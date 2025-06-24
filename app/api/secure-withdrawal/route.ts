import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { securityManager } from "@/lib/security-manager"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { amount, method, walletAddress, verificationCode } = await request.json()
    const userId = session.user.id
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    // Input validation
    if (!amount || amount < 200) {
      return NextResponse.json({ error: "Minimum withdrawal is $2.00 (200 points)" }, { status: 400 })
    }

    if (!method || !walletAddress) {
      return NextResponse.json({ error: "Payment method and wallet address required" }, { status: 400 })
    }

    // Security checks
    const securityCheck = await securityManager.checkWithdrawalSecurity(userId, amount, {
      ipAddress,
      userAgent,
      method,
      walletAddress,
    })

    if (!securityCheck.allowed) {
      return NextResponse.json(
        {
          error: "Withdrawal not allowed",
          reason: securityCheck.reason,
          details: securityCheck.details,
        },
        { status: 403 },
      )
    }

    // Check user balance
    const { data: profile } = await supabase
      .from("profiles")
      .select("points, account_status, kyc_verified")
      .eq("id", userId)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    if (profile.account_status !== "active") {
      return NextResponse.json({ error: "Account suspended or banned" }, { status: 403 })
    }

    if (profile.points < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Generate verification code for high-value withdrawals
    let requiresVerification = false
    let generatedVerificationCode = null

    if (amount > 1000) {
      // $10+
      requiresVerification = true
      generatedVerificationCode = crypto.randomBytes(3).toString("hex").toUpperCase()

      // In production, send this via SMS/Email
      console.log(`Verification code for ${userId}: ${generatedVerificationCode}`)
    }

    // Create withdrawal request with security data
    const withdrawalData = {
      user_id: userId,
      amount,
      method,
      wallet_address: walletAddress,
      status: securityCheck.requiresManualReview ? "pending_review" : "pending",
      ip_address: ipAddress,
      device_fingerprint: securityManager.generateDeviceFingerprint(userAgent || "", {}),
      risk_score: securityCheck.fraudScore,
      requires_manual_review: securityCheck.requiresManualReview,
      verification_code: generatedVerificationCode,
      verification_expires_at: requiresVerification
        ? new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
        : null,
    }

    const { data: withdrawal, error: withdrawalError } = await supabase
      .from("withdrawals")
      .insert(withdrawalData)
      .select()
      .single()

    if (withdrawalError) throw withdrawalError

    // Deduct points using secure function
    await securityManager.creditPoints(
      userId,
      -amount, // Negative for deduction
      "withdrawal",
      withdrawal.id.toString(),
      {
        description: `Withdrawal to ${method}`,
        ipAddress,
        userAgent,
      },
    )

    // Update daily withdrawal tracking
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("daily_withdrawal_limits").upsert(
      {
        user_id: userId,
        date: today,
        total_withdrawn: supabase.raw("total_withdrawn + ?", [amount]),
        withdrawal_count: supabase.raw("withdrawal_count + 1"),
      },
      {
        onConflict: "user_id,date",
      },
    )

    // Response based on security level
    if (requiresVerification) {
      return NextResponse.json({
        success: true,
        requiresVerification: true,
        message: "Verification code sent. Please check your email/SMS.",
        withdrawalId: withdrawal.id,
      })
    }

    if (securityCheck.requiresManualReview) {
      return NextResponse.json({
        success: true,
        requiresReview: true,
        message: "Withdrawal submitted for manual review. Processing within 24 hours.",
        withdrawalId: withdrawal.id,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Withdrawal request submitted successfully",
      withdrawalId: withdrawal.id,
      estimatedProcessing: "5-30 minutes",
    })
  } catch (error: any) {
    console.error("Secure withdrawal error:", error)

    // Log security incident
    if (session?.user?.id) {
      await securityManager.detectFraud(session.user.id, "withdrawal_error", {
        error: error.message,
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      })
    }

    return NextResponse.json(
      {
        error: "Withdrawal processing failed",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
