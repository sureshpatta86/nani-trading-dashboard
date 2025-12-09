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
import { TrendingUp, TrendingDown, Trash2, Edit2, Briefcase } from "lucide-react";
import { useTranslations } from "next-intl";
import type { PortfolioStock } from "@/types/trading";

interface StockTableProps {
  stocks: PortfolioStock[];
  onEdit: (stock: PortfolioStock) => void;
  onDelete: (id: string) => void;
  isLoading?: boolean;
}

export function StockTable({ stocks, onEdit, onDelete, isLoading }: StockTableProps) {
  const t = useTranslations("portfolio");
  const tc = useTranslations("common");

  if (stocks.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-muted/30">
          <CardTitle className="text-lg">{t("yourPortfolio")}</CardTitle>
          <CardDescription>{t("currentHoldings")}</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="text-center py-16 px-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Briefcase className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">{t("noStocks")}</h3>
            <p className="text-muted-foreground mb-4">{t("noStocksHint")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted/30">
        <CardTitle className="text-lg">{t("yourPortfolio")}</CardTitle>
        <CardDescription>{t("currentHoldings")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("tableSymbol")}</TableHead>
                <TableHead>{t("tableName")}</TableHead>
                <TableHead className="text-right">{t("tableQty")}</TableHead>
                <TableHead className="text-right">{t("tableBuyPrice")}</TableHead>
                <TableHead className="text-right">{t("tableCurrentPrice")}</TableHead>
                <TableHead className="text-right">{t("tableInvested")}</TableHead>
                <TableHead className="text-right">{t("tableCurrentValue")}</TableHead>
                <TableHead className="text-right">{t("tablePL")}</TableHead>
                <TableHead className="text-right">{t("tablePLPercent")}</TableHead>
                <TableHead>{t("tablePurchaseDate")}</TableHead>
                <TableHead className="text-right">{t("tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stocks.map((stock) => (
                <TableRow key={stock.id}>
                  <TableCell className="font-medium">{stock.symbol}</TableCell>
                  <TableCell>{stock.name || "-"}</TableCell>
                  <TableCell className="text-right">{stock.quantity}</TableCell>
                  <TableCell className="text-right">₹{stock.buyPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{stock.currentPrice.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{stock.investedValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">₹{stock.currentValue.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-bold flex items-center justify-end gap-1 ${
                        stock.profitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stock.profitLoss >= 0 ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      ₹{stock.profitLoss.toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={`font-medium ${
                        stock.profitLossPercentage >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {stock.profitLossPercentage >= 0 ? "+" : ""}
                      {stock.profitLossPercentage.toFixed(2)}%
                    </span>
                  </TableCell>
                  <TableCell>
                    {new Date(stock.purchaseDate).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(stock)}
                        aria-label={t("editStock")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(stock.id)}
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
