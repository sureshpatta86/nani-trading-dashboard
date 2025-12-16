"use client";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MoodData {
  mood: string;
  trades: number;
  winRate: number;
  totalPL: number;
  color: string;
  emoji: string;
}

interface MoodDistributionBarProps {
  moodStats: MoodData[];
  showLabels?: boolean;
  height?: "sm" | "md" | "lg";
}

export function MoodDistributionBar({ 
  moodStats, 
  showLabels = true,
  height = "md" 
}: MoodDistributionBarProps) {
  const totalTrades = moodStats.reduce((sum, m) => sum + m.trades, 0);
  
  const heightConfig = {
    sm: "h-4",
    md: "h-6",
    lg: "h-8",
  };

  if (totalTrades === 0) {
    return (
      <div className={cn(
        "w-full rounded-lg bg-muted flex items-center justify-center text-sm text-muted-foreground",
        heightConfig[height]
      )}>
        No mood data available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className={cn(
        "w-full rounded-lg overflow-hidden flex",
        heightConfig[height]
      )}>
        <TooltipProvider>
          {moodStats.map((mood, i) => {
            const percentage = (mood.trades / totalTrades) * 100;
            if (percentage === 0) return null;
            
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div
                    className="h-full transition-all duration-300 hover:opacity-80 cursor-pointer first:rounded-l-lg last:rounded-r-lg"
                    style={{ 
                      width: `${percentage}%`,
                      backgroundColor: mood.color,
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent side="top">
                  <div className="text-center">
                    <p className="font-medium">{mood.emoji} {mood.mood}</p>
                    <p className="text-xs text-muted-foreground">
                      {mood.trades} trades ({percentage.toFixed(1)}%)
                    </p>
                    <p className="text-xs">
                      Win Rate: <span className={mood.winRate >= 50 ? "text-green-500" : "text-red-500"}>
                        {mood.winRate.toFixed(1)}%
                      </span>
                    </p>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>
      
      {showLabels && (
        <div className="flex flex-wrap gap-3 justify-center">
          {moodStats.filter(m => m.trades > 0).map((mood, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: mood.color }}
              />
              <span className="text-muted-foreground">
                {mood.emoji} {mood.mood} ({((mood.trades / totalTrades) * 100).toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
