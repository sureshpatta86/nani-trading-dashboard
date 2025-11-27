"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Target,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  RotateCcw,
  Info,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface CalculatorInputs {
  entryPrice: string;
  stopLoss: string;
  targetPrice: string;
  quantity: string;
}

// Custom Tooltip component - defined outside to avoid re-creation during render
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; percent: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Amount: <span className="font-semibold text-foreground">₹{data.value.toFixed(2)}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Percent: <span className="font-semibold text-foreground">{data.percent.toFixed(2)}%</span>
        </p>
      </div>
    );
  }
  return null;
};

export function RiskRewardCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    entryPrice: "",
    stopLoss: "",
    targetPrice: "",
    quantity: "",
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleReset = () => {
    setInputs({
      entryPrice: "",
      stopLoss: "",
      targetPrice: "",
      quantity: "",
    });
  };

  const calculations = useMemo(() => {
    const entry = parseFloat(inputs.entryPrice) || 0;
    const stopLoss = parseFloat(inputs.stopLoss) || 0;
    const target = parseFloat(inputs.targetPrice) || 0;
    const qty = parseFloat(inputs.quantity) || 0;

    if (entry === 0) {
      return null;
    }

    // Determine trade direction
    const isLong = stopLoss < entry;
    
    // Calculate risk and reward per share
    const riskPerShare = Math.abs(entry - stopLoss);
    const rewardPerShare = Math.abs(target - entry);
    
    // Total risk and reward
    const totalRisk = riskPerShare * qty;
    const totalReward = rewardPerShare * qty;
    
    // Risk-Reward Ratio
    const rrRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 0;
    
    // Percentages
    const riskPercent = entry > 0 ? (riskPerShare / entry) * 100 : 0;
    const rewardPercent = entry > 0 ? (rewardPerShare / entry) * 100 : 0;
    
    // Breakeven
    const breakeven = entry;
    
    // Position value
    const positionValue = entry * qty;

    return {
      isLong,
      riskPerShare,
      rewardPerShare,
      totalRisk,
      totalReward,
      rrRatio,
      riskPercent,
      rewardPercent,
      breakeven,
      positionValue,
      isValid: entry > 0 && stopLoss > 0 && target > 0 && qty > 0,
    };
  }, [inputs]);

  const chartData = useMemo(() => {
    if (!calculations || !calculations.isValid) return [];
    
    return [
      {
        name: "Risk",
        value: calculations.totalRisk,
        percent: calculations.riskPercent,
        color: "hsl(var(--destructive))",
      },
      {
        name: "Reward",
        value: calculations.totalReward,
        percent: calculations.rewardPercent,
        color: "hsl(142, 76%, 36%)",
      },
    ];
  }, [calculations]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
              <Target className="h-4 w-4 text-white" />
            </div>
            Trade Parameters
          </CardTitle>
          <CardDescription>Enter your trade details to calculate risk and reward</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entryPrice" className="text-sm font-medium">
                Entry Price (₹)
              </Label>
              <Input
                id="entryPrice"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 1500.00"
                value={inputs.entryPrice}
                onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="text-sm font-medium flex items-center gap-1.5">
                Stop Loss (₹)
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
              </Label>
              <Input
                id="stopLoss"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 1450.00"
                value={inputs.stopLoss}
                onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                className="h-11 border-red-200 dark:border-red-900/50 focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="targetPrice" className="text-sm font-medium flex items-center gap-1.5">
                Target Price (₹)
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
              </Label>
              <Input
                id="targetPrice"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 1600.00"
                value={inputs.targetPrice}
                onChange={(e) => handleInputChange("targetPrice", e.target.value)}
                className="h-11 border-green-200 dark:border-green-900/50 focus:border-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="text-sm font-medium">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="text"
                inputMode="numeric"
                placeholder="e.g., 100"
                value={inputs.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                className="h-11"
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full mt-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Calculator
          </Button>

          {/* Quick Info */}
          {calculations && calculations.isValid && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Trade Direction</span>
              </div>
              <div className="flex items-center gap-2">
                {calculations.isLong ? (
                  <>
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Long Position (Buy)
                    </span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                      Short Position (Sell)
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            Risk & Reward Analysis
          </CardTitle>
          <CardDescription>Visual breakdown of your trade risk and potential reward</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {calculations && calculations.isValid ? (
            <div className="space-y-6">
              {/* R:R Ratio Display */}
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Risk : Reward Ratio</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-4xl font-bold text-foreground">1</span>
                  <span className="text-2xl text-muted-foreground">:</span>
                  <span className={`text-4xl font-bold ${calculations.rrRatio >= 2 ? 'text-green-600 dark:text-green-400' : calculations.rrRatio >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                    {calculations.rrRatio.toFixed(2)}
                  </span>
                </div>
                <p className={`text-sm mt-2 ${calculations.rrRatio >= 2 ? 'text-green-600 dark:text-green-400' : calculations.rrRatio >= 1 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                  {calculations.rrRatio >= 2 ? '✓ Good Risk/Reward' : calculations.rrRatio >= 1 ? '⚠ Moderate Risk/Reward' : '✗ Poor Risk/Reward'}
                </p>
              </div>

              {/* Chart */}
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={true} vertical={false} />
                    <XAxis type="number" tickFormatter={(value) => `₹${value}`} className="text-xs fill-muted-foreground" />
                    <YAxis type="category" dataKey="name" className="text-xs fill-muted-foreground" width={60} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]} maxBarSize={50}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <p className="text-xs text-red-600 dark:text-red-400 font-medium mb-1">Total Risk</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">₹{calculations.totalRisk.toFixed(2)}</p>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">{calculations.riskPercent.toFixed(2)}% of entry</p>
                </div>
                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Total Reward</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">₹{calculations.totalReward.toFixed(2)}</p>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">{calculations.rewardPercent.toFixed(2)}% of entry</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Risk Per Share</p>
                  <p className="text-lg font-bold text-foreground">₹{calculations.riskPerShare.toFixed(2)}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Reward Per Share</p>
                  <p className="text-lg font-bold text-foreground">₹{calculations.rewardPerShare.toFixed(2)}</p>
                </div>
              </div>

              {/* Position Value */}
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Position Value</span>
                  <span className="text-lg font-bold text-foreground">₹{calculations.positionValue.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Enter Trade Details</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Fill in all the trade parameters to see your risk and reward analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
