// 🛡️ INPUT VALIDATION SCHEMAS

import { z } from "zod"

// User Schemas
export const profileUpdateSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  email: z.string().email("Invalid email address").optional(),
})

export const withdrawalRequestSchema = z.object({
  amount: z.number().min(200, "Minimum withdrawal is $2.00").max(100000, "Maximum withdrawal is $1000.00"),
  method: z.enum(["dana", "gopay", "shopeepay", "ovo"]),
  accountDetails: z.object({
    accountNumber: z.string().min(1, "Account number is required"),
    accountName: z.string().min(1, "Account name is required"),
  }),
})

// Admin Schemas
export const adminActionSchema = z.object({
  action: z.enum(["approve", "reject", "suspend", "unsuspend", "ban", "unban"]),
  targetId: z.string().uuid(),
  reason: z.string().min(1, "Reason is required"),
  notes: z.string().optional(),
})

export const systemSettingsSchema = z.object({
  minWithdrawal: z.number().min(100).max(1000),
  maxWithdrawal: z.number().min(1000).max(1000000),
  referralCommission: z.number().min(0).max(0.5),
  dailyLoginBonus: z.number().min(0).max(100),
  maintenanceMode: z.boolean(),
})

// Offerwall Schemas
export const offerClickSchema = z.object({
  offerId: z.string().min(1, "Offer ID is required"),
  userId: z.string().uuid().optional(),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
})

export const offerCompletionSchema = z.object({
  offerId: z.string().min(1),
  userId: z.string().uuid(),
  transactionId: z.string().min(1),
  points: z.number().min(1),
  payout: z.number().min(0),
  providerId: z.string().min(1),
  signature: z.string().optional(),
})

// Security Schemas
export const fraudReportSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(["vpn_detected", "multiple_accounts", "suspicious_activity", "fake_completion"]),
  details: z.record(z.any()),
  severity: z.enum(["low", "medium", "high", "critical"]),
  ipAddress: z.string().ip().optional(),
  userAgent: z.string().optional(),
})

// API Response Schema
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
})

// Pagination Schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
})

// Filter Schemas
export const offerFilterSchema = z.object({
  category: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  minPoints: z.number().min(0).optional(),
  maxPoints: z.number().min(0).optional(),
  provider: z.string().optional(),
  country: z.string().optional(),
  device: z.enum(["android", "ios", "web"]).optional(),
})

export const userFilterSchema = z.object({
  status: z.enum(["active", "suspended", "banned"]).optional(),
  minPoints: z.number().min(0).optional(),
  maxPoints: z.number().min(0).optional(),
  registeredAfter: z.string().datetime().optional(),
  registeredBefore: z.string().datetime().optional(),
  hasReferrals: z.boolean().optional(),
})

// Validation Helper Functions
export function validateInput(schema: z.ZodSchema<any>, data: unknown): any {
  try {
    return schema.parse(data)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation error: ${error.errors.map((e) => e.message).join(", ")}`)
    }
    throw error
  }
}

export function safeValidateInput(schema: z.ZodSchema<any>, data: unknown) {
  const result = schema.safeParse(data)
  return {
    success: result.success,
    data: result.success ? result.data : null,
    errors: result.success ? null : result.error.errors,
  }
}
