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
import { Plus, TrendingUp, TrendingDown, Trash2, Edit2, Download, Upload, Wallet, Target, BarChart3, Calculator, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays } from "lucide-react";
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [initialCapital, setInitialCapital] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage, setTradesPerPage] = useState(25);

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
      fetchUserProfile();
    }
  }, [status, router]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setInitialCapital(data.initialCapital || 0);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
    }
  };

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
        setDialogOpen(false);
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
    setDialogOpen(true);
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
    setDialogOpen(false);
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

  const handleCSVImport = async (data: Record<string, string>[]): Promise<{ success: number; errors: string[] }> => {
    const errors: string[] = [];
    let successCount = 0;

    // Process all rows in parallel with proper error handling
    const results = await Promise.all(
      data.map(async (row, i) => {
        try {
        // Parse date - handle both DD/MM/YYYY and MM/DD/YYYY formats
        let tradeDate: Date;
        const dateStr = row.Date?.trim();
        
        if (!dateStr) {
          return { success: false, error: `Row ${i + 1}: Missing date` };
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
          return { success: false, error: `Row ${i + 1}: Invalid date format "${dateStr}"` };
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
          return { success: false, error: `Row ${i + 1}: Missing script/symbol` };
        }

        if (!type || (type !== "BUY" && type !== "SELL")) {
          return { success: false, error: `Row ${i + 1}: Invalid type "${row.Type}" (must be BUY or SELL)` };
        }

        if (isNaN(quantity) || quantity <= 0) {
          return { success: false, error: `Row ${i + 1}: Invalid quantity "${row.Quantity}"` };
        }

        if (isNaN(buyPrice) || buyPrice <= 0) {
          return { success: false, error: `Row ${i + 1}: Invalid buy price "${row["Buy Price"]}"` };
        }

        if (isNaN(sellPrice) || sellPrice <= 0) {
          return { success: false, error: `Row ${i + 1}: Invalid sell price "${row["Sell Price"]}"` };
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
          return { success: true };
        } else {
          const error = await response.json();
          return { success: false, error: `Row ${i + 1}: ${error.error || "Failed to create trade"}` };
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
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading trades...</p>
          </div>
        </div>
      </div>
    );
  }

  const totalPL = trades.reduce((sum, trade) => sum + trade.netProfitLoss, 0);
  const winningTrades = trades.filter((t) => t.netProfitLoss > 0).length;
  const losingTrades = trades.filter((t) => t.netProfitLoss < 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;
  
  // Calculate unique trading days
  const tradingDays = new Set(trades.map((t) => new Date(t.tradeDate).toDateString())).size;

  // Pagination calculations
  const totalPages = Math.ceil(trades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = trades.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleTradesPerPageChange = (value: string) => {
    setTradesPerPage(parseInt(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="w-[90%] max-w-[1620px] mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Intraday Trading Log</h1>
            <p className="text-muted-foreground mt-1">Track your daily trades and performance</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  resetForm();
                  setEditingId(null);
                }} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Trade
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? "Edit Trade" : "Add New Trade"}</DialogTitle>
                <DialogDescription>
                  Enter your intraday trade details
                </DialogDescription>
              </DialogHeader>
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
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Note: Charges are not stored. Please enter each time.
                    </p>
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

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingId ? "Update Trade" : "Add Trade"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
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
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Initial Capital</CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₹{initialCapital.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Starting amount</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Current Capital</CardTitle>
            <BarChart3 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${(initialCapital + totalPL) >= initialCapital ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ₹{(initialCapital + totalPL).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {totalPL >= 0 ? "+" : ""}₹{totalPL.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-indigo-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{trades.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600 dark:text-green-400">{winningTrades}W</span> / <span className="text-red-600 dark:text-red-400">{losingTrades}L</span>
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trading Days</CardTitle>
            <CalendarDays className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{tradingDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trades.length > 0 ? (trades.length / tradingDays).toFixed(1) : 0} trades/day
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net P&L</CardTitle>
            {totalPL >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ₹{totalPL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {initialCapital > 0 ? `${((totalPL / initialCapital) * 100).toFixed(2)}% ROI` : "Set capital"}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Win Rate</CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Success ratio</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg P&L</CardTitle>
            <Calculator className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ₹{trades.length > 0 ? (totalPL / trades.length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per trade</p>
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">Recent Trades</CardTitle>
              <CardDescription>Your intraday trading history</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Show:</span>
              <Select value={tradesPerPage.toString()} onValueChange={handleTradesPerPageChange}>
                <SelectTrigger className="w-20 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="75">75</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">per page</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {trades.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No trades logged yet</h3>
              <p className="text-muted-foreground mb-4">Click &quot;Add Trade&quot; button above to get started!</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[100px]">Date</TableHead>
                      <TableHead className="min-w-[140px]">Script</TableHead>
                      <TableHead className="min-w-[80px]">Type</TableHead>
                      <TableHead className="text-right min-w-[80px]">Qty</TableHead>
                      <TableHead className="text-right min-w-[100px]">Buy</TableHead>
                      <TableHead className="text-right min-w-[100px]">Sell</TableHead>
                      <TableHead className="text-right min-w-[120px]">P&L</TableHead>
                      <TableHead className="text-right min-w-[100px]">Charges</TableHead>
                      <TableHead className="text-right min-w-[130px]">Net P&L</TableHead>
                      <TableHead className="text-center min-w-[80px]">Setup</TableHead>
                      <TableHead className="min-w-[200px]">Remarks</TableHead>
                      <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTrades.map((trade) => (
                      <TableRow key={trade.id}>
                        <TableCell className="whitespace-nowrap">
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
                        <TableCell className="max-w-[200px] truncate" title={trade.remarks}>{trade.remarks}</TableCell>
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

              {/* Pagination Controls */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-4 border-t bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1} to {Math.min(endIndex, trades.length)} of {trades.length} trades
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex items-center gap-1 mx-2">
                    {/* Show page numbers */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(pageNum)}
                          className="h-8 w-8 p-0"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
