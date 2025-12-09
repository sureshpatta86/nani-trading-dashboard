import { describe, it, expect } from "vitest";
import { z } from "zod";
import {
  signupSchema,
  createIntradayTradeSchema,
  createPortfolioStockSchema,
  updateProfileSchema,
  validate,
} from "@/lib/validations";

describe("Validation Schemas", () => {
  describe("signupSchema", () => {
    it("should validate a valid signup payload", () => {
      const validData = {
        name: "John Doe",
        email: "john@example.com",
        password: "Password123",
      };

      const result = validate(signupSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe("john@example.com");
        expect(result.data.name).toBe("John Doe");
      }
    });

    it("should reject weak passwords", () => {
      const weakPasswordData = {
        email: "john@example.com",
        password: "weak",
      };

      const result = validate(signupSchema, weakPasswordData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("8 characters");
      }
    });

    it("should reject invalid email", () => {
      const invalidEmailData = {
        email: "not-an-email",
        password: "Password123",
      };

      const result = validate(signupSchema, invalidEmailData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("email");
      }
    });

    it("should require uppercase in password", () => {
      const noUppercaseData = {
        email: "john@example.com",
        password: "password123",
      };

      const result = validate(signupSchema, noUppercaseData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("uppercase");
      }
    });

    it("should require number in password", () => {
      const noNumberData = {
        email: "john@example.com",
        password: "PasswordABC",
      };

      const result = validate(signupSchema, noNumberData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("number");
      }
    });
  });

  describe("createIntradayTradeSchema", () => {
    it("should validate a valid trade payload", () => {
      const validTrade = {
        tradeDate: "2025-12-09",
        script: "RELIANCE",
        type: "BUY",
        quantity: 100,
        buyPrice: 2500.5,
        sellPrice: 2550.75,
        followSetup: true,
        mood: "CALM",
      };

      const result = validate(createIntradayTradeSchema, validTrade);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.script).toBe("RELIANCE");
        expect(result.data.quantity).toBe(100);
        expect(result.data.tradeDate).toBeInstanceOf(Date);
      }
    });

    it("should convert script to uppercase", () => {
      const lowercaseScript = {
        tradeDate: "2025-12-09",
        script: "reliance",
        type: "BUY",
        quantity: 100,
        buyPrice: 2500,
        sellPrice: 2550,
      };

      const result = validate(createIntradayTradeSchema, lowercaseScript);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.script).toBe("RELIANCE");
      }
    });

    it("should reject invalid trade type", () => {
      const invalidType = {
        tradeDate: "2025-12-09",
        script: "RELIANCE",
        type: "INVALID",
        quantity: 100,
        buyPrice: 2500,
        sellPrice: 2550,
      };

      const result = validate(createIntradayTradeSchema, invalidType);
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const negativeQty = {
        tradeDate: "2025-12-09",
        script: "RELIANCE",
        type: "BUY",
        quantity: -100,
        buyPrice: 2500,
        sellPrice: 2550,
      };

      const result = validate(createIntradayTradeSchema, negativeQty);
      expect(result.success).toBe(false);
    });

    it("should coerce string numbers to numbers", () => {
      const stringNumbers = {
        tradeDate: "2025-12-09",
        script: "RELIANCE",
        type: "BUY",
        quantity: "100",
        buyPrice: "2500.50",
        sellPrice: "2550.75",
      };

      const result = validate(createIntradayTradeSchema, stringNumbers);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.quantity).toBe(100);
        expect(result.data.buyPrice).toBe(2500.5);
        expect(result.data.sellPrice).toBe(2550.75);
      }
    });

    it("should apply default mood and followSetup", () => {
      const minimalTrade = {
        tradeDate: "2025-12-09",
        script: "RELIANCE",
        type: "SELL",
        quantity: 50,
        buyPrice: 2500,
        sellPrice: 2450,
      };

      const result = validate(createIntradayTradeSchema, minimalTrade);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mood).toBe("CALM");
        expect(result.data.followSetup).toBe(true);
      }
    });
  });

  describe("createPortfolioStockSchema", () => {
    it("should validate a valid stock payload", () => {
      const validStock = {
        symbol: "TCS",
        quantity: 50,
        buyPrice: 3400,
        purchaseDate: "2025-11-15",
      };

      const result = validate(createPortfolioStockSchema, validStock);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.symbol).toBe("TCS");
        expect(result.data.quantity).toBe(50);
      }
    });

    it("should accept averagePrice as alternative to buyPrice", () => {
      const withAveragePrice = {
        symbol: "TCS",
        quantity: 50,
        averagePrice: 3400,
      };

      const result = validate(createPortfolioStockSchema, withAveragePrice);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.averagePrice).toBe(3400);
      }
    });

    it("should require either buyPrice or averagePrice", () => {
      const noPriceData = {
        symbol: "TCS",
        quantity: 50,
      };

      const result = validate(createPortfolioStockSchema, noPriceData);
      expect(result.success).toBe(false);
    });
  });

  describe("updateProfileSchema", () => {
    it("should validate a valid profile update", () => {
      const validUpdate = {
        name: "Jane Doe",
        initialCapital: 100000,
      };

      const result = validate(updateProfileSchema, validUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Jane Doe");
        expect(result.data.initialCapital).toBe(100000);
      }
    });

    it("should reject negative initial capital", () => {
      const negativeCapital = {
        initialCapital: -50000,
      };

      const result = validate(updateProfileSchema, negativeCapital);
      expect(result.success).toBe(false);
    });

    it("should allow partial updates", () => {
      const partialUpdate = {
        name: "Just Name",
      };

      const result = validate(updateProfileSchema, partialUpdate);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe("Just Name");
        expect(result.data.initialCapital).toBeUndefined();
      }
    });
  });
});
