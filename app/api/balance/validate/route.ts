import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { transactionManager } from "@/lib/transaction-manager"

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

    // Validate user's balance consistency
    const validation = await transactionManager.validateUserBalance(user.id)

    // Get transaction statistics
    const stats = await transactionManager.getTransactionStats(user.id, 30)

    return NextResponse.json({
      success: true,
      validation,
      stats,
      recommendations: validation.is_consistent
        ? ["✅ Balance is consistent with transaction history"]
        : [
            "⚠️ Balance inconsistency detected",
            `Profile balance: $${validation.profile_balance.toFixed(2)}`,
            `Calculated balance: $${validation.calculated_balance.toFixed(2)}`,
            `Difference: $${validation.difference.toFixed(2)}`,
            "Contact support if this persists",
          ],
    })
  } catch (error) {
    console.error("Balance validation error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Admin endpoint to fix balance inconsistencies
export async function POST(request: Request) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const { targetUserId, action } = await request.json()

    if (!targetUserId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (action === "fix_balance") {
      // Calculate correct balance from transactions
      const calculatedBalance = await transactionManager.calculateUserBalance(targetUserId)

      // Update profile balance to match calculated balance
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ balance: calculatedBalance })
        .eq("id", targetUserId)

      if (updateError) {
        return NextResponse.json({ error: "Failed to fix balance" }, { status: 500 })
      }

      // Create audit transaction
      const transaction = await transactionManager.createTransaction({
        user_id: targetUserId,
        type: "balance_audit",
        amount: 0, // No actual money movement
        description: `Balance corrected by admin ${user.id} - Synchronized with transaction history`,
        reference_id: user.id,
        reference_type: "admin_action",
      })

      return NextResponse.json({
        success: true,
        message: "Balance corrected successfully",
        newBalance: calculatedBalance,
        transactionId: transaction?.id,
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Balance fix error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
