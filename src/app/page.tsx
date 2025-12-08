"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useMemo, useCallback } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Navbar } from "@/components/navbar";
import { DashboardSkeleton } from "@/components/ui/skeleton";
import { formatINR, getPLColor, calculateWinRate, calculateProfitFactor } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Award,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Calendar,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import type { PeriodType, IntradayTrade, PortfolioStock } from "@/types/trading";

// Fetcher for SWR
const fetcher = (url: string) =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject()));

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [period, setPeriod] = useState<PeriodType>("all");
  const [refreshing, setRefreshing] = useState(false);

  // SWR for data fetching with caching
  const { data: trades = [], mutate: mutateTrades } = useSWR<IntradayTrade[]>(
    status === "authenticated" ? "/api/intraday" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  const { data: portfolio = [], mutate: mutatePortfolio } = useSWR<PortfolioStock[]>(
    status === "authenticated" ? "/api/portfolio" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Calculate date range for filtering
  const getDateRange = useCallback(() => {
    const now = new Date();
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    let start: Date;

    switch (period) {
      case "weekly":
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
      default:
        start = new Date(0); // All time
    }

    return { start, end };
  }, [period]);

  // Filter trades by period
  const filteredTrades = useMemo(() => {
    if (period === "all") return trades;
    const { start, end } = getDateRange();
    return trades.filter((trade) => {
      const tradeDate = new Date(trade.tradeDate);
      return tradeDate >= start && tradeDate <= end;
    });
  }, [trades, period, getDateRange]);

  // Calculate stats from filtered trades
  const stats = useMemo(() => {
    const totalPL = filteredTrades.reduce((sum, t) => sum + (t.netProfitLoss || t.profitLoss), 0);
    const winningTrades = filteredTrades.filter((t) => (t.netProfitLoss || t.profitLoss) > 0).length;
    const losingTrades = filteredTrades.filter((t) => (t.netProfitLoss || t.profitLoss) < 0).length;
    const totalTrades = filteredTrades.length;

    const winRate = calculateWinRate(winningTrades, totalTrades);

    const totalProfit = filteredTrades
      .filter((t) => (t.netProfitLoss || t.profitLoss) > 0)
      .reduce((sum, t) => sum + (t.netProfitLoss || t.profitLoss), 0);
    const totalLoss = Math.abs(
      filteredTrades
        .filter((t) => (t.netProfitLoss || t.profitLoss) < 0)
        .reduce((sum, t) => sum + (t.netProfitLoss || t.profitLoss), 0)
    );

    const profitFactor = calculateProfitFactor(totalProfit, totalLoss);

    const bestTrade = filteredTrades.length > 0
      ? Math.max(...filteredTrades.map((t) => t.netProfitLoss || t.profitLoss))
      : 0;
    const worstTrade = filteredTrades.length > 0
      ? Math.min(...filteredTrades.map((t) => t.netProfitLoss || t.profitLoss))
      : 0;

    const followedSetup = filteredTrades.filter((t) => t.followSetup).length;
    const setupAdherence = calculateWinRate(followedSetup, totalTrades);

    const portfolioValue = portfolio.reduce(
      (sum, s) => sum + (s.currentPrice || s.buyPrice) * s.quantity,
      0
    );
    const portfolioPL = portfolio.reduce((sum, s) => sum + (s.profitLoss || 0), 0);

    return {
      totalPL,
      winRate,
      profitFactor,
      totalTrades,
      winningTrades,
      losingTrades,
      bestTrade,
      worstTrade,
      portfolioValue,
      portfolioPL,
      setupAdherence,
    };
  }, [filteredTrades, portfolio]);

  // Prepare chart data - P&L by day
  const plTrendData = useMemo(() => {
    const dailyPL: Record<string, number> = {};

    filteredTrades.forEach((trade) => {
      const date = new Date(trade.tradeDate).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
      });
      dailyPL[date] = (dailyPL[date] || 0) + (trade.netProfitLoss || trade.profitLoss);
    });

    let cumulative = 0;
    return Object.entries(dailyPL)
      .slice(-15) // Last 15 trading days
      .map(([date, pl]) => {
        cumulative += pl;
        return { date, profitLoss: pl, cumulative };
      });
  }, [filteredTrades]);

  // Win/Loss pie chart data
  const winLossData = useMemo(() => {
    if (stats.totalTrades === 0) return [];
    return [
      { name: "Winning", value: stats.winningTrades, color: "#22c55e" },
      { name: "Losing", value: stats.losingTrades, color: "#ef4444" },
    ].filter((d) => d.value > 0);
  }, [stats]);

  // Script-wise performance data
  const scriptData = useMemo(() => {
    const scriptPL: Record<string, { pl: number; count: number }> = {};

    filteredTrades.forEach((trade) => {
      if (!scriptPL[trade.script]) {
        scriptPL[trade.script] = { pl: 0, count: 0 };
      }
      scriptPL[trade.script].pl += trade.netProfitLoss || trade.profitLoss;
      scriptPL[trade.script].count += 1;
    });

    return Object.entries(scriptPL)
      .map(([script, data]) => ({
        script,
        profitLoss: data.pl,
        trades: data.count,
      }))
      .sort((a, b) => b.profitLoss - a.profitLoss)
      .slice(0, 8);
  }, [filteredTrades]);

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/portfolio?updatePrices=true");
      await mutatePortfolio();
      await mutateTrades();
    } catch (error) {
      console.error("Error refreshing prices:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="w-[90%] max-w-[1620px] mx-auto px-4 py-8">
          <DashboardSkeleton />
        </main>
      </div>
    );
  }

  const getPeriodLabel = () => {
    switch (period) {
      case "weekly":
        return t("thisWeek");
      case "monthly":
        return t("thisMonth");
      case "yearly":
        return t("thisYear");
      default:
        return t("allTime");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="w-[90%] max-w-[1620px] mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8 relative overflow-hidden rounded-2xl bg-primary p-8 text-primary-foreground shadow-xl">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:24px_24px]" />
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold mb-2">
                  {t("welcome", { name: session?.user?.name || t("trader") })} 👋
                </h2>
                <p className="text-primary-foreground/80 max-w-xl">
                  {t("welcomeDescription")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={period}
                  onValueChange={(v: PeriodType) => setPeriod(v)}
                >
                  <SelectTrigger className="w-[140px] bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allTime")}</SelectItem>
                    <SelectItem value="weekly">{t("thisWeek")}</SelectItem>
                    <SelectItem value="monthly">{t("thisMonth")}</SelectItem>
                    <SelectItem value="yearly">{t("thisYear")}</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={refreshPrices}
                  disabled={refreshing}
                  variant="secondary"
                  className="bg-primary-foreground/20 hover:bg-primary-foreground/30 text-primary-foreground border-primary-foreground/30 backdrop-blur-sm"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {t("refreshPrices")}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("totalPL")}
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPLColor(stats.totalPL)}`}>
                {formatINR(stats.totalPL)}
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <BarChart3 className="h-3 w-3" />
                {t("totalTrades", { count: stats.totalTrades })} · {getPeriodLabel()}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("winRate")}
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-green-600 dark:text-green-400">
                  {stats.winningTrades}W
                </span>
                <span>/</span>
                <span className="text-red-600 dark:text-red-400">
                  {stats.losingTrades}L
                </span>
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("profitFactor")}
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.profitFactor === Infinity ? "∞" : stats.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.profitFactor > 2
                  ? t("excellent")
                  : stats.profitFactor > 1
                  ? t("good")
                  : t("needsWork")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t("setupAdherence")}
              </CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.setupAdherence.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("followingPlan")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* P&L Trend Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" />
                {t("plTrend")}
              </CardTitle>
              <CardDescription>{t("plTrendDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {plTrendData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={plTrendData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 12 }}
                      className="text-muted-foreground"
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                      className="text-muted-foreground"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatINR(value), "P&L"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulative"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
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
                {t("winLossDistribution")}
              </CardTitle>
              <CardDescription>{t("winLossDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {winLossData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <RechartsPieChart>
                    <Pie
                      data={winLossData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {winLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
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

        {/* Script Performance + Best/Worst */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Script Performance Bar Chart */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">{t("scriptPerformance")}</CardTitle>
              <CardDescription>{t("scriptPerformanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent>
              {scriptData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={scriptData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      type="category"
                      dataKey="script"
                      tick={{ fontSize: 12 }}
                      width={80}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatINR(value), "P&L"]}
                    />
                    <Bar
                      dataKey="profitLoss"
                      fill="hsl(var(--primary))"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-muted-foreground">
                  {t("noDataForPeriod")}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Best & Worst Trades + Portfolio */}
          <div className="space-y-6">
            <Card className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  {t("bestTrade")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatINR(stats.bestTrade)}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                  </div>
                  {t("worstTrade")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatINR(stats.worstTrade)}
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{t("portfolioOverview")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t("totalValue")}</p>
                    <p className="text-lg font-bold">{formatINR(stats.portfolioValue)}</p>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{t("unrealizedPL")}</p>
                    <p
                      className={`text-lg font-bold flex items-center gap-1 ${getPLColor(
                        stats.portfolioPL
                      )}`}
                    >
                      {stats.portfolioPL >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      {formatINR(stats.portfolioPL)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
