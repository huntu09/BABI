import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Force dynamic rendering
export const dynamic = "force-dynamic"

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

    const { data: withdrawals, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Fetch withdrawals error:", error)
      return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      withdrawals: withdrawals || [],
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("💰 Withdrawal request:", body)

    const { amount, method, accountDetails } = body

    if (!amount || !method || !accountDetails) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Validate amount
    const amountInUSD = Number(amount)
    if (isNaN(amountInUSD) || amountInUSD <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Normalize method name to lowercase
    const normalizedMethod = method.toLowerCase()

    // Validate method
    const allowedMethods = ["dana", "gopay", "shopeepay", "ovo"]
    if (!allowedMethods.includes(normalizedMethod)) {
      return NextResponse.json({ error: `Invalid payment method: ${method}` }, { status: 400 })
    }

    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error("Auth error:", userError)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("👤 User ID:", user.id)

    // Get user profile to check balance (remove is_banned check for now)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    console.log("💵 Current balance:", profile.balance)

    // Check minimum withdrawal
    if (amountInUSD < 2.0) {
      return NextResponse.json({ error: "Minimum withdrawal is $2.00" }, { status: 400 })
    }

    // Check sufficient balance
    if (profile.balance < amountInUSD) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Current: $${profile.balance.toFixed(2)}, Requested: $${amountInUSD.toFixed(2)}`,
        },
        { status: 400 },
      )
    }

    // STEP 1: Deduct balance IMMEDIATELY (before creating withdrawal)
    const newBalance = Number((profile.balance - amountInUSD).toFixed(2))
    console.log("📉 Deducting balance from", profile.balance, "to", newBalance)

    const { error: balanceError } = await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

    if (balanceError) {
      console.error("❌ Balance deduction error:", balanceError)
      return NextResponse.json({ error: "Failed to deduct balance" }, { status: 500 })
    }

    console.log("✅ Balance deducted successfully")

    // STEP 2: Create withdrawal request
    const withdrawalData = {
      user_id: user.id,
      amount: amountInUSD,
      method: normalizedMethod,
      account_details: accountDetails,
      status: "pending",
    }

    console.log("📝 Creating withdrawal:", withdrawalData)

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert(withdrawalData)
      .select()
      .single()

    if (withdrawalError) {
      console.error("❌ Withdrawal creation error:", withdrawalError)

      // ROLLBACK: Return balance if withdrawal creation fails
      await supabase.from("profiles").update({ balance: profile.balance }).eq("id", user.id)

      return NextResponse.json(
        {
          error: `Failed to create withdrawal request: ${withdrawalError.message}`,
        },
        { status: 500 },
      )
    }

    console.log("✅ Withdrawal created:", withdrawal.id)

    // STEP 3: Create transaction record
    try {
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdraw_pending",
        amount: -amountInUSD,
        description: `Withdrawal request via ${normalizedMethod} (Pending approval)`,
        reference_id: withdrawal.id,
        reference_type: "withdrawal",
      })
      console.log("✅ Transaction logged")
    } catch (transactionError) {
      console.log("⚠️ Transaction record creation failed:", transactionError)
    }

    return NextResponse.json({
      success: true,
      withdrawal,
      newBalance,
      message: `Withdrawal request submitted! $${amountInUSD.toFixed(2)} has been deducted from your balance. Awaiting admin approval.`,
    })
  } catch (error) {
    console.error("❌ API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
