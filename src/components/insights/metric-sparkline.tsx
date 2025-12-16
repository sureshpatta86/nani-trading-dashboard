"use client";

import { useMemo } from "react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";
import { cn } from "@/lib/utils";

interface MetricSparklineProps {
  data: number[];
  color?: string;
  height?: number;
  showTrend?: boolean;
  className?: string;
}

export function MetricSparkline({
  data,
  color = "hsl(var(--primary))",
  height = 32,
  showTrend = true,
  className,
}: MetricSparklineProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  const trend = useMemo(() => {
    if (data.length < 2) return null;
    const firstHalf = data.slice(0, Math.floor(data.length / 2));
    const secondHalf = data.slice(Math.floor(data.length / 2));
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg * 1.05) return "up";
    if (secondAvg < firstAvg * 0.95) return "down";
    return "flat";
  }, [data]);

  const trendConfig = {
    up: { icon: "↑", color: "text-green-500", label: "Improving" },
    down: { icon: "↓", color: "text-red-500", label: "Declining" },
    flat: { icon: "→", color: "text-muted-foreground", label: "Stable" },
  };

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div 
          className="bg-muted rounded"
          style={{ width: 80, height }}
        />
        <span className="text-xs text-muted-foreground">No data</span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div style={{ width: 80, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {showTrend && trend && (
        <span className={cn("text-sm font-medium", trendConfig[trend].color)}>
          {trendConfig[trend].icon}
        </span>
      )}
    </div>
  );
}
