import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { fetchStockPrice, fetchMultipleStockPrices } from "@/lib/stock-api";
import { 
  createPortfolioStockSchema, 
  updatePortfolioStockSchema,
  validate 
} from "@/lib/validations";
import { withRateLimit } from "@/lib/rate-limit";

// GET /api/portfolio - Fetch all portfolio stocks for authenticated user
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
    const updatePrices = searchParams.get("updatePrices") === "true";

    let stocks = await prisma.portfolioStock.findMany({
      where: { userId },
      orderBy: { stockName: "asc" },
    });

    // Update prices if requested - fetch all prices in parallel for performance
    if (updatePrices && stocks.length > 0) {
      const symbols = stocks.map(s => s.stockName);
      const priceMap = await fetchMultipleStockPrices(symbols);
      
      // Batch update all stocks in a transaction
      const updatePromises = stocks
        .filter(stock => priceMap.has(stock.stockName))
        .map(stock => {
          const priceData = priceMap.get(stock.stockName)!;
          const profitLoss = (priceData.price - stock.averagePrice) * stock.quantity;
          const profitLossPercent = ((priceData.price - stock.averagePrice) / stock.averagePrice) * 100;
          
          return prisma.portfolioStock.update({
            where: { id: stock.id },
            data: {
              currentPrice: priceData.price,
              profitLoss,
              profitLossPercent,
              lastPriceUpdate: new Date(),
            },
          });
        });
      
      if (updatePromises.length > 0) {
        await prisma.$transaction(updatePromises);
      }

      // Refetch updated stocks
      stocks = await prisma.portfolioStock.findMany({
        where: { userId },
        orderBy: { stockName: "asc" },
      });
    }

    // Transform to match frontend expectations
    const transformedStocks = stocks.map(stock => ({
      id: stock.id,
      symbol: stock.stockName,
      name: stock.displayName || undefined,
      quantity: stock.quantity,
      buyPrice: stock.averagePrice,
      currentPrice: stock.currentPrice || 0,
      investedValue: stock.averagePrice * stock.quantity,
      currentValue: (stock.currentPrice || 0) * stock.quantity,
      profitLoss: stock.profitLoss || 0,
      profitLossPercentage: stock.profitLossPercent || 0,
      purchaseDate: stock.purchaseDate || stock.createdAt,
    }));

    return NextResponse.json(transformedStocks);
  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json(
      { error: "Failed to fetch portfolio" },
      { status: 500 }
    );
  }
}

// POST /api/portfolio - Add a new stock to portfolio
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
    
    // Validate with Zod
    const validation = validate(createPortfolioStockSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }
    
    const data = validation.data;
    const stockName = (data.symbol || data.stockName || "").toUpperCase();
    const displayName = data.name || data.displayName || null;
    const averagePrice = data.buyPrice || data.averagePrice || 0;
    const quantity = data.quantity;
    const purchaseDate = data.purchaseDate || new Date();

    // Check if stock already exists for this user
    const existingStock = await prisma.portfolioStock.findUnique({
      where: {
        userId_stockName: {
          userId,
          stockName: stockName,
        },
      },
    });

    if (existingStock) {
      return NextResponse.json(
        { error: "Stock already exists in portfolio" },
        { status: 409 }
      );
    }

    // Fetch current price
    const priceData = await fetchStockPrice(stockName);
    const currentPrice = priceData?.price || null;
    const profitLoss = currentPrice
      ? (currentPrice - averagePrice) * quantity
      : null;
    const profitLossPercent = currentPrice
      ? ((currentPrice - averagePrice) / averagePrice) * 100
      : null;

    const stock = await prisma.portfolioStock.create({
      data: {
        userId,
        stockName: stockName,
        displayName: displayName,
        averagePrice: averagePrice,
        quantity: quantity,
        currentPrice,
        profitLoss,
        profitLossPercent,
        purchaseDate,
        lastPriceUpdate: currentPrice ? new Date() : null,
      },
    });

    // Transform to match frontend expectations
    const transformedStock = {
      id: stock.id,
      symbol: stock.stockName,
      name: stock.displayName || undefined,
      quantity: stock.quantity,
      buyPrice: stock.averagePrice,
      currentPrice: stock.currentPrice || 0,
      investedValue: stock.averagePrice * stock.quantity,
      currentValue: (stock.currentPrice || 0) * stock.quantity,
      profitLoss: stock.profitLoss || 0,
      profitLossPercentage: stock.profitLossPercent || 0,
      purchaseDate: stock.purchaseDate,
    };

    return NextResponse.json(transformedStock, { status: 201 });
  } catch (error) {
    console.error("Error adding stock to portfolio:", error);
    return NextResponse.json(
      { error: "Failed to add stock" },
      { status: 500 }
    );
  }
}

