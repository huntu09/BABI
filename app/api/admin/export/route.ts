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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const format = searchParams.get("format") || "json"

    let data: any[] = []
    let filename = ""

    switch (type) {
      case "users":
        const { data: users, error: usersError } = await supabase
          .from("profiles")
          .select("id, email, username, full_name, balance, total_earned, status, created_at, last_login")
          .order("created_at", { ascending: false })

        if (usersError) throw usersError
        data = users || []
        filename = `users_export_${new Date().toISOString().split("T")[0]}`
        break

      case "withdrawals":
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from("withdrawals")
          .select(`
            id, user_id, amount, method, status, created_at, processed_at,
            profiles!inner(email, username)
          `)
          .order("created_at", { ascending: false })

        if (withdrawalsError) throw withdrawalsError
        data = withdrawals || []
        filename = `withdrawals_export_${new Date().toISOString().split("T")[0]}`
        break

      case "transactions":
        const { data: transactions, error: transactionsError } = await supabase
          .from("transactions")
          .select(`
            id, user_id, type, amount, description, created_at,
            profiles!inner(email, username)
          `)
          .order("created_at", { ascending: false })
          .limit(10000) // Limit for performance

        if (transactionsError) throw transactionsError
        data = transactions || []
        filename = `transactions_export_${new Date().toISOString().split("T")[0]}`
        break

      case "tasks":
        const { data: tasks, error: tasksError } = await supabase
          .from("tasks")
          .select("id, title, description, reward_amount, task_type, provider, is_active, completion_count, created_at")
          .order("created_at", { ascending: false })

        if (tasksError) throw tasksError
        data = tasks || []
        filename = `tasks_export_${new Date().toISOString().split("T")[0]}`
        break

      case "badges":
        const { data: badges, error: badgesError } = await supabase
          .from("badges")
          .select(`
            id, name, description, requirement_type, requirement_value, reward_amount, is_active, created_at
          `)
          .order("created_at", { ascending: false })

        if (badgesError) throw badgesError
        data = badges || []
        filename = `badges_export_${new Date().toISOString().split("T")[0]}`
        break

      case "fraud_logs":
        const { data: fraudLogs, error: fraudError } = await supabase
          .from("fraud_logs")
          .select(`
            id, user_id, event_type, risk_level, confidence_score, ip_address, created_at,
            profiles(email, username)
          `)
          .order("created_at", { ascending: false })
          .limit(5000) // Limit for performance

        if (fraudError) throw fraudError
        data = fraudLogs || []
        filename = `fraud_logs_export_${new Date().toISOString().split("T")[0]}`
        break

      default:
        return NextResponse.json({ error: "Invalid export type" }, { status: 400 })
    }

    if (format === "csv") {
      // Convert to CSV
      if (data.length === 0) {
        return NextResponse.json({ error: "No data to export" }, { status: 400 })
      }

      const headers = Object.keys(data[0]).join(",")
      const rows = data.map((row) =>
        Object.values(row)
          .map((value) => (typeof value === "string" && value.includes(",") ? `"${value}"` : value))
          .join(","),
      )
      const csv = [headers, ...rows].join("\n")

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "data_export",
        target_type: type,
        details: { format, record_count: data.length },
      })

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${filename}.csv"`,
        },
      })
    }

    // Return JSON
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "data_export",
      target_type: type,
      details: { format, record_count: data.length },
    })

    return NextResponse.json({
      data,
      filename: `${filename}.json`,
      count: data.length,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
