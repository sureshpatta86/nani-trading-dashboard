"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn, formatINR } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Trade {
  tradeDate: string;
  profitLoss: number;
  netProfitLoss?: number;
}

interface PerformanceHeatmapProps {
  trades: Trade[];
  months?: number; // Number of months to show (default: 3)
}

interface DayData {
  date: Date;
  dateStr: string;
  pl: number;
  tradeCount: number;
  isCurrentMonth: boolean;
}

export function PerformanceHeatmap({ trades, months = 3 }: PerformanceHeatmapProps) {
  const t = useTranslations("heatmap");
  const [, setHoveredDay] = useState<DayData | null>(null);

  const { calendarData, monthLabels, maxPL, minPL } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate start date (beginning of the month, `months` months ago)
    const startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1);
    
    // Group trades by date
    const tradesByDate = new Map<string, { pl: number; count: number }>();
    trades.forEach((trade) => {
      const dateStr = trade.tradeDate.split("T")[0];
      const existing = tradesByDate.get(dateStr) || { pl: 0, count: 0 };
      tradesByDate.set(dateStr, {
        pl: existing.pl + (trade.netProfitLoss ?? trade.profitLoss),
        count: existing.count + 1,
      });
    });

    // Generate calendar data
    const calendarData: DayData[][] = [];
    let currentWeek: DayData[] = [];
    let maxPL = 0;
    let minPL = 0;

    // Start from the first day and pad with empty spaces for alignment
    const firstDayOfWeek = startDate.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const emptyDate = new Date(startDate);
      emptyDate.setDate(emptyDate.getDate() - (firstDayOfWeek - i));
      currentWeek.push({
        date: emptyDate,
        dateStr: "",
        pl: 0,
        tradeCount: 0,
        isCurrentMonth: false,
      });
    }

    const currentDate = new Date(startDate);
    while (currentDate <= today) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const tradeData = tradesByDate.get(dateStr);
      const pl = tradeData?.pl || 0;

      if (pl > maxPL) maxPL = pl;
      if (pl < minPL) minPL = pl;

      currentWeek.push({
        date: new Date(currentDate),
        dateStr,
        pl,
        tradeCount: tradeData?.count || 0,
        isCurrentMonth: currentDate.getMonth() === today.getMonth(),
      });

      if (currentDate.getDay() === 6) {
        calendarData.push(currentWeek);
        currentWeek = [];
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add remaining days of the week
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({
          date: new Date(currentDate),
          dateStr: "",
          pl: 0,
          tradeCount: 0,
          isCurrentMonth: false,
        });
        currentDate.setDate(currentDate.getDate() + 1);
      }
      calendarData.push(currentWeek);
    }

    // Generate month labels
    const monthLabels: { month: string; startWeek: number }[] = [];
    let lastMonth = -1;
    calendarData.forEach((week, weekIndex) => {
      const firstValidDay = week.find((d) => d.dateStr);
      if (firstValidDay) {
        const month = firstValidDay.date.getMonth();
        if (month !== lastMonth) {
          monthLabels.push({
            month: firstValidDay.date.toLocaleDateString("en-US", { month: "short" }),
            startWeek: weekIndex,
          });
          lastMonth = month;
        }
      }
    });

    return { calendarData, monthLabels, maxPL, minPL };
  }, [trades, months]);

  const getColorClass = (pl: number, tradeCount: number) => {
    if (tradeCount === 0) return "bg-muted";
    
    const maxAbs = Math.max(Math.abs(maxPL), Math.abs(minPL)) || 1;
    const intensity = Math.min(Math.abs(pl) / maxAbs, 1);

    if (pl > 0) {
      if (intensity > 0.75) return "bg-green-500";
      if (intensity > 0.5) return "bg-green-400";
      if (intensity > 0.25) return "bg-green-300";
      return "bg-green-200";
    } else if (pl < 0) {
      if (intensity > 0.75) return "bg-red-500";
      if (intensity > 0.5) return "bg-red-400";
      if (intensity > 0.25) return "bg-red-300";
      return "bg-red-200";
    }
    return "bg-muted";
  };

  const weekDays = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Month labels */}
          <div className="flex mb-1 ml-6">
            {monthLabels.map((label, i) => (
              <div
                key={i}
                className="text-xs text-muted-foreground"
                style={{
                  marginLeft: i === 0 ? 0 : `${(label.startWeek - (monthLabels[i - 1]?.startWeek || 0)) * 14 - 20}px`,
                }}
              >
                {label.month}
              </div>
            ))}
          </div>

          <div className="flex">
            {/* Day labels */}
            <div className="flex flex-col mr-1 text-xs text-muted-foreground">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="h-3 w-4 flex items-center justify-center"
                  style={{ marginBottom: "2px" }}
                >
                  {i % 2 === 1 ? day : ""}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex gap-0.5">
              {calendarData.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-0.5">
                  {week.map((day, dayIndex) => (
                    <TooltipProvider key={dayIndex} delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={cn(
                              "h-3 w-3 rounded-sm cursor-pointer transition-all hover:ring-2 hover:ring-primary",
                              day.dateStr ? getColorClass(day.pl, day.tradeCount) : "bg-transparent"
                            )}
                            onMouseEnter={() => day.dateStr && setHoveredDay(day)}
                            onMouseLeave={() => setHoveredDay(null)}
                          />
                        </TooltipTrigger>
                        {day.dateStr && (
                          <TooltipContent side="top" className="text-xs">
                            <div className="font-medium">
                              {day.date.toLocaleDateString("en-US", {
                                weekday: "short",
                                month: "short",
                                day: "numeric",
                              })}
                            </div>
                            {day.tradeCount > 0 ? (
                              <>
                                <div
                                  className={cn(
                                    "font-medium",
                                    day.pl >= 0 ? "text-green-500" : "text-red-500"
                                  )}
                                >
                                  {day.pl >= 0 ? "+" : ""}
                                  {formatINR(day.pl)}
                                </div>
                                <div className="text-muted-foreground">
                                  {day.tradeCount} trade{day.tradeCount > 1 ? "s" : ""}
                                </div>
                              </>
                            ) : (
                              <div className="text-muted-foreground">{t("noTrade")}</div>
                            )}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 mt-4 text-xs text-muted-foreground">
            <span>{t("loss")}</span>
            <div className="flex gap-0.5">
              <div className="h-3 w-3 rounded-sm bg-red-500" />
              <div className="h-3 w-3 rounded-sm bg-red-400" />
              <div className="h-3 w-3 rounded-sm bg-red-300" />
              <div className="h-3 w-3 rounded-sm bg-red-200" />
              <div className="h-3 w-3 rounded-sm bg-muted" />
              <div className="h-3 w-3 rounded-sm bg-green-200" />
              <div className="h-3 w-3 rounded-sm bg-green-300" />
              <div className="h-3 w-3 rounded-sm bg-green-400" />
              <div className="h-3 w-3 rounded-sm bg-green-500" />
            </div>
            <span>{t("profit")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
