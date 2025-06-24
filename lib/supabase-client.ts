import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

// Singleton pattern for client-side Supabase client (with proper checks)
let supabaseClient: ReturnType<typeof createClientComponentClient> | null = null

export function getSupabaseClient() {
  // Only create client-side
  if (typeof window === "undefined") {
    throw new Error("getSupabaseClient should only be called on the client side")
  }

  if (!supabaseClient) {
    supabaseClient = createClientComponentClient()
  }
  return supabaseClient
}

// Server-side client
export function getSupabaseServerClient() {
  if (typeof window !== "undefined") {
    throw new Error("getSupabaseServerClient should only be called on the server side")
  }

  return createServerComponentClient({
    cookies,
  })
}

// Optimized query helpers (server-side only)
export const queryHelpers = {
  getUserProfile: async (userId: string) => {
    const supabase = getSupabaseServerClient()
    return supabase
      .from("profiles")
      .select("id, username, email, points, total_earned, referral_code, is_admin, is_banned")
      .eq("id", userId)
      .single()
  },

  getUserTasks: async (userId: string, limit = 10, offset = 0) => {
    const supabase = getSupabaseServerClient()
    return supabase
      .from("user_tasks")
      .select("id, task_id, points_earned, completed_at, status")
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })
      .range(offset, offset + limit - 1)
  },

  getActiveTasks: async (limit = 20) => {
    const supabase = getSupabaseServerClient()
    return supabase
      .from("tasks")
      .select("id, title, description, provider, points, difficulty, estimated_time, url")
      .eq("is_active", true)
      .order("points", { ascending: false })
      .limit(limit)
  },

  getWithdrawals: async (userId: string, limit = 10, offset = 0) => {
    const supabase = getSupabaseServerClient()
    return supabase
      .from("withdrawals")
      .select("id, amount, method, status, requested_at, processed_at")
      .eq("user_id", userId)
      .order("requested_at", { ascending: false })
      .range(offset, offset + limit - 1)
  },

  getReferralStats: async (userId: string) => {
    const supabase = getSupabaseServerClient()
    return supabase
      .from("referrals")
      .select("id, referred_id, commission_earned, created_at")
      .eq("referrer_id", userId)
      .order("created_at", { ascending: false })
  },
}
