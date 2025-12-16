"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState, useMemo, use } from "react";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockChart, ChartDataPoint, TradeMarker } from "@/components/charts";
import { formatINR, cn } from "@/lib/utils";
import { UTCTimestamp } from "lightweight-charts";
import {
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  RefreshCw,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) =>
  fetch(url).then((res) => (res.ok ? res.json() : Promise.reject()));

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  timestamp: number;
  chartData: {
    time: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
}

interface Trade {
  id: string;
  tradeDate: string;
  script: string;
  type: "BUY" | "SELL";
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitLoss: number;
  netProfitLoss: number;
}

type CandleInterval = "1d" | "1wk" | "1mo";
type DataRange = "3mo" | "6mo" | "1y" | "max";

export default function StockDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol: rawSymbol } = use(params);
  const symbol = decodeURIComponent(rawSymbol);
  const { status } = useSession();
  const t = useTranslations("stock");
  const tc = useTranslations("common");
  const [candleInterval, setCandleInterval] = useState<CandleInterval>("1d");
  const [dataRange, setDataRange] = useState<DataRange>("1y");
  const [showMarkers, setShowMarkers] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [indicators, setIndicators] = useState({
    ema9: true,
    ema20: true,
    rsi: true,
  });

  // Fetch stock data with chart
  const {
    data: stockData,
    error: stockError,
    isLoading: stockLoading,
    mutate: mutateStock,
  } = useSWR<StockData>(
    `/api/stock/${encodeURIComponent(symbol)}?range=${dataRange}&interval=${candleInterval}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Fetch user's trades for this stock
  const { data: tradesData } = useSWR<{ trades: Trade[] } | Trade[]>(
    status === "authenticated"
      ? `/api/intraday?script=${encodeURIComponent(symbol.replace(".NS", "").replace(".BO", ""))}`
      : null,
    fetcher,
    { revalidateOnFocus: false }
  );

  const trades = useMemo(() => {
    if (!tradesData) return [];
    return Array.isArray(tradesData) ? tradesData : tradesData.trades || [];
  }, [tradesData]);

  // Convert chart data to the format expected by StockChart
  const chartData: ChartDataPoint[] = useMemo(() => {
    if (!stockData?.chartData) return [];
    return stockData.chartData.map((d) => ({
      time: d.time as UTCTimestamp,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  }, [stockData]);

  // Create trade markers for the chart
  const tradeMarkers: TradeMarker[] = useMemo(() => {
    if (!showMarkers || trades.length === 0) return [];

    return trades.map((trade) => {
      const tradeDate = new Date(trade.tradeDate);
      tradeDate.setHours(12, 0, 0, 0);
      const isBuy = trade.type === "BUY";

      return {
        time: (tradeDate.getTime() / 1000) as UTCTimestamp,
        position: isBuy ? ("belowBar" as const) : ("aboveBar" as const),
        color: isBuy ? "#22c55e" : "#ef4444",
        shape: isBuy ? ("arrowUp" as const) : ("arrowDown" as const),
        text: `${isBuy ? "B" : "S"} ${formatINR(isBuy ? trade.buyPrice : trade.sellPrice)}`,
        size: 2,
      };
    });
  }, [trades, showMarkers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await mutateStock();
    setRefreshing(false);
  };

  if (status === "loading") {
    return <StockPageSkeleton />;
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  const isPositive = stockData && stockData.change >= 0;
  const totalPL = trades.reduce((sum, t) => sum + (t.netProfitLoss || t.profitLoss), 0);
  const winningTrades = trades.filter((t) => (t.netProfitLoss || t.profitLoss) > 0).length;
  const winRate = trades.length > 0 ? (winningTrades / trades.length) * 100 : 0;

  const candleIntervals: { value: CandleInterval; label: string }[] = [
    { value: "1d", label: "D" },
    { value: "1wk", label: "W" },
    { value: "1mo", label: "M" },
  ];

  const dataRanges: { value: DataRange; label: string }[] = [
    { value: "3mo", label: "3M" },
    { value: "6mo", label: "6M" },
    { value: "1y", label: "1Y" },
    { value: "max", label: "All" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="w-[95%] max-w-[1800px] mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link href="/portfolio">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">{symbol}</h1>
              {stockData && (
                <p className="text-muted-foreground text-sm">
                  {t("title")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              {tc("refresh")}
            </Button>
            <a
              href={`https://www.tradingview.com/chart/?symbol=NSE:${symbol.replace(".NS", "").replace(".BO", "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                TradingView
              </Button>
            </a>
          </div>
        </div>

        {stockLoading ? (
          <StockPageSkeleton showNav={false} />
        ) : stockError ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Failed to load stock data</p>
            </CardContent>
          </Card>
        ) : stockData ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price Card */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-3xl font-bold">
                        {formatINR(stockData.price)}
                      </CardTitle>
                      <div
                        className={cn(
                          "flex items-center gap-2 mt-1",
                          isPositive ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                        <span className="font-medium">
                          {isPositive ? "+" : ""}
                          {stockData.change.toFixed(2)} ({isPositive ? "+" : ""}
                          {stockData.changePercent.toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                    {/* Chart Controls */}
                    <div className="flex items-center gap-3">
                      {/* Candle Interval Selector */}
                      <div className="flex gap-1 bg-muted rounded-md p-0.5">
                        {candleIntervals.map((interval) => (
                          <Button
                            key={interval.value}
                            variant={candleInterval === interval.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setCandleInterval(interval.value)}
                            className="h-7 px-2"
                          >
                            {interval.label}
                          </Button>
                        ))}
                      </div>
                      <span className="text-muted-foreground text-xs">|</span>
                      {/* Data Range Selector */}
                      <div className="flex gap-1">
                        {dataRanges.map((range) => (
                          <Button
                            key={range.value}
                            variant={dataRange === range.value ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setDataRange(range.value)}
                            className="h-7 px-2"
                          >
                            {range.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <StockChart
                    data={chartData}
                    markers={tradeMarkers}
                    height={500}
                    showVolume={true}
                    symbol={symbol}
                    indicators={indicators}
                  />
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-sm">
                    <div className="flex flex-wrap items-center gap-4">
                      {/* Indicator Toggles */}
                      <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={indicators.ema9}
                          onChange={(e) => setIndicators({ ...indicators, ema9: e.target.checked })}
                          className="rounded accent-green-500"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-1 bg-green-500 rounded" />
                          EMA 9
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={indicators.ema20}
                          onChange={(e) => setIndicators({ ...indicators, ema20: e.target.checked })}
                          className="rounded accent-red-500"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-4 h-1 bg-red-500 rounded" />
                          EMA 20
                        </span>
                      </label>
                      <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          checked={indicators.rsi}
                          onChange={(e) => setIndicators({ ...indicators, rsi: e.target.checked })}
                          className="rounded accent-green-500"
                        />
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-1 bg-green-500 rounded" />
                          <span className="w-3 h-1 bg-red-500 rounded" />
                          RSI
                        </span>
                      </label>
                      {trades.length > 0 && (
                        <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showMarkers}
                            onChange={(e) => setShowMarkers(e.target.checked)}
                            className="rounded"
                          />
                          {t("showMarkers")} ({trades.length})
                        </label>
                      )}
                    </div>
                    {trades.length > 0 && (
                      <div className="flex gap-4">
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-green-500 rounded-full" />
                          {t("buyMarker")}
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-3 h-3 bg-red-500 rounded-full" />
                          {t("sellMarker")}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Trade History */}
              {trades.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t("tradingHistory")}</CardTitle>
                    <CardDescription>
                      {trades.length} {tc("trades")} • Win Rate: {winRate.toFixed(1)}%
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Buy</TableHead>
                          <TableHead className="text-right">Sell</TableHead>
                          <TableHead className="text-right">P&L</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {trades.slice(0, 10).map((trade) => {
                          const pl = trade.netProfitLoss || trade.profitLoss;
                          return (
                            <TableRow key={trade.id}>
                              <TableCell>
                                {new Date(trade.tradeDate).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded text-xs font-medium",
                                    trade.type === "BUY"
                                      ? "bg-green-500/10 text-green-500"
                                      : "bg-red-500/10 text-red-500"
                                  )}
                                >
                                  {trade.type}
                                </span>
                              </TableCell>
                              <TableCell className="text-right">
                                {trade.quantity}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatINR(trade.buyPrice)}
                              </TableCell>
                              <TableCell className="text-right">
                                {formatINR(trade.sellPrice)}
                              </TableCell>
                              <TableCell
                                className={cn(
                                  "text-right font-medium",
                                  pl >= 0 ? "text-green-500" : "text-red-500"
                                )}
                              >
                                {pl >= 0 ? "+" : ""}
                                {formatINR(pl)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                    {trades.length > 10 && (
                      <div className="mt-4 text-center">
                        <Link href={`/intraday?script=${symbol.replace(".NS", "").replace(".BO", "")}`}>
                          <Button variant="outline" size="sm">
                            {t("viewTrades")} ({trades.length})
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Stats */}
            <div className="space-y-6">
              {/* Stock Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Stock Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">{t("open")}</p>
                      <p className="font-medium">{formatINR(stockData.open)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Prev Close</p>
                      <p className="font-medium">{formatINR(stockData.previousClose)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("high")}</p>
                      <p className="font-medium text-green-500">
                        {formatINR(stockData.high)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{t("low")}</p>
                      <p className="font-medium text-red-500">
                        {formatINR(stockData.low)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">{t("dayRange")}</p>
                    <div className="mt-2 relative h-2 bg-muted rounded-full">
                      <div
                        className="absolute h-full bg-primary rounded-full"
                        style={{
                          left: `${((stockData.low - stockData.low) / (stockData.high - stockData.low)) * 100}%`,
                          right: `${100 - ((stockData.price - stockData.low) / (stockData.high - stockData.low)) * 100}%`,
                        }}
                      />
                      <div
                        className="absolute w-3 h-3 bg-primary rounded-full -top-0.5 transform -translate-x-1/2"
                        style={{
                          left: `${((stockData.price - stockData.low) / (stockData.high - stockData.low)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatINR(stockData.low)}</span>
                      <span>{formatINR(stockData.high)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Your Performance */}
              {trades.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Performance</CardTitle>
                    <CardDescription>
                      Trading this stock
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total P&L</span>
                      <span
                        className={cn(
                          "font-bold text-lg",
                          totalPL >= 0 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {totalPL >= 0 ? "+" : ""}
                        {formatINR(totalPL)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Total Trades</span>
                      <span className="font-medium">{trades.length}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Win Rate</span>
                      <span
                        className={cn(
                          "font-medium",
                          winRate >= 50 ? "text-green-500" : "text-red-500"
                        )}
                      >
                        {winRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Wins / Losses</span>
                      <span className="font-medium">
                        <span className="text-green-500">{winningTrades}</span> /{" "}
                        <span className="text-red-500">{trades.length - winningTrades}</span>
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <a
                    href={`https://www.tradingview.com/chart/?symbol=NSE:${symbol.replace(".NS", "").replace(".BO", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>TradingView Chart</span>
                  </a>
                  <a
                    href={`https://www.screener.in/company/${symbol.replace(".NS", "").replace(".BO", "")}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Screener.in</span>
                  </a>
                  <a
                    href={`https://www.moneycontrol.com/india/stockpricequote/${symbol.replace(".NS", "").replace(".BO", "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>Moneycontrol</span>
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}

function StockPageSkeleton({ showNav = true }: { showNav?: boolean }) {
  return (
    <div className="min-h-screen bg-background">
      {showNav && <Navbar />}
      <main className="w-[95%] max-w-[1800px] mx-auto py-6 px-4">
        <div className="flex items-center gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-1" />
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-10 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[450px] w-full" />
              </CardContent>
            </Card>
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
