import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateTradingInsights, TradeData } from "@/lib/openai";

// POST /api/ai - Generate AI insights from user's trades
export async function POST() {
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

    return NextResponse.json({
      success: true,
      insights,
      tradesAnalyzed: trades.length,
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

    return NextResponse.json({
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
    });
  } catch (error) {
    console.error("Error fetching trade statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch statistics" },
      { status: 500 }
    );
  }
}
