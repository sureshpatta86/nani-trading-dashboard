import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  checkRateLimit,
  getIdentifier,
  withRateLimit,
} from "@/lib/rate-limit";

// Mock @upstash/ratelimit and @upstash/redis
vi.mock("@upstash/redis", () => ({
  Redis: vi.fn().mockImplementation(() => ({})),
}));

vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: vi.fn().mockImplementation(() => ({
    limit: vi.fn().mockResolvedValue({
      success: true,
      limit: 60,
      remaining: 59,
      reset: Date.now() + 60000,
    }),
  })),
}));

describe("Rate Limiting", () => {
  describe("getIdentifier", () => {
    it("should prefer userId when provided", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1" },
      });

      const identifier = getIdentifier(request, "user-123");
      expect(identifier).toBe("user:user-123");
    });

    it("should fall back to IP when no userId", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
      });

      const identifier = getIdentifier(request, undefined);
      expect(identifier).toBe("ip:192.168.1.1");
    });

    it("should use x-real-ip as fallback", () => {
      const request = new Request("http://localhost/api/test", {
        headers: { "x-real-ip": "10.0.0.1" },
      });

      const identifier = getIdentifier(request, undefined);
      expect(identifier).toBe("ip:10.0.0.1");
    });

    it("should use anonymous when no IP available", () => {
      const request = new Request("http://localhost/api/test");

      const identifier = getIdentifier(request, undefined);
      expect(identifier).toBe("ip:anonymous");
    });
  });

  describe("checkRateLimit", () => {
    it("should return success when rate limit not configured", async () => {
      // When Redis is not configured, should allow all requests
      const result = await checkRateLimit("test-user", "standard");
      expect(result.success).toBe(true);
    });
  });
});
