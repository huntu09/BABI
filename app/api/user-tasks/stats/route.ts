import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Mark as dynamic to allow cookies usage
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: stats, error: statsError } = await supabase.rpc("get_user_task_stats", {
      p_user_id: user.id,
    })

    if (statsError) {
      console.error("Error getting user task stats:", statsError)
      return NextResponse.json({ error: "Failed to get task statistics" }, { status: 500 })
    }

    const userStats = stats?.[0] || {
      total_completed: 0,
      total_earned: 0,
      today_completed: 0,
      today_earned: 0,
      this_week_completed: 0,
      this_week_earned: 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        totalCompleted: Number(userStats.total_completed),
        totalEarned: Number(userStats.total_earned),
        todayCompleted: Number(userStats.today_completed),
        todayEarned: Number(userStats.today_earned),
        thisWeekCompleted: Number(userStats.this_week_completed),
        thisWeekEarned: Number(userStats.this_week_earned),
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
