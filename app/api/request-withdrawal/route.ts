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
    const { amount, method, accountDetails } = await request.json()

    // Convert amount to points (assuming $1 = 100 points)
    const pointsRequired = Math.floor(amount * 100)

    // Check minimum withdrawal
    if (pointsRequired < 200) {
      // $2.00 minimum
      return NextResponse.json({ error: "Minimum withdrawal is $2.00" }, { status: 400 })
    }

    // Check user balance
    const { data: profile } = await supabase.from("profiles").select("points").eq("id", session.user.id).single()

    if (!profile || profile.points < pointsRequired) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Validate method against database constraints
    const allowedMethods = ["dana", "gopay", "shopeepay", "ovo", "paypal", "bank_transfer", "crypto", "gift_card"]
    if (!allowedMethods.includes(method)) {
      return NextResponse.json({ error: `Invalid payment method: ${method}` }, { status: 400 })
    }

    // Create withdrawal request
    const { error: withdrawalError } = await supabase.from("withdrawals").insert({
      user_id: session.user.id,
      amount: pointsRequired / 100, // Convert points back to USD
      method,
      account_details: accountDetails, // Use the object directly
      status: "pending",
    })

    if (withdrawalError) throw withdrawalError

    // Deduct points from user
    const { error: pointsError } = await supabase
      .from("profiles")
      .update({ points: supabase.raw("points - ?", [pointsRequired]) })
      .eq("id", session.user.id)

    if (pointsError) throw pointsError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Withdrawal error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
