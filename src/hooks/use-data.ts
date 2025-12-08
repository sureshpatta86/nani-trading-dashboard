import useSWR, { SWRConfiguration } from "swr";
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
