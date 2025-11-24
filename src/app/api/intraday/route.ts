import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/intraday - Fetch all intraday trades for the authenticated user
export async function GET(request: NextRequest) {
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

    const trades = await prisma.intradayTrade.findMany({
      where: { userId: user.id },
      orderBy: { date: "desc" },
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
    }));

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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
        userId: user.id,
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
      where: { id: tradeId, userId: user.id },
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
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
      where: { id: tradeId, userId: user.id },
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
