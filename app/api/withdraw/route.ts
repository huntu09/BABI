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
    const { amount, method, walletAddress } = await request.json()

    // Check minimum withdrawal
    if (amount < 1000) {
      return NextResponse.json({ error: "Minimum withdrawal is 1000 points" }, { status: 400 })
    }

    // Check user balance
    const { data: profile } = await supabase.from("profiles").select("points").eq("id", session.user.id).single()

    if (!profile || profile.points < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Create withdrawal request
    const { error: withdrawalError } = await supabase.from("withdrawals").insert({
      user_id: session.user.id,
      amount,
      method,
      wallet_address: walletAddress,
      status: "pending",
    })

    if (withdrawalError) throw withdrawalError

    // Deduct points from user
    const { error: pointsError } = await supabase
      .from("profiles")
      .update({ points: supabase.raw("points - ?", [amount]) })
      .eq("id", session.user.id)

    if (pointsError) throw pointsError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
