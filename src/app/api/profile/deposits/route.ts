import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for deposit
const depositSchema = z.object({
  amount: z.number().positive("Amount must be positive"),
  date: z.string().transform((val) => new Date(val)),
  reason: z.string().max(500, "Reason too long").optional(),
});

// GET /api/profile/deposits - Get all deposits for the user
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const deposits = await prisma.deposit.findMany({
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

    // Calculate total deposits
    const totalDeposits = deposits.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0);

    return NextResponse.json({
      deposits,
      totalDeposits,
    });
  } catch (error) {
    console.error("Error fetching deposits:", error);
    return NextResponse.json(
      { error: "Failed to fetch deposits" },
      { status: 500 }
    );
  }
}

// POST /api/profile/deposits - Add a new deposit
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = depositSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0]?.message || "Invalid data" },
        { status: 400 }
      );
    }

    const { amount, date, reason } = validationResult.data;

    const deposit = await prisma.deposit.create({
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
      message: "Deposit added successfully",
      deposit,
    });
  } catch (error) {
    console.error("Error adding deposit:", error);
    return NextResponse.json(
      { error: "Failed to add deposit" },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/deposits - Delete a deposit
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
        { error: "Deposit ID is required" },
        { status: 400 }
      );
    }

    // Verify ownership before deleting
    const deposit = await prisma.deposit.findFirst({
      where: {
        id,
        userId: session.user.id,
      },
    });

    if (!deposit) {
      return NextResponse.json(
        { error: "Deposit not found" },
        { status: 404 }
      );
    }

    await prisma.deposit.delete({
      where: { id },
    });

    return NextResponse.json({
      message: "Deposit deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting deposit:", error);
    return NextResponse.json(
      { error: "Failed to delete deposit" },
      { status: 500 }
    );
  }
}
