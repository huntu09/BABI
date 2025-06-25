import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get fraud logs with user info
    const { data: fraudLogs, error } = await supabase
      .from("fraud_logs")
      .select(`
        *,
        profiles(email, username, status)
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) throw error

    return NextResponse.json({ fraudLogs })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { action, fraudId, userId, reason } = body

    switch (action) {
      case "mark_resolved":
        // Update fraud log as resolved
        const { error: updateError } = await supabase
          .from("fraud_logs")
          .update({
            details: {
              ...((await supabase.from("fraud_logs").select("details").eq("id", fraudId).single()).data?.details || {}),
              resolved: true,
              resolved_by: user.id,
              resolved_at: new Date().toISOString(),
              resolution_reason: reason,
            },
          })
          .eq("id", fraudId)

        if (updateError) throw updateError
        break

      case "ban_user":
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        // Ban user and zero balance
        const { error: banError } = await supabase
          .from("profiles")
          .update({
            status: "banned",
            balance: 0,
          })
          .eq("id", userId)

        if (banError) throw banError

        // Create transaction record for balance zeroing
        await supabase.from("transactions").insert({
          user_id: userId,
          type: "admin_adjustment",
          amount: 0,
          description: `Account banned due to fraud - balance zeroed. Reason: ${reason}`,
          reference_type: "admin_action",
        })

        // Update fraud log
        await supabase
          .from("fraud_logs")
          .update({
            details: {
              ...((await supabase.from("fraud_logs").select("details").eq("id", fraudId).single()).data?.details || {}),
              action_taken: "user_banned",
              banned_by: user.id,
              banned_at: new Date().toISOString(),
              ban_reason: reason,
            },
          })
          .eq("id", fraudId)
        break

      case "whitelist_user":
        if (!userId) {
          return NextResponse.json({ error: "User ID required" }, { status: 400 })
        }

        // Update user status to active and reset suspicious activity count
        const { error: whitelistError } = await supabase
          .from("profiles")
          .update({
            status: "active",
            suspicious_activity_count: 0,
          })
          .eq("id", userId)

        if (whitelistError) throw whitelistError

        // Update fraud log
        await supabase
          .from("fraud_logs")
          .update({
            details: {
              ...((await supabase.from("fraud_logs").select("details").eq("id", fraudId).single()).data?.details || {}),
              action_taken: "user_whitelisted",
              whitelisted_by: user.id,
              whitelisted_at: new Date().toISOString(),
              whitelist_reason: reason,
            },
          })
          .eq("id", fraudId)
        break

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: `fraud_${action}`,
      target_type: "fraud_log",
      target_id: fraudId,
      details: { action, userId, reason },
      reason,
    })

    return NextResponse.json({ message: `Fraud ${action.replace("_", " ")} completed successfully` })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
