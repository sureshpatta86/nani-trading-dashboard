"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("tools");
  const tc = useTranslations("common");

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{tc("loading")}</p>
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
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
              <Wrench className="h-5 w-5 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {t("description")}
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="risk-reward" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1.5">
            <TabsTrigger value="risk-reward" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Target className="h-4 w-4" />
              <span className="hidden sm:inline">{t("riskReward")}</span>
              <span className="sm:hidden">R/R</span>
            </TabsTrigger>
            <TabsTrigger value="pl-calculator" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Calculator className="h-4 w-4" />
              <span className="hidden sm:inline">{t("plCalculator")}</span>
              <span className="sm:hidden">P&L</span>
            </TabsTrigger>
            <TabsTrigger value="position-sizing" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Scale className="h-4 w-4" />
              <span className="hidden sm:inline">{t("positionSizing")}</span>
              <span className="sm:hidden">{tc("position")}</span>
            </TabsTrigger>
            <TabsTrigger value="lot-size" className="flex items-center gap-2 data-[state=active]:bg-primary/10">
              <Layers className="h-4 w-4" />
              <span className="hidden sm:inline">{t("lotSize")}</span>
              <span className="sm:hidden">{tc("lots")}</span>
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
          <h3 className="text-lg font-semibold mb-3">{t("aboutTheseTools")}</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground mb-1">{t("riskRewardCalculator")}</p>
              <p>{t("riskRewardDescription")}</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">{t("plCalculatorTitle")}</p>
              <p>{t("plCalculatorDescription")}</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">{t("positionSizingTitle")}</p>
              <p>{t("positionSizingDescription")}</p>
            </div>
            <div>
              <p className="font-medium text-foreground mb-1">{t("lotSizeCalculator")}</p>
              <p>{t("lotSizeDescription")}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
