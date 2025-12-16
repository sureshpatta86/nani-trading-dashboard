"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Zap, Target, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface Improvement {
  category: string;
  suggestion: string;
  priority: "high" | "medium" | "low";
  expectedImpact?: string;
}

interface ImprovementCardProps {
  improvements: Improvement[];
  title?: string;
}

const categoryIcons: { [key: string]: typeof Lightbulb } = {
  psychology: BookOpen,
  discipline: Target,
  strategy: TrendingUp,
  risk: Zap,
  default: Lightbulb,
};

export function ImprovementCard({ improvements, title = "Areas to Improve" }: ImprovementCardProps) {
  const sortedImprovements = [...improvements].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const priorityConfig = {
    high: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
      iconColor: "text-emerald-500",
      numberBg: "bg-emerald-500",
      label: "High Impact",
    },
    medium: {
      bg: "bg-blue-500/10",
      border: "border-blue-500/30",
      iconColor: "text-blue-500",
      numberBg: "bg-blue-500",
      label: "Medium Impact",
    },
    low: {
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
      iconColor: "text-slate-500",
      numberBg: "bg-slate-500",
      label: "Quick Win",
    },
  };

  if (improvements.length === 0) {
    return (
      <Card className="border-0 bg-gradient-to-br from-emerald-500/10 via-card to-card">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <span className="text-2xl">🏆</span>
            </div>
            <div>
              <p className="font-semibold">Outstanding Performance!</p>
              <p className="text-sm text-muted-foreground">Keep refining your edge</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-gradient-to-br from-emerald-500/5 via-card to-card overflow-hidden">
      <div className="px-6 py-4 border-b border-border/50 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-xs text-muted-foreground">
            {improvements.length} opportunity{improvements.length !== 1 ? "ies" : "y"} for growth
          </p>
        </div>
      </div>
      <CardContent className="pt-4 space-y-3">
        {sortedImprovements.map((improvement, i) => {
          const config = priorityConfig[improvement.priority];
          const categoryKey = improvement.category.toLowerCase();
          const Icon = categoryIcons[categoryKey] || categoryIcons.default;
          
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
                  "h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white font-bold text-sm",
                  config.numberBg
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Icon className={cn("h-4 w-4", config.iconColor)} />
                    <span className="font-medium text-sm">{improvement.category}</span>
                    <span className={cn(
                      "px-2 py-0.5 text-[10px] font-medium uppercase rounded-full",
                      config.bg,
                      config.iconColor
                    )}>
                      {config.label}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {improvement.suggestion}
                  </p>
                  {improvement.expectedImpact && (
                    <p className="text-xs mt-2 text-emerald-600 dark:text-emerald-400 font-medium">
                      ✨ Expected: {improvement.expectedImpact}
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
