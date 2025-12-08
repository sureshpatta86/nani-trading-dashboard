"use client";

import { TrendingUp, TrendingDown } from "lucide-react";
import { cn, formatINR, getPLColor } from "@/lib/utils";

interface PLValueProps {
  value: number;
  showIcon?: boolean;
  showPrefix?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl font-bold",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

export function PLValue({
  value,
  showIcon = false,
  showPrefix = false,
  className,
  size = "md",
}: PLValueProps) {
  const formattedValue = formatINR(value);
  const colorClass = getPLColor(value);
  const prefix = value >= 0 ? "+" : "";

  return (
    <span className={cn("flex items-center gap-1", sizeClasses[size], colorClass, className)}>
      {showIcon && (
        value >= 0 ? (
          <TrendingUp className={iconSizes[size]} />
        ) : (
          <TrendingDown className={iconSizes[size]} />
        )
      )}
      {showPrefix ? `${prefix}${formattedValue}` : formattedValue}
    </span>
  );
}

interface WinLossDisplayProps {
  wins: number;
  losses: number;
  className?: string;
}

export function WinLossDisplay({ wins, losses, className }: WinLossDisplayProps) {
  return (
    <span className={cn("flex items-center gap-1", className)}>
      <span className="text-green-600 dark:text-green-400">{wins}W</span>
      <span>/</span>
      <span className="text-red-600 dark:text-red-400">{losses}L</span>
    </span>
  );
}
