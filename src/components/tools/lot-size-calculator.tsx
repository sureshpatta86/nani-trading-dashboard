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
  Layers,
  RotateCcw,
  AlertTriangle,
  Wallet,
  TrendingUp,
  Target,
  Info,
  IndianRupee,
  BarChart3,
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
  capital: string;
  riskAmount: string;
  instrument: string;
  stopLossPoints: string;
}

// Instrument configurations (Updated Nov 2025)
const INSTRUMENTS = {
  NIFTY: {
    name: "NIFTY 50",
    lotSize: 75,
    marginPercent: 12, // Approximate margin requirement
    tickSize: 0.05,
  },
  BANKNIFTY: {
    name: "BANK NIFTY",
    lotSize: 35,
    marginPercent: 12,
    tickSize: 0.05,
  },
  FINNIFTY: {
    name: "FIN NIFTY",
    lotSize: 65,
    marginPercent: 12,
    tickSize: 0.05,
  },
  MIDCPNIFTY: {
    name: "MIDCAP NIFTY",
    lotSize: 140,
    marginPercent: 12,
    tickSize: 0.05,
  },
  NIFTYNXT50: {
    name: "NIFTY NEXT 50",
    lotSize: 25,
    marginPercent: 12,
    tickSize: 0.05,
  },
};

