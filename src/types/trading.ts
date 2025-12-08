// Centralized type definitions for trading data
// Used across all pages and components for consistency

export const MOODS = ["CALM", "CONFIDENT", "ANXIOUS", "FOMO", "PANICKED", "OVERCONFIDENT"] as const;
export type Mood = (typeof MOODS)[number];

export const TRADE_TYPES = ["BUY", "SELL"] as const;
export type TradeType = (typeof TRADE_TYPES)[number];

/**
 * Intraday trade record - full version with all fields
 */
export interface IntradayTrade {
  id: string;
  tradeDate: string;
  script: string;
  type: TradeType;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitLoss: number;
  charges: number;
  netProfitLoss: number;
  remarks?: string;
  followSetup: boolean;
  mood: Mood;
}

/**
 * Simplified trade for dashboard stats
 */
export interface TradeSummary {
  id: string;
  date: string;
  script: string;
  profitLoss: number;
  followSetup: boolean;
}

/**
 * Portfolio stock holding
 */
export interface PortfolioStock {
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

/**
 * User profile data
 */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  initialCapital: number;
  createdAt: string;
}

/**
 * Dashboard statistics
 */
export interface DashboardStats {
  totalPL: number;
  winRate: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestTrade: number;
  worstTrade: number;
  portfolioValue: number;
  portfolioPL: number;
  setupAdherence: number;
  avgTradeSize: number;
  tradingDays: number;
}

/**
 * Report statistics for a given period
 */
export interface ReportStats {
  totalTrades: number;
  tradingDays: number;
  winningTrades: number;
  losingTrades: number;
  breakEvenTrades: number;
  totalProfitLoss: number;
  totalProfit: number;
  totalLoss: number;
  winRate: number;
  followSetupCount: number;
  followSetupRate: number;
  avgProfitPerTrade: number;
  avgWinningTrade: number;
  avgLosingTrade: number;
  largestWin: number;
  largestLoss: number;
  profitFactor: number;
  tradedScripts: string[];
}

/**
 * Period type for reports
 */
export type PeriodType = "weekly" | "monthly" | "yearly" | "custom" | "all";

/**
 * Chart data point for P&L trend
 */
export interface PLDataPoint {
  date: string;
  profitLoss: number;
  cumulativePL: number;
  trades: number;
}

/**
 * Script-wise performance summary
 */
export interface ScriptPerformance {
  script: string;
  trades: number;
  profitLoss: number;
  winRate: number;
  avgPL: number;
}

/**
 * Daily performance summary
 */
export interface DailyPerformance {
  date: string;
  dayOfWeek: string;
  trades: number;
  profitLoss: number;
  winRate: number;
}

/**
 * Mood-wise performance summary
 */
export interface MoodPerformance {
  mood: Mood;
  trades: number;
  profitLoss: number;
  winRate: number;
  avgPL: number;
}

/**
 * Form data for creating/editing trades
 */
export interface TradeFormData {
  tradeDate: string;
  script: string;
  type: TradeType;
  quantity: string;
  buyPrice: string;
  sellPrice: string;
  charges: string;
  remarks: string;
  followSetup: boolean;
  mood: Mood;
}

/**
 * Form data for portfolio stocks
 */
export interface PortfolioFormData {
  symbol: string;
  name: string;
  quantity: string;
  buyPrice: string;
  purchaseDate: string;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
