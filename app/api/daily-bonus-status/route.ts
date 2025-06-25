import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { DailyBonusStatus } from "@/types"

// Mark as dynamic to allow cookies usage
export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse<DailyBonusStatus | { error: string }>> {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toLocaleDateString("en-CA")

    const { data: todayBonus, error: bonusError } = await supabase
      .from("daily_bonuses")
      .select("id, amount, streak_count, login_streak, created_at")
      .eq("user_id", user.id)
      .eq("bonus_date", today)
      .maybeSingle()

    if (bonusError) {
      console.error("Database error:", bonusError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("login_streak, points") // Use 'points' instead of 'balance'
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    const currentStreak = profile.login_streak || 1
    const baseBonus = 25
    const streakBonus = Math.min(currentStreak * 5, 50)
    const nextBonusAmount = baseBonus + streakBonus

    const response: DailyBonusStatus = {
      success: true,
      claimed: !!todayBonus,
      bonusDetails: todayBonus
        ? {
            id: todayBonus.id,
            user_id: user.id,
            bonus_date: today,
            amount: Number(todayBonus.amount),
            streak_count: todayBonus.streak_count || todayBonus.login_streak || 1,
            login_streak: todayBonus.login_streak || todayBonus.streak_count || 1,
            created_at: todayBonus.created_at,
          }
        : undefined,
      nextBonus: {
        amount: nextBonusAmount,
        baseAmount: baseBonus,
        streakBonus: streakBonus,
        currentStreak: currentStreak,
      },
      profile: {
        currentBalance: Number(profile.points) || 0, // Use 'points' instead of 'balance'
        loginStreak: currentStreak,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
