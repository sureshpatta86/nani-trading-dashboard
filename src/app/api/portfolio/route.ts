import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { fetchStockPrice, fetchMultipleStockPrices } from "@/lib/stock-api";

// GET /api/portfolio - Fetch all portfolio stocks for authenticated user
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

    const { searchParams } = new URL(request.url);
    const updatePrices = searchParams.get("updatePrices") === "true";

    let stocks = await prisma.portfolioStock.findMany({
      where: { userId: user.id },
      orderBy: { stockName: "asc" },
    });

    // Update prices if requested
    if (updatePrices && stocks.length > 0) {
      // Fetch prices for all stocks
      for (const stock of stocks) {
        const priceData = await fetchStockPrice(stock.stockName);
        
        if (priceData) {
          const profitLoss = (priceData.price - stock.averagePrice) * stock.quantity;
          const profitLossPercent = ((priceData.price - stock.averagePrice) / stock.averagePrice) * 100;
          
          await prisma.portfolioStock.update({
            where: { id: stock.id },
            data: {
              currentPrice: priceData.price,
              profitLoss,
              profitLossPercent,
              lastPriceUpdate: new Date(),
            },
          });
        }
      }

      // Refetch updated stocks
      stocks = await prisma.portfolioStock.findMany({
        where: { userId: user.id },
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
    
    // Support both field names for flexibility
    const stockName = (body.symbol || body.stockName)?.toUpperCase();
    const displayName = body.name || body.displayName || null;
    const averagePrice = body.buyPrice || body.averagePrice;
    const quantity = body.quantity;
    const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : new Date();

    // Validation
    if (!stockName || !averagePrice || !quantity) {
      return NextResponse.json(
        { error: "Missing required fields: symbol/stockName, buyPrice/averagePrice, quantity" },
        { status: 400 }
      );
    }

    // Check if stock already exists for this user
    const existingStock = await prisma.portfolioStock.findUnique({
      where: {
        userId_stockName: {
          userId: user.id,
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
      ? (currentPrice - parseFloat(averagePrice)) * parseInt(quantity)
      : null;
    const profitLossPercent = currentPrice
      ? ((currentPrice - parseFloat(averagePrice)) / parseFloat(averagePrice)) * 100
      : null;

    const stock = await prisma.portfolioStock.create({
      data: {
        userId: user.id,
        stockName: stockName,
        displayName: displayName,
        averagePrice: parseFloat(averagePrice),
        quantity: parseInt(quantity),
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
    const stockId = searchParams.get("id");

    if (!stockId) {
      return NextResponse.json(
        { error: "Stock ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Verify stock belongs to user
    const existingStock = await prisma.portfolioStock.findFirst({
      where: { id: stockId, userId: user.id },
    });

    if (!existingStock) {
      return NextResponse.json(
        { error: "Stock not found or unauthorized" },
        { status: 404 }
      );
    }

    // Support both field names for flexibility
    const stockName = body.symbol || body.stockName;
    const displayName = body.name !== undefined ? body.name : (body.displayName !== undefined ? body.displayName : undefined);
    const averagePrice = body.buyPrice !== undefined ? parseFloat(body.buyPrice) : (body.averagePrice !== undefined ? parseFloat(body.averagePrice) : undefined);
    const quantity = body.quantity !== undefined ? parseInt(body.quantity) : undefined;
    const purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : undefined;

    const updateData: Record<string, any> = {};
    
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
    const stockId = searchParams.get("id");

    if (!stockId) {
      return NextResponse.json(
        { error: "Stock ID is required" },
        { status: 400 }
      );
    }

    // Verify stock belongs to user
    const existingStock = await prisma.portfolioStock.findFirst({
      where: { id: stockId, userId: user.id },
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
