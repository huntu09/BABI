import { adminQueries } from "@/lib/supabase-admin"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Verify admin user with regular client
    const supabase = createServerComponentClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Use admin client to get all data (bypasses RLS)
    const [usersResult, withdrawalsResult, transactionsResult] = await Promise.all([
      adminQueries.getAllUsers(),
      adminQueries.getAllWithdrawals(),
      adminQueries.getAllTransactions(),
    ])

    return NextResponse.json({
      users: usersResult.data || [],
      withdrawals: withdrawalsResult.data || [],
      transactions: transactionsResult.data || [],
      errors: {
        users: usersResult.error,
        withdrawals: withdrawalsResult.error,
        transactions: transactionsResult.error,
      },
    })
  } catch (error) {
    console.error("Admin data error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
