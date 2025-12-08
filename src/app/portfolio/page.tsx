"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, TrendingUp, TrendingDown, Trash2, Edit2, RefreshCw, Download, Upload, Briefcase, PieChart, Wallet, BarChart3, Loader2 } from "lucide-react";
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
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");
  
  // SWR for data fetching with caching
  const fetcher = useCallback((url: string) => 
    fetch(url).then(res => res.ok ? res.json() : Promise.reject()), []);
  
  const { data: stocks = [], mutate, isLoading: swrLoading } = useSWR<PortfolioStock[]>(
    status === "authenticated" ? "/api/portfolio" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    }
  }, [status, router]);
  
  useEffect(() => {
    if (!swrLoading) {
      setIsLoading(false);
    }
  }, [swrLoading]);

  const refreshPrices = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/portfolio?updatePrices=true");
      if (response.ok) {
        const data = await response.json();
        mutate(data, false); // Update cache without revalidation
        toast({
          title: t("pricesUpdated"),
          description: t("pricesUpdatedDesc"),
        });
      } else {
        const error = await response.json();
        toast({
          title: t("failedRefresh"),
          description: error.error || tc("errorTryAgain"),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to refresh prices:", error);
      toast({
        title: tc("error"),
        description: tc("errorTryAgain"),
        variant: "destructive",
      });
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

      const url = editingId ? `/api/portfolio?id=${editingId}` : "/api/portfolio";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        mutate(); // Revalidate cache
        resetForm();
        setDialogOpen(false);
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
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const response = await fetch(`/api/portfolio?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutate(); // Revalidate cache
      } else {
        alert(tc("deleteFailed"));
      }
    } catch (error) {
      console.error("Failed to delete stock:", error);
      alert(tc("deleteFailed"));
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
    setDialogOpen(false);
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
          return { success: false, error: `Row ${i + 1}: Missing purchase date` };
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
          return { success: false, error: `Row ${i + 1}: Invalid date format "${dateStr}"` };
        }

        const symbol = row.Symbol?.trim().toUpperCase();
        const name = row.Name?.trim() || "";
        const quantity = parseFloat(row.Quantity);
        const buyPrice = parseFloat(row["Buy Price"]);

        // Validation
        if (!symbol) {
          return { success: false, error: `Row ${i + 1}: Missing symbol` };
        }

        if (isNaN(quantity) || quantity <= 0) {
          return { success: false, error: `Row ${i + 1}: Invalid quantity "${row.Quantity}"` };
        }

        if (isNaN(buyPrice) || buyPrice <= 0) {
          return { success: false, error: `Row ${i + 1}: Invalid buy price "${row["Buy Price"]}"` };
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
      mutate(); // Revalidate cache
      toast({
        title: t("importSuccess"),
        description: t("importSuccessDesc", { count: successCount }),
      });
    }

    return { success: successCount, errors };
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{t("loading")}</p>
          </div>
        </div>
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
      <div className="w-[90%] max-w-[1620px] mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  resetForm();
                  setEditingId(null);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("addStock")}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? t("editStock") : t("addNewStock")}</DialogTitle>
                <DialogDescription>
                  {t("enterStockDetails")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">{t("stockSymbol")} *</Label>
                    <Input
                      id="symbol"
                      placeholder={t("stockSymbolPlaceholder")}
                      value={formData.symbol}
                      onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("stockSymbolHint")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="name">{t("stockName")}</Label>
                    <Input
                      id="name"
                      placeholder={t("stockNamePlaceholder")}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t("quantity")} *</Label>
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
                    <Label htmlFor="buyPrice">{t("buyPrice")} *</Label>
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
                    <Label htmlFor="purchaseDate">{t("purchaseDate")} *</Label>
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
                      <span>{t("totalInvestmentLabel")}:</span>
                      <span className="font-bold">
                        ₹{(parseFloat(formData.quantity) * parseFloat(formData.buyPrice)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    {tc("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? tc("saving") : editingId ? t("updateStock") : t("addStock")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            onClick={refreshPrices}
            variant="outline"
            disabled={isRefreshing || stocks.length === 0}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            {t("refreshPrices")}
          </Button>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t("importCSV")}
          </Button>
          <Button onClick={exportToCSV} variant="outline" disabled={stocks.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {t("exportCSV")}
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
        title={t("importPortfolio")}
        description={t("importDescription")}
        templateExample={`Symbol,Name,Quantity,Buy Price,Purchase Date
RELIANCE.NS,Reliance Industries,100,2500.00,15/11/2025
TCS.NS,Tata Consultancy Services,50,3400.00,20/11/2025`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalStocks")}</CardTitle>
            <Briefcase className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stocks.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400">{gainers} {t("gainers")}</span> / <span className="text-red-600 dark:text-red-400">{losers} {t("losers")}</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("investedValue")}</CardTitle>
            <Wallet className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("totalInvestment")}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("currentValue")}</CardTitle>
            <PieChart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("marketValue")}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalPL")}</CardTitle>
            {totalPL >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ₹{totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <p className={`text-xs mt-1 ${totalPLPercentage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {totalPLPercentage >= 0 ? "+" : ""}{totalPLPercentage.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">{t("yourPortfolio")}</CardTitle>
          <CardDescription>{t("currentHoldings")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {stocks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Briefcase className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t("noStocks")}</h3>
              <p className="text-muted-foreground mb-4">{t("noStocksHint")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tableSymbol")}</TableHead>
                    <TableHead>{t("tableName")}</TableHead>
                    <TableHead className="text-right">{t("tableQty")}</TableHead>
                    <TableHead className="text-right">{t("tableBuyPrice")}</TableHead>
                    <TableHead className="text-right">{t("tableCurrentPrice")}</TableHead>
                    <TableHead className="text-right">{t("tableInvested")}</TableHead>
                    <TableHead className="text-right">{t("tableCurrentValue")}</TableHead>
                    <TableHead className="text-right">{t("tablePL")}</TableHead>
                    <TableHead className="text-right">{t("tablePLPercent")}</TableHead>
                    <TableHead>{t("tablePurchaseDate")}</TableHead>
                    <TableHead className="text-right">{t("tableActions")}</TableHead>
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
