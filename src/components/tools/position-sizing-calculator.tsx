"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Scale,
  TrendingDown,
  RotateCcw,
  AlertTriangle,
  PieChart,
  Wallet,
  Target,
  ShieldCheck,
} from "lucide-react";

interface CalculatorInputs {
  accountSize: string;
  riskPercent: string;
  entryPrice: string;
  stopLoss: string;
}

export function PositionSizingCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    accountSize: "",
    riskPercent: "2",
    entryPrice: "",
    stopLoss: "",
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    // Allow only numbers and decimal point
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      setInputs((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleReset = () => {
    setInputs({
      accountSize: "",
      riskPercent: "2",
      entryPrice: "",
      stopLoss: "",
    });
  };

  const calculations = useMemo(() => {
    const account = parseFloat(inputs.accountSize) || 0;
    const riskPct = parseFloat(inputs.riskPercent) || 0;
    const entry = parseFloat(inputs.entryPrice) || 0;
    const stopLoss = parseFloat(inputs.stopLoss) || 0;

    if (account === 0 || entry === 0 || stopLoss === 0 || riskPct === 0) {
      return null;
    }

    // Risk amount in rupees
    const riskAmount = (account * riskPct) / 100;

    // Risk per share
    const riskPerShare = Math.abs(entry - stopLoss);

    if (riskPerShare === 0) return null;

    // Number of shares (max position size)
    const shares = Math.floor(riskAmount / riskPerShare);

    // Total position value
    const positionValue = shares * entry;

    // Position as percentage of account
    const positionPercent = (positionValue / account) * 100;

    // Actual risk amount with calculated shares
    const actualRiskAmount = shares * riskPerShare;

    // Capital at risk percentage
    const capitalAtRiskPercent = (actualRiskAmount / account) * 100;

    // Trade direction
    const isLong = stopLoss < entry;

    // Maximum loss scenario
    const maxLoss = shares * riskPerShare;

    return {
      riskAmount,
      riskPerShare,
      shares,
      positionValue,
      positionPercent,
      actualRiskAmount,
      capitalAtRiskPercent,
      isLong,
      maxLoss,
      isValid: shares > 0,
    };
  }, [inputs]);

  const getRiskLevel = (percent: number) => {
    if (percent <= 1) return { label: "Conservative", color: "text-green-600 dark:text-green-400", bg: "bg-green-500" };
    if (percent <= 2) return { label: "Moderate", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500" };
    if (percent <= 3) return { label: "Aggressive", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500" };
    return { label: "High Risk", color: "text-red-600 dark:text-red-400", bg: "bg-red-500" };
  };

  const riskLevel = getRiskLevel(parseFloat(inputs.riskPercent) || 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-violet-600/10 to-purple-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center">
              <Scale className="h-4 w-4 text-white" />
            </div>
            Position Parameters
          </CardTitle>
          <CardDescription>Calculate the optimal position size based on your risk tolerance</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="accountSize" className="text-sm font-medium flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              Account Size (₹)
            </Label>
            <Input
              id="accountSize"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 100000"
              value={inputs.accountSize}
              onChange={(e) => handleInputChange("accountSize", e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-3">
            <Label htmlFor="riskPercent" className="text-sm font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Risk Per Trade (%)
            </Label>
            <Input
              id="riskPercent"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 2"
              value={inputs.riskPercent}
              onChange={(e) => handleInputChange("riskPercent", e.target.value)}
              className="h-11"
            />
            {/* Risk Level Indicator */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Risk Level</span>
                <span className={riskLevel.color}>{riskLevel.label}</span>
              </div>
              <div className="relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${riskLevel.bg}`}
                    style={{ width: `${Math.min((parseFloat(inputs.riskPercent) || 0) / 5 * 100, 100)}%` }}
                  />
                </div>
                {/* Tick marks */}
                <div className="absolute top-0 left-0 right-0 h-2 flex justify-between pointer-events-none">
                  <div className="w-px h-full bg-background/50" />
                  <div className="w-px h-full bg-background/50" style={{ marginLeft: '20%' }} />
                  <div className="w-px h-full bg-background/50" style={{ marginLeft: '40%' }} />
                  <div className="w-px h-full bg-background/50" style={{ marginLeft: '60%' }} />
                  <div className="w-px h-full bg-background/50" />
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0%</span>
                <span>1%</span>
                <span>2%</span>
                <span>3%</span>
                <span>5%</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entryPrice" className="text-sm font-medium">
                Entry Price (₹)
              </Label>
              <Input
                id="entryPrice"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 500.00"
                value={inputs.entryPrice}
                onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stopLoss" className="text-sm font-medium flex items-center gap-1.5">
                Stop Loss (₹)
                <TrendingDown className="h-3.5 w-3.5 text-red-500" />
              </Label>
              <Input
                id="stopLoss"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 480.00"
                value={inputs.stopLoss}
                onChange={(e) => handleInputChange("stopLoss", e.target.value)}
                className="h-11 border-red-200 dark:border-red-900/50 focus:border-red-500"
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

          {/* Quick Tips */}
          <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">💡 Pro Tips</p>
            <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
              <li>• Most traders risk 1-2% per trade</li>
              <li>• Never risk more than 5% on a single trade</li>
              <li>• Consistent position sizing is key to longevity</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-cyan-600/10 to-blue-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center">
              <PieChart className="h-4 w-4 text-white" />
            </div>
            Position Size Analysis
          </CardTitle>
          <CardDescription>Optimal position size based on your risk parameters</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {calculations && calculations.isValid ? (
            <div className="space-y-6">
              {/* Main Result */}
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Recommended Position Size</p>
                <div className="text-5xl font-bold text-foreground mb-2">
                  {calculations.shares.toLocaleString()}
                </div>
                <p className="text-sm text-muted-foreground">shares</p>
              </div>

              {/* Position Value Bar */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Position as % of Account</span>
                  <span className="font-medium">{calculations.positionPercent.toFixed(1)}%</span>
                </div>
                <div className="h-4 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(calculations.positionPercent, 100)}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    Position Value
                  </p>
                  <p className="text-xl font-bold text-foreground">₹{calculations.positionValue.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Per Share
                  </p>
                  <p className="text-xl font-bold text-foreground">₹{calculations.riskPerShare.toFixed(2)}</p>
                </div>
              </div>

              {/* Risk Details */}
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Risk Analysis
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Max Risk Amount</span>
                    <span className="font-bold text-red-700 dark:text-red-300">₹{calculations.actualRiskAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Capital at Risk</span>
                    <span className="font-bold text-red-700 dark:text-red-300">{calculations.capitalAtRiskPercent.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-600 dark:text-red-400">Trade Direction</span>
                    <span className="font-bold text-red-700 dark:text-red-300">
                      {calculations.isLong ? "Long (Buy)" : "Short (Sell)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Card */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900/50">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-700 dark:text-green-300">Risk-Managed Position</p>
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                      With {calculations.shares} shares at ₹{parseFloat(inputs.entryPrice).toFixed(2)}, 
                      your maximum loss is ₹{calculations.actualRiskAmount.toFixed(2)} ({calculations.capitalAtRiskPercent.toFixed(2)}% of account)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Scale className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Enter Position Details</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Fill in your account size, risk percentage, and trade levels to calculate optimal position size
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
