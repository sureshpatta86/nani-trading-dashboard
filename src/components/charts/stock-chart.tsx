"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData,
  Time,
  UTCTimestamp,
  LineData,
} from "lightweight-charts";
import { useTheme } from "next-themes";

export interface ChartDataPoint {
  time: UTCTimestamp;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface TradeMarker {
  time: UTCTimestamp;
  position: "aboveBar" | "belowBar";
  color: string;
  shape: "arrowUp" | "arrowDown" | "circle";
  text: string;
  size?: number;
}

export interface IndicatorSettings {
  ema9?: boolean;
  ema20?: boolean;
  rsi?: boolean;
}

interface StockChartProps {
  data: ChartDataPoint[];
  markers?: TradeMarker[];
  height?: number;
  showVolume?: boolean;
  symbol?: string;
  indicators?: IndicatorSettings;
}

const chartThemes = {
  light: {
    background: "#ffffff",
    textColor: "#333333",
    gridColor: "#f0f0f0",
    borderColor: "#e0e0e0",
    upColor: "#22c55e",
    downColor: "#ef4444",
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
    volumeUpColor: "rgba(34, 197, 94, 0.3)",
    volumeDownColor: "rgba(239, 68, 68, 0.3)",
    ema9Color: "#22c55e", // Green
    ema20Color: "#ef4444", // Red
    rsi14Color: "#22c55e", // Green
    rsiEma20Color: "#ef4444", // Red
    rsiOverbought: "rgba(239, 68, 68, 0.3)",
    rsiOversold: "rgba(34, 197, 94, 0.3)",
  },
  dark: {
    background: "#0a0a0a",
    textColor: "#d1d5db",
    gridColor: "#1f2937",
    borderColor: "#374151",
    upColor: "#22c55e",
    downColor: "#ef4444",
    wickUpColor: "#22c55e",
    wickDownColor: "#ef4444",
    volumeUpColor: "rgba(34, 197, 94, 0.3)",
    volumeDownColor: "rgba(239, 68, 68, 0.3)",
    ema9Color: "#4ade80", // Green (brighter for dark mode)
    ema20Color: "#f87171", // Red (brighter for dark mode)
    rsi14Color: "#4ade80", // Green
    rsiEma20Color: "#f87171", // Red
    rsiOverbought: "rgba(239, 68, 68, 0.3)",
    rsiOversold: "rgba(34, 197, 94, 0.3)",
  },
};

// Calculate EMA (Exponential Moving Average)
function calculateEMA(data: ChartDataPoint[], period: number): LineData<Time>[] {
  if (data.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const emaData: LineData<Time>[] = [];
  
  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].close;
  }
  let ema = sum / period;
  
  emaData.push({ time: data[period - 1].time as Time, value: ema });
  
  // Calculate EMA for remaining data points
  for (let i = period; i < data.length; i++) {
    ema = (data[i].close - ema) * multiplier + ema;
    emaData.push({ time: data[i].time as Time, value: ema });
  }
  
  return emaData;
}

// Calculate EMA from LineData (for RSI-EMA)
function calculateEMAFromLineData(data: LineData<Time>[], period: number): LineData<Time>[] {
  if (data.length < period) return [];
  
  const multiplier = 2 / (period + 1);
  const emaData: LineData<Time>[] = [];
  
  // Calculate initial SMA for first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i].value;
  }
  let ema = sum / period;
  
  emaData.push({ time: data[period - 1].time, value: ema });
  
  // Calculate EMA for remaining data points
  for (let i = period; i < data.length; i++) {
    ema = (data[i].value - ema) * multiplier + ema;
    emaData.push({ time: data[i].time, value: ema });
  }
  
  return emaData;
}

// Calculate RSI (Relative Strength Index)
function calculateRSI(data: ChartDataPoint[], period: number = 14): LineData<Time>[] {
  if (data.length < period + 1) return [];
  
  const rsiData: LineData<Time>[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  // Calculate initial average gain and loss
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;
  
  // Calculate first RSI
  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = 100 - (100 / (1 + rs));
  rsiData.push({ time: data[period].time as Time, value: rsi });
  
  // Calculate RSI for remaining data points using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = 100 - (100 / (1 + rs));
    rsiData.push({ time: data[i + 1].time as Time, value: rsi });
  }
  
  return rsiData;
}

