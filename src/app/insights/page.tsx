"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  TrendingUp, 
  Brain, 
  Target, 
  Lightbulb, 
  Loader2, 
  RefreshCw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  BarChart3,
  Shield,
  Clock,
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
} from "recharts";

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

// Collapsible card component
function CollapsibleCard({ 
  title, 
  icon: Icon, 
  summary, 
  children, 
  iconColor = "text-primary",
  bgGradient = "from-blue-500/10",
  defaultExpanded = false,
}: { 
  title: string;
  icon: React.ElementType;
  summary: string;
  children: React.ReactNode;
  iconColor?: string;
  bgGradient?: string;
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${bgGradient} via-card to-card transition-all duration-300 hover:shadow-lg`}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
      <CardHeader 
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center`}>
              <Icon className={`h-5 w-5 ${iconColor}`} />
            </div>
            {title}
          </CardTitle>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <CardDescription className="mt-2 text-sm">
          {summary}
        </CardDescription>
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-0 animate-in slide-in-from-top-2 duration-200">
          <div className="border-t border-border/50 pt-4">
            {children}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Mood emoji and color mapping
const MOOD_CONFIG: { [key: string]: { emoji: string; color: string; bgColor: string } } = {
  CALM: { emoji: "😌", color: "#3B82F6", bgColor: "bg-blue-500" },
  CONFIDENT: { emoji: "😎", color: "#22C55E", bgColor: "bg-green-500" },
  ANXIOUS: { emoji: "😰", color: "#EAB308", bgColor: "bg-yellow-500" },
  FOMO: { emoji: "😱", color: "#F97316", bgColor: "bg-orange-500" },
  PANICKED: { emoji: "😨", color: "#EF4444", bgColor: "bg-red-500" },
};

export default function InsightsPage() {
  const { data: session, status } = useSession();
  const [insights, setInsights] = useState<AIInsights | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tradesAnalyzed, setTradesAnalyzed] = useState(0);

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

  // Chart data preparation
  const moodChartData = insights?.moodPerformance.moodStats.map(stat => ({
    name: stat.mood,
    winRate: parseFloat(stat.winRate.toFixed(1)),
    avgPL: parseFloat(stat.avgPL.toFixed(2)),
    trades: stat.trades,
    fill: MOOD_CONFIG[stat.mood]?.color || "#6B7280",
  })) || [];

  const moodDistributionData = insights?.moodPerformance.moodStats.map(stat => ({
    name: `${MOOD_CONFIG[stat.mood]?.emoji || ""} ${stat.mood}`,
    value: stat.trades,
    fill: MOOD_CONFIG[stat.mood]?.color || "#6B7280",
  })) || [];

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

        {/* Generate/Refresh Controls */}
        <Card className="mb-8 relative overflow-hidden border-0">
          <div className="absolute inset-0 bg-primary/10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl -mr-32 -mt-32" />
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Brain className="h-5 w-5 text-primary-foreground" />
              </div>
              AI Trading Analysis
            </CardTitle>
            <CardDescription className="text-base">
              {insights 
                ? `Last generated: ${formatDate(insights.generatedAt)} • ${tradesAnalyzed} trades analyzed`
                : "Generate AI-powered insights from your trading data"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="relative">
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={generateInsights} 
                disabled={isLoading}
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing Trades...
                  </>
                ) : insights ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh Insights
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Insights
                  </>
                )}
              </Button>
              
              {insights && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Insights refresh daily or on-demand
                </div>
              )}
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
              <div className="h-20 w-20 rounded-full border-4 border-primary/30 animate-pulse" />
              <Brain className="h-10 w-10 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
            </div>
            <p className="mt-4 text-lg font-medium">Analyzing your trading patterns...</p>
            <p className="text-muted-foreground">This may take a few seconds</p>
          </div>
        )}

        {/* No Insights Yet */}
        {!isLoading && !insights && !error && (
          <div className="text-center py-16">
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/20 mb-6">
              <div className="absolute inset-0 rounded-2xl bg-primary opacity-20 blur-xl" />
              <Sparkles className="h-12 w-12 text-primary relative" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Ready to Analyze Your Trades</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              Click the &quot;Generate Insights&quot; button above to get AI-powered analysis of your trading patterns, 
              mood correlations, and personalized recommendations.
            </p>
          </div>
        )}

        {/* Insights Display */}
        {!isLoading && insights && (
          <div className="space-y-6">
            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Mood Performance Bar Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Mood vs Win Rate
                  </CardTitle>
                  <CardDescription>How your emotional state affects trading success</CardDescription>
                </CardHeader>
                <CardContent>
                  {moodChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={moodChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${MOOD_CONFIG[value]?.emoji || ""} ${value}`}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === "winRate" ? `${value}%` : `₹${value}`,
                            name === "winRate" ? "Win Rate" : "Avg P&L"
                          ]}
                          labelFormatter={(label) => `${MOOD_CONFIG[label]?.emoji || ""} ${label}`}
                        />
                        <Bar dataKey="winRate" name="Win Rate" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No mood data available
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Mood Distribution Pie Chart */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-purple-500" />
                    Trade Distribution by Mood
                  </CardTitle>
                  <CardDescription>Breakdown of trades across emotional states</CardDescription>
                </CardHeader>
                <CardContent>
                  {moodDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={moodDistributionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {moodDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                      No mood data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Collapsible Insight Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Trading Psychology */}
              <CollapsibleCard
                title="Trading Psychology"
                icon={Brain}
                summary={insights.tradingPsychology.summary}
                iconColor="text-purple-500"
                bgGradient="from-purple-500/10"
              >
                <div className="space-y-4">
                  {insights.tradingPsychology.details.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Key Insights</h4>
                      <ul className="space-y-2">
                        {insights.tradingPsychology.details.map((detail, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            {detail}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.tradingPsychology.moodPatterns.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Mood Patterns</h4>
                      <ul className="space-y-2">
                        {insights.tradingPsychology.moodPatterns.map((pattern, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                            {pattern}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleCard>

              {/* Remarks Analysis */}
              <CollapsibleCard
                title="Remarks Analysis"
                icon={MessageSquare}
                summary={insights.remarksAnalysis.summary}
                iconColor="text-blue-500"
                bgGradient="from-blue-500/10"
              >
                <div className="space-y-4">
                  {insights.remarksAnalysis.themes.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Common Themes</h4>
                      <div className="flex flex-wrap gap-2">
                        {insights.remarksAnalysis.themes.map((theme, i) => (
                          <span key={i} className="px-2 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-xs">
                            {theme}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {insights.remarksAnalysis.strategies.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Strategies Mentioned</h4>
                      <ul className="space-y-1">
                        {insights.remarksAnalysis.strategies.map((strategy, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {strategy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {insights.remarksAnalysis.selfReflections.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Self Reflections</h4>
                      <ul className="space-y-1">
                        {insights.remarksAnalysis.selfReflections.map((reflection, i) => (
                          <li key={i} className="text-sm text-muted-foreground italic">&ldquo;{reflection}&rdquo;</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleCard>

              {/* Mood Performance */}
              <CollapsibleCard
                title="Mood Performance"
                icon={TrendingUp}
                summary={insights.moodPerformance.summary}
                iconColor="text-green-500"
                bgGradient="from-green-500/10"
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Best Mood</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {MOOD_CONFIG[insights.moodPerformance.bestMood]?.emoji} {insights.moodPerformance.bestMood}
                      </p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Worst Mood</p>
                      <p className="font-medium text-red-600 dark:text-red-400">
                        {MOOD_CONFIG[insights.moodPerformance.worstMood]?.emoji} {insights.moodPerformance.worstMood}
                      </p>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Detailed Stats</h4>
                    <div className="space-y-2">
                      {insights.moodPerformance.moodStats.map((stat, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                          <span className="flex items-center gap-2">
                            {MOOD_CONFIG[stat.mood]?.emoji} {stat.mood}
                          </span>
                          <span className="text-muted-foreground">
                            {stat.trades} trades • {stat.winRate.toFixed(1)}% WR • ₹{stat.avgPL.toFixed(0)} avg
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleCard>

              {/* Behavioral Warnings */}
              <CollapsibleCard
                title="Behavioral Warnings"
                icon={AlertTriangle}
                summary={insights.behavioralWarnings.summary}
                iconColor={insights.behavioralWarnings.warningCount > 0 ? "text-orange-500" : "text-green-500"}
                bgGradient={insights.behavioralWarnings.warningCount > 0 ? "from-orange-500/10" : "from-green-500/10"}
              >
                <div className="space-y-3">
                  {insights.behavioralWarnings.warnings.length > 0 ? (
                    insights.behavioralWarnings.warnings.map((warning, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded-lg border ${
                          warning.severity === "high" ? "bg-red-500/10 border-red-500/30" :
                          warning.severity === "medium" ? "bg-orange-500/10 border-orange-500/30" :
                          "bg-yellow-500/10 border-yellow-500/30"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium uppercase ${
                            warning.severity === "high" ? "text-red-600" :
                            warning.severity === "medium" ? "text-orange-600" :
                            "text-yellow-600"
                          }`}>
                            {warning.severity} severity
                          </span>
                        </div>
                        <p className="font-medium text-sm">{warning.type}</p>
                        <p className="text-sm text-muted-foreground mt-1">{warning.description}</p>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <CheckCircle className="h-5 w-5" />
                      <span>No critical behavioral warnings detected!</span>
                    </div>
                  )}
                </div>
              </CollapsibleCard>

              {/* Setup Discipline */}
              <CollapsibleCard
                title="Setup Discipline"
                icon={Shield}
                summary={insights.setupDiscipline.summary}
                iconColor="text-cyan-500"
                bgGradient="from-cyan-500/10"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm">Setup Adherence Rate</span>
                    <span className={`text-lg font-bold ${
                      insights.setupDiscipline.adherenceRate >= 70 ? "text-green-600" :
                      insights.setupDiscipline.adherenceRate >= 50 ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {insights.setupDiscipline.adherenceRate.toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Followed Setup</p>
                      <p className="font-medium">{insights.setupDiscipline.followedSetupStats.winRate.toFixed(1)}% WR</p>
                      <p className="text-sm text-muted-foreground">₹{insights.setupDiscipline.followedSetupStats.avgPL.toFixed(0)} avg</p>
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Ignored Setup</p>
                      <p className="font-medium">{insights.setupDiscipline.ignoredSetupStats.winRate.toFixed(1)}% WR</p>
                      <p className="text-sm text-muted-foreground">₹{insights.setupDiscipline.ignoredSetupStats.avgPL.toFixed(0)} avg</p>
                    </div>
                  </div>

                  {insights.setupDiscipline.moodCorrelation.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Mood Correlation</h4>
                      <ul className="space-y-1">
                        {insights.setupDiscipline.moodCorrelation.map((correlation, i) => (
                          <li key={i} className="text-sm text-muted-foreground">• {correlation}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CollapsibleCard>

              {/* Recommendations */}
              <CollapsibleCard
                title="Personalized Recommendations"
                icon={Lightbulb}
                summary={insights.recommendations.summary}
                iconColor="text-amber-500"
                bgGradient="from-amber-500/10"
                defaultExpanded={true}
              >
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-3">Top Tips</h4>
                    <div className="space-y-2">
                      {insights.recommendations.topTips.map((tip, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 bg-amber-500/10 rounded-lg">
                          <span className="flex items-center justify-center w-6 h-6 bg-amber-500 text-white rounded-full text-sm font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <p className="text-sm">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {insights.recommendations.detailedAdvice.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Detailed Advice</h4>
                      <div className="space-y-3">
                        {insights.recommendations.detailedAdvice.map((advice, i) => (
                          <div key={i} className="border-l-2 border-amber-500 pl-3">
                            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase mb-1">
                              {advice.category}
                            </p>
                            <p className="text-sm text-muted-foreground">{advice.advice}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CollapsibleCard>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
