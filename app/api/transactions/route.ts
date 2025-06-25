import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { transactionManager } from "@/lib/transaction-manager"
import type { TransactionType } from "@/types"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const type = searchParams.get("type") as TransactionType | null
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")

    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Use provided userId or current user's ID
    const targetUserId = userId || user.id

    // If requesting another user's transactions, check admin permission
    if (targetUserId !== user.id) {
      const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

      if (!profile?.is_admin) {
        return NextResponse.json({ error: "Admin access required" }, { status: 403 })
      }
    }

    // Fetch transactions using transaction manager
    const transactions = await transactionManager.getUserTransactions(targetUserId, {
      type: type || undefined,
      limit,
      offset,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })

    // Get transaction statistics
    const stats = await transactionManager.getTransactionStats(targetUserId, 30)

    return NextResponse.json({
      success: true,
      transactions,
      stats,
      pagination: {
        limit,
        offset,
        hasMore: transactions.length === limit,
      },
    })
  } catch (error) {
    console.error("Transactions API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
