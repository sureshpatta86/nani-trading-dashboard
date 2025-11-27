/**
 * Yahoo Finance API client for fetching Indian stock prices (Free, No API key required)
 */

interface YahooQuoteResponse {
  chart: {
    result: Array<{
      meta: {
        regularMarketPrice: number;
        previousClose: number;
        regularMarketOpen: number;
        regularMarketDayHigh: number;
        regularMarketDayLow: number;
        regularMarketTime: number;
        symbol: string;
      };
    }>;
    error: null | { code: string; description: string };
  };
}

export interface StockPrice {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: number;
}

/**
 * Fetch stock price from Yahoo Finance API (FREE - No API key required!)
 * @param symbol Stock symbol (e.g., "RELIANCE.NS" for NSE, "RELIANCE.BO" for BSE)
 */
export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  try {
    // Normalize symbol format for Yahoo Finance
    // Add .NS for NSE if no exchange suffix present
    let normalizedSymbol = symbol.toUpperCase();
    if (!normalizedSymbol.includes('.NS') && !normalizedSymbol.includes('.BO')) {
      normalizedSymbol = `${normalizedSymbol}.NS`;
    }

    // Yahoo Finance API endpoint (free, no API key required)
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${normalizedSymbol}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: YahooQuoteResponse = await response.json();

    // Check if there's an error in the response
    if (data.chart.error) {
      console.warn(`Yahoo Finance error for ${normalizedSymbol}:`, data.chart.error.description);
      return null;
    }

    const result = data.chart.result?.[0];
    if (!result || !result.meta) {
      console.warn(`No data found for symbol: ${normalizedSymbol}`);
      return null;
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change = currentPrice - previousClose;
    const changePercent = (change / previousClose) * 100;

    return {
      symbol: normalizedSymbol,
      price: currentPrice,
      change: change,
      changePercent: changePercent,
      high: meta.regularMarketDayHigh,
      low: meta.regularMarketDayLow,
      open: meta.regularMarketOpen,
      previousClose: previousClose,
      timestamp: meta.regularMarketTime * 1000, // Convert to milliseconds
    };
  } catch (error) {
    console.error(`Error fetching stock price for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch multiple stock prices in batch
 */
export async function fetchMultipleStockPrices(symbols: string[]): Promise<Map<string, StockPrice>> {
  const priceMap = new Map<string, StockPrice>();
  
  // Fetch all prices in parallel
  const results = await Promise.allSettled(
    symbols.map(symbol => fetchStockPrice(symbol))
  );

  results.forEach((result, index) => {
    if (result.status === 'fulfilled' && result.value) {
      priceMap.set(symbols[index], result.value);
    }
  });

  return priceMap;
}

/**
 * Check if market is open (NSE/BSE trading hours: 9:15 AM - 3:30 PM IST, Mon-Fri)
 */
export function isMarketOpen(): boolean {
  const now = new Date();
  
  // Convert to IST (UTC+5:30)
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(now.getTime() + istOffset);
  
  const dayOfWeek = istTime.getUTCDay();
  const hours = istTime.getUTCHours();
  const minutes = istTime.getUTCMinutes();
  
  // Check if weekday (Monday=1 to Friday=5)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return false; // Weekend
  }
  
  // Check if within trading hours (9:15 AM to 3:30 PM)
  const currentMinutes = hours * 60 + minutes;
  const marketOpen = 9 * 60 + 15; // 9:15 AM
  const marketClose = 15 * 60 + 30; // 3:30 PM
  
  return currentMinutes >= marketOpen && currentMinutes <= marketClose;
}
