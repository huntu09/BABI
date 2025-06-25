import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { dailyBonusManager } from "@/lib/daily-bonus-manager"

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

    // Get user's daily bonus statistics
    const stats = await dailyBonusManager.getBonusStats(user.id)
    const history = await dailyBonusManager.getUserBonusHistory(user.id, 7) // Last 7 days
    const canClaim = await dailyBonusManager.canClaimToday(user.id)

    return NextResponse.json({
      success: true,
      stats,
      recentHistory: history,
      canClaimToday: canClaim,
    })
  } catch (error) {
    console.error("Daily bonus stats API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
