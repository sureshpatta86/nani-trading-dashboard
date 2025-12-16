"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, AlertCircle, AlertOctagon, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Mistake {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
  impact?: string;
  frequency?: number;
}

interface MistakeCardProps {
  mistakes: Mistake[];
  title?: string;
}

export function MistakeCard({ mistakes, title = "Trading Mistakes" }: MistakeCardProps) {
  const sortedMistakes = [...mistakes].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });

  const severityConfig = {
    high: {
      icon: XCircle,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      iconColor: "text-red-500",
      textColor: "text-red-600 dark:text-red-400",
      label: "Critical",
      labelBg: "bg-red-500",
    },
    medium: {
      icon: AlertOctagon,
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
      iconColor: "text-orange-500",
      textColor: "text-orange-600 dark:text-orange-400",
      label: "Important",
      labelBg: "bg-orange-500",
    },
    low: {
      icon: AlertCircle,
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/30",
      iconColor: "text-yellow-500",
      textColor: "text-yellow-600 dark:text-yellow-400",
      label: "Minor",
      labelBg: "bg-yellow-500",
    },
  };

  if (mistakes.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-green-500/10 via-card to-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <span className="text-2xl">🎉</span>
            </div>
            <div>
              <p className="font-semibold">No Critical Mistakes Detected!</p>
              <p className="text-sm text-muted-foreground">Keep up the disciplined trading</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-red-500/5 via-card to-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {mistakes.length} issue{mistakes.length !== 1 ? "s" : ""} identified
          </p>
        </div>
      </div>
      <CardContent className="pt-4 space-y-3">
        {sortedMistakes.map((mistake, i) => {
          const config = severityConfig[mistake.severity];
          const Icon = config.icon;
          
          return (
            <div
              key={i}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
                config.bg,
                config.border
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0",
                  config.bg
                )}>
                  <Icon className={cn("h-4 w-4", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-sm">{mistake.type}</span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full text-white",
                      config.labelBg
                    )}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {mistake.description}
                  </p>
                  {mistake.impact && (
                    <p className={cn("text-xs mt-2 font-medium", config.textColor)}>
                      💡 Impact: {mistake.impact}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
