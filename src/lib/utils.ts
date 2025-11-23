import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number as Indian Rupees (₹)
 */
export function formatINR(amount: number, decimals: number = 2): string {
  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)
  
  return formatted
}

/**
 * Format date to Indian format (DD/MM/YYYY)
 */
export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calculate win rate percentage
 */
export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0
  return (wins / total) * 100
}

/**
 * Calculate profit factor
 */
export function calculateProfitFactor(totalProfit: number, totalLoss: number): number {
  if (totalLoss === 0) return totalProfit > 0 ? Infinity : 0
  return Math.abs(totalProfit / totalLoss)
}

/**
 * Calculate expectancy (average win * win rate - average loss * loss rate)
 */
export function calculateExpectancy(
  avgWin: number,
  winRate: number,
  avgLoss: number,
  lossRate: number
): number {
  return (avgWin * winRate) - (Math.abs(avgLoss) * lossRate)
}

/**
 * Get color class based on profit/loss
 */
export function getPLColor(value: number): string {
  if (value > 0) return 'text-green-600 dark:text-green-400'
  if (value < 0) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

/**
 * Get background color class based on profit/loss
 */
export function getPLBgColor(value: number): string {
  if (value > 0) return 'bg-green-50 dark:bg-green-950'
  if (value < 0) return 'bg-red-50 dark:bg-red-950'
  return 'bg-gray-50 dark:bg-gray-950'
}
