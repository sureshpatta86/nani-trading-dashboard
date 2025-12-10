import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { 
  createIntradayTradeSchema, 
  updateIntradayTradeSchema,
  validate 
} from "@/lib/validations";
import { withRateLimit } from "@/lib/rate-limit";

// Default pagination settings
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

// GET /api/intraday - Fetch intraday trades for the authenticated user with pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Rate limit check
    const rateLimitResponse = await withRateLimit(request, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;
    
    const { searchParams } = new URL(request.url);
    const requestedPage = parseInt(searchParams.get("page") || "1");
    const requestedLimit = parseInt(searchParams.get("limit") || String(DEFAULT_PAGE_SIZE));
    const allRecords = searchParams.get("all") === "true";
    
    // Apply pagination by default unless explicitly requesting all
    const page = Math.max(1, requestedPage);
    const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, requestedLimit));
    
    // Get total count for pagination
    const total = await prisma.intradayTrade.count({ where: { userId } });

    const trades = await prisma.intradayTrade.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      ...(!allRecords && {
        skip: (page - 1) * limit,
        take: limit,
      }),
      select: {
        id: true,
        date: true,
        script: true,
        buySell: true,
        quantity: true,
        entryPrice: true,
        exitPrice: true,
        charges: true,
        profitLoss: true,
        followSetup: true,
        remarks: true,
        mood: true,
      },
    });

    // Transform to match frontend expectations
    const transformedTrades = trades.map(trade => ({
      id: trade.id,
      tradeDate: trade.date,
      script: trade.script,
      type: trade.buySell,
      quantity: trade.quantity,
      buyPrice: trade.entryPrice,
      sellPrice: trade.exitPrice,
      profitLoss: trade.profitLoss,
      charges: trade.charges,
      netProfitLoss: trade.profitLoss,
      followSetup: trade.followSetup,
      remarks: trade.remarks,
      mood: trade.mood,
    }));

    // Return paginated response (always include pagination info now)
    if (!allRecords) {
      return NextResponse.json({
        trades: transformedTrades,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // Return flat array for backward compatibility
    return NextResponse.json(transformedTrades);
  } catch (error) {
    console.error("Error fetching intraday trades:", error);
    return NextResponse.json(
      { error: "Failed to fetch trades" },
      { status: 500 }
    );
  }
}

// POST /api/intraday - Create a new intraday trade
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    // Rate limit check
    const rateLimitResponse = await withRateLimit(request, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    const body = await request.json();
    
    // Normalize field names for backward compatibility before validation
    const normalizedBody = {
      tradeDate: body.tradeDate || body.date,
      script: body.script,
      type: body.type || body.buySell,
      quantity: body.quantity,
      buyPrice: body.buyPrice || body.entryPrice,
      sellPrice: body.sellPrice || body.exitPrice,
      profitLoss: body.profitLoss,
      charges: body.charges || 0,
      netProfitLoss: body.netProfitLoss || body.profitLoss,
      followSetup: body.followSetup ?? true,
      remarks: body.remarks,
      mood: body.mood || 'CALM',
    };
    
    // Validate with Zod
    const validation = validate(createIntradayTradeSchema, normalizedBody);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    const points = data.sellPrice - data.buyPrice;
    const calculatedNetPL = data.netProfitLoss ?? ((data.sellPrice - data.buyPrice) * data.quantity - data.charges);

    const trade = await prisma.intradayTrade.create({
      data: {
        userId,
        date: data.tradeDate,
        day: data.tradeDate.toLocaleDateString('en-IN', { weekday: 'long' }),
        script: data.script,
        buySell: data.type,
        quantity: data.quantity,
        entryPrice: data.buyPrice,
        exitPrice: data.sellPrice,
        points,
        charges: data.charges,
        profitLoss: calculatedNetPL,
        followSetup: data.followSetup,
        remarks: data.remarks || null,
        mood: data.mood,
      },
    });

    // Return in format expected by frontend
    return NextResponse.json({
      id: trade.id,
      tradeDate: trade.date,
      script: trade.script,
      type: trade.buySell,
      quantity: trade.quantity,
      buyPrice: trade.entryPrice,
      sellPrice: trade.exitPrice,
      profitLoss: trade.profitLoss,
      charges: data.charges,
      netProfitLoss: trade.profitLoss,
      followSetup: trade.followSetup,
      remarks: trade.remarks,
      mood: trade.mood,
    }, { status: 201 });
  } catch (error) {
    console.error("Error creating intraday trade:", error);
    return NextResponse.json(
      { error: "Failed to create trade" },
      { status: 500 }
    );
  }
}

// PUT /api/intraday?id=xxx - Update an existing intraday trade
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get("id");

    if (!tradeId) {
      return NextResponse.json(
        { error: "Trade ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify trade belongs to user
    const existingTrade = await prisma.intradayTrade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: "Trade not found or unauthorized" },
        { status: 404 }
      );
    }

    const updatedTrade = await prisma.intradayTrade.update({
      where: { id: tradeId },
      data: {
        date: body.date ? new Date(body.date) : undefined,
        day: body.day,
        script: body.script,
        buySell: body.buySell,
        quantity: body.quantity ? parseInt(body.quantity) : undefined,
        entryPrice: body.entryPrice ? parseFloat(body.entryPrice) : undefined,
        exitPrice: body.exitPrice ? parseFloat(body.exitPrice) : undefined,
        points: body.points ? parseFloat(body.points) : undefined,
        charges: body.charges !== undefined ? parseFloat(body.charges) : undefined,
        profitLoss: body.profitLoss ? parseFloat(body.profitLoss) : undefined,
        followSetup: body.followSetup !== undefined ? body.followSetup : undefined,
        remarks: body.remarks !== undefined ? body.remarks : undefined,
        mood: body.mood !== undefined ? body.mood : undefined,
      },
    });

    return NextResponse.json(updatedTrade);
  } catch (error) {
    console.error("Error updating intraday trade:", error);
    return NextResponse.json(
      { error: "Failed to update trade" },
      { status: 500 }
    );
  }
}

// DELETE /api/intraday?id=xxx - Delete an intraday trade
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const tradeId = searchParams.get("id");

    if (!tradeId) {
      return NextResponse.json(
        { error: "Trade ID is required" },
        { status: 400 }
      );
    }

    // Verify trade belongs to user
    const existingTrade = await prisma.intradayTrade.findFirst({
      where: { id: tradeId, userId },
    });

    if (!existingTrade) {
      return NextResponse.json(
        { error: "Trade not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.intradayTrade.delete({
      where: { id: tradeId },
    });

    return NextResponse.json({ message: "Trade deleted successfully" });
  } catch (error) {
    console.error("Error deleting intraday trade:", error);
    return NextResponse.json(
      { error: "Failed to delete trade" },
      { status: 500 }
    );
  }
}
