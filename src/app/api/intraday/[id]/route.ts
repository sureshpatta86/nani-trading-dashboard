import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT /api/intraday/[id] - Update an existing intraday trade
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: tradeId } = await params;
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

    // Support both old and new field names
    const updateData: any = {};
    
    if (body.tradeDate) {
      const dateObj = new Date(body.tradeDate);
      updateData.date = dateObj;
      updateData.day = dateObj.toLocaleDateString('en-IN', { weekday: 'long' });
    }
    if (body.script) updateData.script = body.script;
    if (body.type) updateData.buySell = body.type;
    if (body.quantity) updateData.quantity = parseInt(body.quantity);
    if (body.buyPrice) updateData.entryPrice = parseFloat(body.buyPrice);
    if (body.sellPrice) updateData.exitPrice = parseFloat(body.sellPrice);
    if (body.buyPrice && body.sellPrice) {
      updateData.points = parseFloat(body.sellPrice) - parseFloat(body.buyPrice);
    }
    if (body.netProfitLoss !== undefined) updateData.profitLoss = parseFloat(body.netProfitLoss);
    if (body.followSetup !== undefined) updateData.followSetup = Boolean(body.followSetup);
    if (body.remarks !== undefined) updateData.remarks = body.remarks || null;

    const updatedTrade = await prisma.intradayTrade.update({
      where: { id: tradeId },
      data: updateData,
    });

    // Return in format expected by frontend
    return NextResponse.json({
      id: updatedTrade.id,
      tradeDate: updatedTrade.date,
      script: updatedTrade.script,
      type: updatedTrade.buySell,
      quantity: updatedTrade.quantity,
      buyPrice: updatedTrade.entryPrice,
      sellPrice: updatedTrade.exitPrice,
      profitLoss: updatedTrade.profitLoss,
      charges: 0,
      netProfitLoss: updatedTrade.profitLoss,
      followSetup: updatedTrade.followSetup,
      remarks: updatedTrade.remarks,
    });
  } catch (error) {
    console.error("Error updating intraday trade:", error);
    return NextResponse.json(
      { error: "Failed to update trade" },
      { status: 500 }
    );
  }
}

// DELETE /api/intraday/[id] - Delete an intraday trade
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id: tradeId } = await params;

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
