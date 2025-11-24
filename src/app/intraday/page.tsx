"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, TrendingUp, TrendingDown, Trash2, Edit2, Download, Upload } from "lucide-react";
import { CSVImportDialog } from "@/components/csv-import-dialog";
import { useToast } from "@/hooks/use-toast";

interface IntradayTrade {
  id: string;
  tradeDate: string;
  script: string;
  type: "BUY" | "SELL";
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitLoss: number;
  charges: number;
  netProfitLoss: number;
  remarks?: string;
  followSetup: boolean;
}

export default function IntradayLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [trades, setTrades] = useState<IntradayTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    tradeDate: new Date().toISOString().split("T")[0],
    script: "",
    type: "BUY" as "BUY" | "SELL",
    quantity: "",
    buyPrice: "",
    sellPrice: "",
    charges: "",
    remarks: "",
    followSetup: true,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    } else if (status === "authenticated") {
      fetchTrades();
    }
  }, [status, router]);

  const fetchTrades = async () => {
    try {
      const response = await fetch("/api/intraday");
      if (response.ok) {
        const data = await response.json();
        setTrades(data);
      }
    } catch (error) {
      console.error("Failed to fetch trades:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProfitLoss = () => {
    const qty = parseFloat(formData.quantity) || 0;
    const buy = parseFloat(formData.buyPrice) || 0;
    const sell = parseFloat(formData.sellPrice) || 0;
    const charges = parseFloat(formData.charges) || 0;

    const profitLoss = (sell - buy) * qty;
    const netProfitLoss = profitLoss - charges;

    return { profitLoss, netProfitLoss };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { profitLoss, netProfitLoss } = calculateProfitLoss();

      const payload = {
        tradeDate: new Date(formData.tradeDate).toISOString(),
        script: formData.script.toUpperCase(),
        type: formData.type,
        quantity: parseInt(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice),
        sellPrice: parseFloat(formData.sellPrice),
        profitLoss,
        charges: parseFloat(formData.charges) || 0,
        netProfitLoss,
        remarks: formData.remarks || undefined,
        followSetup: formData.followSetup,
      };

      const url = editingId ? `/api/intraday/${editingId}` : "/api/intraday";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchTrades();
        resetForm();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save trade");
      }
    } catch (error) {
      console.error("Failed to submit trade:", error);
      alert("Failed to save trade");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (trade: IntradayTrade) => {
    setFormData({
      tradeDate: new Date(trade.tradeDate).toISOString().split("T")[0],
      script: trade.script,
      type: trade.type,
      quantity: trade.quantity.toString(),
      buyPrice: trade.buyPrice.toString(),
      sellPrice: trade.sellPrice.toString(),
      charges: trade.charges.toString(),
      remarks: trade.remarks || "",
      followSetup: trade.followSetup,
    });
    setEditingId(trade.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this trade?")) return;

    try {
      const response = await fetch(`/api/intraday/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchTrades();
      } else {
        alert("Failed to delete trade");
      }
    } catch (error) {
      console.error("Failed to delete trade:", error);
      alert("Failed to delete trade");
    }
  };

  const resetForm = () => {
    setFormData({
      tradeDate: new Date().toISOString().split("T")[0],
      script: "",
      type: "BUY",
      quantity: "",
      buyPrice: "",
      sellPrice: "",
      charges: "",
      remarks: "",
      followSetup: true,
    });
    setEditingId(null);
  };

  const exportToCSV = () => {
    const headers = [
      "Date",
      "Script",
      "Type",
      "Quantity",
      "Buy Price",
      "Sell Price",
      "Charges",
      "Remarks",
      "Follow Setup",
    ];

    const rows = trades.map((trade) => [
      new Date(trade.tradeDate).toLocaleDateString("en-IN"),
      trade.script,
      trade.type,
      trade.quantity,
      trade.buyPrice.toFixed(2),
      trade.sellPrice.toFixed(2),
      trade.charges.toFixed(2),
      trade.remarks || "",
      trade.followSetup ? "Yes" : "No",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `intraday-trades-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const handleCSVImport = async (data: any[]): Promise<{ success: number; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Parse date - handle both DD/MM/YYYY and MM/DD/YYYY formats
        let tradeDate: Date;
        const dateStr = row.Date?.trim();
        
        if (!dateStr) {
          errors.push(`Row ${i + 1}: Missing date`);
          continue;
        }

        // Try to parse the date
        const dateParts = dateStr.split("/");
        if (dateParts.length === 3) {
          // Assume DD/MM/YYYY format for Indian locale
          const day = parseInt(dateParts[0]);
          const month = parseInt(dateParts[1]) - 1; // months are 0-indexed
          const year = parseInt(dateParts[2]);
          tradeDate = new Date(year, month, day);
        } else {
          // Try ISO format
          tradeDate = new Date(dateStr);
        }

        if (isNaN(tradeDate.getTime())) {
          errors.push(`Row ${i + 1}: Invalid date format "${dateStr}"`);
          continue;
        }

        const script = row.Script?.trim();
        const type = row.Type?.trim().toUpperCase();
        const quantity = parseFloat(row.Quantity);
        const buyPrice = parseFloat(row["Buy Price"]);
        const sellPrice = parseFloat(row["Sell Price"]);
        const charges = parseFloat(row.Charges || "0");
        const remarks = row.Remarks?.trim() || "";
        const followSetup = row["Follow Setup"]?.trim().toLowerCase() === "yes";

        // Validation
        if (!script) {
          errors.push(`Row ${i + 1}: Missing script/symbol`);
          continue;
        }

        if (!type || (type !== "BUY" && type !== "SELL")) {
          errors.push(`Row ${i + 1}: Invalid type "${row.Type}" (must be BUY or SELL)`);
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

        if (isNaN(sellPrice) || sellPrice <= 0) {
          errors.push(`Row ${i + 1}: Invalid sell price "${row["Sell Price"]}"`);
          continue;
        }

        // Calculate P&L
        const profitLoss = (sellPrice - buyPrice) * quantity;
        const netProfitLoss = profitLoss - charges;

        // Create trade
        const response = await fetch("/api/intraday", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tradeDate: tradeDate.toISOString(),
            script: script.toUpperCase(),
            type,
            quantity,
            buyPrice,
            sellPrice,
            profitLoss,
            charges,
            netProfitLoss,
            remarks,
            followSetup,
          }),
        });

        if (response.ok) {
          successCount++;
        } else {
          const error = await response.json();
          errors.push(`Row ${i + 1}: ${error.error || "Failed to create trade"}`);
        }
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message || "Failed to process row"}`);
      }
    }

    // Refresh trades list
    if (successCount > 0) {
      await fetchTrades();
      toast({
        title: "Import Successful",
        description: `Imported ${successCount} trade(s) successfully.`,
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

  const totalPL = trades.reduce((sum, trade) => sum + trade.netProfitLoss, 0);
  const winningTrades = trades.filter((t) => t.netProfitLoss > 0).length;
  const losingTrades = trades.filter((t) => t.netProfitLoss < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Intraday Trading Log</h1>
          <p className="text-muted-foreground">Track your daily trades and performance</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </Button>
          <Button onClick={exportToCSV} variant="outline" disabled={trades.length === 0}>
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
          "Date",
          "Script",
          "Type",
          "Quantity",
          "Buy Price",
          "Sell Price",
          "Charges",
          "Remarks",
          "Follow Setup",
        ]}
        title="Import Intraday Trades"
        description="Upload a CSV file to import multiple trades at once. Date format should be DD/MM/YYYY."
        templateExample={`Date,Script,Type,Quantity,Buy Price,Sell Price,Charges,Remarks,Follow Setup
24/11/2025,RELIANCE,BUY,100,2500.00,2520.00,20.00,Good trade,Yes
24/11/2025,TCS,SELL,50,3400.00,3390.00,15.00,Stop loss hit,No`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{trades.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalPL >= 0 ? "text-green-600" : "text-red-600"}`}>
              ₹{totalPL.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {winningTrades}W / {losingTrades}L
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{trades.length > 0 ? (totalPL / trades.length).toFixed(2) : "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trade Entry Form */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit Trade" : "Add New Trade"}</CardTitle>
          <CardDescription>Enter your intraday trade details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="tradeDate">Trade Date</Label>
                <Input
                  id="tradeDate"
                  type="date"
                  value={formData.tradeDate}
                  onChange={(e) => setFormData({ ...formData, tradeDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="script">Script/Symbol</Label>
                <Input
                  id="script"
                  placeholder="e.g., RELIANCE, TCS"
                  value={formData.script}
                  onChange={(e) => setFormData({ ...formData, script: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: "BUY" | "SELL") => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BUY">Buy</SelectItem>
                    <SelectItem value="SELL">Sell</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
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
                <Label htmlFor="buyPrice">Buy Price</Label>
                <Input
                  id="buyPrice"
                  type="number"
                  step="0.01"
                  placeholder="100.50"
                  value={formData.buyPrice}
                  onChange={(e) => setFormData({ ...formData, buyPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">Sell Price</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  placeholder="105.25"
                  value={formData.sellPrice}
                  onChange={(e) => setFormData({ ...formData, sellPrice: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="charges">Charges</Label>
                <Input
                  id="charges"
                  type="number"
                  step="0.01"
                  placeholder="20.00"
                  value={formData.charges}
                  onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks (Optional)</Label>
              <Textarea
                id="remarks"
                placeholder="Trade notes, strategy, market conditions..."
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="followSetup"
                checked={formData.followSetup}
                onChange={(e) => setFormData({ ...formData, followSetup: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="followSetup" className="cursor-pointer">
                Followed trading setup/rules?
              </Label>
            </div>

            {formData.buyPrice && formData.sellPrice && formData.quantity && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated P&L:</span>
                  <span className="font-medium">₹{calculateProfitLoss().profitLoss.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1">
                  <span>Net P&L (after charges):</span>
                  <span
                    className={`font-bold ${
                      calculateProfitLoss().netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    ₹{calculateProfitLoss().netProfitLoss.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                <Plus className="mr-2 h-4 w-4" />
                {isSubmitting ? "Saving..." : editingId ? "Update Trade" : "Add Trade"}
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

      {/* Trades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Trades</CardTitle>
          <CardDescription>Your intraday trading history</CardDescription>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No trades logged yet. Add your first trade above!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Script</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Buy</TableHead>
                    <TableHead className="text-right">Sell</TableHead>
                    <TableHead className="text-right">P&L</TableHead>
                    <TableHead className="text-right">Charges</TableHead>
                    <TableHead className="text-right">Net P&L</TableHead>
                    <TableHead className="text-center">Setup</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        {new Date(trade.tradeDate).toLocaleDateString("en-IN")}
                      </TableCell>
                      <TableCell className="font-medium">{trade.script}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            trade.type === "BUY"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {trade.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">{trade.quantity}</TableCell>
                      <TableCell className="text-right">₹{trade.buyPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">₹{trade.sellPrice.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={
                            trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"
                          }
                        >
                          ₹{trade.profitLoss.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">₹{trade.charges.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <span
                          className={`font-bold flex items-center justify-end gap-1 ${
                            trade.netProfitLoss >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {trade.netProfitLoss >= 0 ? (
                            <TrendingUp className="h-4 w-4" />
                          ) : (
                            <TrendingDown className="h-4 w-4" />
                          )}
                          ₹{trade.netProfitLoss.toFixed(2)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {trade.followSetup ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            ✓ Yes
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                            ✗ No
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{trade.remarks}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(trade)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(trade.id)}
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
