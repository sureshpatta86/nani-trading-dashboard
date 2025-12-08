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
import { Plus, TrendingUp, TrendingDown, Trash2, Edit2, Download, Upload, Wallet, Target, BarChart3, Calculator, Loader2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CalendarDays, Filter, X } from "lucide-react";
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
  mood: string;
}

export default function IntradayLogPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations("intraday");
  const tc = useTranslations("common");
  
  // SWR for data fetching with caching
  const fetcher = useCallback((url: string) => 
    fetch(url).then(res => res.ok ? res.json() : Promise.reject()), []);
  
  const { data: trades = [], mutate, isLoading: swrLoading } = useSWR<IntradayTrade[]>(
    status === "authenticated" ? "/api/intraday" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 60000, // Cache for 1 minute
    }
  );
  
  const { data: profileData } = useSWR(
    status === "authenticated" ? "/api/profile" : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5 minutes
    }
  );
  
  const initialCapital = profileData?.initialCapital || 0;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage, setTradesPerPage] = useState(25);

  // Column filters state
  const [filters, setFilters] = useState({
    script: "all",
    type: "all",
    mood: "all",
    followSetup: "all",
    dateFrom: "",
    dateTo: "",
    plType: "all", // profit, loss, or all
  });
  const [showFilters, setShowFilters] = useState(false);

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
    mood: "CALM",
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
        mood: formData.mood,
      };

      const url = editingId ? `/api/intraday/${editingId}` : "/api/intraday";
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
      mood: trade.mood || "CALM",
    });
    setEditingId(trade.id);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("confirmDelete"))) return;

    try {
      const response = await fetch(`/api/intraday/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        mutate(); // Revalidate cache
      } else {
        alert(tc("deleteFailed"));
      }
    } catch (error) {
      console.error("Failed to delete trade:", error);
      alert(tc("deleteFailed"));
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
      mood: "CALM",
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
            <p className="text-muted-foreground">{t("loadingTrades")}</p>
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

  // Filter trades based on filters
  const filteredTrades = trades.filter((trade) => {
    // Script filter
    if (filters.script !== "all" && !trade.script.toLowerCase().includes(filters.script.toLowerCase())) {
      return false;
    }
    // Type filter
    if (filters.type !== "all" && trade.type !== filters.type) {
      return false;
    }
    // Mood filter
    if (filters.mood !== "all" && trade.mood !== filters.mood) {
      return false;
    }
    // Follow Setup filter
    if (filters.followSetup === "yes" && !trade.followSetup) {
      return false;
    }
    if (filters.followSetup === "no" && trade.followSetup) {
      return false;
    }
    // Date range filter
    if (filters.dateFrom) {
      const tradeDate = new Date(trade.tradeDate);
      const fromDate = new Date(filters.dateFrom);
      if (tradeDate < fromDate) return false;
    }
    if (filters.dateTo) {
      const tradeDate = new Date(trade.tradeDate);
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      if (tradeDate > toDate) return false;
    }
    // P&L type filter
    if (filters.plType === "profit" && trade.netProfitLoss <= 0) {
      return false;
    }
    if (filters.plType === "loss" && trade.netProfitLoss >= 0) {
      return false;
    }
    return true;
  });

  // Get unique scripts for filter dropdown
  const uniqueScripts = [...new Set(trades.map((t) => t.script))].sort();

  // Pagination calculations - use filteredTrades
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      script: "all",
      type: "all",
      mood: "all",
      followSetup: "all",
      dateFrom: "",
      dateTo: "",
      plType: "all",
    });
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.entries(filters).some(([key, v]) => {
    if (key === "dateFrom" || key === "dateTo") return v !== "";
    return v !== "all";
  });

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
                  {t("addTrade")}
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? t("editTrade") : t("addNewTrade")}</DialogTitle>
                <DialogDescription>
                  {t("enterTradeDetails")}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="tradeDate">{t("tradeDate")}</Label>
                    <Input
                      id="tradeDate"
                      type="date"
                      value={formData.tradeDate}
                      onChange={(e) => setFormData({ ...formData, tradeDate: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="script">{t("scriptSymbol")}</Label>
                    <Input
                      id="script"
                      placeholder={t("scriptPlaceholder")}
                      value={formData.script}
                      onChange={(e) => setFormData({ ...formData, script: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">{t("type")}</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: "BUY" | "SELL") => setFormData({ ...formData, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">{t("typeBuy")}</SelectItem>
                        <SelectItem value="SELL">{t("typeSell")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t("quantity")}</Label>
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
                    <Label htmlFor="buyPrice">{t("buyPrice")}</Label>
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
                    <Label htmlFor="sellPrice">{t("sellPrice")}</Label>
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
                    <Label htmlFor="charges">{t("charges")}</Label>
                    <Input
                      id="charges"
                      type="number"
                      step="0.01"
                      placeholder="20.00"
                      value={formData.charges}
                      onChange={(e) => setFormData({ ...formData, charges: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("chargesNote")}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remarks">{t("remarks")}</Label>
                  <Textarea
                    id="remarks"
                    placeholder={t("remarksPlaceholder")}
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="mood">{t("mood")}</Label>
                    <Select
                      value={formData.mood}
                      onValueChange={(value) => setFormData({ ...formData, mood: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t("filterMood")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CALM">{t("moodCalm")}</SelectItem>
                        <SelectItem value="ANXIOUS">{t("moodAnxious")}</SelectItem>
                        <SelectItem value="CONFIDENT">{t("moodConfident")}</SelectItem>
                        <SelectItem value="OVERCONFIDENT">{t("moodOverConfident")}</SelectItem>
                        <SelectItem value="FOMO">{t("moodFomo")}</SelectItem>
                        <SelectItem value="PANICKED">{t("moodPanicked")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2 pt-6">
                    <input
                      type="checkbox"
                      id="followSetup"
                      checked={formData.followSetup}
                      onChange={(e) => setFormData({ ...formData, followSetup: e.target.checked })}
                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <Label htmlFor="followSetup" className="cursor-pointer">
                      {t("followSetup")}
                    </Label>
                  </div>
                </div>

                {formData.buyPrice && formData.sellPrice && formData.quantity && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>{t("estimatedPL")}:</span>
                      <span className="font-medium">₹{calculateProfitLoss().profitLoss.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>{t("netPLAfterCharges")}:</span>
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
                    {tc("cancel")}
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? tc("saving") : editingId ? t("updateTrade") : t("addTrade")}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
          <Button onClick={() => setImportDialogOpen(true)} variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            {t("importCSV")}
          </Button>
          <Button onClick={exportToCSV} variant="outline" disabled={trades.length === 0}>
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
        title={t("importTrades")}
        description={t("importDescription")}
        templateExample={`Date,Script,Type,Quantity,Buy Price,Sell Price,Charges,Remarks,Follow Setup
24/11/2025,RELIANCE,BUY,100,2500.00,2520.00,20.00,Good trade,Yes
24/11/2025,TCS,SELL,50,3400.00,3390.00,15.00,Stop loss hit,No`}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-6">
        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-slate-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-slate-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("initialCapital")}</CardTitle>
            <Wallet className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">₹{initialCapital.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">{t("startingAmount")}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("currentCapital")}</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalTrades")}</CardTitle>
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
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("tradingDays")}</CardTitle>
            <CalendarDays className="h-4 w-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-cyan-600 dark:text-cyan-400">{tradingDays}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {trades.length > 0 ? (trades.length / tradingDays).toFixed(1) : 0} {t("tradesPerDay")}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("netPL")}</CardTitle>
            {totalPL >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              ₹{totalPL.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {initialCapital > 0 ? `${((totalPL / initialCapital) * 100).toFixed(2)}% ${t("roi")}` : t("setCapital")}
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("winRate")}</CardTitle>
            <Target className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600 dark:text-amber-400">{winRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">{t("successRatio")}</p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
          <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("avgPL")}</CardTitle>
            <Calculator className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
              ₹{trades.length > 0 ? (totalPL / trades.length).toFixed(2) : "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("perTrade")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{t("recentTrades")}</CardTitle>
              <CardDescription>{t("tradingHistory")} {hasActiveFilters && `(${filteredTrades.length} ${t("filtered")} ${trades.length} ${tc("trades")})`}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-8"
              >
                <Filter className="h-4 w-4 mr-1" />
                {tc("filters")}
                {hasActiveFilters && (
                  <span className="ml-1 bg-primary-foreground text-primary rounded-full px-1.5 py-0.5 text-xs">
                    {Object.entries(filters).filter(([key, v]) => {
                      if (key === "dateFrom" || key === "dateTo") return v !== "";
                      return v !== "all";
                    }).length}
                  </span>
                )}
              </Button>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8">
                  <X className="h-4 w-4 mr-1" />
                  {tc("clear")}
                </Button>
              )}
              <span className="text-sm text-muted-foreground ml-2">{tc("show")}:</span>
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
              <span className="text-sm text-muted-foreground">{tc("perPage")}</span>
            </div>
          </div>

          {/* Filter Row */}
          {showFilters && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
                {/* Date Range */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterFromDate")}</Label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterToDate")}</Label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>

                {/* Script Filter */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterScript")}</Label>
                  <Select value={filters.script} onValueChange={(v) => handleFilterChange("script", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={t("filterAllScripts")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterAllScripts")}</SelectItem>
                      {uniqueScripts.map((script) => (
                        <SelectItem key={script} value={script}>
                          {script}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterType")}</Label>
                  <Select value={filters.type} onValueChange={(v) => handleFilterChange("type", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={t("filterAllTypes")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterAllTypes")}</SelectItem>
                      <SelectItem value="BUY">{t("typeBuy")}</SelectItem>
                      <SelectItem value="SELL">{t("typeSell")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* P&L Filter */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterPL")}</Label>
                  <Select value={filters.plType} onValueChange={(v) => handleFilterChange("plType", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={tc("all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      <SelectItem value="profit">{t("filterProfitOnly")}</SelectItem>
                      <SelectItem value="loss">{t("filterLossOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Mood Filter */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterMood")}</Label>
                  <Select value={filters.mood} onValueChange={(v) => handleFilterChange("mood", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={t("filterAllMoods")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("filterAllMoods")}</SelectItem>
                      <SelectItem value="CALM">{t("moodCalm")}</SelectItem>
                      <SelectItem value="CONFIDENT">{t("moodConfident")}</SelectItem>
                      <SelectItem value="OVERCONFIDENT">{t("moodOverConfident")}</SelectItem>
                      <SelectItem value="ANXIOUS">{t("moodAnxious")}</SelectItem>
                      <SelectItem value="FOMO">{t("moodFomo")}</SelectItem>
                      <SelectItem value="PANICKED">{t("moodPanicked")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Follow Setup Filter */}
                <div className="space-y-1">
                  <Label className="text-xs">{t("filterSetup")}</Label>
                  <Select value={filters.followSetup} onValueChange={(v) => handleFilterChange("followSetup", v)}>
                    <SelectTrigger className="h-8 text-sm">
                      <SelectValue placeholder={tc("all")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{tc("all")}</SelectItem>
                      <SelectItem value="yes">{t("filterFollowed")}</SelectItem>
                      <SelectItem value="no">{t("filterNotFollowed")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Summary */}
              {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {tc("showing")} <span className="font-medium text-foreground">{filteredTrades.length}</span> {tc("of")}{" "}
                    <span className="font-medium text-foreground">{trades.length}</span> {tc("trades")}
                    {filteredTrades.length > 0 && (
                      <>
                        {" • "}
                        <span className={filteredTrades.reduce((sum, t) => sum + t.netProfitLoss, 0) >= 0 ? "text-green-600" : "text-red-600"}>
                          {t("netPL")}: ₹{filteredTrades.reduce((sum, t) => sum + t.netProfitLoss, 0).toFixed(2)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {trades.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">{t("noTrades")}</h3>
              <p className="text-muted-foreground mb-4">{t("noTradesHint")}</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="min-w-[100px]">{t("tableDate")}</TableHead>
                      <TableHead className="min-w-[140px]">{t("tableScript")}</TableHead>
                      <TableHead className="min-w-[80px]">{t("tableType")}</TableHead>
                      <TableHead className="text-right min-w-[80px]">{t("tableQty")}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t("tableBuy")}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t("tableSell")}</TableHead>
                      <TableHead className="text-right min-w-[120px]">{t("tablePL")}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t("tableCharges")}</TableHead>
                      <TableHead className="text-right min-w-[130px]">{t("tableNetPL")}</TableHead>
                      <TableHead className="text-center min-w-[80px]">{t("tableSetup")}</TableHead>
                      <TableHead className="text-center min-w-[100px]">{t("tableMood")}</TableHead>
                      <TableHead className="min-w-[200px]">{t("tableRemarks")}</TableHead>
                      <TableHead className="text-right min-w-[100px]">{t("tableActions")}</TableHead>
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
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            trade.mood === "CALM" ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400" :
                            trade.mood === "CONFIDENT" ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" :
                            trade.mood === "OVERCONFIDENT" ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400" :
                            trade.mood === "ANXIOUS" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            trade.mood === "FOMO" ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" :
                            trade.mood === "PANICKED" ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400" :
                            "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                          }`}>
                            {trade.mood === "CALM" && "😌"} 
                            {trade.mood === "CONFIDENT" && "😎"} 
                            {trade.mood === "OVERCONFIDENT" && "🤩"} 
                            {trade.mood === "ANXIOUS" && "😰"} 
                            {trade.mood === "FOMO" && "😱"} 
                            {trade.mood === "PANICKED" && "😨"} 
                            {" "}{trade.mood || "CALM"}
                          </span>
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
                  {tc("showing")} {startIndex + 1} {tc("to")} {Math.min(endIndex, filteredTrades.length)} {tc("of")} {filteredTrades.length} {tc("trades")}
                  {hasActiveFilters && ` (${t("filtered")} ${trades.length})`}
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