export function StockChart({
  data,
  markers = [],
  height = 400,
  showVolume = true,
  symbol,
  indicators = { ema9: true, ema20: true, rsi: true },
}: StockChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const rsiContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const rsiChartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
  const ema9SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const ema20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsi14SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const rsiEma20SeriesRef = useRef<ISeriesApi<"Line"> | null>(null);
  const { resolvedTheme } = useTheme();
  const [isReady, setIsReady] = useState(false);

  // Calculate main chart height based on RSI visibility
  const mainChartHeight = indicators.rsi ? Math.floor(height * 0.75) : height;
  const rsiChartHeight = Math.floor(height * 0.25);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const theme = resolvedTheme === "dark" ? chartThemes.dark : chartThemes.light;

    // Main price chart
    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: theme.background },
        textColor: theme.textColor,
      },
      grid: {
        vertLines: { color: theme.gridColor },
        horzLines: { color: theme.gridColor },
      },
      width: chartContainerRef.current.clientWidth,
      height: mainChartHeight,
      rightPriceScale: {
        borderColor: theme.borderColor,
        scaleMargins: {
          top: 0.1,
          bottom: showVolume ? 0.2 : 0.1,
        },
      },
      timeScale: {
        borderColor: theme.borderColor,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 1,
        vertLine: {
          width: 1,
          color: theme.borderColor,
          style: 3,
        },
        horzLine: {
          width: 1,
          color: theme.borderColor,
          style: 3,
        },
      },
    });

    chartRef.current = chart;

    // Create candlestick series
    const candlestickSeries = chart.addCandlestickSeries({
      upColor: theme.upColor,
      downColor: theme.downColor,
      borderDownColor: theme.downColor,
      borderUpColor: theme.upColor,
      wickDownColor: theme.wickDownColor,
      wickUpColor: theme.wickUpColor,
    });

    candlestickSeriesRef.current = candlestickSeries;

    // Create EMA 9 series (Green, Bold)
    if (indicators.ema9) {
      const ema9Series = chart.addLineSeries({
        color: theme.ema9Color,
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      ema9SeriesRef.current = ema9Series;
    }

    // Create EMA 20 series (Red, Bold)
    if (indicators.ema20) {
      const ema20Series = chart.addLineSeries({
        color: theme.ema20Color,
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      ema20SeriesRef.current = ema20Series;
    }

    // Create volume series if enabled
    if (showVolume) {
      const volumeSeries = chart.addHistogramSeries({
        color: theme.volumeUpColor,
        priceFormat: {
          type: "volume",
        },
        priceScaleId: "",
      });

      volumeSeries.priceScale().applyOptions({
        scaleMargins: {
          top: 0.85,
          bottom: 0,
        },
      });

      volumeSeriesRef.current = volumeSeries;
    }

    // Create RSI chart if enabled
    let rsiChart: IChartApi | null = null;
    if (indicators.rsi && rsiContainerRef.current) {
      rsiChart = createChart(rsiContainerRef.current, {
        layout: {
          background: { type: ColorType.Solid, color: theme.background },
          textColor: theme.textColor,
        },
        grid: {
          vertLines: { color: theme.gridColor },
          horzLines: { color: theme.gridColor },
        },
        width: rsiContainerRef.current.clientWidth,
        height: rsiChartHeight,
        rightPriceScale: {
          borderColor: theme.borderColor,
          scaleMargins: { top: 0.1, bottom: 0.1 },
        },
        timeScale: {
          borderColor: theme.borderColor,
          timeVisible: false,
          visible: true,
        },
        crosshair: {
          mode: 1,
          vertLine: { width: 1, color: theme.borderColor, style: 3 },
          horzLine: { width: 1, color: theme.borderColor, style: 3 },
        },
      });

      rsiChartRef.current = rsiChart;

      // RSI 14 line series (Green, Bold)
      const rsi14Series = rsiChart.addLineSeries({
        color: theme.rsi14Color,
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      rsi14SeriesRef.current = rsi14Series;

      // RSI-EMA-20 line series (Red, Bold)
      const rsiEma20Series = rsiChart.addLineSeries({
        color: theme.rsiEma20Color,
        lineWidth: 3,
        priceLineVisible: false,
        lastValueVisible: true,
      });
      rsiEma20SeriesRef.current = rsiEma20Series;

      // Sync time scales
      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && rsiChart) {
          rsiChart.timeScale().setVisibleLogicalRange(range);
        }
      });

      rsiChart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        if (range && chart) {
          chart.timeScale().setVisibleLogicalRange(range);
        }
      });
    }

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
        });
      }
      if (rsiContainerRef.current && rsiChartRef.current) {
        rsiChartRef.current.applyOptions({
          width: rsiContainerRef.current.clientWidth,
        });
      }
    };

    window.addEventListener("resize", handleResize);

    // Mark chart as ready after setup is complete (using setTimeout to avoid sync setState in effect)
    const timeoutId = setTimeout(() => setIsReady(true), 0);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", handleResize);
      chart.remove();
      rsiChart?.remove();
      chartRef.current = null;
      rsiChartRef.current = null;
      candlestickSeriesRef.current = null;
      volumeSeriesRef.current = null;
      ema9SeriesRef.current = null;
      ema20SeriesRef.current = null;
      rsi14SeriesRef.current = null;
      rsiEma20SeriesRef.current = null;
      setIsReady(false);
    };
  }, [height, mainChartHeight, rsiChartHeight, showVolume, resolvedTheme, indicators.ema9, indicators.ema20, indicators.rsi]);

  // Update data when it changes
  useEffect(() => {
    if (!isReady || !candlestickSeriesRef.current) return;

    const theme = resolvedTheme === "dark" ? chartThemes.dark : chartThemes.light;

    // Set candlestick data
    candlestickSeriesRef.current.setData(data as CandlestickData<Time>[]);

    // Set EMA 9 data
    if (indicators.ema9 && ema9SeriesRef.current && data.length >= 9) {
      const ema9Data = calculateEMA(data, 9);
      ema9SeriesRef.current.setData(ema9Data);
    }

    // Set EMA 20 data
    if (indicators.ema20 && ema20SeriesRef.current && data.length >= 20) {
      const ema20Data = calculateEMA(data, 20);
      ema20SeriesRef.current.setData(ema20Data);
    }

    // Set RSI 14 data (Green) and RSI-EMA-20 data (Red)
    if (indicators.rsi && rsi14SeriesRef.current && data.length >= 15) {
      const rsiData = calculateRSI(data, 14);
      rsi14SeriesRef.current.setData(rsiData);
      
      // Calculate EMA-20 of RSI values
      if (rsiEma20SeriesRef.current && rsiData.length >= 20) {
        const rsiEmaData = calculateEMAFromLineData(rsiData, 20);
        rsiEma20SeriesRef.current.setData(rsiEmaData);
      }
      
      rsiChartRef.current?.timeScale().fitContent();
    }

    // Set volume data if available
    if (showVolume && volumeSeriesRef.current && data.length > 0) {
      const volumeData = data.map((d, i) => ({
        time: d.time as Time,
        value: d.volume || 0,
        color:
          i > 0 && d.close < data[i - 1].close
            ? theme.volumeDownColor
            : theme.volumeUpColor,
      }));
      volumeSeriesRef.current.setData(volumeData);
    }

    // Set trade markers (must be sorted by time ascending)
    if (markers.length > 0) {
      const formattedMarkers = markers
        .map((m) => ({
          ...m,
          time: m.time as Time,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number));
      candlestickSeriesRef.current.setMarkers(formattedMarkers);
    }

    // Fit content
    chartRef.current?.timeScale().fitContent();
  }, [data, markers, isReady, showVolume, resolvedTheme, indicators.ema9, indicators.ema20, indicators.rsi]);

  return (
    <div className="relative w-full">
      {symbol && (
        <div className="absolute top-2 left-2 z-10 text-sm font-medium text-muted-foreground">
          {symbol}
        </div>
      )}
      {/* Indicator Legend */}
      <div className="absolute top-2 right-2 z-10 flex gap-3 text-xs">
        {indicators.ema9 && (
          <span className="flex items-center gap-1">
            <span className="w-4 h-1 bg-green-500 rounded" />
            <span className="text-muted-foreground">EMA 9</span>
          </span>
        )}
        {indicators.ema20 && (
          <span className="flex items-center gap-1">
            <span className="w-4 h-1 bg-red-500 rounded" />
            <span className="text-muted-foreground">EMA 20</span>
          </span>
        )}
      </div>
      <div
        ref={chartContainerRef}
        className="w-full rounded-t-lg overflow-hidden"
        style={{ height: mainChartHeight }}
      />
      {indicators.rsi && (
        <div className="relative border-t border-border">
          <div className="absolute top-1 left-2 z-10 text-xs text-muted-foreground flex gap-3">
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 bg-green-500 rounded" />
              RSI 14
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-1 bg-red-500 rounded" />
              RSI-EMA 20
            </span>
          </div>
          {/* RSI overbought/oversold zones */}
          <div className="absolute top-0 left-0 right-12 z-0 h-full pointer-events-none">
            <div className="absolute top-[10%] h-[20%] w-full bg-red-500/5 border-y border-red-500/20" />
            <div className="absolute bottom-[10%] h-[20%] w-full bg-green-500/5 border-y border-green-500/20" />
          </div>
          <div
            ref={rsiContainerRef}
            className="w-full rounded-b-lg overflow-hidden"
            style={{ height: rsiChartHeight }}
          />
        </div>
      )}
    </div>
  );
}

// Helper function to convert date string to UTCTimestamp
export function dateToTimestamp(dateString: string): UTCTimestamp {
  return (new Date(dateString).getTime() / 1000) as UTCTimestamp;
}

// Helper to generate sample data for testing
export function generateSampleData(
  days: number = 30,
  basePrice: number = 1000
): ChartDataPoint[] {
  const data: ChartDataPoint[] = [];
  let price = basePrice;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const change = (Math.random() - 0.5) * 0.04; // ±2% max change
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000) + 100000;

    data.push({
      time: (date.getTime() / 1000) as UTCTimestamp,
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });

    price = close;
  }

  return data;
}
