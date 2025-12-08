"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  color?: "emerald" | "blue" | "amber" | "purple" | "cyan" | "pink" | "red" | "green";
  valueClassName?: string;
  className?: string;
}

const colorClasses = {
  emerald: {
    gradient: "from-emerald-500/10",
    circle: "bg-emerald-500/10",
    icon: "text-emerald-600 dark:text-emerald-400",
  },
  blue: {
    gradient: "from-blue-500/10",
    circle: "bg-blue-500/10",
    icon: "text-blue-600 dark:text-blue-400",
  },
  amber: {
    gradient: "from-amber-500/10",
    circle: "bg-amber-500/10",
    icon: "text-amber-600 dark:text-amber-400",
  },
  purple: {
    gradient: "from-purple-500/10",
    circle: "bg-purple-500/10",
    icon: "text-purple-600 dark:text-purple-400",
  },
  cyan: {
    gradient: "from-cyan-500/10",
    circle: "bg-cyan-500/10",
    icon: "text-cyan-600 dark:text-cyan-400",
  },
  pink: {
    gradient: "from-pink-500/10",
    circle: "bg-pink-500/10",
    icon: "text-pink-600 dark:text-pink-400",
  },
  red: {
    gradient: "from-red-500/10",
    circle: "bg-red-500/10",
    icon: "text-red-600 dark:text-red-400",
  },
  green: {
    gradient: "from-green-500/10",
    circle: "bg-green-500/10",
    icon: "text-green-600 dark:text-green-400",
  },
};

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = "blue",
  valueClassName,
  className,
}: StatCardProps) {
  const colors = colorClasses[color];

  return (
    <Card
      className={cn(
        "relative overflow-hidden border-0 bg-gradient-to-br via-card to-card",
        colors.gradient,
        className
      )}
    >
      <div
        className={cn(
          "absolute top-0 right-0 w-16 h-16 rounded-full -mr-8 -mt-8",
          colors.circle
        )}
      />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              colors.circle
            )}
          >
            <span className={colors.icon}>{icon}</span>
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", colors.icon, valueClassName)}>
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}
