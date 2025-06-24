import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET() {
  // Generate valid UUID for test user
  const testUserId = "550e8400-e29b-41d4-a716-446655440000" // Valid UUID format
  const transactionId = `adgem_test_${Date.now()}`
  const rewardAmount = 1.5

  try {
    console.log("🔍 Starting AdGem test with correct structure...")

    // Step 1: Check if test user exists
    console.log("📝 Step 1: Checking test user...")
    const { data: userCheck, error: userCheckError } = await supabase
      .from("profiles")
      .select("id, username, balance, total_earned")
      .eq("id", testUserId)
      .single()

    if (userCheckError && userCheckError.code === "PGRST116") {
      console.log("🔧 Test user not found, creating...")

      const { error: createUserError } = await supabase.from("profiles").insert({
        id: testUserId,
        email: "test-adgem@example.com",
        username: "TestUserAdGem",
        full_name: "AdGem Test User",
        balance: 0.0,
        total_earned: 0.0,
        referral_code: `ADGEM${Date.now()}`,
        email_verified: true,
        status: "active",
      })

      if (createUserError) {
        return NextResponse.json({
          success: false,
          error: "Failed to create test user",
          details: createUserError,
          step: "user_creation",
          note: "Check if auth.users record exists or RLS policies",
        })
      }

      console.log("✅ Test user created successfully")
    } else if (userCheckError) {
      return NextResponse.json({
        success: false,
        error: "Error checking user",
        details: userCheckError,
        step: "user_check",
      })
    } else {
      console.log("✅ Test user exists:", userCheck.username)
    }

    // Step 2: Get current balance
    const { data: currentUser } = await supabase
      .from("profiles")
      .select("balance, total_earned, username")
      .eq("id", testUserId)
      .single()

    const currentBalance = Number(currentUser?.balance || 0)
    const currentTotalEarned = Number(currentUser?.total_earned || 0)

    console.log("💰 Current balance:", currentBalance)
    console.log("📊 Current total earned:", currentTotalEarned)

    // Step 3: Insert into offerwall_completions (with correct columns)
    console.log("📝 Step 3: Inserting completion record...")
    const completionData = {
      user_id: testUserId,
      provider: "adgem", // Must match constraint check
      external_offer_id: "adgem_12345",
      transaction_id: transactionId,
      reward_amount: rewardAmount, // Correct column name
      status: "completed", // Must match constraint check
      ip_address: "127.0.0.1",
      user_agent: "AdGem-Test/1.0",
      completed_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
    }

    const { data: completionResult, error: completionError } = await supabase
      .from("offerwall_completions")
      .insert(completionData)
      .select()

    if (completionError) {
      console.log("❌ Completion insert error:", completionError)
      return NextResponse.json({
        success: false,
        error: "Failed to insert completion",
        details: completionError,
        attempted_data: completionData,
        step: "completion_insert",
      })
    }

    console.log("✅ Completion record inserted:", completionResult)

    // Step 4: Update user balance
    console.log("📝 Step 4: Updating user balance...")
    const newBalance = currentBalance + rewardAmount
    const newTotalEarned = currentTotalEarned + rewardAmount

    const { error: balanceError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", testUserId)

    if (balanceError) {
      return NextResponse.json({
        success: false,
        error: "Failed to update balance",
        details: balanceError,
        step: "balance_update",
      })
    }

    console.log("✅ Balance updated:", newBalance)

    // Get final results
    const { data: finalUser } = await supabase
      .from("profiles")
      .select("balance, total_earned, username, email")
      .eq("id", testUserId)
      .single()

    // Get completion record to verify
    const { data: completionRecord } = await supabase
      .from("offerwall_completions")
      .select("*")
      .eq("transaction_id", transactionId)
      .single()

    return NextResponse.json({
      success: true,
      message: "🎉 AdGem test completed successfully!",
      test_results: {
        user_info: {
          user_id: testUserId,
          username: finalUser?.username,
          email: finalUser?.email,
        },
        balance_changes: {
          previous_balance: currentBalance,
          amount_credited: rewardAmount,
          new_balance: Number(finalUser?.balance || 0),
          total_earned: Number(finalUser?.total_earned || 0),
        },
        completion_record: {
          id: completionRecord?.id,
          provider: completionRecord?.provider,
          external_offer_id: completionRecord?.external_offer_id,
          transaction_id: completionRecord?.transaction_id,
          reward_amount: Number(completionRecord?.reward_amount || 0),
          status: completionRecord?.status,
          completed_at: completionRecord?.completed_at,
        },
      },
      steps_completed: [
        "✅ User verified/created",
        "✅ Completion record inserted to offerwall_completions",
        "✅ Balance updated in profiles",
        "✅ Test completed successfully",
      ],
      database_info: {
        tables_used: ["profiles", "offerwall_completions"],
        note: "No transactions table found - skipped transaction logging",
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("🚨 AdGem test error:", error)
    return NextResponse.json({
      success: false,
      error: "AdGem test failed",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })
  }
}
