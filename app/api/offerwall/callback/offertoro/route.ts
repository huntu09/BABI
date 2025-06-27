import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { offerwallManager } from "@/lib/offerwall-manager"
import crypto from "crypto"

// Add CORS headers
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }
}

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders(),
  })
}

// Rate limiting store (should be Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(ip: string): boolean {
  const maxRequests = 50 // Max 50 requests per minute per IP
  const windowMs = 60 * 1000 // 1 minute
  const now = Date.now()

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

function validateOfferToroSignature(data: any): boolean {
  const secretKey = process.env.OFFERTORO_SECRET_KEY
  if (!secretKey) {
    console.error("❌ OFFERTORO_SECRET_KEY not configured")
    return false
  }

  const signatureString = `${data.oid}${data.uid}${data.amount}${secretKey}`
  const expectedSignature = crypto.createHash("sha1").update(signatureString).digest("hex")

  console.log("[OfferToro] Signature validation:", {
    received: data.sig,
    expected: expectedSignature,
    signatureString: signatureString.replace(secretKey, "***SECRET***"),
  })

  return data.sig === expectedSignature
}

async function logSecurityEvent(
  supabase: any,
  event: string,
  details: any,
  severity: "low" | "medium" | "high" = "medium",
) {
  try {
    await supabase.from("security_logs").insert({
      event_type: event,
      provider: "offertoro",
      details,
      severity,
      created_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to log security event:", error)
  }
}

async function isDuplicateTransaction(
  supabase: any,
  transactionId: string,
  userId: string,
  offerId: string,
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("transactions")
      .select("id")
      .eq("reference_id", transactionId)
      .eq("user_id", userId)
      .single()

    if (error && error.code !== "PGRST116") {
      console.error("Error checking duplicate transaction:", error)
      return false
    }

    return !!data
  } catch (error) {
    console.error("Exception checking duplicate transaction:", error)
    return false
  }
}

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  try {
    console.log("[OfferToro] POST Callback started")

    // Rate limiting
    if (!checkRateLimit(ip)) {
      console.log(`[OfferToro] Rate limit exceeded for IP: ${ip}`)
      await logSecurityEvent(supabase, "rate_limit_exceeded", { ip }, "medium")
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded" },
        { status: 429, headers: corsHeaders() },
      )
    }

    const callbackData = await request.json()
    console.log("[OfferToro] Callback data received:", {
      ...callbackData,
      sig: callbackData.sig ? "***SIGNATURE***" : undefined,
    })

    // Validate required parameters
    const requiredParams = ["oid", "uid", "amount", "sig"]
    for (const param of requiredParams) {
      if (!callbackData[param]) {
        console.error(`[OfferToro] Missing required parameter: ${param}`)
        await logSecurityEvent(supabase, "missing_parameter", { param, ip }, "high")
        return NextResponse.json(
          { success: false, error: `Missing required parameter: ${param}` },
          { status: 400, headers: corsHeaders() },
        )
      }
    }

    // Validate signature
    if (!validateOfferToroSignature(callbackData)) {
      console.error("[OfferToro] Invalid signature")
      await logSecurityEvent(
        supabase,
        "invalid_signature",
        { callbackData: { ...callbackData, sig: "***" }, ip },
        "high",
      )
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401, headers: corsHeaders() })
    }

    // Validate amount
    const amount = Number.parseFloat(callbackData.amount)
    if (isNaN(amount) || amount <= 0) {
      console.error("[OfferToro] Invalid amount:", callbackData.amount)
      await logSecurityEvent(supabase, "invalid_amount", { amount: callbackData.amount, ip }, "high")
      return NextResponse.json({ success: false, error: "Invalid amount" }, { status: 400, headers: corsHeaders() })
    }

    // Check for suspicious amounts
    if (amount > 100) {
      console.warn("[OfferToro] Suspicious high amount:", amount)
      await logSecurityEvent(supabase, "suspicious_amount", { amount, callbackData, ip }, "high")
    }

    // Check for duplicate transaction
    const transactionId = `offertoro_${callbackData.oid}_${callbackData.uid}_${Date.now()}`
    const isDuplicate = await isDuplicateTransaction(supabase, transactionId, callbackData.uid, callbackData.oid)

    if (isDuplicate) {
      console.log("[OfferToro] Duplicate transaction detected")
      return NextResponse.json({ success: true, message: "Transaction already processed" }, { headers: corsHeaders() })
    }

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase.from("profiles").select("id").limit(1)
    if (testError) {
      console.error("Supabase connection error:", testError)
      return NextResponse.json(
        { success: false, error: "Database connection failed" },
        { status: 500, headers: corsHeaders() },
      )
    }

    console.log("Supabase connection OK")

    // Handle the completion
    const completion = await offerwallManager.handleOfferCompletion("offertoro", callbackData)
    console.log("OfferToro completion result:", completion)

    if (completion) {
      // Log successful completion
      try {
        const { error: logError } = await supabase.from("sync_logs").insert({
          type: "completion_callback",
          provider_id: "offertoro",
          completion_count: 1,
          status: "completed",
          details: {
            offer_id: callbackData.oid,
            user_id: callbackData.uid,
            amount: amount,
            transaction_id: transactionId,
          },
        })

        if (logError) {
          console.error("Error inserting sync log:", logError)
        }
      } catch (logErr) {
        console.error("Exception inserting sync log:", logErr)
      }

      return NextResponse.json(
        {
          success: true,
          completion: {
            offerId: completion.offerId,
            userId: completion.userId,
            points: completion.points,
            status: completion.status,
          },
        },
        { headers: corsHeaders() },
      )
    } else {
      console.log("No completion returned from offerwallManager")
      return NextResponse.json(
        { success: false, error: "Failed to process completion" },
        { status: 400, headers: corsHeaders() },
      )
    }
  } catch (error: any) {
    console.error("[OfferToro] Callback error:", error)
    console.error("Error stack:", error.stack)

    // Log callback error
    try {
      await supabase.from("sync_logs").insert({
        type: "completion_callback",
        provider_id: "offertoro",
        status: "failed",
        error_message: error.message || "Unknown error",
        details: { ip, error: error.stack },
      })
    } catch (logErr) {
      console.error("Failed to log error:", logErr)
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Callback processing failed",
      },
      { status: 500, headers: corsHeaders() },
    )
  }
}

// Handle GET requests for OfferToro (they might use GET callbacks)
export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"

  console.log("[OfferToro] GET Callback started")
  console.log("URL params:", Object.fromEntries(url.searchParams))

  // Rate limiting
  if (!checkRateLimit(ip)) {
    console.log(`[OfferToro] Rate limit exceeded for IP: ${ip}`)
    return NextResponse.json({ success: false, error: "Rate limit exceeded" }, { status: 429, headers: corsHeaders() })
  }

  // Convert URL params to object
  const callbackData: any = {}
  url.searchParams.forEach((value, key) => {
    callbackData[key] = value
  })

  try {
    // Validate signature for GET requests too
    if (!validateOfferToroSignature(callbackData)) {
      console.error("[OfferToro] Invalid signature in GET request")
      return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401, headers: corsHeaders() })
    }

    const completion = await offerwallManager.handleOfferCompletion("offertoro", callbackData)
    console.log("OfferToro GET completion result:", completion)

    if (completion) {
      return NextResponse.json({ success: true }, { headers: corsHeaders() })
    } else {
      return NextResponse.json(
        { success: false, error: "Failed to process completion" },
        { status: 400, headers: corsHeaders() },
      )
    }
  } catch (error: any) {
    console.error("[OfferToro] GET Callback error:", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: corsHeaders() })
  }
}
