import OpenAI from "openai";

// Lazy-initialize OpenAI client to avoid build-time errors
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set");
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openaiClient;
}

// Trade data structure for AI analysis
export interface TradeData {
  id: string;
  date: string;
  script: string;
  type: string;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profitLoss: number;
  followSetup: boolean;
  remarks: string | null;
  mood: string;
}

// Structured insights response from AI
export interface AIInsights {
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
    moodStats: {
      mood: string;
      trades: number;
      winRate: number;
      avgPL: number;
      totalPL: number;
    }[];
    bestMood: string;
    worstMood: string;
  };
  behavioralWarnings: {
    summary: string;
    warningCount: number;
    warnings: {
      type: string;
      description: string;
      severity: "low" | "medium" | "high";
    }[];
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
    detailedAdvice: {
      category: string;
      advice: string;
    }[];
  };
  generatedAt: string;
}

// Calculate mood statistics from trades
function calculateMoodStats(trades: TradeData[]) {
  const moodGroups: { [key: string]: TradeData[] } = {};
  
  trades.forEach(trade => {
    const mood = trade.mood || "CALM";
    if (!moodGroups[mood]) {
      moodGroups[mood] = [];
    }
    moodGroups[mood].push(trade);
  });

  return Object.entries(moodGroups).map(([mood, moodTrades]) => {
    const winningTrades = moodTrades.filter(t => t.profitLoss > 0);
    const totalPL = moodTrades.reduce((sum, t) => sum + t.profitLoss, 0);
    
    return {
      mood,
      trades: moodTrades.length,
      winRate: moodTrades.length > 0 ? (winningTrades.length / moodTrades.length) * 100 : 0,
      avgPL: moodTrades.length > 0 ? totalPL / moodTrades.length : 0,
      totalPL,
    };
  });
}

