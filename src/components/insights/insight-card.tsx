"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface InsightCardProps {
  title: string;
  icon: LucideIcon;
  iconColor?: string;
  bgGradient?: string;
  items: string[];
  maxItems?: number;
  emptyMessage?: string;
  badge?: {
    text: string;
    variant: "success" | "warning" | "danger" | "info";
  };
}

export function InsightCard({
  title,
  icon: Icon,
  iconColor = "text-primary",
  bgGradient = "from-primary/5",
  items,
  maxItems = 5,
  emptyMessage = "No insights available",
  badge,
}: InsightCardProps) {
  const displayItems = items.slice(0, maxItems);
  
  const badgeColors = {
    success: "bg-green-500/10 text-green-600 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    danger: "bg-red-500/10 text-red-600 border-red-500/20",
    info: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  };

  return (
    <Card className={cn(
      "relative overflow-hidden border-0 bg-gradient-to-br transition-all duration-300 hover:shadow-lg",
      bgGradient,
      "via-card to-card"
    )}>
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Icon className={cn("h-5 w-5", iconColor)} />
            </div>
            <h3 className="font-semibold text-lg">{title}</h3>
          </div>
          {badge && (
            <span className={cn(
              "px-2 py-1 text-xs font-medium rounded-full border",
              badgeColors[badge.variant]
            )}>
              {badge.text}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {displayItems.length > 0 ? (
          <ul className="space-y-2.5">
            {displayItems.map((item, i) => (
              <li 
                key={i} 
                className="flex items-start gap-3 text-sm text-muted-foreground"
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0",
                  iconColor.replace("text-", "bg-")
                )} />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground italic">{emptyMessage}</p>
        )}
        {items.length > maxItems && (
          <p className="text-xs text-muted-foreground mt-3">
            +{items.length - maxItems} more insights
          </p>
        )}
      </CardContent>
    </Card>
  );
}
