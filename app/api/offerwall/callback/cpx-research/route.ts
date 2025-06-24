import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// Hash validation for security - PREVENTS FAKE CALLBACKS! 🔐
function validateHash(params: any, secretKey: string): boolean {
  const { hash, ...otherParams } = params

  // Create sorted parameter string (CPX Research format)
  const sortedParams = Object.keys(otherParams)
    .filter((key) => otherParams[key] !== null && otherParams[key] !== undefined)
    .sort()
    .map((key) => `${key}=${otherParams[key]}`)
    .join("&")

  const expectedHash = crypto
    .createHash("md5")
    .update(sortedParams + secretKey)
    .digest("hex")

  console.log(`🔐 Hash validation: ${hash === expectedHash ? "VALID" : "INVALID"}`)
  return hash === expectedHash
}

// Rate limiting check (simple in-memory)
const callbackAttempts = new Map<string, { count: number; lastAttempt: number }>()

function checkRateLimit(userId: string, maxAttempts = 10, windowMs = 60000): boolean {
  const now = Date.now()
  const userAttempts = callbackAttempts.get(userId)

  if (!userAttempts || now - userAttempts.lastAttempt > windowMs) {
    callbackAttempts.set(userId, { count: 1, lastAttempt: now })
    return true
  }

  if (userAttempts.count >= maxAttempts) {
    console.log(`🚨 Rate limit exceeded for user: ${userId}`)
    return false
  }

  userAttempts.count++
  userAttempts.lastAttempt = now
  return true
}

export async function GET(request: NextRequest) {
  try {
    console.log("🎯 CPX Research callback received!")

    // Get client IP for security logging
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"

    // Parse callback data from URL parameters
    const searchParams = request.nextUrl.searchParams
    const callbackData = {
      status: searchParams.get("status"),
      trans_id: searchParams.get("trans_id"),
      user_id: searchParams.get("user_id"),
      amount_usd: searchParams.get("amount_usd"),
      offer_id: searchParams.get("offer_id"),
      hash: searchParams.get("hash"),
      ip_click: searchParams.get("ip_click"),
      sub_id: searchParams.get("sub_id"),
      sub_id_2: searchParams.get("sub_id_2"),
      amount_local: searchParams.get("amount_local"),
    }

    console.log("📋 Callback data:", {
      ...callbackData,
      hash: callbackData.hash ? "***HIDDEN***" : null,
      client_ip: clientIP,
    })

    // SECURITY CHECK #1: Validate required fields
    if (!callbackData.user_id || !callbackData.status || !callbackData.hash) {
      console.log("❌ Missing required fields")
      return new NextResponse("0", { status: 400 })
    }

    // SECURITY CHECK #2: Rate limiting
    if (!checkRateLimit(callbackData.user_id)) {
      console.log("❌ Rate limit exceeded")
      return new NextResponse("0", { status: 429 })
    }

    // SECURITY CHECK #3: Hash validation (CRITICAL!)
    if (!process.env.CPX_RESEARCH_SECRET_KEY) {
      console.log("⚠️ WARNING: CPX_RESEARCH_SECRET_KEY not set - skipping hash validation")
    } else {
      if (!validateHash(callbackData, process.env.CPX_RESEARCH_SECRET_KEY)) {
        console.log("❌ SECURITY ALERT: Invalid hash signature!")
        console.log(`🚨 Potential hack attempt from IP: ${clientIP}`)

        // Log security incident
        await logSecurityIncident({
          type: "invalid_hash",
          ip: clientIP,
          user_id: callbackData.user_id,
          data: callbackData,
        })

        return new NextResponse("0", { status: 401 })
      }
      console.log("✅ Hash validation passed - callback is authentic")
    }

    // Handle different status codes
    const status = callbackData.status
    console.log(`📊 Processing status: ${status}`)

    if (status === "1") {
      // Status 1 = Completed - Credit user
      return await handleCompletedSurvey(callbackData, clientIP)
    } else if (status === "2") {
      // Status 2 = Cancelled/Reversed - Debit user (if previously credited)
      return await handleCancelledSurvey(callbackData, clientIP)
    } else {
      // Other statuses - just log and return success
      console.log(`ℹ️ Unhandled status: ${status} - returning success`)
      return new NextResponse("1", { status: 200 })
    }
  } catch (error) {
    console.log("❌ Callback error:", error)
    return new NextResponse("0", { status: 500 })
  }
}

