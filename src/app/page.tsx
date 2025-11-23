"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { formatINR, getPLColor, calculateWinRate, calculateProfitFactor } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Target,
  Award,
  AlertTriangle,
  RefreshCw,
  Loader2,
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

      const trades: IntradayTrade[] = await tradesRes.json();
      const portfolio: PortfolioStock[] = await portfolioRes.json();

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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Trading Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Track your performance and get AI-powered insights
            </p>
          </div>
          <Button onClick={refreshPrices} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Prices
          </Button>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getPLColor(stats.totalPL)}`}>
                {formatINR(stats.totalPL)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalTrades} total trades
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.winRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.winningTrades} wins / {stats.losingTrades} losses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Profit Factor</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.profitFactor === Infinity
                  ? "∞"
                  : stats.profitFactor.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.profitFactor > 2 ? "Excellent" : stats.profitFactor > 1 ? "Good" : "Needs work"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Setup Adherence</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {stats.setupAdherence.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Following your trading plan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Best & Worst Trades + Portfolio */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Best Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                {formatINR(stats.bestTrade)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Your most profitable trade
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                Worst Trade
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                {formatINR(stats.worstTrade)}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                Biggest loss - learn from it
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Portfolio Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">
                    {formatINR(stats.portfolioValue)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                  <p className={`text-xl font-bold ${getPLColor(stats.portfolioPL)}`}>
                    {formatINR(stats.portfolioPL)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights Placeholder */}
        <Card>
          <CardHeader>
            <CardTitle>AI Trading Insights</CardTitle>
            <CardDescription>
              AI-powered analysis of your trading patterns (Coming soon)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-4">
                AI insights will analyze your trading patterns and provide actionable recommendations
              </p>
              <Button variant="outline" disabled>
                Generate Insights (Coming Soon)
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
