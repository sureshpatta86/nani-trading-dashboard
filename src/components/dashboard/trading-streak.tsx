"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface TradingStreakProps {
  tradeDates: string[]; // Array of ISO date strings when trades were made
}

export function TradingStreak({ tradeDates }: TradingStreakProps) {
  const t = useTranslations("streak");

  const { currentStreak, longestStreak, lastTradeDate, tradingDays } = useMemo(() => {
    if (tradeDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0, lastTradeDate: null, tradingDays: 0 };
    }

    // Get unique trade dates and sort them
    const uniqueDates = [...new Set(tradeDates.map((d) => d.split("T")[0]))].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    const tradingDays = uniqueDates.length;
    const lastTradeDate = uniqueDates[0];

    // Calculate current streak (consecutive trading days from today or yesterday)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let checkDate = new Date(today);

    // Check if user traded today or yesterday to start counting
    const todayStr = today.toISOString().split("T")[0];
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    // Start from today if traded today, or yesterday if traded yesterday
    if (uniqueDates.includes(todayStr)) {
      checkDate = today;
    } else if (uniqueDates.includes(yesterdayStr)) {
      checkDate = yesterday;
    } else {
      // Streak is broken
      return { currentStreak: 0, longestStreak: 0, lastTradeDate, tradingDays };
    }

    // Count consecutive days
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      const dayOfWeek = checkDate.getDay();

      // Skip weekends
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }

      if (uniqueDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Calculate longest streak
    let longestStreak = 0;
    let tempStreak = 0;
    const sortedAsc = [...uniqueDates].sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );

    for (let i = 0; i < sortedAsc.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(sortedAsc[i - 1]);
        const currDate = new Date(sortedAsc[i]);
        
        // Calculate business days between dates
        let businessDays = 0;
        const tempDate = new Date(prevDate);
        tempDate.setDate(tempDate.getDate() + 1);
        
        while (tempDate < currDate) {
          const day = tempDate.getDay();
          if (day !== 0 && day !== 6) businessDays++;
          tempDate.setDate(tempDate.getDate() + 1);
        }

        if (businessDays === 0) {
          // Next business day
          tempStreak++;
        } else {
          tempStreak = 1;
        }
      }
      longestStreak = Math.max(longestStreak, tempStreak);
    }

    return { currentStreak, longestStreak, lastTradeDate, tradingDays };
  }, [tradeDates]);

  const getStreakColor = (streak: number) => {
    if (streak >= 10) return "text-orange-500";
    if (streak >= 5) return "text-yellow-500";
    if (streak >= 3) return "text-green-500";
    return "text-muted-foreground";
  };

  const getStreakMessage = () => {
    if (currentStreak === 0) {
      return t("startStreak");
    }
    if (currentStreak >= 5) {
      return t("keepGoing");
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Flame className={cn("h-5 w-5", getStreakColor(currentStreak))} />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{t("currentStreak")}</p>
            <p className={cn("text-3xl font-bold", getStreakColor(currentStreak))}>
              {currentStreak}
            </p>
            <p className="text-xs text-muted-foreground">{t("days")}</p>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">{t("longestStreak")}</p>
            <p className="text-3xl font-bold text-primary">
              {longestStreak}
            </p>
            <p className="text-xs text-muted-foreground">{t("days")}</p>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {t("tradingDays")}
            </span>
            <span className="font-medium">{tradingDays}</span>
          </div>
          {lastTradeDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("lastTrade")}</span>
              <span className="font-medium">
                {new Date(lastTradeDate).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        {getStreakMessage() && (
          <div className="mt-4 p-2 bg-primary/10 rounded-lg text-center">
            <p className="text-sm font-medium text-primary flex items-center justify-center gap-1">
              <Trophy className="h-4 w-4" />
              {getStreakMessage()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
