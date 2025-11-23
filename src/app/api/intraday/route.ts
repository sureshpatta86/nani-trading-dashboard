import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/intraday - Fetch all intraday trades for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
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

    return NextResponse.json(trades);
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
    const session = await getServerSession(authOptions);
    
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
    const {
      date,
      day,
      script,
      buySell,
      quantity,
      entryPrice,
      exitPrice,
      points,
      profitLoss,
      followSetup,
      remarks,
    } = body;

    // Validation
    if (!date || !script || !buySell || !quantity || !entryPrice || !exitPrice) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const trade = await prisma.intradayTrade.create({
      data: {
        userId: user.id,
        date: new Date(date),
        day: day || new Date(date).toLocaleDateString('en-IN', { weekday: 'long' }),
        script,
        buySell,
        quantity: parseInt(quantity),
        entryPrice: parseFloat(entryPrice),
        exitPrice: parseFloat(exitPrice),
        points: parseFloat(points || (exitPrice - entryPrice)),
        profitLoss: parseFloat(profitLoss),
        followSetup: followSetup === true || followSetup === "true",
        remarks: remarks || null,
      },
    });

    return NextResponse.json(trade, { status: 201 });
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
    const session = await getServerSession(authOptions);
    
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
    const session = await getServerSession(authOptions);
    
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