// PUT /api/portfolio?id=xxx - Update a portfolio stock
export async function PUT(request: NextRequest) {
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
    const stockId = searchParams.get("id");

    if (!stockId) {
      return NextResponse.json(
        { error: "Stock ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();
    
    // Validate with Zod
    const validation = validate(updatePortfolioStockSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Verify stock belongs to user
    const existingStock = await prisma.portfolioStock.findFirst({
      where: { id: stockId, userId },
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: "Stock not found or unauthorized" },
        { status: 404 }
      );
    }

    const data = validation.data;
    const stockName = data.symbol || data.stockName;
    const displayName = data.name !== undefined ? data.name : data.displayName;
    const averagePrice = data.buyPrice ?? data.averagePrice;
    const quantity = data.quantity;
    const purchaseDate = data.purchaseDate;

    // Build update data with proper types
    interface PortfolioUpdateData {
      stockName?: string;
      displayName?: string | null;
      averagePrice?: number;
      quantity?: number;
      purchaseDate?: Date;
      profitLoss?: number;
      profitLossPercent?: number;
    }
    
    const updateData: PortfolioUpdateData = {};
    
    if (stockName !== undefined && stockName !== existingStock.stockName) {
      updateData.stockName = stockName.toUpperCase();
    }
    if (displayName !== undefined) {
      updateData.displayName = displayName || null;
    }
    if (averagePrice !== undefined) {
      updateData.averagePrice = averagePrice;
    }
    if (quantity !== undefined) {
      updateData.quantity = quantity;
    }
    if (purchaseDate !== undefined) {
      updateData.purchaseDate = purchaseDate;
    }

    // Recalculate P&L if price or quantity changed
    if (updateData.averagePrice !== undefined || updateData.quantity !== undefined) {
      const avgPrice = updateData.averagePrice !== undefined ? updateData.averagePrice : existingStock.averagePrice;
      const qty = updateData.quantity !== undefined ? updateData.quantity : existingStock.quantity;
      const currentPrice = existingStock.currentPrice;

      if (currentPrice) {
        updateData.profitLoss = (currentPrice - avgPrice) * qty;
        updateData.profitLossPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
      }
    }

    const updatedStock = await prisma.portfolioStock.update({
      where: { id: stockId },
      data: updateData,
    });

    // Fetch latest price if stock symbol changed or if we want fresh data
    let finalStock = updatedStock;
    if (updateData.stockName || updateData.averagePrice !== undefined || updateData.quantity !== undefined) {
      const priceData = await fetchStockPrice(finalStock.stockName);
      
      if (priceData) {
        const profitLoss = (priceData.price - finalStock.averagePrice) * finalStock.quantity;
        const profitLossPercent = ((priceData.price - finalStock.averagePrice) / finalStock.averagePrice) * 100;
        
        finalStock = await prisma.portfolioStock.update({
          where: { id: stockId },
          data: {
            currentPrice: priceData.price,
            profitLoss,
            profitLossPercent,
            lastPriceUpdate: new Date(),
          },
        });
      }
    }

    // Transform to match frontend expectations
    const transformedStock = {
      id: finalStock.id,
      symbol: finalStock.stockName,
      name: finalStock.displayName || undefined,
      quantity: finalStock.quantity,
      buyPrice: finalStock.averagePrice,
      currentPrice: finalStock.currentPrice || 0,
      investedValue: finalStock.averagePrice * finalStock.quantity,
      currentValue: (finalStock.currentPrice || 0) * finalStock.quantity,
      profitLoss: finalStock.profitLoss || 0,
      profitLossPercentage: finalStock.profitLossPercent || 0,
      purchaseDate: finalStock.purchaseDate || finalStock.createdAt,
    };

    return NextResponse.json(transformedStock);
  } catch (error) {
    console.error("Error updating portfolio stock:", error);
    return NextResponse.json(
      { error: "Failed to update stock" },
      { status: 500 }
    );
  }
}

// DELETE /api/portfolio - Delete a stock from portfolio
export async function DELETE(request: NextRequest) {
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
    const stockId = searchParams.get("id");

    if (!stockId) {
      return NextResponse.json(
        { error: "Stock ID is required" },
        { status: 400 }
      );
    }

    // Verify stock belongs to user
    const existingStock = await prisma.portfolioStock.findFirst({
      where: { id: stockId, userId },
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: "Stock not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.portfolioStock.delete({
      where: { id: stockId },
    });

    return NextResponse.json({ message: "Stock removed successfully" });
  } catch (error) {
    console.error("Error removing stock from portfolio:", error);
    return NextResponse.json(
      { error: "Failed to remove stock" },
      { status: 500 }
    );
  }
}
