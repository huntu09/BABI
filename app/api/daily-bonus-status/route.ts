import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const today = new Date().toLocaleDateString("en-CA") // YYYY-MM-DD format

    // Check if bonus already claimed today
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

    // Get current profile for streak info
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("login_streak, balance")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Calculate next bonus amount based on current streak
    const currentStreak = profile.login_streak || 1
    const baseBonus = 25
    const streakBonus = Math.min(currentStreak * 5, 50) // Up to 50 extra points
    const nextBonusAmount = baseBonus + streakBonus

    return NextResponse.json({
      success: true,
      claimed: !!todayBonus,
      bonusDetails: todayBonus
        ? {
            amount: Number(todayBonus.amount),
            claimedAt: todayBonus.created_at,
            streakAtClaim: todayBonus.login_streak || todayBonus.streak_count,
          }
        : null,
      nextBonus: {
        amount: nextBonusAmount,
        baseAmount: baseBonus,
        streakBonus: streakBonus,
        currentStreak: currentStreak,
      },
      profile: {
        currentBalance: Number(profile.balance) || 0,
        loginStreak: currentStreak,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
