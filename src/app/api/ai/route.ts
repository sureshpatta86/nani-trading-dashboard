import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateTradingInsights, TradeData } from "@/lib/openai";

// In-memory cache for AI insights (per user)
const insightsCache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// POST /api/ai - Generate AI insights from user's trades
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check for force refresh in request
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("refresh") === "true";
    const cacheKey = `insights_${user.id}`;
    
    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const cached = insightsCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return NextResponse.json(cached.data, {
          headers: {
            "X-Cache": "HIT",
            "Cache-Control": "private, max-age=300",
          },
        });
      }
    }

    // Fetch all trades for the user
    const trades = await prisma.intradayTrade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    if (trades.length === 0) {
      return NextResponse.json({
        error: "No trades found",
        message: "Please log some trades first to generate AI insights.",
      }, { status: 400 });
    }

    // Transform trades to the format expected by the AI
    // Cast to any to handle mood field before migration is applied
    const tradeData: TradeData[] = trades.map((trade) => {
      const t = trade as typeof trade & { mood?: string };
      return {
        id: t.id,
        date: t.date.toISOString().split("T")[0],
        script: t.script,
        type: t.buySell,
        quantity: t.quantity,
        buyPrice: t.entryPrice,
        sellPrice: t.exitPrice,
        profitLoss: t.profitLoss,
        followSetup: t.followSetup,
        remarks: t.remarks,
        mood: t.mood || "CALM",
      };
    });

    // Generate AI insights
    const insights = await generateTradingInsights(tradeData);

    const responseData = {
      success: true,
      insights,
      tradesAnalyzed: trades.length,
      generatedAt: new Date().toISOString(),
    };

    // Cache the results
    insightsCache.set(cacheKey, { data: responseData, timestamp: Date.now() });

    return NextResponse.json(responseData, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=300",
      },
    });
  } catch (error) {
    console.error("Error generating AI insights:", error);
    return NextResponse.json(
      { 
        error: "Failed to generate insights",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      },
      { status: 500 }
    );
  }
}

// Statistics cache (shorter TTL as it's cheaper to compute)
const statsCache = new Map<string, { data: unknown; timestamp: number }>();
const STATS_CACHE_TTL = 60 * 1000; // 1 minute

// GET /api/ai - Get basic trade statistics (without AI generation)
export async function GET() {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check stats cache
    const statsCacheKey = `stats_${user.id}`;
    const cachedStats = statsCache.get(statsCacheKey);
    if (cachedStats && Date.now() - cachedStats.timestamp < STATS_CACHE_TTL) {
      return NextResponse.json(cachedStats.data, {
        headers: {
          "X-Cache": "HIT",
          "Cache-Control": "private, max-age=60",
        },
      });
    }

    // Fetch all trades for the user
    const trades = await prisma.intradayTrade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
    });

    // Calculate basic statistics
    const totalTrades = trades.length;
    const winningTrades = trades.filter(t => t.profitLoss > 0).length;
    const losingTrades = trades.filter(t => t.profitLoss < 0).length;
    const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
    const followedSetup = trades.filter(t => t.followSetup).length;

    // Mood distribution
    // Cast to any to handle mood field before migration is applied
    type TradeWithMood = typeof trades[0] & { mood?: string };
    const moodDistribution: { [key: string]: number } = {};
    trades.forEach((trade) => {
      const t = trade as TradeWithMood;
      const mood = t.mood || "CALM";
      moodDistribution[mood] = (moodDistribution[mood] || 0) + 1;
    });

    // Mood performance
    const moodPerformance: { [key: string]: { trades: number; wins: number; totalPL: number } } = {};
    trades.forEach((trade) => {
      const t = trade as TradeWithMood;
      const mood = t.mood || "CALM";
      if (!moodPerformance[mood]) {
        moodPerformance[mood] = { trades: 0, wins: 0, totalPL: 0 };
      }
      moodPerformance[mood].trades++;
      if (t.profitLoss > 0) moodPerformance[mood].wins++;
      moodPerformance[mood].totalPL += t.profitLoss;
    });

    const statsData = {
      totalTrades,
      winningTrades,
      losingTrades,
      winRate: totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0,
      totalPL,
      avgPL: totalTrades > 0 ? totalPL / totalTrades : 0,
      setupAdherenceRate: totalTrades > 0 ? (followedSetup / totalTrades) * 100 : 0,
      moodDistribution,
      moodPerformance: Object.entries(moodPerformance).map(([mood, stats]) => ({
        mood,
        trades: stats.trades,
        winRate: stats.trades > 0 ? (stats.wins / stats.trades) * 100 : 0,
        avgPL: stats.trades > 0 ? stats.totalPL / stats.trades : 0,
        totalPL: stats.totalPL,
      })),
    };

    // Cache the stats
    statsCache.set(statsCacheKey, { data: statsData, timestamp: Date.now() });

    return NextResponse.json(statsData, {
      headers: {
        "X-Cache": "MISS",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("Error fetching trade statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
