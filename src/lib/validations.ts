import { z } from "zod";
import { MOODS, TRADE_TYPES } from "@/types/trading";

// ============================================================================
// Common Validators
// ============================================================================

export const emailSchema = z.string().trim().email("Invalid email address").toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const idSchema = z.string().cuid("Invalid ID format");

export const positiveNumber = z.number().positive("Must be a positive number");
export const positiveInt = z.number().int().positive("Must be a positive integer");

// ============================================================================
// Auth Schemas
// ============================================================================

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long").optional(),
  email: emailSchema,
  password: passwordSchema,
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});

// ============================================================================
// Intraday Trade Schemas
// ============================================================================

export const moodSchema = z.enum(MOODS);
export const tradeTypeSchema = z.enum(TRADE_TYPES);

export const createIntradayTradeSchema = z.object({
  tradeDate: z.string().or(z.date()).transform((val) => new Date(val)),
  script: z
    .string()
    .transform((val) => val.trim())
    .pipe(z.string().min(1, "Script is required").max(50, "Script name too long"))
    .transform((val) => val.toUpperCase()),
  type: tradeTypeSchema,
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  buyPrice: z.coerce.number().positive("Buy price must be positive"),
  sellPrice: z.coerce.number().positive("Sell price must be positive"),
  profitLoss: z.coerce.number().optional(),
  charges: z.coerce.number().min(0).default(0),
  netProfitLoss: z.coerce.number().optional(),
  remarks: z.string().trim().max(500, "Remarks too long").optional().nullable(),
  followSetup: z.boolean().default(true),
  mood: moodSchema.default("CALM"),
});

export const updateIntradayTradeSchema = z.object({
  date: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
  day: z.string().optional(),
  script: z.string().transform((val) => val.trim()).pipe(z.string().max(50)).transform((val) => val.toUpperCase()).optional(),
  buySell: tradeTypeSchema.optional(),
  quantity: z.coerce.number().int().positive().optional(),
  entryPrice: z.coerce.number().positive().optional(),
  exitPrice: z.coerce.number().positive().optional(),
  points: z.coerce.number().optional(),
  profitLoss: z.coerce.number().optional(),
  followSetup: z.boolean().optional(),
  remarks: z.string().trim().max(500).optional().nullable(),
  mood: moodSchema.optional(),
});

export const intradayQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(50),
});

// ============================================================================
// Portfolio Schemas
// ============================================================================

export const createPortfolioStockSchema = z.object({
  symbol: z
    .string()
    .transform((val) => val.trim())
    .pipe(z.string().min(1, "Symbol is required").max(50, "Symbol too long"))
    .transform((val) => val.toUpperCase()),
  stockName: z.string().trim().max(50).toUpperCase().optional(),
  name: z.string().trim().max(100, "Display name too long").optional().nullable(),
  displayName: z.string().trim().max(100).optional().nullable(),
  quantity: z.coerce.number().int().positive("Quantity must be positive"),
  buyPrice: z.coerce.number().positive("Buy price must be positive").optional(),
  averagePrice: z.coerce.number().positive().optional(),
  purchaseDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
}).refine((data) => data.buyPrice !== undefined || data.averagePrice !== undefined, {
  message: "Either buyPrice or averagePrice is required",
  path: ["buyPrice"],
});

export const updatePortfolioStockSchema = z.object({
  symbol: z.string().trim().max(50).toUpperCase().optional(),
  stockName: z.string().trim().max(50).toUpperCase().optional(),
  name: z.string().trim().max(100).optional().nullable(),
  displayName: z.string().trim().max(100).optional().nullable(),
  quantity: z.coerce.number().int().positive().optional(),
  buyPrice: z.coerce.number().positive().optional(),
  averagePrice: z.coerce.number().positive().optional(),
  purchaseDate: z.string().or(z.date()).transform((val) => new Date(val)).optional(),
});

// ============================================================================
// Profile Schemas
// ============================================================================

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name too long").optional(),
  initialCapital: z.coerce.number().min(0, "Initial capital cannot be negative").optional(),
});

// ============================================================================
// Utility Functions
// ============================================================================

export type ValidationResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; issues?: z.ZodIssue[] };

/**
 * Safely validate data against a Zod schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): ValidationResult<T> {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const firstError = result.error.issues[0];
  const errorMessage = firstError
    ? `${firstError.path.join(".")}: ${firstError.message}`.replace(/^: /, "")
    : "Validation failed";
  
  return {
    success: false,
    error: errorMessage,
    issues: result.error.issues,
  };
}

/**
 * Parse and validate request body with a schema
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>
): Promise<ValidationResult<T>> {
  try {
    const body = await request.json();
    return validate(schema, body);
  } catch {
    return {
      success: false,
      error: "Invalid JSON in request body",
    };
  }
}

export type SignupInput = z.infer<typeof signupSchema>;
export type CreateIntradayTradeInput = z.infer<typeof createIntradayTradeSchema>;
export type UpdateIntradayTradeInput = z.infer<typeof updateIntradayTradeSchema>;
export type CreatePortfolioStockInput = z.infer<typeof createPortfolioStockSchema>;
export type UpdatePortfolioStockInput = z.infer<typeof updatePortfolioStockSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
