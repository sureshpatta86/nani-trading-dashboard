"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Trash2, Edit2, BarChart3, CandlestickChart } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import type { IntradayTrade } from "@/types/trading";

// Mood emoji mapping
const moodEmojis: Record<string, string> = {
  CALM: "😌",
  CONFIDENT: "😎",
  ANXIOUS: "😰",
  FOMO: "🤑",
  PANICKED: "😱",
  OVERCONFIDENT: "🦸",
};

interface TradeTableProps {
  trades: IntradayTrade[];
  onEdit: (trade: IntradayTrade) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function TradeTable({ trades, onEdit, onDelete, isLoading }: TradeTableProps) {
  const t = useTranslations("intraday");
  const tc = useTranslations("common");

  if (trades.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">{t("tradeLog")}</CardTitle>
          <CardDescription>{t("recentTrades")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t("noTrades")}</h3>
            <p className="text-muted-foreground mb-4">{t("noTradesHint")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">{t("tradeLog")}</CardTitle>
        <CardDescription>{t("recentTrades")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableDate")}</TableHead>
                <TableHead>{t("tableScript")}</TableHead>
                <TableHead>{t("tableType")}</TableHead>
                <TableHead className="text-right">{t("tableQty")}</TableHead>
                <TableHead className="text-right">{t("tableBuy")}</TableHead>
                <TableHead className="text-right">{t("tableSell")}</TableHead>
                <TableHead className="text-right">{t("tablePL")}</TableHead>
                <TableHead className="text-center">{t("tableSetup")}</TableHead>
                <TableHead className="text-center">{t("tableMood")}</TableHead>
                <TableHead>{t("tableRemarks")}</TableHead>
                <TableHead className="text-right">{t("tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trades.map((trade) => (
                <TableRow key={trade.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(trade.tradeDate).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link 
                      href={`/stock/${trade.script}.NS`}
                      className="flex items-center gap-1 hover:text-primary transition-colors group"
                    >
                      {trade.script}
                      <CandlestickChart className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.type === "BUY"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }`}
                    >
                      {trade.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{trade.quantity}</TableCell>
                  <TableCell className="text-right">₹{trade.buyPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{trade.sellPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold flex items-center justify-end gap-1 ${
                        trade.netProfitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {trade.netProfitLoss >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      ₹{trade.netProfitLoss.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        trade.followSetup
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                      }`}
                    >
                      {trade.followSetup ? tc("yes") : tc("no")}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span title={trade.mood} className="text-lg">
                      {moodEmojis[trade.mood] || "😐"}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate" title={trade.remarks}>
                    {trade.remarks || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(trade)}
                        aria-label={t("editTrade")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(trade.id)}
                        aria-label={tc("delete")}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
