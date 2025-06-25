import { z } from "zod"

// Badge validation schemas
export const badgeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  icon: z.string().optional(),
  requirement_type: z.enum([
    "tasks_completed",
    "points_earned",
    "login_streak",
    "referrals_made",
    "withdrawals_made",
    "days_active",
  ]),
  requirement_value: z.number().int().positive(),
  reward_amount: z.number().min(0),
  is_active: z.boolean().default(true),
})

// Cached offer validation schemas
export const cachedOfferSchema = z.object({
  provider: z.enum([
    "cpx_research",
    "adgem",
    "lootably",
    "offertoro",
    "bitlabs",
    "ayetstudios",
    "revenue_universe",
    "persona_ly",
  ]),
  external_offer_id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  reward_amount: z.number().positive(),
  original_reward: z.number().positive(),
  conversion_rate: z.number().positive().default(1),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  requirements: z.record(z.any()).default({}),
  countries: z.array(z.string()).default([]),
  devices: z.array(z.string()).default([]),
  offer_url: z.string().url(),
  is_active: z.boolean().default(true),
  difficulty: z.enum(["easy", "medium", "hard"]).default("easy"),
})

// Fraud log validation schemas
export const fraudLogSchema = z.object({
  user_id: z.string().uuid().optional(),
  event_type: z.string().min(1),
  risk_level: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  details: z.record(z.any()).default({}),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
  confidence_score: z.number().min(0).max(1).default(0.5),
})

// Admin action validation schemas
export const adminActionSchema = z.object({
  admin_id: z.string().uuid(),
  action_type: z.string().min(1),
  target_type: z.string().min(1),
  target_id: z.string().uuid().optional(),
  details: z.record(z.any()).default({}),
  reason: z.string().optional(),
  ip_address: z.string().optional(),
  user_agent: z.string().optional(),
})
