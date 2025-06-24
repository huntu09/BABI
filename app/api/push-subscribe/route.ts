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
    const { subscription, userId, settings } = await request.json()

    // Store push subscription in database
    const { error } = await supabase.from("push_subscriptions").upsert({
      user_id: userId,
      subscription: JSON.stringify(subscription),
      settings: JSON.stringify(settings),
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Push subscription error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
