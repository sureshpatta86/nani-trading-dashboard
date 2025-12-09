import useSWR, { SWRConfiguration } from "swr";
import { useMemo } from "react";
import type { 
  PortfolioStock, 
  IntradayTrade, 
  UserProfile,
  DashboardStats,
  PeriodType 
} from "@/types/trading";

const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
});

const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 2,
};

// Re-export types for convenience
export type { PortfolioStock, IntradayTrade, UserProfile, DashboardStats };

// Helper to normalize API response (handles both array and paginated response)
const normalizeTradesResponse = (data: IntradayTrade[] | { trades: IntradayTrade[] } | undefined): IntradayTrade[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.trades && Array.isArray(data.trades)) return data.trades;
  return [];
};

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
 * Returns normalized array of trades (handles paginated response)
 */
export function useIntradayTrades() {
  const { data, ...rest } = useSWR<IntradayTrade[] | { trades: IntradayTrade[] }>(
    "/api/intraday?all=true", 
    fetcher, 
    defaultConfig
  );
  
  // Normalize the response to always return an array
  const trades = useMemo(() => normalizeTradesResponse(data), [data]);
  
  return { data: trades, ...rest };
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
 * Hook for fetching dashboard stats with server-side aggregation
 */
export function useDashboardStats(period: PeriodType = "all") {
  const url = `/api/dashboard/stats?period=${period}`;
  
  return useSWR<DashboardStats>(url, fetcher, {
    ...defaultConfig,
    dedupingInterval: 30000, // 30 seconds for dashboard
  });
}

/**
 * Mutate functions for cache invalidation
 */
export { mutate } from "swr";
