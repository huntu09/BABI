import { getSupabaseServerClient } from "@/lib/supabase-client"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const supabase = getSupabaseServerClient()
  const { searchParams } = new URL(request.url)
  const period = searchParams.get("period") || "alltime"
  const limit = Number.parseInt(searchParams.get("limit") || "50")

  try {
    let query = supabase
      .from("leaderboard_periods")
      .select(`
        *,
        profiles!inner(id, username, email, total_earned, points)
      `)
      .eq("period_type", period)
      .order("rank", { ascending: true })
      .limit(limit)

    if (period !== "alltime") {
      // Get the most recent period for weekly/monthly
      const { data: latestPeriod } = await supabase
        .from("leaderboard_periods")
        .select("period_start")
        .eq("period_type", period)
        .order("period_start", { ascending: false })
        .limit(1)
        .single()

      if (latestPeriod) {
        query = query.eq("period_start", latestPeriod.period_start)
      }
    }

    const { data, error } = await query

    if (error) throw error

    // Format the response
    const leaderboard =
      data?.map((entry) => ({
        rank: entry.rank,
        userId: entry.user_id,
        username: entry.profiles.username || entry.profiles.email.split("@")[0],
        points: period === "alltime" ? entry.profiles.total_earned : entry.points,
        tasksCompleted: entry.tasks_completed,
        period: entry.period_start,
      })) || []

    return NextResponse.json({ success: true, leaderboard })
  } catch (error: any) {
    console.error("Error fetching leaderboard:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
