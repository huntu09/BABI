import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
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

    // Get profile with stats
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get user level
    const { data: userLevel } = await supabase.from("user_levels").select("*").eq("user_id", user.id).single()

    // Get completed tasks count
    const { count: completedTasks } = await supabase
      .from("user_tasks")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "completed")

    // Get referrals count
    const { count: referralsCount } = await supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", user.id)

    // Get badges count
    const { count: badgesCount } = await supabase
      .from("user_badges")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        level: userLevel?.current_level || 1,
        xp: userLevel?.current_xp || 0,
        totalXp: userLevel?.total_xp || 0,
        completedTasks: completedTasks || 0,
        referralsCount: referralsCount || 0,
        badgesCount: badgesCount || 0,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const updates = await request.json()
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Update profile
    const { data: profile, error: updateError } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      profile,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
