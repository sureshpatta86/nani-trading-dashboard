"use client";

import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Brain, Target, Lightbulb, Loader2, Zap, BarChart3, Shield } from "lucide-react";

export default function InsightsPage() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading insights...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">AI Trading Insights</h1>
          <p className="text-muted-foreground mt-1">
            Get AI-powered analysis of your trading patterns and personalized recommendations
          </p>
        </div>

        {/* Coming Soon Hero Card */}
        <Card className="mb-8 relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-purple-600/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              Coming Soon
            </CardTitle>
            <CardDescription className="text-base">
              Advanced AI-powered trading analysis is under development
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-center py-12">
              <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 mb-6">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 opacity-20 blur-xl" />
                <Brain className="h-12 w-12 text-primary relative" />
              </div>
              <h3 className="text-2xl font-bold mb-4">
                Intelligent Trading Analysis
              </h3>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8 text-lg">
                Our AI will analyze your trading patterns, identify strengths and weaknesses, 
                and provide actionable recommendations to improve your trading performance.
              </p>
              <Button size="lg" disabled className="bg-gradient-to-r from-blue-600 to-purple-600 opacity-50">
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Insights
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-green-500/5 via-card to-card hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                Pattern Recognition
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Identify recurring patterns in your winning and losing trades to understand what works best for you.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-blue-500/5 via-card to-card hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get detailed analysis of your risk management practices and suggestions for optimal position sizing.
              </p>
            </CardContent>
          </Card>

          <Card className="group relative overflow-hidden border-0 bg-gradient-to-br from-amber-500/5 via-card to-card hover:shadow-lg transition-all duration-300">
            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -mr-10 -mt-10 group-hover:scale-150 transition-transform duration-300" />
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                Personalized Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Receive customized recommendations based on your unique trading style and performance metrics.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Features Coming */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-purple-500" />
                Performance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Detailed profit/loss breakdown by time period
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Win rate analysis by stock sector
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Best and worst performing trading hours
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-indigo-500" />
                Advanced Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Drawdown analysis and recovery patterns
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Risk-adjusted return calculations
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Trade journal sentiment analysis
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
