import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { bonusType, points } = await request.json()

    // Check if bonus already claimed today
    const today = new Date().toISOString().split("T")[0]
    const { data: existingBonus } = await supabase
      .from("user_tasks")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("status", "daily_bonus")
      .gte("completed_at", `${today}T00:00:00.000Z`)
      .single()

    if (existingBonus) {
      return NextResponse.json({ error: "Bonus already claimed today" }, { status: 400 })
    }

    // Record bonus claim
    const { error: bonusError } = await supabase.from("user_tasks").insert({
      user_id: session.user.id,
      task_id: 9999, // Special ID for daily bonus
      points_earned: points,
      status: "daily_bonus",
    })

    if (bonusError) throw bonusError

    // Update user points
    const { error: pointsError } = await supabase
      .from("profiles")
      .update({
        points: supabase.raw("points + ?", [points]),
        total_earned: supabase.raw("total_earned + ?", [points]),
      })
      .eq("id", session.user.id)

    if (pointsError) throw pointsError

    return NextResponse.json({ success: true, points })
  } catch (error: any) {
    console.error("Claim bonus error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
