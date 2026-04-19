import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET /api/profile - Get user profile data
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [user, depositAgg, withdrawalAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          initialCapital: true,
          createdAt: true,
        },
      }),
      prisma.deposit.aggregate({
        where: { userId: session.user.id },
        _sum: { amount: true },
      }),
      prisma.withdrawal.aggregate({
        where: { userId: session.user.id },
        _sum: { amount: true },
      }),
    ]);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const totalDeposits = depositAgg._sum.amount ?? 0;
    const totalWithdrawals = withdrawalAgg._sum.amount ?? 0;
    const currentCapital = user.initialCapital + totalDeposits - totalWithdrawals;

    return NextResponse.json({
      ...user,
      totalDeposits,
      totalWithdrawals,
      currentCapital,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
