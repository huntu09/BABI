import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { badgeManager } from "@/lib/badge-manager"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Get user badges
    const userBadges = await badgeManager.getUserBadges(session.user.id)

    // Get all available badges
    const { data: allBadges, error } = await supabase
      .from("badges")
      .select("*")
      .eq("is_active", true)
      .order("requirement_value", { ascending: true })

    if (error) throw error

    return NextResponse.json({
      success: true,
      data: {
        userBadges,
        availableBadges: allBadges,
      },
    })
  } catch (error: any) {
    console.error("Error fetching badges:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Check and award new badges
    const newBadges = await badgeManager.checkAndAwardBadges(session.user.id)

    return NextResponse.json({
      success: true,
      data: {
        newBadges,
        count: newBadges.length,
      },
    })
  } catch (error: any) {
    console.error("Error checking badges:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
