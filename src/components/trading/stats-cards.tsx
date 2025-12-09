"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Target, 
  BarChart3, 
  CalendarDays,
  Briefcase,
  PieChart
} from "lucide-react";
import { useTranslations } from "next-intl";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  colorClass: string;
  valueColorClass?: string;
}

function StatCard({ title, value, subtitle, icon, colorClass, valueColorClass }: StatCardProps) {
  return (
    <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${colorClass} via-card to-card`}>
      <div className={`absolute top-0 right-0 w-16 h-16 ${colorClass.replace('from-', 'bg-')} rounded-full -mr-8 -mt-8`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${valueColorClass || ''}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

interface IntradayStatsProps {
  totalPL: number;
  winRate: number;
  winningTrades: number;
  losingTrades: number;
  totalTrades: number;
  tradingDays: number;
  initialCapital?: number;
}

export function IntradayStatsCards({
  totalPL,
  winRate,
  winningTrades,
  losingTrades,
  totalTrades,
  tradingDays,
  initialCapital = 0,
}: IntradayStatsProps) {
  const t = useTranslations("intraday");
  const returnPercent = initialCapital > 0 ? (totalPL / initialCapital) * 100 : 0;

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("totalPL")}
        value={`₹${totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        subtitle={initialCapital > 0 ? `${returnPercent >= 0 ? '+' : ''}${returnPercent.toFixed(1)}% ${t("returns")}` : undefined}
        icon={totalPL >= 0 
          ? <TrendingUp className="h-4 w-4 text-emerald-500" />
          : <TrendingDown className="h-4 w-4 text-red-500" />
        }
        colorClass="from-emerald-500/10"
        valueColorClass={totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
      />

      <StatCard
        title={t("winRate")}
        value={`${winRate.toFixed(1)}%`}
        subtitle={`${winningTrades}W / ${losingTrades}L`}
        icon={<Target className="h-4 w-4 text-blue-500" />}
        colorClass="from-blue-500/10"
        valueColorClass={winRate >= 50 ? "text-green-600 dark:text-green-400" : undefined}
      />

      <StatCard
        title={t("totalTrades")}
        value={totalTrades}
        subtitle={t("tradeCount")}
        icon={<BarChart3 className="h-4 w-4 text-purple-500" />}
        colorClass="from-purple-500/10"
      />

      <StatCard
        title={t("tradingDays")}
        value={tradingDays}
        subtitle={t("daysActive")}
        icon={<CalendarDays className="h-4 w-4 text-orange-500" />}
        colorClass="from-orange-500/10"
      />
    </div>
  );
}

interface PortfolioStatsProps {
  totalStocks: number;
  gainers: number;
  losers: number;
  totalInvested: number;
  totalCurrent: number;
  totalPL: number;
  totalPLPercentage: number;
}

export function PortfolioStatsCards({
  totalStocks,
  gainers,
  losers,
  totalInvested,
  totalCurrent,
  totalPL,
  totalPLPercentage,
}: PortfolioStatsProps) {
  const t = useTranslations("portfolio");

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("totalStocks")}
        value={totalStocks}
        subtitle={
          <span>
            <span className="text-green-600 dark:text-green-400">{gainers} {t("gainers")}</span>
            {" / "}
            <span className="text-red-600 dark:text-red-400">{losers} {t("losers")}</span>
          </span> as unknown as string
        }
        icon={<Briefcase className="h-4 w-4 text-indigo-500" />}
        colorClass="from-indigo-500/10"
      />

      <StatCard
        title={t("investedValue")}
        value={`₹${totalInvested.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        subtitle={t("totalInvestment")}
        icon={<Wallet className="h-4 w-4 text-blue-500" />}
        colorClass="from-blue-500/10"
      />

      <StatCard
        title={t("currentValue")}
        value={`₹${totalCurrent.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        subtitle={t("marketValue")}
        icon={<PieChart className="h-4 w-4 text-purple-500" />}
        colorClass="from-purple-500/10"
      />

      <StatCard
        title={t("totalPL")}
        value={`₹${totalPL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
        subtitle={`${totalPLPercentage >= 0 ? '+' : ''}${totalPLPercentage.toFixed(2)}%`}
        icon={totalPL >= 0 
          ? <TrendingUp className="h-4 w-4 text-emerald-500" />
          : <TrendingDown className="h-4 w-4 text-red-500" />
        }
        colorClass="from-emerald-500/10"
        valueColorClass={totalPL >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}
      />
    </div>
  );
}
