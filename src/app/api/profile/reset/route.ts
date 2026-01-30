import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE /api/profile/reset - Reset all user data (clean slate)
export async function DELETE() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Delete all user data in a transaction
    await prisma.$transaction([
      // Delete all intraday trades
      prisma.intradayTrade.deleteMany({
        where: { userId },
      }),
      // Delete all portfolio stocks
      prisma.portfolioStock.deleteMany({
        where: { userId },
      }),
      // Delete all deposits
      prisma.deposit.deleteMany({
        where: { userId },
      }),
      // Delete all withdrawals
      prisma.withdrawal.deleteMany({
        where: { userId },
      }),
      // Reset initial capital to 0
      prisma.user.update({
        where: { id: userId },
        data: { initialCapital: 0 },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "All data has been reset successfully",
    });
  } catch (error) {
    console.error("Reset data error:", error);
    return NextResponse.json(
      { error: "Failed to reset data" },
      { status: 500 }
    );
  }
}