// Custom Tooltip component
const CustomBarTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; lots: number; quantity: number; riskAmount: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          Lots: <span className="font-semibold text-foreground">{data.lots}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Quantity: <span className="font-semibold text-foreground">{data.quantity}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          Risk: <span className="font-semibold text-foreground">₹{data.riskAmount.toFixed(0)}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function LotSizeCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    capital: "",
    riskAmount: "",
    instrument: "NIFTY",
    stopLossPoints: "",
  });

  const handleInputChange = (field: keyof CalculatorInputs, value: string) => {
    if (field === "instrument") {
      setInputs((prev) => ({ ...prev, [field]: value }));
    } else {
      if (value === "" || /^\d*\.?\d*$/.test(value)) {
        setInputs((prev) => ({ ...prev, [field]: value }));
      }
    }
  };

  const handleReset = () => {
    setInputs({
      capital: "",
      riskAmount: "",
      instrument: "NIFTY",
      stopLossPoints: "",
    });
  };

  const calculations = useMemo(() => {
    const capital = parseFloat(inputs.capital) || 0;
    const riskAmt = parseFloat(inputs.riskAmount) || 0;
    const slPoints = parseFloat(inputs.stopLossPoints) || 0;
    const instrument = INSTRUMENTS[inputs.instrument as keyof typeof INSTRUMENTS];

    if (riskAmt === 0 || slPoints === 0) {
      return null;
    }

    const lotSize = instrument.lotSize;

    // Risk per lot = stop loss points * lot size
    const riskPerLot = slPoints * lotSize;

    // Number of lots based on risk
    const lotsBasedOnRisk = Math.floor(riskAmt / riskPerLot);

    // Total quantity
    const totalQuantity = lotsBasedOnRisk * lotSize;

    // Actual risk with calculated lots
    const actualRisk = lotsBasedOnRisk * riskPerLot;

    // Approximate margin required (rough estimate based on current spot prices)
    // This is a simplified calculation
    const approxSpotPrice = inputs.instrument === "BANKNIFTY" ? 52000 : 
                            inputs.instrument === "NIFTYNXT50" ? 70000 :
                            inputs.instrument === "MIDCPNIFTY" ? 13000 :
                            inputs.instrument === "FINNIFTY" ? 24000 : 24000;
    const marginPerLot = (approxSpotPrice * lotSize * instrument.marginPercent) / 100;
    const totalMarginRequired = lotsBasedOnRisk * marginPerLot;

    // Check if capital is sufficient
    const isCapitalSufficient = capital === 0 || capital >= totalMarginRequired;

    // Max lots based on capital (if capital is provided)
    const lotsBasedOnCapital = capital > 0 ? Math.floor(capital / marginPerLot) : Infinity;

    // Final recommended lots (minimum of risk-based and capital-based)
    const recommendedLots = Math.min(lotsBasedOnRisk, lotsBasedOnCapital);
    const recommendedQuantity = recommendedLots * lotSize;
    const recommendedRisk = recommendedLots * riskPerLot;
    const recommendedMargin = recommendedLots * marginPerLot;

    return {
      lotSize,
      riskPerLot,
      lotsBasedOnRisk,
      totalQuantity,
      actualRisk,
      marginPerLot,
      totalMarginRequired,
      isCapitalSufficient,
      lotsBasedOnCapital: lotsBasedOnCapital === Infinity ? null : lotsBasedOnCapital,
      recommendedLots,
      recommendedQuantity,
      recommendedRisk,
      recommendedMargin,
      instrument,
      isValid: recommendedLots > 0,
    };
  }, [inputs]);

  const chartData = useMemo(() => {
    if (!calculations || !calculations.isValid) return [];

    const data = [];
    const maxLots = Math.min(calculations.lotsBasedOnRisk + 2, 10);

    for (let i = 1; i <= maxLots; i++) {
      data.push({
        name: `${i} Lot${i > 1 ? 's' : ''}`,
        lots: i,
        quantity: i * calculations.lotSize,
        riskAmount: i * calculations.riskPerLot,
        isRecommended: i === calculations.recommendedLots,
      });
    }

    return data;
  }, [calculations]);

  const selectedInstrument = INSTRUMENTS[inputs.instrument as keyof typeof INSTRUMENTS];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Input Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-600/10 to-amber-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
              <Layers className="h-4 w-4 text-white" />
            </div>
            Lot Size Parameters
          </CardTitle>
          <CardDescription>Calculate the number of lots based on your risk and capital</CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="instrument" className="text-sm font-medium">
              Instrument
            </Label>
            <Select
              value={inputs.instrument}
              onValueChange={(value) => handleInputChange("instrument", value)}
            >
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Select instrument" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(INSTRUMENTS).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {value.name} (Lot: {value.lotSize})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capital" className="text-sm font-medium flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
              Available Capital (₹) <span className="text-muted-foreground text-xs">(Optional)</span>
            </Label>
            <Input
              id="capital"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 500000"
              value={inputs.capital}
              onChange={(e) => handleInputChange("capital", e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="riskAmount" className="text-sm font-medium flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Risk Amount Per Trade (₹)
            </Label>
            <Input
              id="riskAmount"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 5000"
              value={inputs.riskAmount}
              onChange={(e) => handleInputChange("riskAmount", e.target.value)}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="stopLossPoints" className="text-sm font-medium flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-red-500" />
              Stop Loss (Points)
            </Label>
            <Input
              id="stopLossPoints"
              type="text"
              inputMode="decimal"
              placeholder="e.g., 50"
              value={inputs.stopLossPoints}
              onChange={(e) => handleInputChange("stopLossPoints", e.target.value)}
              className="h-11 border-red-200 dark:border-red-900/50 focus:border-red-500"
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

          {/* Instrument Info */}
          <div className="mt-4 p-4 rounded-lg bg-muted/50 border border-border/50">
            <div className="flex items-center gap-2 mb-2">
              <Info className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{selectedInstrument.name} Details</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Lot Size</span>
                <span className="font-medium">{selectedInstrument.lotSize}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Margin %</span>
                <span className="font-medium">{selectedInstrument.marginPercent}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-rose-600/10 to-pink-600/10 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-rose-600 to-pink-600 flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            Lot Size Analysis
          </CardTitle>
          <CardDescription>Recommended lot size based on your risk parameters</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {calculations && calculations.isValid ? (
            <div className="space-y-6">
              {/* Main Result */}
              <div className="text-center p-6 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <p className="text-sm text-muted-foreground mb-1">Recommended Lots</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl font-bold text-foreground">
                    {calculations.recommendedLots}
                  </span>
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">lots</p>
                    <p className="text-lg font-semibold text-primary">
                      = {calculations.recommendedQuantity} qty
                    </p>
                  </div>
                </div>
              </div>

              {/* Chart */}
              {chartData.length > 0 && (
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                      <XAxis dataKey="name" className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                      <YAxis tickFormatter={(value) => `₹${value}`} className="text-xs fill-muted-foreground" tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomBarTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                      <Bar dataKey="riskAmount" radius={[4, 4, 0, 0]} maxBarSize={40}>
                        {chartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.isRecommended ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))'} 
                            opacity={entry.isRecommended ? 1 : 0.4}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Risk Per Lot
                  </p>
                  <p className="text-xl font-bold text-amber-700 dark:text-amber-300">₹{calculations.riskPerLot.toFixed(0)}</p>
                </div>
                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50">
                  <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1 flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    Total Risk
                  </p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{calculations.recommendedRisk.toFixed(0)}</p>
                </div>
              </div>

              {/* Margin Details */}
              <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  Margin Requirements (Approx.)
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Margin Per Lot</span>
                    <span className="font-medium">₹{calculations.marginPerLot.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Margin Required</span>
                    <span className="font-bold text-foreground">₹{calculations.recommendedMargin.toLocaleString()}</span>
                  </div>
                  {calculations.lotsBasedOnCapital !== null && (
                    <div className="flex justify-between pt-2 border-t border-border/50">
                      <span className="text-muted-foreground">Max Lots (Capital)</span>
                      <span className="font-medium">{calculations.lotsBasedOnCapital}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning if capital is insufficient */}
              {!calculations.isCapitalSufficient && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Insufficient Capital</p>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        Your capital is less than the required margin. Lots have been adjusted based on available capital.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-900/50">
                <p className="text-sm text-green-700 dark:text-green-300">
                  <span className="font-medium">Summary:</span> Trade {calculations.recommendedLots} lot{calculations.recommendedLots > 1 ? 's' : ''} 
                  ({calculations.recommendedQuantity} qty) of {selectedInstrument.name} with a stop loss of {inputs.stopLossPoints} points. 
                  Maximum risk: ₹{calculations.recommendedRisk.toFixed(0)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">Enter Trade Details</h3>
              <p className="text-sm text-muted-foreground max-w-[280px]">
                Fill in risk amount and stop loss points to calculate the optimal lot size
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
