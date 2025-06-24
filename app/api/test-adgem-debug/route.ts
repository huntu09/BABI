import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  const testUserId = "test_user_123"
  const transactionId = `test_${Date.now()}`

  try {
    console.log("🔍 Starting AdGem debug test...")

    // Step 1: Check if user exists
    console.log("📝 Step 1: Checking user exists...")
    const { data: userCheck, error: userCheckError } = await supabase
      .from("profiles")
      .select("id, username, balance_points")
      .eq("id", testUserId)
      .single()

    if (userCheckError) {
      console.log("❌ User check error:", userCheckError)

      // Try to create user
      console.log("🔧 Creating test user...")
      const { error: createUserError } = await supabase.from("profiles").insert({
        id: testUserId,
        username: "Test User",
        email: "test@example.com",
        balance_usd: 0,
        balance_points: 0,
      })

      if (createUserError) {
        return NextResponse.json({
          success: false,
          error: "Failed to create test user",
          details: createUserError,
        })
      }
    }

    console.log("✅ User exists:", userCheck)

    // Step 2: Check table structure
    console.log("📝 Step 2: Checking table structure...")
    const { data: tableInfo, error: tableError } = await supabase
      .from("information_schema.columns")
      .select("column_name, data_type, is_nullable")
      .eq("table_name", "offer_completions")

    console.log("📊 Table structure:", tableInfo)

    // Step 3: Try to insert completion
    console.log("📝 Step 3: Inserting completion...")
    const completionData = {
      external_offer_id: "adgem_12345",
      user_id: testUserId,
      provider_id: "adgem",
      transaction_id: transactionId,
      points_earned: 150,
      payout_usd: 1.5,
      status: "completed",
      completed_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
      ip_address: "127.0.0.1",
      user_agent: "Test-Agent/1.0",
      campaign_id: "test_campaign",
    }

    console.log("📤 Inserting data:", completionData)

    const { data: insertResult, error: insertError } = await supabase
      .from("offer_completions")
      .insert(completionData)
      .select()

    if (insertError) {
      console.log("❌ Insert error:", insertError)
      return NextResponse.json({
        success: false,
        error: "Failed to insert completion",
        details: insertError,
        user_exists: !!userCheck,
        table_structure: tableInfo,
        attempted_data: completionData,
      })
    }

    console.log("✅ Insert successful:", insertResult)

    // Step 4: Credit points
    console.log("📝 Step 4: Crediting points...")
    const { error: creditError } = await supabase.rpc("credit_user_points", {
      p_user_id: testUserId,
      p_points: 150,
    })

    if (creditError) {
      console.log("❌ Credit error:", creditError)
      return NextResponse.json({
        success: false,
        error: "Failed to credit points",
        details: creditError,
        completion_inserted: true,
      })
    }

    // Step 5: Insert transaction log
    console.log("📝 Step 5: Logging transaction...")
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: testUserId,
      type: "offer_completion",
      amount: 150,
      description: "AdGem test offer completion",
      reference_id: transactionId,
      status: "completed",
    })

    if (transactionError) {
      console.log("⚠️ Transaction log error:", transactionError)
    }

    // Step 6: Get final user balance
    const { data: finalUser } = await supabase.from("profiles").select("balance_points").eq("id", testUserId).single()

    return NextResponse.json({
      success: true,
      message: "AdGem test completed successfully!",
      results: {
        user_created: !userCheck,
        completion_inserted: true,
        points_credited: true,
        transaction_logged: !transactionError,
        final_balance: finalUser?.balance_points || 0,
        transaction_id: transactionId,
      },
      debug_info: {
        user_check: userCheck,
        table_structure: tableInfo,
        completion_data: insertResult,
      },
    })
  } catch (error) {
    console.error("🚨 Debug test error:", error)
    return NextResponse.json({
      success: false,
      error: "Debug test failed",
      details: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
