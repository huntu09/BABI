import { getSupabaseServerClient } from "@/lib/supabase-client"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Call the check_and_award_badges function
    const { data, error } = await supabase.rpc("check_and_award_badges", {
      p_user_id: session.user.id,
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      badgesAwarded: data,
      message: data > 0 ? `${data} new badges unlocked!` : "No new badges unlocked",
    })
  } catch (error: any) {
    console.error("Error checking badges:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
