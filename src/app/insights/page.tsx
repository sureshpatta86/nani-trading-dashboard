"use client";

import { useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { useTranslations } from "next-intl";
import useSWR from "swr";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  TrendingUp, 
  Brain, 
  Target, 
  Lightbulb, 
  Loader2, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Shield,
  Zap,
  Award,
  Activity,
  PieChart as PieChartIcon,
  Eye,
  BookOpen,
  Flame,
  Trophy,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { PerformanceHeatmap, TradingStreak } from "@/components/dashboard";

import {
  RadialGauge,
  InsightCard,
  MistakeCard,
  ImprovementCard,
  AIConfidenceIndicator,
  MoodDistributionBar,
} from "@/components/insights";

// Types for AI insights
interface MoodStat {
  mood: string;
  trades: number;
  winRate: number;
  avgPL: number;
  totalPL: number;
}

interface Warning {
  type: string;
  description: string;
  severity: "low" | "medium" | "high";
}

interface DetailedAdvice {
  category: string;
  advice: string;
}

interface AIInsights {
  tradingPsychology: {
    summary: string;
    details: string[];
    moodPatterns: string[];
  };
  remarksAnalysis: {
    summary: string;
    themes: string[];
    strategies: string[];
    marketConditions: string[];
    selfReflections: string[];
  };
  moodPerformance: {
    summary: string;
    moodStats: MoodStat[];
    bestMood: string;
    worstMood: string;
  };
  behavioralWarnings: {
    summary: string;
    warningCount: number;
    warnings: Warning[];
  };
  setupDiscipline: {
    summary: string;
    adherenceRate: number;
    followedSetupStats: {
      winRate: number;
      avgPL: number;
    };
    ignoredSetupStats: {
      winRate: number;
      avgPL: number;
    };
    moodCorrelation: string[];
  };
  recommendations: {
    summary: string;
    topTips: string[];
    detailedAdvice: DetailedAdvice[];
  };
  generatedAt: string;
}

// Mood emoji and color mapping
const MOOD_CONFIG: { [key: string]: { emoji: string; color: string; bgColor: string } } = {
  CALM: { emoji: "😌", color: "#3B82F6", bgColor: "bg-blue-500" },
  CONFIDENT: { emoji: "😎", color: "#22C55E", bgColor: "bg-green-500" },
  ANXIOUS: { emoji: "😰", color: "#EAB308", bgColor: "bg-yellow-500" },
  FOMO: { emoji: "😱", color: "#F97316", bgColor: "bg-orange-500" },
  PANICKED: { emoji: "😨", color: "#EF4444", bgColor: "bg-red-500" },
  OVERCONFIDENT: { emoji: "🤩", color: "#A855F7", bgColor: "bg-purple-500" },
};

// Calculate AI confidence based on data quality
function calculateAIConfidence(tradesAnalyzed: number, insights: AIInsights): number {
  let confidence = 0;
  
  // Base confidence from trade count
  if (tradesAnalyzed >= 100) confidence += 40;
  else if (tradesAnalyzed >= 50) confidence += 30;
  else if (tradesAnalyzed >= 20) confidence += 20;
  else if (tradesAnalyzed >= 10) confidence += 15;
  else confidence += 5;
  
  // Mood data completeness
  const moodDataCount = insights.moodPerformance.moodStats.length;
  if (moodDataCount >= 4) confidence += 20;
  else if (moodDataCount >= 2) confidence += 15;
  else if (moodDataCount >= 1) confidence += 10;
  
  // Pattern diversity
  if (insights.tradingPsychology.moodPatterns.length >= 3) confidence += 15;
  else if (insights.tradingPsychology.moodPatterns.length >= 1) confidence += 10;
  
  // Remarks quality
  if (insights.remarksAnalysis.themes.length >= 3) confidence += 15;
  else if (insights.remarksAnalysis.themes.length >= 1) confidence += 10;
  
  // Setup discipline tracking
  if (insights.setupDiscipline.adherenceRate > 0) confidence += 10;
  
  return Math.min(confidence, 100);
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Trade interface for heatmap/streak
interface Trade {
  tradeDate: string;
  profitLoss: number;
  netProfitLoss?: number;
}

export default function InsightsPage() {
  const { status } = useSession();
  const t = useTranslations("insights");
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradesAnalyzed, setTradesAnalyzed] = useState(0);
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch trades data for heatmap and streak
  const { data: tradesData } = useSWR<{ trades: Trade[] }>(
    status === "authenticated" ? "/api/intraday" : null,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  // Extract trade dates for streak component
  const tradeDates = useMemo(() => {
    if (!tradesData?.trades) return [];
    return tradesData.trades.map(t => t.tradeDate);
  }, [tradesData]);

  // Transform trades for heatmap
  const heatmapTrades = useMemo(() => {
    if (!tradesData?.trades) return [];
    return tradesData.trades;
  }, [tradesData]);

  // Calculate derived data
  const aiConfidence = useMemo(() => {
    if (!insights) return 0;
    return calculateAIConfidence(tradesAnalyzed, insights);
  }, [insights, tradesAnalyzed]);

  const moodDistributionData = useMemo(() => {
    if (!insights) return [];
    return insights.moodPerformance.moodStats.map(stat => ({
      mood: stat.mood,
      trades: stat.trades,
      winRate: stat.winRate,
      totalPL: stat.totalPL,
      color: MOOD_CONFIG[stat.mood]?.color || "#6B7280",
      emoji: MOOD_CONFIG[stat.mood]?.emoji || "❓",
    }));
  }, [insights]);

  const overallWinRate = useMemo(() => {
    if (!insights || insights.moodPerformance.moodStats.length === 0) return 0;
    const totalTrades = insights.moodPerformance.moodStats.reduce((sum, m) => sum + m.trades, 0);
    const weightedWinRate = insights.moodPerformance.moodStats.reduce(
      (sum, m) => sum + m.winRate * m.trades,
      0
    );
    return totalTrades > 0 ? weightedWinRate / totalTrades : 0;
  }, [insights]);

  // Transform warnings to mistakes format
  const mistakes = useMemo(() => {
    if (!insights) return [];
    return insights.behavioralWarnings.warnings.map(w => ({
      type: w.type,
      description: w.description,
      severity: w.severity,
    }));
  }, [insights]);

  // Transform recommendations to improvements format
  const improvements = useMemo(() => {
    if (!insights) return [];
    return insights.recommendations.detailedAdvice.map((advice, i) => ({
      category: advice.category,
      suggestion: advice.advice,
      priority: i < 2 ? "high" : i < 4 ? "medium" : "low" as "high" | "medium" | "low",
    }));
  }, [insights]);

  // Radar chart data for psychology analysis
  const psychologyRadarData = useMemo(() => {
    if (!insights) return [];
    return [
      { subject: "Discipline", value: insights.setupDiscipline.adherenceRate, fullMark: 100 },
      { subject: "Consistency", value: Math.min(overallWinRate * 1.5, 100), fullMark: 100 },
      { subject: "Emotional Control", value: mistakes.filter(m => m.severity === "high").length === 0 ? 85 : 50, fullMark: 100 },
      { subject: "Strategy", value: insights.remarksAnalysis.strategies.length >= 3 ? 80 : 50, fullMark: 100 },
      { subject: "Self-Awareness", value: insights.remarksAnalysis.selfReflections.length >= 2 ? 75 : 45, fullMark: 100 },
    ];
  }, [insights, overallWinRate, mistakes]);

  // Chart data for mood performance
  const moodChartData = useMemo(() => {
    if (!insights) return [];
    return insights.moodPerformance.moodStats.map(stat => ({
      name: stat.mood,
      winRate: parseFloat(stat.winRate.toFixed(1)),
      avgPL: parseFloat(stat.avgPL.toFixed(2)),
      trades: stat.trades,
      fill: MOOD_CONFIG[stat.mood]?.color || "#6B7280",
    }));
  }, [insights]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">{t("loadingInsights")}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated") {
    redirect("/auth/signin");
  }

  const generateInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to generate insights");
      }

      setInsights(data.insights);
      setTradesAnalyzed(data.tradesAnalyzed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="w-[90%] max-w-[1620px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                <Brain className="h-8 w-8 text-primary" />
                {t("title")}
              </h1>
              <p className="text-muted-foreground mt-1">
                {t("description")}
              </p>
            </div>
            {insights && (
              <AIConfidenceIndicator 
                confidence={aiConfidence} 
                variant="bar"
                size="md"
              />
            )}
          </div>
        </div>

        {/* Generate/Refresh CTA */}
        <Card className="mb-8 relative overflow-hidden border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/5 rounded-full blur-2xl -ml-16 -mb-16" />
          <CardContent className="relative pt-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{t("aiTradingAnalysis")}</h2>
                  <p className="text-sm text-muted-foreground">
                    {insights 
                      ? `${t("lastGenerated")}: ${formatDate(insights.generatedAt)} • ${tradesAnalyzed} ${t("tradesAnalyzed")}`
                      : t("generateDescription")
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button 
                  onClick={generateInsights} 
                  disabled={isLoading}
                  size="lg"
                  className="min-w-[180px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("analyzingTrades")}
                    </>
                  ) : insights ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      {t("refreshInsights")}
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      {t("generateInsights")}
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-600 dark:text-red-400">
                <p className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {error}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="h-24 w-24 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 h-24 w-24 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Brain className="h-10 w-10 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-6 text-lg font-medium">{t("analyzingPatterns")}</p>
            <p className="text-muted-foreground">{t("mayTakeFewSeconds")}</p>
            <div className="flex gap-1 mt-4">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !insights && !error && (
          <div className="text-center py-16">
            <div className="relative inline-flex items-center justify-center mb-8">
              <div className="absolute w-32 h-32 rounded-full bg-primary/10 animate-pulse" />
              <div className="relative w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <Sparkles className="h-14 w-14 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4">{t("readyToAnalyze")}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              {t("readyToAnalyzeDescription")}
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                <Brain className="h-4 w-4" />
                <span>{t("featurePsychology")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                <Activity className="h-4 w-4" />
                <span>{t("featureMood")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                <AlertTriangle className="h-4 w-4" />
                <span>{t("featureMistakes")}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-full">
                <Lightbulb className="h-4 w-4" />
                <span>{t("featureTips")}</span>
              </div>
            </div>
          </div>
        )}

        {/* Insights Dashboard */}
        {!isLoading && insights && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="w-full justify-start overflow-x-auto">
              <TabsTrigger value="overview" className="gap-2">
                <Eye className="h-4 w-4" />
                {t("tabOverview")}
              </TabsTrigger>
              <TabsTrigger value="psychology" className="gap-2">
                <Brain className="h-4 w-4" />
                {t("tabPsychology")}
              </TabsTrigger>
              <TabsTrigger value="performance" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                {t("tabPerformance")}
              </TabsTrigger>
              <TabsTrigger value="actions" className="gap-2">
                <Zap className="h-4 w-4" />
                {t("tabActions")}
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Key Metrics Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 bg-gradient-to-br from-green-500/5 via-card to-card">
                  <CardContent className="pt-6 flex justify-center">
                    <RadialGauge
                      value={overallWinRate}
                      label={t("winRate")}
                      sublabel={t("overallSuccess")}
                      colorScheme="auto"
                      icon={<Target className="h-4 w-4" />}
                    />
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-cyan-500/5 via-card to-card">
                  <CardContent className="pt-6 flex justify-center">
                    <RadialGauge
                      value={insights.setupDiscipline.adherenceRate}
                      label={t("setupAdherence")}
                      sublabel={t("followingPlan")}
                      colorScheme="auto"
                      icon={<Shield className="h-4 w-4" />}
                    />
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-purple-500/5 via-card to-card">
                  <CardContent className="pt-6 flex justify-center">
                    <RadialGauge
                      value={aiConfidence}
                      label={t("aiConfidenceLabel")}
                      sublabel={t("analysisQuality")}
                      colorScheme="primary"
                      icon={<Sparkles className="h-4 w-4" />}
                    />
                  </CardContent>
                </Card>
                <Card className="border-0 bg-gradient-to-br from-amber-500/5 via-card to-card">
                  <CardContent className="pt-6 flex justify-center">
                    <RadialGauge
                      value={Math.max(0, 100 - (mistakes.filter(m => m.severity === "high").length * 20) - (mistakes.filter(m => m.severity === "medium").length * 10))}
                      label={t("riskScore")}
                      sublabel={t("behavioralHealth")}
                      colorScheme="auto"
                      icon={<Activity className="h-4 w-4" />}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Mood Distribution Overview */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    {t("moodDistribution")}
                  </CardTitle>
                  <CardDescription>{t("moodDistributionDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <MoodDistributionBar moodStats={moodDistributionData} height="lg" />
                </CardContent>
              </Card>

              {/* Quick Insights Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Best/Worst Mood Cards */}
                <Card className="border-0 bg-gradient-to-br from-green-500/10 via-card to-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-green-500/20 flex items-center justify-center text-3xl">
                        {MOOD_CONFIG[insights.moodPerformance.bestMood]?.emoji || "😌"}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("bestMood")}</p>
                        <p className="text-xl font-bold text-green-600 dark:text-green-400">
                          {insights.moodPerformance.bestMood}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("bestMoodDesc")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-red-500/10 via-card to-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-2xl bg-red-500/20 flex items-center justify-center text-3xl">
                        {MOOD_CONFIG[insights.moodPerformance.worstMood]?.emoji || "😰"}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("worstMood")}</p>
                        <p className="text-xl font-bold text-red-600 dark:text-red-400">
                          {insights.moodPerformance.worstMood}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("worstMoodDesc")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Warning Count Card */}
                <Card className={`border-0 bg-gradient-to-br ${insights.behavioralWarnings.warningCount === 0 ? 'from-green-500/10' : 'from-orange-500/10'} via-card to-card`}>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className={`h-16 w-16 rounded-2xl ${insights.behavioralWarnings.warningCount === 0 ? 'bg-green-500/20' : 'bg-orange-500/20'} flex items-center justify-center`}>
                        {insights.behavioralWarnings.warningCount === 0 ? (
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-8 w-8 text-orange-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{t("warningsLabel")}</p>
                        <p className={`text-xl font-bold ${insights.behavioralWarnings.warningCount === 0 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                          {insights.behavioralWarnings.warningCount === 0 ? t("noWarnings") : `${insights.behavioralWarnings.warningCount} ${t("issuesFound")}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{t("behavioralAnalysis")}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Recommendations */}
              <Card className="border-0 bg-gradient-to-br from-amber-500/5 via-card to-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-500" />
                    {t("topRecommendations")}
                  </CardTitle>
                  <CardDescription>{insights.recommendations.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {insights.recommendations.topTips.slice(0, 3).map((tip, i) => (
                      <div 
                        key={i} 
                        className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20"
                      >
                        <span className="flex items-center justify-center w-8 h-8 bg-amber-500 text-white rounded-full text-sm font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm leading-relaxed">{tip}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Psychology Tab */}
            <TabsContent value="psychology" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Psychology Radar */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-500" />
                      {t("tradingProfile")}
                    </CardTitle>
                    <CardDescription>{t("tradingProfileDesc")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RadarChart data={psychologyRadarData}>
                        <PolarGrid />
                        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Score"
                          dataKey="value"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Psychology Insights */}
                <InsightCard
                  title={t("tradingPsychology")}
                  icon={Brain}
                  iconColor="text-purple-500"
                  bgGradient="from-purple-500/10"
                  items={[
                    insights.tradingPsychology.summary,
                    ...insights.tradingPsychology.details,
                  ]}
                  maxItems={6}
                  badge={{
                    text: `${insights.tradingPsychology.moodPatterns.length} ${t("patterns")}`,
                    variant: "info",
                  }}
                />
              </div>

              {/* Mood Patterns */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    {t("moodPatterns")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {insights.tradingPsychology.moodPatterns.map((pattern, i) => (
                      <div 
                        key={i}
                        className="p-4 bg-gradient-to-br from-blue-500/10 via-card to-card rounded-xl border border-blue-500/20"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                            <Activity className="h-4 w-4 text-blue-500" />
                          </div>
                          <p className="text-sm leading-relaxed">{pattern}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Remarks Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InsightCard
                  title={t("strategiesMentioned")}
                  icon={Target}
                  iconColor="text-cyan-500"
                  bgGradient="from-cyan-500/10"
                  items={insights.remarksAnalysis.strategies}
                  maxItems={5}
                  emptyMessage={t("noStrategies")}
                />
                <InsightCard
                  title={t("selfReflections")}
                  icon={BookOpen}
                  iconColor="text-indigo-500"
                  bgGradient="from-indigo-500/10"
                  items={insights.remarksAnalysis.selfReflections.map(r => `"${r}"`)}
                  maxItems={4}
                  emptyMessage={t("noReflections")}
                />
              </div>

              {/* Themes */}
              {insights.remarksAnalysis.themes.length > 0 && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-500" />
                      {t("commonThemes")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {insights.remarksAnalysis.themes.map((theme, i) => (
                        <span 
                          key={i} 
                          className="px-3 py-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium border border-blue-500/20"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Mood vs Win Rate Bar Chart */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-blue-500" />
                      {t("moodVsWinRate")}
                    </CardTitle>
                    <CardDescription>{t("moodVsWinRateDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {moodChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={moodChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${MOOD_CONFIG[value]?.emoji || ""}`}
                          />
                          <YAxis 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: "hsl(var(--card))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "8px",
                            }}
                            formatter={(value: number, name: string) => [
                              name === "winRate" ? `${value}%` : `₹${value}`,
                              name === "winRate" ? t("winRate") : t("avgPL")
                            ]}
                            labelFormatter={(label) => `${MOOD_CONFIG[label]?.emoji || ""} ${label}`}
                          />
                          <Bar dataKey="winRate" name={t("winRate")} radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        {t("noMoodData")}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Trade Distribution Pie Chart */}
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5 text-purple-500" />
                      {t("tradeDistributionByMood")}
                    </CardTitle>
                    <CardDescription>{t("tradeDistributionDescription")}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {moodDistributionData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={moodDistributionData.map(d => ({
                              name: `${d.emoji} ${d.mood}`,
                              value: d.trades,
                              fill: d.color,
                            }))}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            outerRadius={100}
                            dataKey="value"
                          >
                            {moodDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                        {t("noMoodData")}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Setup Discipline Comparison */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-cyan-500" />
                    {t("setupDiscipline")}
                  </CardTitle>
                  <CardDescription>{insights.setupDiscipline.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Adherence Rate */}
                    <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-cyan-500/10 via-card to-card rounded-xl">
                      <RadialGauge
                        value={insights.setupDiscipline.adherenceRate}
                        label={t("adherenceRate")}
                        colorScheme="auto"
                        size="lg"
                      />
                    </div>

                    {/* Followed vs Ignored Comparison */}
                    <div className="md:col-span-2">
                      <div className="grid grid-cols-2 gap-4">
                        {/* Followed Setup */}
                        <div className="p-5 bg-green-500/10 rounded-xl border border-green-500/20">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            <span className="font-semibold text-green-600 dark:text-green-400">{t("followedSetup")}</span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground">{t("winRate")}</p>
                              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                {insights.setupDiscipline.followedSetupStats.winRate.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t("avgPL")}</p>
                              <p className="text-lg font-semibold">
                                ₹{insights.setupDiscipline.followedSetupStats.avgPL.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Ignored Setup */}
                        <div className="p-5 bg-red-500/10 rounded-xl border border-red-500/20">
                          <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                            <span className="font-semibold text-red-600 dark:text-red-400">{t("ignoredSetup")}</span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <p className="text-xs text-muted-foreground">{t("winRate")}</p>
                              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                                {insights.setupDiscipline.ignoredSetupStats.winRate.toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{t("avgPL")}</p>
                              <p className="text-lg font-semibold">
                                ₹{insights.setupDiscipline.ignoredSetupStats.avgPL.toFixed(0)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Visual Comparison Bar */}
                      <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                        <p className="text-xs text-muted-foreground mb-2">{t("winRateComparison")}</p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500 rounded-full"
                              style={{ width: `${insights.setupDiscipline.followedSetupStats.winRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-12 text-green-600">
                            {insights.setupDiscipline.followedSetupStats.winRate.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-red-500 rounded-full"
                              style={{ width: `${insights.setupDiscipline.ignoredSetupStats.winRate}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium w-12 text-red-600">
                            {insights.setupDiscipline.ignoredSetupStats.winRate.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mood Correlation */}
                  {insights.setupDiscipline.moodCorrelation.length > 0 && (
                    <div className="mt-6 p-4 bg-muted/30 rounded-xl">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        {t("moodCorrelation")}
                      </h4>
                      <div className="space-y-2">
                        {insights.setupDiscipline.moodCorrelation.map((correlation, i) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                            <span>{correlation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Trading Activity & Achievements */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Heatmap */}
                {heatmapTrades.length > 0 && (
                  <PerformanceHeatmap trades={heatmapTrades} months={3} />
                )}

                {/* Trading Streak */}
                {tradeDates.length > 0 && (
                  <TradingStreak tradeDates={tradeDates} />
                )}
              </div>

              {/* Achievements Section */}
              <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-500/5 via-card to-purple-500/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    {t("achievements")}
                  </CardTitle>
                  <CardDescription>{t("achievementsDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Win Rate Achievement */}
                    <div className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      overallWinRate >= 50 
                        ? "bg-green-500/10 border-green-500/30" 
                        : "bg-muted/30 border-border opacity-50"
                    )}>
                      <div className={cn(
                        "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                        overallWinRate >= 50 ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                      )}>
                        <Trophy className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm">{t("winnerBadge")}</p>
                      <p className="text-xs text-muted-foreground">&gt;50% {t("winRate")}</p>
                    </div>

                    {/* Discipline Achievement */}
                    <div className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      insights.setupDiscipline.adherenceRate >= 70 
                        ? "bg-cyan-500/10 border-cyan-500/30" 
                        : "bg-muted/30 border-border opacity-50"
                    )}>
                      <div className={cn(
                        "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                        insights.setupDiscipline.adherenceRate >= 70 ? "bg-cyan-500/20 text-cyan-500" : "bg-muted text-muted-foreground"
                      )}>
                        <Shield className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm">{t("disciplinedTrader")}</p>
                      <p className="text-xs text-muted-foreground">&gt;70% {t("setupAdherence")}</p>
                    </div>

                    {/* Calm Trader Achievement */}
                    <div className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      insights.moodPerformance.moodStats.some(m => 
                        (m.mood === "CALM" || m.mood === "CONFIDENT") && m.trades >= 5
                      ) 
                        ? "bg-purple-500/10 border-purple-500/30" 
                        : "bg-muted/30 border-border opacity-50"
                    )}>
                      <div className={cn(
                        "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                        insights.moodPerformance.moodStats.some(m => 
                          (m.mood === "CALM" || m.mood === "CONFIDENT") && m.trades >= 5
                        ) ? "bg-purple-500/20 text-purple-500" : "bg-muted text-muted-foreground"
                      )}>
                        <Brain className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm">{t("calmMind")}</p>
                      <p className="text-xs text-muted-foreground">5+ {t("calmTrades")}</p>
                    </div>

                    {/* Streak Achievement */}
                    <div className={cn(
                      "p-4 rounded-xl border text-center transition-all",
                      tradesAnalyzed >= 20 
                        ? "bg-amber-500/10 border-amber-500/30" 
                        : "bg-muted/30 border-border opacity-50"
                    )}>
                      <div className={cn(
                        "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-2",
                        tradesAnalyzed >= 20 ? "bg-amber-500/20 text-amber-500" : "bg-muted text-muted-foreground"
                      )}>
                        <Flame className="h-6 w-6" />
                      </div>
                      <p className="font-semibold text-sm">{t("activeTrader")}</p>
                      <p className="text-xs text-muted-foreground">20+ {t("tradesLabel")}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mood Stats Table */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    {t("detailedMoodStats")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium">{t("moodLabel")}</th>
                          <th className="text-right py-3 px-4 font-medium">{t("tradesLabel")}</th>
                          <th className="text-right py-3 px-4 font-medium">{t("winRate")}</th>
                          <th className="text-right py-3 px-4 font-medium">{t("avgPL")}</th>
                          <th className="text-right py-3 px-4 font-medium">{t("totalPL")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {insights.moodPerformance.moodStats.map((stat, i) => (
                          <tr key={i} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">{MOOD_CONFIG[stat.mood]?.emoji || "❓"}</span>
                                <span className="font-medium">{stat.mood}</span>
                              </div>
                            </td>
                            <td className="text-right py-3 px-4">{stat.trades}</td>
                            <td className="text-right py-3 px-4">
                              <span className={stat.winRate >= 50 ? "text-green-600" : "text-red-600"}>
                                {stat.winRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className={stat.avgPL >= 0 ? "text-green-600" : "text-red-600"}>
                                ₹{stat.avgPL.toFixed(0)}
                              </span>
                            </td>
                            <td className="text-right py-3 px-4">
                              <span className={stat.totalPL >= 0 ? "text-green-600" : "text-red-600"}>
                                ₹{stat.totalPL.toFixed(0)}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Mistakes & Improvements Tab */}
            <TabsContent value="actions" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MistakeCard mistakes={mistakes} title={t("tradingMistakes")} />
                <ImprovementCard improvements={improvements} title={t("areasToImprove")} />
              </div>

              {/* Detailed Recommendations */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-500" />
                    {t("actionPlan")}
                  </CardTitle>
                  <CardDescription>{t("actionPlanDesc")}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.recommendations.topTips.map((tip, i) => (
                      <div 
                        key={i}
                        className="flex items-start gap-4 p-4 bg-gradient-to-r from-amber-500/10 via-card to-card rounded-xl border border-amber-500/20 hover:shadow-md transition-all duration-200"
                      >
                        <div className="flex items-center justify-center w-10 h-10 bg-amber-500 text-white rounded-xl text-lg font-bold flex-shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm leading-relaxed">{tip}</p>
                          {i === 0 && (
                            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-medium">
                              <Flame className="h-3 w-3" />
                              {t("topPriority")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
