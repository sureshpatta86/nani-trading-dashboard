"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RiskRewardCalculator } from "@/components/tools/risk-reward-calculator";
import { PLCalculator } from "@/components/tools/pl-calculator";
import { PositionSizingCalculator } from "@/components/tools/position-sizing-calculator";
import { LotSizeCalculator } from "@/components/tools/lot-size-calculator";
import {
  Loader2,
  Target,
  Calculator,
  Scale,
  Layers,
  Wrench,
} from "lucide-react";

export default function ToolsPage() {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading tools...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="w-[90%] max-w-[1620px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Wrench className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Trading Tools</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Professional calculators to help you make informed trading decisions
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="risk-reward" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1.5">
            <TabsTrigger value="risk-reward" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500/10 data-[state=active]:to-purple-500/10">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">Risk/Reward</span>
              <span className="sm:hidden">R/R</span>
            </TabsTrigger>
            <TabsTrigger value="pl-calculator" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500/10 data-[state=active]:to-teal-500/10">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">P&L Calculator</span>
              <span className="sm:hidden">P&L</span>
            </TabsTrigger>
            <TabsTrigger value="position-sizing" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500/10 data-[state=active]:to-purple-500/10">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">Position Sizing</span>
              <span className="sm:hidden">Position</span>
            </TabsTrigger>
            <TabsTrigger value="lot-size" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500/10 data-[state=active]:to-amber-500/10">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">Lot Size</span>
              <span className="sm:hidden">Lots</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="risk-reward">
            <RiskRewardCalculator />
          </TabsContent>

          <TabsContent value="pl-calculator">
            <PLCalculator />
          </TabsContent>

          <TabsContent value="position-sizing">
            <PositionSizingCalculator />
          </TabsContent>

          <TabsContent value="lot-size">
            <LotSizeCalculator />
          </TabsContent>
        </Tabs>

        {/* Footer Info */}
        <div className="mt-12 p-6 rounded-xl bg-muted/30 border border-border/50">
          <h3 className="text-lg font-semibold mb-3">About These Tools</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">Risk/Reward Calculator</p>
              <p>Calculate the risk-to-reward ratio for any trade to ensure you&apos;re taking trades with favorable odds.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">P&L Calculator</p>
              <p>Calculate your profit or loss including all trading charges like brokerage, STT, and GST.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Position Sizing</p>
              <p>Determine the optimal number of shares to buy based on your account size and risk tolerance.</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">Lot Size Calculator</p>
              <p>Calculate the number of lots to trade in F&O based on your risk amount and stop loss.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
