import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import crypto from "crypto"

// Initialize Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// Security logging
async function logSecurityEvent(event: string, details: any, severity: "low" | "medium" | "high" = "medium") {
  try {
    await supabase.from("security_logs").insert({
      event_type: "adgem_callback",
      event_name: event,
      details,
      severity,
      ip_address: details.ip_address,
      user_agent: details.user_agent,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to log security event:", error)
  }
}

// Rate limiting function
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 100 // Max 100 requests per minute per IP

  const current = rateLimitStore.get(ip)

  if (!current || now > current.resetTime) {
    rateLimitStore.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (current.count >= maxRequests) {
    return false
  }

  current.count++
  return true
}

// Validate AdGem signature - PRODUCTION VERSION
function validateAdGemSignature(data: any, signature: string): boolean {
  if (!process.env.ADGEM_SECRET_KEY) {
    console.error("ADGEM_SECRET_KEY not configured")
    return false
  }

  try {
    // AdGem signature format: MD5(user_id + offer_id + amount + status + secret_key)
    const signatureString = `${data.user_id}${data.offer_id}${data.amount}${data.status}${process.env.ADGEM_SECRET_KEY}`
    const expectedSignature = crypto.createHash("md5").update(signatureString).digest("hex")

    console.log("🔐 Signature validation:")
    console.log("Input string:", signatureString)
    console.log("Expected:", expectedSignature)
    console.log("Received:", signature)

    return signature.toLowerCase() === expectedSignature.toLowerCase()
  } catch (error) {
    console.error("Signature validation error:", error)
    return false
  }
}

// Check for duplicate transactions
async function isDuplicateTransaction(
  transactionId: string,
  userId: string,
  externalOfferId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("offerwall_completions")
      .select("id")
      .eq("transaction_id", transactionId)
      .eq("user_id", userId)
      .eq("provider", "adgem")
      .eq("external_offer_id", externalOfferId)
      .single()

    return !error && !!data
  } catch (error) {
    return false
  }
}

// Validate suspicious amounts
function validateAmount(amount: number): { valid: boolean; reason?: string } {
  if (amount <= 0) {
    return { valid: false, reason: "Amount must be positive" }
  }

  if (amount > 100) {
    // Suspicious if > $100
    return { valid: false, reason: "Amount too high - potential fraud" }
  }

  return { valid: true }
}

// Handle referral commission
async function handleReferralCommission(userId: string, amount: number): Promise<void> {
  try {
    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", userId).single()

    if (profile?.referred_by) {
      const commission = Number((amount * 0.1).toFixed(2)) // 10% commission

      // Update referrer balance
      const { data: referrer } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", profile.referred_by)
        .single()

      if (referrer) {
        const newBalance = Number(referrer.balance || 0) + commission

        await supabase
          .from("profiles")
          .update({
            balance: newBalance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", profile.referred_by)

        console.log(`💰 Referral commission: $${commission} credited to ${profile.referred_by}`)
      }
    }
  } catch (error) {
    console.error("Error handling referral commission:", error)
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse request body
    const body = await request.json()
    console.log("🔍 AdGem PRODUCTION callback received:", body)

    // Get request details
    const headersList = headers()
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"
    const userAgent = headersList.get("user-agent") || "unknown"

    // Rate limiting
    if (!checkRateLimit(ip)) {
      await logSecurityEvent("rate_limit_exceeded", { ip_address: ip, user_agent: userAgent }, "high")
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    // Validate required fields
    const requiredFields = ["user_id", "offer_id", "amount", "status", "signature"]
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      await logSecurityEvent(
        "missing_required_fields",
        {
          missing_fields: missingFields,
          body,
          ip_address: ip,
          user_agent: userAgent,
        },
        "medium",
      )

      return NextResponse.json(
        {
          error: "Missing required fields",
          missing: missingFields,
        },
        { status: 400 },
      )
    }

    // Validate signature - PRODUCTION (no bypass)
    if (!validateAdGemSignature(body, body.signature)) {
      await logSecurityEvent(
        "invalid_signature",
        {
          body,
          ip_address: ip,
          user_agent: userAgent,
        },
        "high",
      )

      return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }

    // Extract data
    const {
      user_id,
      offer_id,
      amount,
      status,
      transaction_id = `adgem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      campaign_id,
    } = body

    // Validate amount
    const rewardAmount = Number.parseFloat(amount)
    const amountValidation = validateAmount(rewardAmount)
    if (!amountValidation.valid) {
      await logSecurityEvent(
        "suspicious_amount",
        {
          amount: rewardAmount,
          reason: amountValidation.reason,
          user_id,
          offer_id,
          ip_address: ip,
          user_agent: userAgent,
        },
        "high",
      )

      return NextResponse.json({ error: amountValidation.reason }, { status: 400 })
    }

    // Check for duplicate transaction
    const externalOfferId = `adgem_${offer_id}`
    if (await isDuplicateTransaction(transaction_id, user_id, externalOfferId)) {
      await logSecurityEvent(
        "duplicate_transaction",
        {
          transaction_id,
          user_id,
          offer_id,
          ip_address: ip,
          user_agent: userAgent,
        },
        "medium",
      )

      return NextResponse.json({ error: "Duplicate transaction" }, { status: 409 })
    }

    // Verify user exists
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("id, username, balance, total_earned")
      .eq("id", user_id)
      .single()

    if (userError || !userProfile) {
      await logSecurityEvent(
        "invalid_user",
        {
          user_id,
          error: userError?.message,
          ip_address: ip,
          user_agent: userAgent,
        },
        "high",
      )

      return NextResponse.json({ error: "Invalid user" }, { status: 400 })
    }

    // Process based on status
    let completionStatus: "completed" | "rejected" | "pending" = "completed"

    if (status === "completed" || status === "1") {
      completionStatus = "completed"
    } else if (status === "rejected" || status === "0") {
      completionStatus = "rejected"
    } else {
      completionStatus = "pending"
    }

    // Store offer completion in offerwall_completions table
    const { error: completionError } = await supabase.from("offerwall_completions").insert({
      user_id,
      provider: "adgem",
      external_offer_id: externalOfferId,
      transaction_id,
      reward_amount: rewardAmount,
      status: completionStatus,
      ip_address: ip,
      user_agent: userAgent,
      completed_at: new Date().toISOString(),
      verified_at: completionStatus === "completed" ? new Date().toISOString() : null,
    })

    if (completionError) {
      console.error("Error storing completion:", completionError)
      await logSecurityEvent(
        "database_error",
        {
          error: completionError.message,
          user_id,
          offer_id,
          ip_address: ip,
          user_agent: userAgent,
        },
        "high",
      )

      return NextResponse.json({ error: "Database error" }, { status: 500 })
    }

    // Update user balance if completed
    if (completionStatus === "completed") {
      const currentBalance = Number(userProfile.balance || 0)
      const currentTotalEarned = Number(userProfile.total_earned || 0)

      // Apply 30% profit margin - user gets 70% of what provider pays
      const userReward = rewardAmount * 0.7 // User gets 70%, you keep 30%

      // Update balance with the reduced amount
      const newBalance = currentBalance + userReward
      const newTotalEarned = currentTotalEarned + userReward

      const { error: balanceError } = await supabase
        .from("profiles")
        .update({
          balance: newBalance,
          total_earned: newTotalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user_id)

      if (balanceError) {
        console.error("Error updating balance:", balanceError)
        return NextResponse.json({ error: "Failed to update balance" }, { status: 500 })
      }

      // Handle referral commission
      await handleReferralCommission(user_id, rewardAmount)

      // Log successful processing
      console.log(
        `🎉 AdGem: Credited $${userReward} to ${userProfile.username} (Original: $${rewardAmount}, Profit: $${rewardAmount - userReward})`,
      )
    }

    // Log successful processing
    await logSecurityEvent(
      "callback_processed",
      {
        user_id,
        username: userProfile.username,
        offer_id,
        amount: rewardAmount,
        status: completionStatus,
        transaction_id,
        processing_time_ms: Date.now() - startTime,
        ip_address: ip,
        user_agent: userAgent,
      },
      "low",
    )

    return NextResponse.json({
      success: true,
      message: "Callback processed successfully",
      transaction_id,
      amount_credited: completionStatus === "completed" ? rewardAmount : 0,
      status: completionStatus,
    })
  } catch (error) {
    console.error("AdGem callback error:", error)

    await logSecurityEvent(
      "callback_error",
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        processing_time_ms: Date.now() - startTime,
      },
      "high",
    )

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 },
    )
  }
}

// Handle GET requests (for testing)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: "AdGem callback endpoint is active",
    timestamp: new Date().toISOString(),
    provider: "adgem",
    environment: "production",
  })
}
