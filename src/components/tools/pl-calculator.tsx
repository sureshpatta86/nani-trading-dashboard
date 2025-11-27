"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  IndianRupee,
  Percent,
  Receipt,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface CalculatorInputs {
  entryPrice: string;
  exitPrice: string;
  quantity: string;
  tradeType: "BUY" | "SELL";
}

// Brokerage calculation constants (Indian market estimates)
const BROKERAGE_RATES = {
  stt: 0.001, // 0.1% STT on sell side
  exchangeCharges: 0.0000345, // 0.00345%
  sebiCharges: 0.000001, // ₹10 per crore
  gst: 0.18, // 18% GST on brokerage + exchange charges
  stampDuty: 0.00015, // 0.015% on buy side
  brokeragePerOrder: 20, // Flat ₹20 per executed order (discount broker)
};

// Custom Tooltip component - defined outside to avoid re-creation during render
const CustomPieTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Amount: <span className="font-semibold text-foreground">₹{Math.abs(data.value).toFixed(2)}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Custom Legend component
const CustomLegend = ({ payload }: { payload?: Array<{ value: string; color: string }> }) => {
  if (!payload) return null;
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {payload.map((entry, index) => (
        <div key={`legend-${index}`} className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-sm text-muted-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export function PLCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    entryPrice: "",
    exitPrice: "",
    quantity: "",
    tradeType: "BUY",
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    if (field === "tradeType") {
      setInputs((prev) => ({ ...prev, [field]: value as "BUY" | "SELL" }));
    } else {
      // Allow only numbers and decimal point
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setInputs((prev) => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleReset = () => {
    setInputs({
      entryPrice: "",
      exitPrice: "",
      quantity: "",
      tradeType: "BUY",
    });
  };

  const calculations = useMemo(() => {
    const entry = parseFloat(inputs.entryPrice) || 0;
    const exit = parseFloat(inputs.exitPrice) || 0;
    const qty = parseFloat(inputs.quantity) || 0;

    if (entry === 0 || exit === 0 || qty === 0) {
      return null;
    }

    // Calculate turnover
    const buyValue = entry * qty;
    const sellValue = exit * qty;
    const turnover = buyValue + sellValue;

    // Calculate gross P&L
    let grossPL: number;
    if (inputs.tradeType === "BUY") {
      grossPL = (exit - entry) * qty;
    } else {
      grossPL = (entry - exit) * qty;
    }

    // Calculate charges
    const brokerage = BROKERAGE_RATES.brokeragePerOrder * 2; // Buy + Sell
    const stt = sellValue * BROKERAGE_RATES.stt;
    const exchangeCharges = turnover * BROKERAGE_RATES.exchangeCharges;
    const sebiCharges = turnover * BROKERAGE_RATES.sebiCharges;
    const stampDuty = buyValue * BROKERAGE_RATES.stampDuty;
    const gst = (brokerage + exchangeCharges) * BROKERAGE_RATES.gst;

    const totalCharges = brokerage + stt + exchangeCharges + sebiCharges + stampDuty + gst;

    // Net P&L
    const netPL = grossPL - totalCharges;

    // P&L percentages
    const grossPLPercent = (grossPL / buyValue) * 100;
    const netPLPercent = (netPL / buyValue) * 100;

    return {
      grossPL,
      netPL,
      grossPLPercent,
      netPLPercent,
      totalCharges,
      chargesBreakdown: {
        brokerage,
        stt,
        exchangeCharges,
        sebiCharges,
        stampDuty,
        gst,
      },
      turnover,
      buyValue,
      sellValue,
      isProfit: netPL > 0,
      isValid: true,
    };
  }, [inputs]);

  const pieChartData = useMemo(() => {
    if (!calculations || !calculations.isValid) return [];

    const data = [
      {
        name: "Net P&L",
        value: Math.abs(calculations.netPL),
        color: calculations.isProfit ? "hsl(142, 76%, 36%)" : "hsl(var(--destructive))",
      },
      {
        name: "Total Charges",
        value: calculations.totalCharges,
        color: "hsl(var(--muted-foreground))",
      },
    ];

    return data;
  }, [calculations]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-emerald-600/10 to-teal-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center">
              <Calculator className="h-4 w-4 text-white" />
            </div>
            Trade Details
          </CardTitle>
          <CardDescription>Enter your trade details to calculate profit or loss</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="tradeType" className="text-sm font-medium">
              Trade Type
            </Label>
            <Select
              value={inputs.tradeType}
              onValueChange={(value) => handleInputChange("tradeType", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select trade type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    Buy (Long)
                  </div>
                </SelectItem>
                <SelectItem value="SELL">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    Sell (Short)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
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
                placeholder="e.g., 1500.00"
                value={inputs.entryPrice}
                onChange={(e) => handleInputChange("entryPrice", e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="exitPrice" className="text-sm font-medium">
                Exit Price (₹)
              </Label>
              <Input
                id="exitPrice"
                type="text"
                inputMode="decimal"
                placeholder="e.g., 1550.00"
                value={inputs.exitPrice}
                onChange={(e) => handleInputChange("exitPrice", e.target.value)}
                className="h-11"
              />
            </div>
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

          <Button
            variant="outline"
            onClick={handleReset}
            className="w-full mt-2"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset Calculator
          </Button>

          {/* Trade Summary */}
          {calculations && calculations.isValid && (
            <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Trade Summary</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Buy Value</span>
                  <span className="font-medium">₹{calculations.buyValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sell Value</span>
                  <span className="font-medium">₹{calculations.sellValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Turnover</span>
                  <span className="font-medium">₹{calculations.turnover.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-amber-600/10 to-orange-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center">
              <IndianRupee className="h-4 w-4 text-white" />
            </div>
            Profit & Loss Analysis
          </CardTitle>
          <CardDescription>Detailed breakdown of your trade P&L including all charges</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {calculations && calculations.isValid ? (
            <div className="space-y-6">
              {/* Net P&L Display */}
              <div className={`text-center p-6 rounded-xl border ${
                calculations.isProfit 
                  ? 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-900/50' 
                  : 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-900/50'
              }`}>
                <p className="text-sm text-muted-foreground mb-1">Net Profit/Loss</p>
                <div className="flex items-center justify-center gap-2">
                  {calculations.isProfit ? (
                    <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-8 w-8 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-4xl font-bold ${
                    calculations.isProfit 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {calculations.isProfit ? '+' : '-'}₹{Math.abs(calculations.netPL).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <Percent className="h-4 w-4 text-muted-foreground" />
                  <span className={`text-sm font-medium ${
                    calculations.isProfit 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {calculations.netPLPercent >= 0 ? '+' : ''}{calculations.netPLPercent.toFixed(2)}%
                  </span>
                </div>
              </div>

              {/* P&L Breakdown Chart */}
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomPieTooltip />} />
                    <Legend content={<CustomLegend />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Gross P&L</p>
                  <p className={`text-xl font-bold ${calculations.grossPL >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {calculations.grossPL >= 0 ? '+' : ''}₹{calculations.grossPL.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.grossPLPercent >= 0 ? '+' : ''}{calculations.grossPLPercent.toFixed(2)}%
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground font-medium mb-1">Total Charges</p>
                  <p className="text-xl font-bold text-foreground">₹{calculations.totalCharges.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Deducted from P&L</p>
                </div>
              </div>

              {/* Charges Breakdown */}
              <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  Charges Breakdown
                </p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brokerage</span>
                    <span>₹{calculations.chargesBreakdown.brokerage.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">STT</span>
                    <span>₹{calculations.chargesBreakdown.stt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Exchange</span>
                    <span>₹{calculations.chargesBreakdown.exchangeCharges.toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GST</span>
                    <span>₹{calculations.chargesBreakdown.gst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Stamp Duty</span>
                    <span>₹{calculations.chargesBreakdown.stampDuty.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">SEBI</span>
                    <span>₹{calculations.chargesBreakdown.sebiCharges.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Calculator className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Enter Trade Details</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Fill in all the trade parameters to see your profit & loss analysis
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