async function handleCompletedSurvey(callbackData: any, clientIP: string) {
  // Validate amount
  if (!callbackData.amount_usd) {
    console.log("❌ Missing amount_usd")
    return new NextResponse("0", { status: 400 })
  }

  const rewardAmount = Number.parseFloat(callbackData.amount_usd)

  // Skip if amount is 0 or negative
  if (rewardAmount <= 0) {
    console.log(`ℹ️ Skipping zero/negative amount: $${rewardAmount}`)
    return new NextResponse("1", { status: 200 })
  }

  // Security: Check for suspicious amounts
  if (rewardAmount > 100) {
    console.log(`🚨 SUSPICIOUS: Large amount $${rewardAmount} - logging for review`)
    await logSecurityIncident({
      type: "suspicious_amount",
      ip: clientIP,
      user_id: callbackData.user_id,
      amount: rewardAmount,
      data: callbackData,
    })
  }

  console.log(`💰 Processing completion: $${rewardAmount} for user ${callbackData.user_id}`)

  // Find user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, email, balance, total_earned")
    .eq("id", callbackData.user_id)
    .single()

  if (profileError || !profile) {
    console.log("❌ User not found:", callbackData.user_id)
    return new NextResponse("0", { status: 404 })
  }

  // Check if transaction already exists (prevent duplicates)
  const { data: existingTransaction } = await supabase
    .from("transactions")
    .select("id")
    .eq("reference_id", `cpx_${callbackData.trans_id}`)
    .single()

  if (existingTransaction) {
    console.log(`ℹ️ Transaction already processed: cpx_${callbackData.trans_id}`)
    return new NextResponse("1", { status: 200 })
  }

  // Update balance
  const currentBalance = Number.parseFloat(profile.balance?.toString() || "0")
  const currentTotalEarned = Number.parseFloat(profile.total_earned?.toString() || "0")
  const newBalance = currentBalance + rewardAmount
  const newTotalEarned = currentTotalEarned + rewardAmount

  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      balance: newBalance,
      total_earned: newTotalEarned,
      updated_at: new Date().toISOString(),
    })
    .eq("id", profile.id)

  if (updateError) {
    console.log("❌ Balance update error:", updateError)
    return new NextResponse("0", { status: 500 })
  }

  // Create transaction record with enhanced metadata
  const { error: transactionError } = await supabase.from("transactions").insert({
    user_id: profile.id,
    type: "offerwall_completion",
    amount: rewardAmount,
    description: `CPX Research Survey - Offer ${callbackData.offer_id || "Unknown"}`,
    reference_id: `cpx_${callbackData.trans_id}`,
    metadata: {
      provider: "cpx_research",
      offer_id: callbackData.offer_id,
      ip_address: callbackData.ip_click,
      client_ip: clientIP,
      original_amount: callbackData.amount_usd,
      local_amount: callbackData.amount_local,
      sub_id: callbackData.sub_id,
      sub_id_2: callbackData.sub_id_2,
      hash_validated: !!process.env.CPX_RESEARCH_SECRET_KEY,
      timestamp: new Date().toISOString(),
    },
    created_at: new Date().toISOString(),
  })

  if (transactionError) {
    console.log("❌ Transaction error:", transactionError)
    // Don't fail callback if transaction logging fails
  } else {
    console.log("✅ Transaction recorded successfully")
  }

  console.log(`🎉 Completed! Credited $${rewardAmount} to ${profile.username}`)
  return new NextResponse("1", { status: 200 })
}

async function handleCancelledSurvey(callbackData: any, clientIP: string) {
  console.log(`🔄 Processing cancellation for user ${callbackData.user_id}`)

  // Find user
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, email, balance, total_earned")
    .eq("id", callbackData.user_id)
    .single()

  if (profileError || !profile) {
    console.log("❌ User not found:", callbackData.user_id)
    return new NextResponse("0", { status: 404 })
  }

  // Check if we previously credited this transaction
  const { data: existingTransaction } = await supabase
    .from("transactions")
    .select("id, amount")
    .eq("reference_id", `cpx_${callbackData.trans_id}`)
    .eq("type", "offerwall_completion")
    .single()

  if (existingTransaction) {
    const rewardAmount = existingTransaction.amount

    // Debit the amount back
    const currentBalance = Number.parseFloat(profile.balance?.toString() || "0")
    const currentTotalEarned = Number.parseFloat(profile.total_earned?.toString() || "0")
    const newBalance = Math.max(0, currentBalance - rewardAmount) // Don't go negative
    const newTotalEarned = Math.max(0, currentTotalEarned - rewardAmount)

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id)

    if (updateError) {
      console.log("❌ Balance update error:", updateError)
      return new NextResponse("0", { status: 500 })
    }

    // Create reversal transaction with enhanced metadata
    const { error: transactionError } = await supabase.from("transactions").insert({
      user_id: profile.id,
      type: "offerwall_reversal",
      amount: -rewardAmount, // Negative amount
      description: `CPX Research Survey Cancelled - Offer ${callbackData.offer_id || "Unknown"}`,
      reference_id: `cpx_${callbackData.trans_id}_reversal`,
      metadata: {
        provider: "cpx_research",
        original_transaction: `cpx_${callbackData.trans_id}`,
        reason: "survey_cancelled",
        client_ip: clientIP,
        hash_validated: !!process.env.CPX_RESEARCH_SECRET_KEY,
        timestamp: new Date().toISOString(),
      },
      created_at: new Date().toISOString(),
    })

    if (transactionError) {
      console.log("❌ Reversal transaction error:", transactionError)
    } else {
      console.log("✅ Reversal transaction recorded")
    }

    console.log(`🔄 Cancelled! Debited $${rewardAmount} from ${profile.username}`)
  } else {
    console.log("ℹ️ No previous transaction found to reverse - this is normal for cancelled surveys")
  }

  return new NextResponse("1", { status: 200 })
}

// Security incident logging
async function logSecurityIncident(incident: any) {
  try {
    await supabase.from("security_logs").insert({
      type: incident.type,
      ip_address: incident.ip,
      user_id: incident.user_id,
      details: incident,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.log("❌ Failed to log security incident:", error)
  }
}