// Generate AI insights using GPT-5.1
export async function generateTradingInsights(trades: TradeData[]): Promise<AIInsights> {
  if (trades.length === 0) {
    return getEmptyInsights();
  }

  // Pre-calculate statistics for the AI
  const moodStats = calculateMoodStats(trades);
  const totalTrades = trades.length;
  const winningTrades = trades.filter(t => t.profitLoss > 0).length;
  const losingTrades = trades.filter(t => t.profitLoss < 0).length;
  const totalPL = trades.reduce((sum, t) => sum + t.profitLoss, 0);
  const followedSetupTrades = trades.filter(t => t.followSetup);
  const ignoredSetupTrades = trades.filter(t => !t.followSetup);
  
  // Prepare trade summary for AI
  const tradeSummary = trades.map(t => ({
    date: t.date,
    script: t.script,
    type: t.type,
    pl: t.profitLoss.toFixed(2),
    mood: t.mood || "CALM",
    followedSetup: t.followSetup,
    remarks: t.remarks || "",
  }));

  const prompt = `You are an expert trading psychologist and performance analyst. Analyze the following trading data and provide comprehensive insights.

TRADING DATA SUMMARY:
- Total Trades: ${totalTrades}
- Winning Trades: ${winningTrades} (${((winningTrades/totalTrades)*100).toFixed(1)}%)
- Losing Trades: ${losingTrades}
- Total P&L: ₹${totalPL.toFixed(2)}
- Setup Adherence Rate: ${((followedSetupTrades.length/totalTrades)*100).toFixed(1)}%

MOOD STATISTICS:
${moodStats.map(m => `- ${m.mood}: ${m.trades} trades, ${m.winRate.toFixed(1)}% win rate, Avg P&L: ₹${m.avgPL.toFixed(2)}`).join('\n')}

DETAILED TRADES (last 50 for context):
${JSON.stringify(tradeSummary.slice(0, 50), null, 2)}

Please analyze this data and respond with a JSON object (no markdown, just pure JSON) with this exact structure:
{
  "tradingPsychology": {
    "summary": "One sentence summary of key emotional pattern",
    "details": ["Detailed insight 1", "Detailed insight 2", "..."],
    "moodPatterns": ["Pattern 1: description", "Pattern 2: description"]
  },
  "remarksAnalysis": {
    "summary": "One sentence about themes found in remarks",
    "themes": ["Theme 1", "Theme 2"],
    "strategies": ["Strategy mentioned 1", "Strategy mentioned 2"],
    "marketConditions": ["Condition 1", "Condition 2"],
    "selfReflections": ["Reflection 1", "Reflection 2"]
  },
  "moodPerformance": {
    "summary": "One sentence about best/worst mood for trading",
    "bestMood": "MOOD_NAME",
    "worstMood": "MOOD_NAME"
  },
  "behavioralWarnings": {
    "summary": "One sentence about critical issues",
    "warningCount": number,
    "warnings": [
      {"type": "Warning type", "description": "Description", "severity": "low|medium|high"}
    ]
  },
  "setupDiscipline": {
    "summary": "One sentence about setup adherence impact",
    "moodCorrelation": ["Correlation 1", "Correlation 2"]
  },
  "recommendations": {
    "summary": "Top 3 actionable tips in one sentence",
    "topTips": ["Tip 1", "Tip 2", "Tip 3"],
    "detailedAdvice": [
      {"category": "Category name", "advice": "Detailed actionable advice"}
    ]
  }
}

Focus on:
1. Emotional triggers and mood patterns affecting trading decisions
2. Extracting insights from remarks (strategies, market conditions, self-reflections)
3. Correlation between mood and trading outcomes
4. Behavioral patterns like revenge trading, overtrading, FOMO trades
5. Impact of following/ignoring trading setup
6. Actionable, personalized recommendations

Be specific and reference actual data patterns. If remarks are sparse, focus more on mood and performance data.`;

  try {
    // Using GPT-5.1 with the new responses API
    const response = await getOpenAIClient().responses.create({
      model: "gpt-5.1",
      instructions: "You are an expert trading psychologist. Respond only with valid JSON, no markdown formatting.",
      input: prompt,
      reasoning: { effort: "medium" },
      text: { format: { type: "text" } },
    });

    // GPT-5.1 uses output_text for the response
    const content = response.output_text;
    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse AI response
    let aiResponse;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      aiResponse = JSON.parse(cleanContent);
    } catch {
      console.error("Failed to parse AI response:", content);
      throw new Error("Invalid AI response format");
    }

    // Merge AI insights with calculated stats
    const insights: AIInsights = {
      tradingPsychology: {
        summary: aiResponse.tradingPsychology?.summary || "No trading psychology insights available",
        details: aiResponse.tradingPsychology?.details || [],
        moodPatterns: aiResponse.tradingPsychology?.moodPatterns || [],
      },
      remarksAnalysis: {
        summary: aiResponse.remarksAnalysis?.summary || "No remarks to analyze",
        themes: aiResponse.remarksAnalysis?.themes || [],
        strategies: aiResponse.remarksAnalysis?.strategies || [],
        marketConditions: aiResponse.remarksAnalysis?.marketConditions || [],
        selfReflections: aiResponse.remarksAnalysis?.selfReflections || [],
      },
      moodPerformance: {
        summary: aiResponse.moodPerformance?.summary || "Insufficient data for mood analysis",
        moodStats: moodStats,
        bestMood: aiResponse.moodPerformance?.bestMood || moodStats.reduce((best, curr) => 
          curr.winRate > best.winRate ? curr : best, moodStats[0])?.mood || "CALM",
        worstMood: aiResponse.moodPerformance?.worstMood || moodStats.reduce((worst, curr) => 
          curr.winRate < worst.winRate ? curr : worst, moodStats[0])?.mood || "PANICKED",
      },
      behavioralWarnings: {
        summary: aiResponse.behavioralWarnings?.summary || "No critical warnings",
        warningCount: aiResponse.behavioralWarnings?.warningCount || 0,
        warnings: aiResponse.behavioralWarnings?.warnings || [],
      },
      setupDiscipline: {
        summary: aiResponse.setupDiscipline?.summary || "Setup discipline data insufficient",
        adherenceRate: (followedSetupTrades.length / totalTrades) * 100,
        followedSetupStats: {
          winRate: followedSetupTrades.length > 0 
            ? (followedSetupTrades.filter(t => t.profitLoss > 0).length / followedSetupTrades.length) * 100 
            : 0,
          avgPL: followedSetupTrades.length > 0 
            ? followedSetupTrades.reduce((sum, t) => sum + t.profitLoss, 0) / followedSetupTrades.length 
            : 0,
        },
        ignoredSetupStats: {
          winRate: ignoredSetupTrades.length > 0 
            ? (ignoredSetupTrades.filter(t => t.profitLoss > 0).length / ignoredSetupTrades.length) * 100 
            : 0,
          avgPL: ignoredSetupTrades.length > 0 
            ? ignoredSetupTrades.reduce((sum, t) => sum + t.profitLoss, 0) / ignoredSetupTrades.length 
            : 0,
        },
        moodCorrelation: aiResponse.setupDiscipline?.moodCorrelation || [],
      },
      recommendations: {
        summary: aiResponse.recommendations?.summary || "Add more trades to get personalized recommendations",
        topTips: aiResponse.recommendations?.topTips || ["Start logging your trades consistently", "Track your emotional state", "Follow your trading setup"],
        detailedAdvice: aiResponse.recommendations?.detailedAdvice || [],
      },
      generatedAt: new Date().toISOString(),
    };

    return insights;
  } catch (error) {
    console.error("Error generating AI insights:", error);
    throw error;
  }
}

// Return empty insights structure when no trades available
function getEmptyInsights(): AIInsights {
  return {
    tradingPsychology: {
      summary: "No trades available for analysis",
      details: [],
      moodPatterns: [],
    },
    remarksAnalysis: {
      summary: "No remarks to analyze",
      themes: [],
      strategies: [],
      marketConditions: [],
      selfReflections: [],
    },
    moodPerformance: {
      summary: "Add trades to see mood performance analysis",
      moodStats: [],
      bestMood: "",
      worstMood: "",
    },
    behavioralWarnings: {
      summary: "No warnings",
      warningCount: 0,
      warnings: [],
    },
    setupDiscipline: {
      summary: "No data available",
      adherenceRate: 0,
      followedSetupStats: { winRate: 0, avgPL: 0 },
      ignoredSetupStats: { winRate: 0, avgPL: 0 },
      moodCorrelation: [],
    },
    recommendations: {
      summary: "Start logging trades to receive personalized recommendations",
      topTips: ["Log your first trade to get started"],
      detailedAdvice: [],
    },
    generatedAt: new Date().toISOString(),
  };
}

export { getOpenAIClient };
