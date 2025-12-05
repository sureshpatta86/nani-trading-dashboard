"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { formatINR, getPLColor, calculateWinRate, calculateProfitFactor } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
} from "lucide-react";

interface IntradayTrade {
  id: string;
  date: string;
  script: string;
  profitLoss: number;
  followSetup: boolean;
}

interface PortfolioStock {
  id: string;
  stockName: string;
  averagePrice: number;
  quantity: number;
  currentPrice: number | null;
  profitLoss: number | null;
}

interface Stats {
  totalPL: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestTrade: number;
  worstTrade: number;
  portfolioValue: number;
  portfolioPL: number;
  setupAdherence: number;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<Stats>({
    totalPL: 0,
    winRate: 0,
    profitFactor: 0,
    totalTrades: 0,
    winningTrades: 0,
    losingTrades: 0,
    bestTrade: 0,
    worstTrade: 0,
    portfolioValue: 0,
    portfolioPL: 0,
    setupAdherence: 0,
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/auth/signin");
    }
    if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch intraday trades and portfolio
      const [tradesRes, portfolioRes] = await Promise.all([
        fetch("/api/intraday"),
        fetch("/api/portfolio?updatePrices=false"),
      ]);

      const tradesData = await tradesRes.json();
      const portfolioData = await portfolioRes.json();

      // Handle API errors - check if response is an error object
      const trades: IntradayTrade[] = Array.isArray(tradesData) ? tradesData : [];
      const portfolio: PortfolioStock[] = Array.isArray(portfolioData) ? portfolioData : [];

      // Calculate stats
      const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
      const winningTrades = trades.filter((t) => t.profitLoss > 0).length;
      const losingTrades = trades.filter((t) => t.profitLoss < 0).length;
      const totalTrades = trades.length;

      const winRate = calculateWinRate(winningTrades, totalTrades);

      const totalProfit = trades
        .filter((t) => t.profitLoss > 0)
        .reduce((sum, t) => sum + t.profitLoss, 0);
      const totalLoss = Math.abs(
        trades
          .filter((t) => t.profitLoss < 0)
          .reduce((sum, t) => sum + t.profitLoss, 0)
      );

      const profitFactor = calculateProfitFactor(totalProfit, totalLoss);

      const bestTrade = trades.length > 0
        ? Math.max(...trades.map((t) => t.profitLoss))
        : 0;
      const worstTrade = trades.length > 0
        ? Math.min(...trades.map((t) => t.profitLoss))
        : 0;

      const followedSetup = trades.filter((t) => t.followSetup).length;
      const setupAdherence = calculateWinRate(followedSetup, totalTrades);

      const portfolioValue = portfolio.reduce(
        (sum, s) => sum + (s.currentPrice || s.averagePrice) * s.quantity,
        0
      );
      const portfolioPL = portfolio.reduce(
        (sum, s) => sum + (s.profitLoss || 0),
        0
      );

      setStats({
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
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const refreshPrices = async () => {
    setRefreshing(true);
    try {
      await fetch("/api/portfolio?updatePrices=true");
      await fetchDashboardData();
    } catch (error) {
      console.error("Error refreshing prices:", error);
    } finally {
      setRefreshing(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative" />
          </div>
          <p className="text-muted-foreground">{tc("loading")}</p>
        </div>
      </div>
    );
  }

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

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("totalPL")}</CardTitle>
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
                {t("totalTrades", { count: stats.totalTrades })}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("winRate")}</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <span className="text-green-600 dark:text-green-400">{stats.winningTrades}W</span>
                <span>/</span>
                <span className="text-red-600 dark:text-red-400">{stats.losingTrades}L</span>
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("profitFactor")}</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                {stats.profitFactor === Infinity
                  ? "∞"
                  : stats.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.profitFactor > 2 ? t("excellent") : stats.profitFactor > 1 ? t("good") : t("needsWork")}
              </p>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-purple-500/10 via-card to-card">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("setupAdherence")}</CardTitle>
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.setupAdherence.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {t("followingPlan")}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Best & Worst Trades + Portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                {t("bestTrade")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(stats.bestTrade)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t("mostProfitable")}
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                  <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-400" />
                </div>
                {t("worstTrade")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatINR(stats.worstTrade)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {t("biggestLoss")}
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden bg-gradient-to-br from-primary/5 via-card to-card">
            <CardHeader>
              <CardTitle className="text-lg">{t("portfolioOverview")}</CardTitle>
              <CardDescription>{t("longTermInvestments")}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("totalValue")}</p>
                  <p className="text-xl font-bold">
                    {formatINR(stats.portfolioValue)}
                  </p>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t("unrealizedPL")}</p>
                  <p className={`text-xl font-bold flex items-center gap-1 ${getPLColor(stats.portfolioPL)}`}>
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
      </main>
    </div>
  );
}
