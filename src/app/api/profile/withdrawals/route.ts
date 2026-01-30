import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for withdrawal
const withdrawalSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().transform((val) => new Date(val)),
  reason: z.string().max(500, "Reason too long").optional(),
});

// GET /api/profile/withdrawals - Get all withdrawals for the user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      select: {
        id: true,
        amount: true,
        date: true,
        reason: true,
        createdAt: true,
      },
    });

    // Calculate total withdrawals
    const totalWithdrawals = withdrawals.reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);

    return NextResponse.json({
      withdrawals,
      totalWithdrawals,
    });
  } catch (error) {
    console.error("Error fetching withdrawals:", error);
    return NextResponse.json(
      { error: "Failed to fetch withdrawals" },
      { status: 500 }
    );
  }
}

// POST /api/profile/withdrawals - Add a new withdrawal
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = withdrawalSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }

    const { amount, date, reason } = validationResult.data;

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: session.user.id,
        amount,
        date,
        reason: reason?.trim() || null,
      },
      select: {
        id: true,
        amount: true,
        date: true,
        reason: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: "Withdrawal added successfully",
      withdrawal,
    });
  } catch (error) {
    console.error("Error adding withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to add withdrawal" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/withdrawals - Delete a withdrawal
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Withdrawal ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const withdrawal = await prisma.withdrawal.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!withdrawal) {
      return NextResponse.json(
        { error: "Withdrawal not found" },
        { status: 404 }
      );
    }

    await prisma.withdrawal.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Withdrawal deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting withdrawal:", error);
    return NextResponse.json(
      { error: "Failed to delete withdrawal" },
      { status: 500 }
    );
  }
}
