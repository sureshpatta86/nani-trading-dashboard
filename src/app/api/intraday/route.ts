import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/intraday - Fetch intraday trades for the authenticated user with optional pagination
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "0");
    const isPaginated = page > 0 && limit > 0;
    
    // Get total count for pagination
    const total = isPaginated 
      ? await prisma.intradayTrade.count({ where: { userId } })
      : 0;

    const trades = await prisma.intradayTrade.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      ...(isPaginated && {
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
      charges: 0, // Not stored separately in current schema
      netProfitLoss: trade.profitLoss,
      followSetup: trade.followSetup,
      remarks: trade.remarks,
      mood: trade.mood,
    }));

    // Return paginated response if pagination was requested
    if (isPaginated) {
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

    const body = await request.json();
    
    // Support both old and new field names for backward compatibility
    const tradeDate = body.tradeDate || body.date;
    const script = body.script;
    const type = body.type || body.buySell;
    const quantity = body.quantity;
    const buyPrice = body.buyPrice || body.entryPrice;
    const sellPrice = body.sellPrice || body.exitPrice;
    const profitLoss = body.profitLoss;
    const charges = body.charges || 0;
    const netProfitLoss = body.netProfitLoss || profitLoss;
    const followSetup = body.followSetup ?? true;
    const remarks = body.remarks;
    const mood = body.mood || 'CALM';

    // Validation
    if (!tradeDate || !script || !type || !quantity || !buyPrice || !sellPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const dateObj = new Date(tradeDate);
    const points = parseFloat(sellPrice) - parseFloat(buyPrice);

    const trade = await prisma.intradayTrade.create({
      data: {
        userId,
        date: dateObj,
        day: dateObj.toLocaleDateString('en-IN', { weekday: 'long' }),
        script,
        buySell: type,
        quantity: parseInt(quantity),
        entryPrice: parseFloat(buyPrice),
        exitPrice: parseFloat(sellPrice),
        points,
        profitLoss: parseFloat(netProfitLoss),
        followSetup: Boolean(followSetup),
        remarks: remarks || null,
        mood: mood,
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
      charges,
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
