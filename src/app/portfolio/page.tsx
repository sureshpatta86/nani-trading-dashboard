"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, TrendingUp, TrendingDown, Trash2, Edit2, RefreshCw, Download, Upload } from "lucide-react";
import { CSVImportDialog } from "@/components/csv-import-dialog";
import { useToast } from "@/hooks/use-toast";

interface PortfolioStock {
  id: string;
  symbol: string;
  name?: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  purchaseDate: string;
}

export default function PortfolioPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [stocks, setStocks] = useState<PortfolioStock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    symbol: "",
    name: "",
    quantity: "",
    buyPrice: "",
    purchaseDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchPortfolio();
    }
  }, [status, router]);

  const fetchPortfolio = async () => {
    try {
      const response = await fetch("/api/portfolio");
      if (response.ok) {
        const data = await response.json();
        setStocks(data);
      }
    } catch (error) {
      console.error("Failed to fetch portfolio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/portfolio/refresh-prices", {
        method: "POST",
      });
      if (response.ok) {
        await fetchPortfolio();
      } else {
        alert("Failed to refresh prices");
      }
    } catch (error) {
      console.error("Failed to refresh prices:", error);
      alert("Failed to refresh prices");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        symbol: formData.symbol.toUpperCase(),
        name: formData.name || undefined,
        quantity: parseInt(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice),
        purchaseDate: new Date(formData.purchaseDate).toISOString(),
      };

      const url = editingId ? `/api/portfolio/${editingId}` : "/api/portfolio";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchPortfolio();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save stock");
      }
    } catch (error) {
      console.error("Failed to submit stock:", error);
      alert("Failed to save stock");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (stock: PortfolioStock) => {
    setFormData({
      symbol: stock.symbol,
      name: stock.name || "",
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString(),
      purchaseDate: new Date(stock.purchaseDate).toISOString().split("T")[0],
    });
    setEditingId(stock.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this stock from your portfolio?")) return;

    try {
      const response = await fetch(`/api/portfolio/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchPortfolio();
      } else {
        alert("Failed to delete stock");
      }
    } catch (error) {
      console.error("Failed to delete stock:", error);
      alert("Failed to delete stock");
    }
  };

  const resetForm = () => {
    setFormData({
      symbol: "",
      name: "",
      quantity: "",
      buyPrice: "",
      purchaseDate: new Date().toISOString().split("T")[0],
    });
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = [
      "Symbol",
      "Name",
      "Quantity",
      "Buy Price",
      "Purchase Date",
    ];

    const rows = stocks.map((stock) => [
      stock.symbol,
      stock.name || "",
      stock.quantity,
      stock.buyPrice.toFixed(2),
      new Date(stock.purchaseDate).toLocaleDateString("en-IN"),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleCSVImport = async (data: Record<string, string>[]): Promise<{ success: number; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;

    // Create a set of existing stocks for O(1) lookup
    const existingSymbols = new Set(stocks.map(s => s.symbol));

    // Process all rows in parallel with proper error handling
    const results = await Promise.all(
      data.map(async (row, i) => {
        try {
        // Parse date - handle both DD/MM/YYYY and MM/DD/YYYY formats
        let purchaseDate: Date;
        const dateStr = row["Purchase Date"]?.trim();
        
        if (!dateStr) {
          errors.push(`Row ${i + 1}: Missing purchase date`);
          continue;
        }

        // Try to parse the date
        const dateParts = dateStr.split("/");
        if (dateParts.length === 3) {
          // Assume DD/MM/YYYY format for Indian locale
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1; // months are 0-indexed
          const year = parseInt(dateParts[2]);
          purchaseDate = new Date(year, month, day);
        } else {
          // Try ISO format
          purchaseDate = new Date(dateStr);
        }

        if (isNaN(purchaseDate.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
          continue;
        }

        const symbol = row.Symbol?.trim().toUpperCase();
        const name = row.Name?.trim() || "";
        const quantity = parseFloat(row.Quantity);
        const buyPrice = parseFloat(row["Buy Price"]);

        // Validation
        if (!symbol) {
          errors.push(`Row ${i + 1}: Missing symbol`);
          continue;
        }

        if (isNaN(quantity) || quantity <= 0) {
          errors.push(`Row ${i + 1}: Invalid quantity "${row.Quantity}"`);
          continue;
        }

        if (isNaN(buyPrice) || buyPrice <= 0) {
          errors.push(`Row ${i + 1}: Invalid buy price "${row["Buy Price"]}"`);
          continue;
        }

        // Check if stock already exists
        if (existingSymbols.has(symbol)) {
          return { success: false, error: `Row ${i + 1}: Stock ${symbol} already exists in portfolio` };
        }

        // Create stock
        const response = await fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            symbol,
            name: name || undefined,
            quantity,
            buyPrice,
            purchaseDate: purchaseDate.toISOString(),
          }),
        });

        if (response.ok) {
          return { success: true };
        } else {
          const error = await response.json();
          return { success: false, error: `Row ${i + 1}: ${error.error || "Failed to add stock"}` };
        }
      } catch (error) {
        return { success: false, error: `Row ${i + 1}: ${(error as Error).message || "Failed to process row"}` };
      }
    })
  );

    // Process results
    results.forEach(result => {
      if (result.success) {
        successCount++;
      } else if (result.error) {
        errors.push(result.error);
      }
    });

    // Refresh stocks list
    if (successCount > 0) {
      await fetchPortfolio();
      toast({
        title: "Import Successful",
        description: `Imported ${successCount} stock(s) successfully.`,
      });
    }

    return { success: successCount, errors };
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const totalInvested = stocks.reduce((sum, stock) => sum + stock.investedValue, 0);
  const totalCurrent = stocks.reduce((sum, stock) => sum + stock.currentValue, 0);
  const totalPL = totalCurrent - totalInvested;
  const totalPLPercentage = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  const gainers = stocks.filter((s) => s.profitLoss > 0).length;
  const losers = stocks.filter((s) => s.profitLoss < 0).length;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Management</h1>
          <p className="text-muted-foreground">Track your long-term investments</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={refreshPrices}
            variant="outline"
            disabled={isRefreshing || stocks.length === 0}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh Prices
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={exportToCSV} variant="outline" disabled={stocks.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleCSVImport}
        expectedHeaders={[
          "Symbol",
          "Name",
          "Quantity",
          "Buy Price",
          "Purchase Date",
        ]}
        title="Import Portfolio Stocks"
        description="Upload a CSV file to import multiple stocks at once. Date format should be DD/MM/YYYY. Symbol should include .NS or .BO suffix."
        templateExample={`Symbol,Name,Quantity,Buy Price,Purchase Date
RELIANCE.NS,Reliance Industries,100,2500.00,15/11/2025
TCS.NS,Tata Consultancy Services,50,3400.00,20/11/2025`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stocks.length}</div>
            <p className="text-xs text-muted-foreground">
              {gainers} gainers / {losers} losers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invested Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInvested.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCurrent.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{totalPL.toFixed(2)}
            </div>
            <p className={`text-xs ${totalPLPercentage >= 0 ? "text-green-600" : "text-red-600"}`}>
              {totalPLPercentage >= 0 ? "+" : ""}
              {totalPLPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Stock Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Stock" : "Add New Stock"}</CardTitle>
          <CardDescription>Enter your portfolio stock details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="symbol">Stock Symbol *</Label>
                <Input
                  id="symbol"
                  placeholder="e.g., RELIANCE.NS, TCS.NS"
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Add .NS for NSE or .BO for BSE (e.g., RELIANCE.NS)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Stock Name (Optional)</Label>
                <Input
                  id="name"
                  placeholder="e.g., Reliance Industries"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="100"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="buyPrice">Buy Price *</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  placeholder="2500.00"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Purchase Date *</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  value={formData.purchaseDate}
                  onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                  required
                />
              </div>
            </div>

            {formData.quantity && formData.buyPrice && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Total Investment:</span>
                  <span className="font-bold">
                    ₹{(parseFloat(formData.quantity) * parseFloat(formData.buyPrice)).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : editingId ? "Update Stock" : "Add Stock"}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Portfolio Table */}
      <Card>
        <CardHeader>
          <CardTitle>Your Portfolio</CardTitle>
          <CardDescription>Current holdings and performance</CardDescription>
        </CardHeader>
        <CardContent>
          {stocks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No stocks in your portfolio yet. Add your first stock above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Buy Price</TableHead>
                    <TableHead className="text-right">Current Price</TableHead>
                    <TableHead className="text-right">Invested</TableHead>
                    <TableHead className="text-right">Current Value</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">P&L %</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stocks.map((stock) => (
                    <TableRow key={stock.id}>
                      <TableCell className="font-medium">{stock.symbol}</TableCell>
                      <TableCell>{stock.name || "-"}</TableCell>
                      <TableCell className="text-right">{stock.quantity}</TableCell>
                      <TableCell className="text-right">₹{stock.buyPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{stock.currentPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{stock.investedValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{stock.currentValue.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold flex items-center justify-end gap-1 ${
                            stock.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {stock.profitLoss >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          ₹{stock.profitLoss.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-medium ${
                            stock.profitLossPercentage >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {stock.profitLossPercentage >= 0 ? "+" : ""}
                          {stock.profitLossPercentage.toFixed(2)}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(stock.purchaseDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(stock)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(stock.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
