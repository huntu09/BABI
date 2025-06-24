import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const body = await request.json()
    console.log("Test callback body:", body)

    // Test direct database insert
    const { data, error } = await supabase
      .from("offer_completions")
      .insert({
        external_offer_id: "test_offer_123",
        user_id: body.user_id,
        provider_id: "cpx_research",
        transaction_id: "test_tx_" + Date.now(),
        points_earned: 25,
        payout_usd: 0.25,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .select()

    if (error) {
      console.error("Database insert error:", error)
      return NextResponse.json({
        success: false,
        error: "Database error",
        details: error,
      })
    }

    console.log("Insert success:", data)

    // Test balance update
    const { error: balanceError } = await supabase
      .from("profiles")
      .update({
        balance: supabase.raw("balance + ?", [0.25]),
        total_earned: supabase.raw("total_earned + ?", [0.25]),
      })
      .eq("id", body.user_id)

    if (balanceError) {
      console.error("Balance update error:", balanceError)
      return NextResponse.json({
        success: false,
        error: "Balance update failed",
        details: balanceError,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Test callback successful",
      data: data,
    })
  } catch (error: any) {
    console.error("Test callback error:", error)
    console.error("Error type:", typeof error)
    console.error("Error keys:", Object.keys(error))

    return NextResponse.json({
      success: false,
      error: error?.message || "Unknown error",
      errorType: typeof error,
      errorKeys: Object.keys(error || {}),
    })
  }
}
