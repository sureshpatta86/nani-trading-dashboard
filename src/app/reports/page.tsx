"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  Printer,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

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
  const t = useTranslations("reports");
  const tc = useTranslations("common");
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
      const response = await fetch("/api/intraday?all=true");
      if (response.ok) {
        const data = await response.json();
        // Handle both array and paginated response
        const tradesArray = Array.isArray(data) ? data : (data.trades || []);
        setTrades(tradesArray);
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

  // Chart Data: Daily P&L
  const dailyPLData = useMemo(() => {
    const dailyMap: Record<string, number> = {};
    
    filteredTrades.forEach((trade) => {
      const date = new Date(trade.tradeDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      dailyMap[date] = (dailyMap[date] || 0) + trade.netProfitLoss;
    });

    return Object.entries(dailyMap)
      .slice(-15)
      .map(([date, pl]) => ({
        date,
        profitLoss: pl,
        fill: pl >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))",
      }));
  }, [filteredTrades]);

  // Chart Data: Win/Loss Distribution - using CSS variable compatible colors
  const winLossData = useMemo(() => {
    if (stats.totalTrades === 0) return [];
    const data = [];
    if (stats.winningTrades > 0) data.push({ name: "Wins", value: stats.winningTrades, color: "hsl(var(--chart-2))" });
    if (stats.losingTrades > 0) data.push({ name: "Losses", value: stats.losingTrades, color: "hsl(var(--destructive))" });
    if (stats.breakEvenTrades > 0) data.push({ name: "Break Even", value: stats.breakEvenTrades, color: "hsl(var(--muted-foreground))" });
    return data;
  }, [stats]);

  // Chart Data: Script-wise performance
  const scriptPLData = useMemo(() => {
    const scriptMap: Record<string, { pl: number; trades: number }> = {};
    
    filteredTrades.forEach((trade) => {
      if (!scriptMap[trade.script]) {
        scriptMap[trade.script] = { pl: 0, trades: 0 };
      }
      scriptMap[trade.script].pl += trade.netProfitLoss;
      scriptMap[trade.script].trades += 1;
    });

    return Object.entries(scriptMap)
      .map(([script, data]) => ({
        script,
        profitLoss: data.pl,
        trades: data.trades,
      }))
      .sort((a, b) => b.profitLoss - a.profitLoss)
      .slice(0, 8);
  }, [filteredTrades]);

  // Print report as PDF
  const printReport = () => {
    window.print();
  };

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
            <p className="text-muted-foreground">{t("loadingReports")}</p>
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
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={printReport} variant="outline" disabled={filteredTrades.length === 0} className="print:hidden">
              <Printer className="mr-2 h-4 w-4" />
              {t("printReport")}
            </Button>
            <Button onClick={exportReport} variant="outline" disabled={filteredTrades.length === 0} className="print:hidden">
              <Download className="mr-2 h-4 w-4" />
              {t("exportReport")}
            </Button>
          </div>
        </div>

        {/* Period Filter */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              {t("selectPeriod")}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-2">
                <Label>{t("periodType")}</Label>
                <Select value={period} onValueChange={(v: PeriodType) => { setPeriod(v); setCurrentPage(1); }}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">{t("thisWeek")}</SelectItem>
                    <SelectItem value="monthly">{t("thisMonth")}</SelectItem>
                    <SelectItem value="yearly">{t("thisYear")}</SelectItem>
                    <SelectItem value="custom">{t("customRange")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {period === "custom" && (
                <>
                  <div className="space-y-2">
                    <Label>{t("startDate")}</Label>
                    <Input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => { setCustomStartDate(e.target.value); setCurrentPage(1); }}
                      className="w-[180px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("endDate")}</Label>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalTrades")}</CardTitle>
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
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("tradingDays")}</CardTitle>
              <CalendarDays className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats.tradingDays}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.tradingDays > 0 ? (stats.totalTrades / stats.tradingDays).toFixed(1) : 0} {t("tradesPerDay")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("netPL")}</CardTitle>
              {stats.totalProfitLoss >= 0 ? <TrendingUp className="h-4 w-4 text-emerald-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.totalProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                ₹{stats.totalProfitLoss.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("profit")}: ₹{stats.totalProfit.toFixed(0)} | {t("loss")}: ₹{stats.totalLoss.toFixed(0)}
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
              <div className={`text-2xl font-bold ${stats.winRate >= 50 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"}`}>
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winningTrades} {tc("of")} {stats.totalTrades} {tc("trades")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("followSetupPercent")}</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.followSetupRate >= 70 ? "text-green-600 dark:text-green-400" : "text-purple-600 dark:text-purple-400"}`}>
                {stats.followSetupRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.followSetupCount} {tc("of")} {stats.totalTrades} {tc("trades")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("avgPLPerTrade")}</CardTitle>
              <Calculator className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.avgProfitPerTrade >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                ₹{stats.avgProfitPerTrade.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("perTradeAverage")}</p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-pink-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-16 h-16 bg-pink-500/10 rounded-full -mr-8 -mt-8" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("profitFactor")}</CardTitle>
              <PieChart className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.profitFactor >= 1 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("profitLossRatio")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 lg:grid-cols-2 print:grid-cols-2">
          {/* Daily P&L Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("dailyPL")}
              </CardTitle>
              <CardDescription>{t("dailyPLDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyPLData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={dailyPLData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(var(--card-foreground))" }}
                      labelStyle={{ color: "hsl(var(--card-foreground))" }}
                      formatter={(value: number) => [`₹${value.toFixed(2)}`, "P&L"]}
                    />
                    <Bar dataKey="profitLoss" radius={[4, 4, 0, 0]}>
                      {dailyPLData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                  {t("noDataForPeriod")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Win/Loss Distribution */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <PieChart className="h-5 w-5 text-primary" />
                {t("tradeDistribution")}
              </CardTitle>
              <CardDescription>{t("winLossBreakdown")}</CardDescription>
            </CardHeader>
            <CardContent>
              {winLossData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={true}
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      itemStyle={{ color: "hsl(var(--card-foreground))" }}
                      labelStyle={{ color: "hsl(var(--card-foreground))" }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  {t("noDataForPeriod")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Script Performance Chart */}
        {scriptPLData.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-primary" />
                {t("scriptPerformance")}
              </CardTitle>
              <CardDescription>{t("scriptPerformanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={scriptPLData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(1)}k`} />
                  <YAxis type="category" dataKey="script" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    itemStyle={{ color: "hsl(var(--card-foreground))" }}
                    labelStyle={{ color: "hsl(var(--card-foreground))" }}
                    formatter={(value: number, name: string) => {
                      if (name === "profitLoss") return [`₹${value.toFixed(2)}`, "P&L"];
                      return [value, name];
                    }}
                  />
                  <Bar dataKey="profitLoss" radius={[0, 4, 4, 0]}>
                    {scriptPLData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.profitLoss >= 0 ? "hsl(var(--chart-2))" : "hsl(var(--destructive))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Detailed Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                {t("winningTradesAnalysis")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t("totalWinningTrades")}</span>
                <span className="font-medium text-green-600">{stats.winningTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t("totalProfit")}</span>
                <span className="font-medium text-green-600">₹{stats.totalProfit.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t("avgWinningTrade")}</span>
                <span className="font-medium text-green-600">₹{stats.avgWinningTrade.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">{t("largestWin")}</span>
                <span className="font-medium text-green-600">₹{stats.largestWin.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                {t("losingTradesAnalysis")}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t("totalLosingTrades")}</span>
                <span className="font-medium text-red-600">{stats.losingTrades}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t("totalLoss")}</span>
                <span className="font-medium text-red-600">₹{stats.totalLoss.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-muted-foreground">{t("avgLosingTrade")}</span>
                <span className="font-medium text-red-600">₹{stats.avgLosingTrade.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-muted-foreground">{t("largestLoss")}</span>
                <span className="font-medium text-red-600">₹{Math.abs(stats.largestLoss).toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Scripts Traded */}
        {stats.tradedScripts.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-muted/30">
              <CardTitle className="text-lg">{t("scriptsTraded")} ({stats.tradedScripts.length})</CardTitle>
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
                <CardTitle className="text-lg">{t("tradeDetails")}</CardTitle>
                <CardDescription>{t("allTradesForPeriod")}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{tc("show")}:</span>
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
          </CardHeader>
          <CardContent className="p-0">
            {filteredTrades.length === 0 ? (
              <div className="text-center py-16 px-4">
                <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">{t("noTradesFound")}</h3>
                <p className="text-muted-foreground">{t("noTradesForPeriod")}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto overflow-y-auto max-h-[500px] scrollbar-thin">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10">
                      <TableRow>
                        <TableHead className="min-w-[100px]">{t("tableDate")}</TableHead>
                        <TableHead className="min-w-[120px]">{t("tableScript")}</TableHead>
                        <TableHead className="min-w-[70px]">{t("tableType")}</TableHead>
                        <TableHead className="text-right min-w-[60px]">{t("tableQty")}</TableHead>
                        <TableHead className="text-right min-w-[90px]">{t("tableBuy")}</TableHead>
                        <TableHead className="text-right min-w-[90px]">{t("tableSell")}</TableHead>
                        <TableHead className="text-right min-w-[100px]">{t("tablePL")}</TableHead>
                        <TableHead className="text-right min-w-[110px]">{t("tableNetPL")}</TableHead>
                        <TableHead className="text-center min-w-[80px]">{t("tableSetup")}</TableHead>
                        <TableHead className="min-w-[150px]">{t("tableRemarks")}</TableHead>
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
                      {tc("showing")} {startIndex + 1} {tc("to")} {Math.min(endIndex, filteredTrades.length)} {tc("of")} {filteredTrades.length} {tc("trades")}
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
