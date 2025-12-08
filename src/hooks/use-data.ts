import useSWR, { SWRConfiguration } from "swr";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 2,
};

interface PortfolioStock {
  id: string;
  symbol: string;
  name?: string;
  quantity: number;
  buyPrice: number;
  currentPrice: number;
  investedValue: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercentage: number;
  purchaseDate: string;
}

interface IntradayTrade {
  id: string;
  tradeDate: string;
  script: string;
  type: "BUY" | "SELL";
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitLoss: number;
  charges: number;
  netProfitLoss: number;
  remarks?: string;
  followSetup: boolean;
  mood: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  initialCapital: number;
  createdAt: string;
}

/**
 * Hook for fetching portfolio data with caching
 */
export function usePortfolio(updatePrices = false) {
  const url = updatePrices ? "/api/portfolio?updatePrices=true" : "/api/portfolio";
  
  return useSWR<PortfolioStock[]>(url, fetcher, {
    ...defaultConfig,
    // Shorter cache time when updating prices
    dedupingInterval: updatePrices ? 5000 : 60000,
  });
}

/**
 * Hook for fetching intraday trades with caching
 */
export function useIntradayTrades() {
  return useSWR<IntradayTrade[]>("/api/intraday", fetcher, defaultConfig);
}

/**
 * Hook for fetching user profile with caching
 */
export function useProfile() {
  return useSWR<UserProfile>("/api/profile", fetcher, {
    ...defaultConfig,
    dedupingInterval: 300000, // 5 minutes - profile rarely changes
  });
}

/**
 * Mutate functions for cache invalidation
 */
export { mutate } from "swr";
