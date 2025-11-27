"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  TrendingUp,
  TrendingDown,
  Loader2,
  Calendar,
  Target,
  BarChart3,
  Calculator,
  Percent,
  CheckCircle2,
  XCircle,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  PieChart,
  CalendarDays,
} from "lucide-react";

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

type PeriodType = "weekly" | "monthly" | "yearly" | "custom";

interface ReportStats {
  totalTrades: number;
  tradingDays: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  totalProfitLoss: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  followSetupCount: number;
  followSetupRate: number;
  avgProfitPerTrade: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  tradedScripts: string[];
}

export default function ReportsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [trades, setTrades] = useState<IntradayTrade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<PeriodType>("monthly");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [tradesPerPage, setTradesPerPage] = useState(25);

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

  // Calculate date range based on period
  const getDateRange = (): { start: Date; end: Date } => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;

    switch (period) {
      case "weekly":
        // Get start of current week (Monday)
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        start = new Date(now);
        start.setDate(now.getDate() - daysToMonday);
        start.setHours(0, 0, 0, 0);
        break;
      case "monthly":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "yearly":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "custom":
        start = customStartDate ? new Date(customStartDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        if (customEndDate) {
          return { start, end: new Date(customEndDate + "T23:59:59") };
        }
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start, end };
  };

  // Filter trades based on date range
  const filteredTrades = useMemo(() => {
    const { start, end } = getDateRange();
    return trades.filter((trade) => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate >= start && tradeDate <= end;
    }).sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime());
  }, [trades, period, customStartDate, customEndDate]);

  // Calculate report statistics
  const stats: ReportStats = useMemo(() => {
    const winning = filteredTrades.filter((t) => t.netProfitLoss > 0);
    const losing = filteredTrades.filter((t) => t.netProfitLoss < 0);
    const breakEven = filteredTrades.filter((t) => t.netProfitLoss === 0);
    const followSetup = filteredTrades.filter((t) => t.followSetup);
    
    const totalProfit = winning.reduce((sum, t) => sum + t.netProfitLoss, 0);
    const totalLoss = Math.abs(losing.reduce((sum, t) => sum + t.netProfitLoss, 0));
    const totalPL = filteredTrades.reduce((sum, t) => sum + t.netProfitLoss, 0);
    
    const scripts = [...new Set(filteredTrades.map((t) => t.script))];
    
    // Calculate unique trading days
    const tradingDays = new Set(filteredTrades.map((t) => new Date(t.tradeDate).toDateString())).size;

    return {
      totalTrades: filteredTrades.length,
      tradingDays,
      winningTrades: winning.length,
      losingTrades: losing.length,
      breakEvenTrades: breakEven.length,
      totalProfitLoss: totalPL,
      totalProfit,
      totalLoss,
      winRate: filteredTrades.length > 0 ? (winning.length / filteredTrades.length) * 100 : 0,
      followSetupCount: followSetup.length,
      followSetupRate: filteredTrades.length > 0 ? (followSetup.length / filteredTrades.length) * 100 : 0,
      avgProfitPerTrade: filteredTrades.length > 0 ? totalPL / filteredTrades.length : 0,
      avgWinningTrade: winning.length > 0 ? totalProfit / winning.length : 0,
      avgLosingTrade: losing.length > 0 ? totalLoss / losing.length : 0,
      largestWin: winning.length > 0 ? Math.max(...winning.map((t) => t.netProfitLoss)) : 0,
      largestLoss: losing.length > 0 ? Math.min(...losing.map((t) => t.netProfitLoss)) : 0,
      profitFactor: totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0,
      tradedScripts: scripts,
    };
  }, [filteredTrades]);

  // Pagination
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  const startIndex = (currentPage - 1) * tradesPerPage;
  const endIndex = startIndex + tradesPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleTradesPerPageChange = (value: string) => {
    setTradesPerPage(parseInt(value));
    setCurrentPage(1);
  };

  // Export report to CSV
  const exportReport = () => {
    const headers = [
      "Date",
      "Script",
      "Type",
      "Quantity",
      "Buy Price",
      "Sell Price",
      "P&L",
      "Charges",
      "Net P&L",
      "Follow Setup",
      "Remarks",
    ];

    const rows = filteredTrades.map((trade) => [
      new Date(trade.tradeDate).toLocaleDateString("en-IN"),
      trade.script,
      trade.type,
      trade.quantity,
      trade.buyPrice.toFixed(2),
      trade.sellPrice.toFixed(2),
      trade.profitLoss.toFixed(2),
      trade.charges.toFixed(2),
      trade.netProfitLoss.toFixed(2),
      trade.followSetup ? "Yes" : "No",
      trade.remarks || "",
    ]);

    // Add summary at the end
    rows.push([]);
    rows.push(["=== REPORT SUMMARY ==="]);
    rows.push(["Period", getPeriodLabel()]);
    rows.push(["Total Trades", stats.totalTrades.toString()]);
    rows.push(["Winning Trades", stats.winningTrades.toString()]);
    rows.push(["Losing Trades", stats.losingTrades.toString()]);
    rows.push(["Win Rate", `${stats.winRate.toFixed(1)}%`]);
    rows.push(["Total P&L", `₹${stats.totalProfitLoss.toFixed(2)}`]);
    rows.push(["Follow Setup Rate", `${stats.followSetupRate.toFixed(1)}%`]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trading-report-${period}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const getPeriodLabel = () => {
    const { start, end } = getDateRange();
    switch (period) {
      case "weekly":
        return `Week of ${start.toLocaleDateString("en-IN")}`;
      case "monthly":
        return start.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
      case "yearly":
        return start.getFullYear().toString();
      case "custom":
        return `${start.toLocaleDateString("en-IN")} - ${end.toLocaleDateString("en-IN")}`;
      default:
        return "";
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading reports...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="w-[90%] max-w-[1620px] mx-auto px-4 py-8 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Reports</h1>
            <p className="text-muted-foreground mt-1">Analyze your trading performance over time</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={exportReport} variant="outline" disabled={filteredTrades.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Period Filter */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Select Period
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>Period Type</Label>
                <Select value={period} onValueChange={(v: PeriodType) => { setPeriod(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">This Week</SelectItem>
                    <SelectItem value="monthly">This Month</SelectItem>
                    <SelectItem value="yearly">This Year</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {period === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                      className="w-[180px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => { setCustomEndDate(e.target.value); setCurrentPage(1); }}
                      className="w-[180px]"
                    />
                  </div>
                </>
              )}

              <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{getPeriodLabel()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-7">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Trades</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTrades}</div>
              <p className="text-xs text-muted-foreground mt-1">
                <span className="text-green-600">{stats.winningTrades}W</span> / <span className="text-red-600">{stats.losingTrades}L</span>
                {stats.breakEvenTrades > 0 && <span className="text-muted-foreground"> / {stats.breakEvenTrades}BE</span>}
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
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.tradingDays}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.tradingDays > 0 ? (stats.totalTrades / stats.tradingDays).toFixed(1) : 0} trades/day
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net P&L</CardTitle>
              {stats.totalProfitLoss >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                ₹{stats.totalProfitLoss.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Profit: ₹{stats.totalProfit.toFixed(0)} | Loss: ₹{stats.totalLoss.toFixed(0)}
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
              <div className={`text-2xl font-bold ${stats.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winningTrades} of {stats.totalTrades} trades
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Follow Setup %</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.followSetupRate >= 70 ? "text-green-600 dark:text-green-400" : "text-purple-600 dark:text-purple-400"}`}>
                {stats.followSetupRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.followSetupCount} of {stats.totalTrades} trades
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg P&L/Trade</CardTitle>
              <Calculator className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.avgProfitPerTrade >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                ₹{stats.avgProfitPerTrade.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Per trade average</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-pink-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Profit Factor</CardTitle>
              <PieChart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.profitFactor >= 1 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">Profit / Loss ratio</p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Winning Trades Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Winning Trades</span>
                <span className="font-medium text-green-600">{stats.winningTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Profit</span>
                <span className="font-medium text-green-600">₹{stats.totalProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Average Winning Trade</span>
                <span className="font-medium text-green-600">₹{stats.avgWinningTrade.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Largest Win</span>
                <span className="font-medium text-green-600">₹{stats.largestWin.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Losing Trades Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Losing Trades</span>
                <span className="font-medium text-red-600">{stats.losingTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Total Loss</span>
                <span className="font-medium text-red-600">₹{stats.totalLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">Average Losing Trade</span>
                <span className="font-medium text-red-600">₹{stats.avgLosingTrade.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">Largest Loss</span>
                <span className="font-medium text-red-600">₹{Math.abs(stats.largestLoss).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scripts Traded */}
        {stats.tradedScripts.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">Scripts Traded ({stats.tradedScripts.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="flex flex-wrap gap-2">
                {stats.tradedScripts.map((script) => (
                  <span
                    key={script}
                    className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                  >
                    {script}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trades Table */}
        <Card className="overflow-hidden border-0 shadow-lg">
          <CardHeader className="bg-muted/30">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Trade Details</CardTitle>
                <CardDescription>All trades for the selected period</CardDescription>
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
            {filteredTrades.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No trades found</h3>
                <p className="text-muted-foreground">No trades recorded for the selected period.</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[100px]">Date</TableHead>
                        <TableHead className="min-w-[120px]">Script</TableHead>
                        <TableHead className="min-w-[70px]">Type</TableHead>
                        <TableHead className="text-right min-w-[60px]">Qty</TableHead>
                        <TableHead className="text-right min-w-[90px]">Buy</TableHead>
                        <TableHead className="text-right min-w-[90px]">Sell</TableHead>
                        <TableHead className="text-right min-w-[100px]">P&L</TableHead>
                        <TableHead className="text-right min-w-[110px]">Net P&L</TableHead>
                        <TableHead className="text-center min-w-[80px]">Setup</TableHead>
                        <TableHead className="min-w-[150px]">Remarks</TableHead>
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
                            <span className={trade.profitLoss >= 0 ? "text-green-600" : "text-red-600"}>
                              ₹{trade.profitLoss.toFixed(2)}
                            </span>
                          </TableCell>
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
                              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500 mx-auto" />
                            )}
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate" title={trade.remarks}>
                            {trade.remarks}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-4 border-t bg-muted/20">
                    <div className="text-sm text-muted-foreground">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredTrades.length)} of {filteredTrades.length} trades
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
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
