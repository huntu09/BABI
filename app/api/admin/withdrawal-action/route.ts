import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const { withdrawalId, action, adminNotes } = await request.json()

    if (!withdrawalId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const supabase = createServerComponentClient({ cookies })

    // Check if user is admin
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single()

    if (adminError || !adminProfile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get withdrawal details
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("*, profiles(email, balance)")
      .eq("id", withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal not found" }, { status: 404 })
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 })
    }

    console.log(`Processing ${action} for withdrawal:`, withdrawal)

    if (action === "approve") {
      // APPROVE: Just update status (balance already deducted)
      const { error: updateError } = await supabase
        .from("withdrawals")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId)

      if (updateError) {
        console.error("Approval error:", updateError)
        return NextResponse.json({ error: "Failed to approve withdrawal" }, { status: 500 })
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: withdrawal.user_id,
        type: "withdraw_completed",
        amount: -withdrawal.amount,
        description: `Withdrawal approved via ${withdrawal.method}${adminNotes ? ` - ${adminNotes}` : ""}`,
        reference_id: withdrawal.id,
        reference_type: "withdrawal",
      })

      console.log("✅ Withdrawal approved")

      return NextResponse.json({
        success: true,
        message: "Withdrawal approved successfully",
      })
    } else {
      // REJECT: Return balance to user
      const currentBalance = withdrawal.profiles.balance
      const refundAmount = withdrawal.amount
      const newBalance = currentBalance + refundAmount

      console.log(`Refunding $${refundAmount} to user. Balance: ${currentBalance} → ${newBalance}`)

      // Update withdrawal status
      const { error: updateError } = await supabase
        .from("withdrawals")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId)

      if (updateError) {
        console.error("Rejection update error:", updateError)
        return NextResponse.json({ error: "Failed to reject withdrawal" }, { status: 500 })
      }

      // Refund balance
      const { error: refundError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", withdrawal.user_id)

      if (refundError) {
        console.error("Refund error:", refundError)
        return NextResponse.json({ error: "Failed to refund balance" }, { status: 500 })
      }

      // Create transaction record
      await supabase.from("transactions").insert({
        user_id: withdrawal.user_id,
        type: "withdraw_refund",
        amount: refundAmount,
        description: `Withdrawal rejected - balance refunded${adminNotes ? ` - ${adminNotes}` : ""}`,
        reference_id: withdrawal.id,
        reference_type: "withdrawal",
      })

      console.log("✅ Withdrawal rejected and balance refunded")

      return NextResponse.json({
        success: true,
        message: "Withdrawal rejected and balance refunded",
      })
    }
  } catch (error) {
    console.error("Admin action error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
