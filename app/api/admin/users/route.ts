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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
