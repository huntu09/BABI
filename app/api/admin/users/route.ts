import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function PUT(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", session.user.id).single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 })
  }

  try {
    const { userId, action } = await request.json()

    const updates: any = {}

    if (action === "ban") updates.is_banned = true
    if (action === "unban") updates.is_banned = false
    if (action === "verify") updates.is_verified = true

    const { error } = await supabase.from("profiles").update(updates).eq("id", userId)

    if (error) throw error

    // Log admin action with proper admin_id (NOT NULL constraint)
    await supabase.from("admin_actions").insert({
      admin_id: session.user.id, // ✅ FIX: Always provide admin_id (NOT NULL)
      action_type: action,
      target_type: "user", // ✅ ADD: Required target_type field
      target_id: userId,
      details: { action, previous_status: profile },
      reason: `Admin ${action} action on user`,
      ip_address: request.headers.get("x-forwarded-for"),
      user_agent: request.headers.get("user-agent"),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
