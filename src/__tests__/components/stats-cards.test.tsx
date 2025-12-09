import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { IntradayStatsCards, PortfolioStatsCards } from "@/components/trading/stats-cards";

// Mock next-intl
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("Stats Cards Components", () => {
  describe("IntradayStatsCards", () => {
    it("should render all stat cards", () => {
      render(
        <IntradayStatsCards
          totalPL={15000}
          winRate={65}
          winningTrades={13}
          losingTrades={7}
          totalTrades={20}
          tradingDays={10}
          initialCapital={100000}
        />
      );

      // Check if key elements are rendered
      expect(screen.getByText("totalPL")).toBeInTheDocument();
      expect(screen.getByText("winRate")).toBeInTheDocument();
      expect(screen.getByText("totalTrades")).toBeInTheDocument();
      expect(screen.getByText("tradingDays")).toBeInTheDocument();
    });

    it("should display formatted P/L value", () => {
      render(
        <IntradayStatsCards
          totalPL={15000}
          winRate={65}
          winningTrades={13}
          losingTrades={7}
          totalTrades={20}
          tradingDays={10}
        />
      );

      expect(screen.getByText(/₹15,000/)).toBeInTheDocument();
    });

    it("should display win rate percentage", () => {
      render(
        <IntradayStatsCards
          totalPL={15000}
          winRate={65}
          winningTrades={13}
          losingTrades={7}
          totalTrades={20}
          tradingDays={10}
        />
      );

      expect(screen.getByText("65.0%")).toBeInTheDocument();
    });

    it("should show returns when initial capital is provided", () => {
      render(
        <IntradayStatsCards
          totalPL={10000}
          winRate={60}
          winningTrades={12}
          losingTrades={8}
          totalTrades={20}
          tradingDays={10}
          initialCapital={100000}
        />
      );

      // 10% return
      expect(screen.getByText(/\+10.0%/)).toBeInTheDocument();
    });
  });

  describe("PortfolioStatsCards", () => {
    it("should render all portfolio stat cards", () => {
      render(
        <PortfolioStatsCards
          totalStocks={10}
          gainers={7}
          losers={3}
          totalInvested={500000}
          totalCurrent={550000}
          totalPL={50000}
          totalPLPercentage={10}
        />
      );

      expect(screen.getByText("totalStocks")).toBeInTheDocument();
      expect(screen.getByText("investedValue")).toBeInTheDocument();
      expect(screen.getByText("currentValue")).toBeInTheDocument();
      expect(screen.getByText("totalPL")).toBeInTheDocument();
    });

    it("should display formatted currency values", () => {
      render(
        <PortfolioStatsCards
          totalStocks={10}
          gainers={7}
          losers={3}
          totalInvested={500000}
          totalCurrent={550000}
          totalPL={50000}
          totalPLPercentage={10}
        />
      );

      expect(screen.getByText(/₹5,00,000/)).toBeInTheDocument();
      expect(screen.getByText(/₹5,50,000/)).toBeInTheDocument();
      expect(screen.getByText(/₹50,000/)).toBeInTheDocument();
    });

    it("should display stock count", () => {
      render(
        <PortfolioStatsCards
          totalStocks={15}
          gainers={10}
          losers={5}
          totalInvested={500000}
          totalCurrent={520000}
          totalPL={20000}
          totalPLPercentage={4}
        />
      );

      expect(screen.getByText("15")).toBeInTheDocument();
    });
  });
});
