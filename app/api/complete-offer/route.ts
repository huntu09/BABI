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
    const { offerId, points, title } = await request.json()

    // Check if user already completed this task
    const { data: existingTask } = await supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("task_id", offerId)
      .single()

    if (existingTask) {
      return NextResponse.json({ error: "Task already completed" }, { status: 400 })
    }

    // Record task completion
    const { error: taskError } = await supabase.from("user_tasks").insert({
      user_id: session.user.id,
      task_id: offerId,
      points_earned: points,
      status: "completed",
    })

    if (taskError) throw taskError

    // Update user points and total earned
    const { error: pointsError } = await supabase
      .from("profiles")
      .update({
        points: supabase.raw("points + ?", [points]),
        total_earned: supabase.raw("total_earned + ?", [points]),
      })
      .eq("id", session.user.id)

    if (pointsError) throw pointsError

    // Handle referral commission (10%)
    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", session.user.id).single()

    if (profile?.referred_by) {
      const commission = Math.floor(points * 0.1) // 10% commission

      // Add commission to referrer
      await supabase
        .from("profiles")
        .update({
          points: supabase.raw("points + ?", [commission]),
          total_earned: supabase.raw("total_earned + ?", [commission]),
        })
        .eq("id", profile.referred_by)

      // Update referral record
      await supabase
        .from("referrals")
        .update({
          commission_earned: supabase.raw("commission_earned + ?", [commission]),
        })
        .eq("referrer_id", profile.referred_by)
        .eq("referred_id", session.user.id)
    }

    return NextResponse.json({ success: true, points })
  } catch (error: any) {
    console.error("Complete offer error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
