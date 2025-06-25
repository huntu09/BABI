import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { transactionManager } from "@/lib/transaction-manager"

export async function POST() {
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

    // Check if already claimed today
    const { data: existingBonus, error: bonusError } = await supabase
      .from("daily_bonuses")
      .select("id")
      .eq("user_id", user.id)
      .eq("bonus_date", today)
      .maybeSingle()

    if (bonusError) {
      console.error("Database error:", bonusError)
      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    if (existingBonus) {
      return NextResponse.json(
        {
          error: "Daily bonus already claimed today",
          alreadyClaimed: true,
        },
        { status: 400 },
      )
    }

    // Get current profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("login_streak, balance")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // 🔥 UPDATED: Sustainable daily bonus
    const bonusAmount = 5 // Base bonus (was 25, now 5 = $0.05)
    const streakBonus = Math.min(profile.login_streak * 1, 10) // Max 10 extra points (was 50)
    const totalBonus = bonusAmount + streakBonus

    // Use database function for atomic operations
    const { data: result, error: claimError } = await supabase.rpc("claim_daily_bonus", {
      p_user_id: user.id,
      p_bonus_date: today,
      p_bonus_amount: totalBonus,
      p_login_streak: profile.login_streak,
    })

    if (claimError) {
      console.error("Claim bonus error:", claimError)
      return NextResponse.json({ error: "Failed to claim bonus: " + claimError.message }, { status: 500 })
    }

    // 🔥 NEW: Create transaction record for daily bonus
    const bonusAmountInUSD = totalBonus / 100 // Convert points to USD
    const transaction = await transactionManager.createEarningTransaction(
      user.id,
      bonusAmountInUSD,
      "daily_bonus",
      `Daily login bonus (Day ${profile.login_streak}) - ${bonusAmount} base + ${streakBonus} streak bonus`,
      existingBonus?.id, // Reference to daily_bonuses record if available
      "daily_bonus",
    )

    if (!transaction) {
      console.warn("⚠️ Failed to create transaction record for daily bonus")
    } else {
      console.log("✅ Daily bonus transaction created:", transaction.id)
    }

    return NextResponse.json({
      success: true,
      bonusAmount: totalBonus,
      bonusAmountUSD: bonusAmountInUSD,
      streakBonus,
      currentStreak: profile.login_streak,
      message: `You earned ${totalBonus} points ($${bonusAmountInUSD.toFixed(2)})! (${bonusAmount} base + ${streakBonus} streak bonus)`,
      newBalance: result.new_balance,
      transactionId: transaction?.id,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
