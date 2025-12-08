"use client";

import { Calendar } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { PeriodType } from "@/types/trading";

interface PeriodSelectorProps {
  value: PeriodType;
  onPeriodChange: (value: PeriodType) => void;
  labels?: {
    all?: string;
    weekly?: string;
    monthly?: string;
    yearly?: string;
  };
  showIcon?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function PeriodSelector({
  value,
  onPeriodChange,
  labels = {
    all: "All Time",
    weekly: "This Week",
    monthly: "This Month",
    yearly: "This Year",
  },
  showIcon = true,
  className,
  triggerClassName,
}: PeriodSelectorProps) {
  return (
    <Select value={value} onValueChange={onPeriodChange}>
      <SelectTrigger className={cn("w-[140px]", triggerClassName, className)}>
        {showIcon && <Calendar className="h-4 w-4 mr-2" />}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{labels.all}</SelectItem>
        <SelectItem value="weekly">{labels.weekly}</SelectItem>
        <SelectItem value="monthly">{labels.monthly}</SelectItem>
        <SelectItem value="yearly">{labels.yearly}</SelectItem>
      </SelectContent>
    </Select>
  );
}

// Utility function to calculate date range based on period
export function getDateRange(period: PeriodType): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  let start: Date;

  switch (period) {
    case "weekly":
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      start = new Date(now);
      start.setDate(now.getDate() - daysToMonday);
      start.setHours(0, 0, 0, 0);
      break;
    case "monthly":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "yearly":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(0); // All time
  }

  return { start, end };
}
