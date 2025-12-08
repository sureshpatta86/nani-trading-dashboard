import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

/**
 * GET /api/dashboard/stats - Get aggregated dashboard statistics
 * Calculates stats server-side using Prisma aggregations for better performance
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "all"; // all, week, month, year

    // Calculate date range based on period
    let dateFilter: { gte?: Date; lte?: Date } = {};
    const now = new Date();

    switch (period) {
      case "week":
        const weekStart = new Date(now);
        const dayOfWeek = weekStart.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        weekStart.setDate(weekStart.getDate() - daysToMonday);
        weekStart.setHours(0, 0, 0, 0);
        dateFilter = { gte: weekStart };
        break;
      case "month":
        dateFilter = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
        break;
      case "year":
        dateFilter = { gte: new Date(now.getFullYear(), 0, 1) };
        break;
      // "all" - no date filter
    }

    const whereClause = {
      userId,
      ...(Object.keys(dateFilter).length > 0 && { date: dateFilter }),
    };

    // Run all aggregations in parallel for better performance
    const [
      tradeAggregates,
      winningStats,
      losingStats,
      followSetupCount,
      bestTrade,
      worstTrade,
      distinctDates,
      portfolioData,
    ] = await Promise.all([
      // Total P&L and count
      prisma.intradayTrade.aggregate({
        where: whereClause,
        _sum: { profitLoss: true },
        _count: { id: true },
      }),
      // Winning trades stats
      prisma.intradayTrade.aggregate({
        where: { ...whereClause, profitLoss: { gt: 0 } },
        _sum: { profitLoss: true },
        _count: { id: true },
      }),
      // Losing trades stats
      prisma.intradayTrade.aggregate({
        where: { ...whereClause, profitLoss: { lt: 0 } },
        _sum: { profitLoss: true },
        _count: { id: true },
      }),
      // Follow setup count
      prisma.intradayTrade.count({
        where: { ...whereClause, followSetup: true },
      }),
      // Best trade
      prisma.intradayTrade.findFirst({
        where: whereClause,
        orderBy: { profitLoss: "desc" },
        select: { profitLoss: true },
      }),
      // Worst trade
      prisma.intradayTrade.findFirst({
        where: whereClause,
        orderBy: { profitLoss: "asc" },
        select: { profitLoss: true },
      }),
      // Distinct trading days
      prisma.intradayTrade.findMany({
        where: whereClause,
        select: { date: true },
        distinct: ["date"],
      }),
      // Portfolio aggregation
      prisma.portfolioStock.findMany({
        where: { userId },
        select: {
          averagePrice: true,
          quantity: true,
          currentPrice: true,
          profitLoss: true,
        },
      }),
    ]);

    // Calculate derived stats
    const totalTrades = tradeAggregates._count.id;
    const totalPL = tradeAggregates._sum.profitLoss || 0;
    const winningTrades = winningStats._count.id;
    const losingTrades = losingStats._count.id;
    const totalProfit = winningStats._sum.profitLoss || 0;
    const totalLoss = Math.abs(losingStats._sum.profitLoss || 0);

    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
    const setupAdherence = totalTrades > 0 ? (followSetupCount / totalTrades) * 100 : 0;

    const portfolioValue = portfolioData.reduce(
      (sum, s) => sum + (s.currentPrice || s.averagePrice) * s.quantity,
      0
    );
    const portfolioPL = portfolioData.reduce(
      (sum, s) => sum + (s.profitLoss || 0),
      0
    );

    const stats = {
      totalPL,
      winRate,
      profitFactor: profitFactor === Infinity ? null : profitFactor,
      totalTrades,
      winningTrades,
      losingTrades,
      bestTrade: bestTrade?.profitLoss || 0,
      worstTrade: worstTrade?.profitLoss || 0,
      portfolioValue,
      portfolioPL,
      setupAdherence,
      avgTradeSize: totalTrades > 0 ? totalPL / totalTrades : 0,
      tradingDays: distinctDates.length,
      period,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
