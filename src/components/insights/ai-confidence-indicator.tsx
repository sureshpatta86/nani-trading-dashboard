"use client";

import { cn } from "@/lib/utils";
import { Sparkles, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AIConfidenceIndicatorProps {
  confidence: number; // 0-100
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  variant?: "bar" | "badge" | "ring";
}

export function AIConfidenceIndicator({
  confidence,
  size = "md",
  showLabel = true,
  variant = "bar",
}: AIConfidenceIndicatorProps) {
  const clampedConfidence = Math.min(Math.max(confidence, 0), 100);

  const getConfidenceLevel = () => {
    if (clampedConfidence >= 85) return { label: "Very High", color: "bg-emerald-500", textColor: "text-emerald-500" };
    if (clampedConfidence >= 70) return { label: "High", color: "bg-green-500", textColor: "text-green-500" };
    if (clampedConfidence >= 50) return { label: "Moderate", color: "bg-yellow-500", textColor: "text-yellow-500" };
    if (clampedConfidence >= 30) return { label: "Low", color: "bg-orange-500", textColor: "text-orange-500" };
    return { label: "Very Low", color: "bg-red-500", textColor: "text-red-500" };
  };

  const { label, color, textColor } = getConfidenceLevel();

  const sizeConfig = {
    sm: { height: "h-1.5", width: "w-20", text: "text-xs", icon: "h-3 w-3" },
    md: { height: "h-2", width: "w-28", text: "text-sm", icon: "h-4 w-4" },
    lg: { height: "h-2.5", width: "w-36", text: "text-base", icon: "h-5 w-5" },
  };

  const config = sizeConfig[size];

  if (variant === "badge") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2 py-1 rounded-full border",
              "bg-muted/50 border-border/50 cursor-help"
            )}>
              <Sparkles className={cn(config.icon, textColor)} />
              <span className={cn(config.text, "font-medium", textColor)}>
                {clampedConfidence}%
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Confidence: {label}</p>
            <p className="text-xs text-muted-foreground">
              Based on data quality and pattern strength
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (variant === "ring") {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative inline-flex items-center justify-center cursor-help">
              <svg className={cn(
                size === "sm" ? "w-10 h-10" : size === "md" ? "w-14 h-14" : "w-18 h-18"
              )} viewBox="0 0 36 36">
                <path
                  className="text-muted stroke-current"
                  strokeWidth="3"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={cn("stroke-current", textColor)}
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={`${clampedConfidence}, 100`}
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("font-bold", config.text)}>{clampedConfidence}</span>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>AI Confidence: {label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Default: bar variant
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center gap-2 cursor-help">
            <Sparkles className={cn(config.icon, "text-primary")} />
            {showLabel && (
              <span className={cn(config.text, "text-muted-foreground")}>
                AI Confidence
              </span>
            )}
            <div className={cn(
              "rounded-full bg-muted overflow-hidden",
              config.height,
              config.width
            )}>
              <div
                className={cn("h-full rounded-full transition-all duration-500", color)}
                style={{ width: `${clampedConfidence}%` }}
              />
            </div>
            <span className={cn(config.text, "font-medium", textColor)}>
              {clampedConfidence}%
            </span>
            <Info className="h-3 w-3 text-muted-foreground" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-medium">Confidence Level: {label}</p>
            <p className="text-xs text-muted-foreground">
              This score reflects how confident the AI is in its analysis based on:
            </p>
            <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-0.5">
              <li>Number of trades analyzed</li>
              <li>Data completeness (moods, remarks)</li>
              <li>Pattern consistency</li>
            </ul>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
