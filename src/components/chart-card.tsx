"use client";

import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  height?: number;
  isEmpty?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function ChartCard({
  title,
  description,
  icon,
  children,
  height = 280,
  isEmpty = false,
  emptyMessage = "No data available",
  className,
}: ChartCardProps) {
  return (
    <Card className={cn("border-0 shadow-lg", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          {icon}
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isEmpty ? (
          <div
            className="flex items-center justify-center text-muted-foreground"
            style={{ height }}
          >
            {emptyMessage}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={height}>
            {children}
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
