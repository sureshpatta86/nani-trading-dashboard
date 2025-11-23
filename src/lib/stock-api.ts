/**
 * Finnhub API client for fetching Indian stock prices
 */

interface FinnhubQuote {
  c: number; // Current price
  d: number; // Change
  dp: number; // Percent change
  h: number; // High price of the day
  l: number; // Low price of the day
  o: number; // Open price of the day
  pc: number; // Previous close price
  t: number; // Timestamp
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
 * Fetch stock price from Finnhub API
 * @param symbol Stock symbol (e.g., "RELIANCE.NS" for NSE, "RELIANCE.BO" for BSE)
 */
export async function fetchStockPrice(symbol: string): Promise<StockPrice | null> {
  const apiKey = process.env.FINNHUB_API_KEY;
  
  if (!apiKey) {
    console.error('FINNHUB_API_KEY not found in environment variables');
    return null;
  }

  try {
    // Normalize symbol format for Finnhub
    // Add .NS for NSE if no exchange suffix present
    let normalizedSymbol = symbol;
    if (!symbol.includes('.NS') && !symbol.includes('.BO')) {
      normalizedSymbol = `${symbol}.NS`;
    }

    const url = `https://finnhub.io/api/v1/quote?symbol=${normalizedSymbol}&token=${apiKey}`;
    const response = await fetch(url, {
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      console.error(`Finnhub API error: ${response.status} ${response.statusText}`);
      return null;
    }

    const data: FinnhubQuote = await response.json();

    // Check if data is valid (Finnhub returns 0 for all values if symbol not found)
    if (data.c === 0 && data.pc === 0) {
      console.warn(`No data found for symbol: ${normalizedSymbol}`);
      return null;
    }

    return {
      symbol: normalizedSymbol,
      price: data.c,
      change: data.d,
      changePercent: data.dp,
      high: data.h,
      low: data.l,
      open: data.o,
      previousClose: data.pc,
      timestamp: data.t * 1000, // Convert to milliseconds
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
