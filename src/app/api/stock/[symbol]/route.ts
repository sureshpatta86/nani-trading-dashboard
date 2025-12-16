import { NextRequest, NextResponse } from "next/server";
import { fetchChartData, fetchStockPrice, ChartRange, ChartInterval } from "@/lib/stock-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;
    const searchParams = request.nextUrl.searchParams;
    const range = (searchParams.get("range") || "3mo") as ChartRange;
    const interval = (searchParams.get("interval") || "1d") as ChartInterval;

    // Fetch both current price and historical data in parallel
    const [stockPrice, chartData] = await Promise.all([
      fetchStockPrice(symbol),
      fetchChartData(symbol, range, interval),
    ]);

    if (!stockPrice) {
      return NextResponse.json(
        { error: "Stock not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      symbol: stockPrice.symbol,
      price: stockPrice.price,
      change: stockPrice.change,
      changePercent: stockPrice.changePercent,
      open: stockPrice.open,
      high: stockPrice.high,
      low: stockPrice.low,
      previousClose: stockPrice.previousClose,
      timestamp: stockPrice.timestamp,
      chartData,
    });
  } catch (error) {
    console.error("Error fetching stock data:", error);
    return NextResponse.json(
      { error: "Failed to fetch stock data" },
      { status: 500 }
    );
  }
}
