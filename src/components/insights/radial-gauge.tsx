"use client";

import { useMemo } from "react";
import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from "recharts";
import { cn } from "@/lib/utils";

interface RadialGaugeProps {
  value: number;
  maxValue?: number;
  label: string;
  sublabel?: string;
  size?: "sm" | "md" | "lg";
  colorScheme?: "success" | "warning" | "danger" | "primary" | "auto";
  showPercentage?: boolean;
  icon?: React.ReactNode;
  animated?: boolean;
}

export function RadialGauge({
  value,
  maxValue = 100,
  label,
  sublabel,
  size = "md",
  colorScheme = "auto",
  showPercentage = true,
  icon,
  animated = true,
}: RadialGaugeProps) {
  const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
  
  const color = useMemo(() => {
    if (colorScheme === "auto") {
      if (percentage >= 70) return "#22c55e"; // green-500
      if (percentage >= 40) return "#f59e0b"; // amber-500
      return "#ef4444"; // red-500
    }
    const colors = {
      success: "#22c55e",
      warning: "#f59e0b",
      danger: "#ef4444",
      primary: "hsl(var(--primary))",
    };
    return colors[colorScheme];
  }, [percentage, colorScheme]);

  const sizeConfig = {
    sm: { width: 100, height: 100, fontSize: "text-lg", labelSize: "text-xs", innerRadius: 35, outerRadius: 45 },
    md: { width: 140, height: 140, fontSize: "text-2xl", labelSize: "text-sm", innerRadius: 50, outerRadius: 65 },
    lg: { width: 180, height: 180, fontSize: "text-3xl", labelSize: "text-base", innerRadius: 65, outerRadius: 85 },
  };

  const config = sizeConfig[size];

  const data = [
    { name: "value", value: percentage, fill: color },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius={config.innerRadius}
            outerRadius={config.outerRadius}
            barSize={12}
            data={data}
            startAngle={180}
            endAngle={0}
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: "hsl(var(--muted))" }}
              dataKey="value"
              cornerRadius={6}
              isAnimationActive={animated}
              animationDuration={1000}
              animationEasing="ease-out"
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {icon && <div className="mb-1 opacity-70">{icon}</div>}
          <span className={cn("font-bold", config.fontSize)}>
            {showPercentage ? `${percentage.toFixed(0)}%` : value.toFixed(1)}
          </span>
        </div>
      </div>
      <div className="text-center mt-2">
        <p className={cn("font-medium", config.labelSize)}>{label}</p>
        {sublabel && (
          <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>
        )}
      </div>
    </div>
  );
}
