import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";

// Check if Upstash Redis is configured
const isUpstashConfigured = Boolean(
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
);

// Create Redis client only if configured
const redis = isUpstashConfigured
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

// Rate limiters for different endpoints
// Adjust these values based on your needs

/**
 * Standard API rate limiter: 60 requests per minute
 */
export const standardLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/standard",
    })
  : null;

/**
 * Auth rate limiter: 10 requests per minute (stricter for security)
 */
export const authLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/auth",
    })
  : null;

/**
 * AI/expensive operations rate limiter: 10 requests per minute
 */
export const aiLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/ai",
    })
  : null;

/**
 * Strict rate limiter for sensitive operations: 5 requests per minute
 */
export const strictLimiter = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "@upstash/ratelimit/strict",
    })
  : null;

export type RateLimiterType = "standard" | "auth" | "ai" | "strict";

const limiters = {
  standard: standardLimiter,
  auth: authLimiter,
  ai: aiLimiter,
  strict: strictLimiter,
};

export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
}

/**
 * Check rate limit for a given identifier
 */
export async function checkRateLimit(
  identifier: string,
  type: RateLimiterType = "standard"
): Promise<RateLimitResult> {
  const limiter = limiters[type];
  
  // If rate limiting is not configured, allow all requests
  if (!limiter) {
    return { success: true };
  }
  
  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);
    return { success, limit, remaining, reset };
  } catch (error) {
    // If rate limiting fails, log and allow the request (fail open)
    console.error("Rate limiting error:", error);
    return { success: true };
  }
}

/**
 * Get identifier from request (IP address or user ID)
 */
export function getIdentifier(
  request: Request,
  userId?: string
): string {
  // Prefer user ID for authenticated requests
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  const forwardedFor = request.headers.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0].trim() || 
             request.headers.get("x-real-ip") ||
             "anonymous";
  
  return `ip:${ip}`;
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(result: RateLimitResult): NextResponse {
  return NextResponse.json(
    { 
      error: "Too many requests. Please try again later.",
      retryAfter: result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60,
    },
    { 
      status: 429,
      headers: {
        "X-RateLimit-Limit": String(result.limit || 0),
        "X-RateLimit-Remaining": String(result.remaining || 0),
        "X-RateLimit-Reset": String(result.reset || 0),
        "Retry-After": String(result.reset ? Math.ceil((result.reset - Date.now()) / 1000) : 60),
      },
    }
  );
}

/**
 * Wrapper function to easily add rate limiting to API routes
 */
export async function withRateLimit(
  request: Request,
  userId: string | undefined,
  type: RateLimiterType = "standard"
): Promise<NextResponse | null> {
  const identifier = getIdentifier(request, userId);
  const result = await checkRateLimit(identifier, type);
  
  if (!result.success) {
    return rateLimitResponse(result);
  }
  
  return null;
}
