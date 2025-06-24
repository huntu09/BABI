import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { securityManager } from "@/lib/security-manager"
import { offerwallManager } from "@/lib/offerwall-manager"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { offerId, providerId, transactionId } = await request.json()
    const userId = session.user.id
    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    // Rate limiting check
    const rateLimit = await securityManager.checkRateLimit(userId, "offer_completion", 60, 5) // 5 per hour
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          details: `Maximum ${rateLimit.limit} completions per ${rateLimit.windowMinutes} minutes`,
        },
        { status: 429 },
      )
    }

    // Check for duplicate completion
    const { data: existingCompletion } = await supabase
      .from("offer_completions")
      .select("id")
      .eq("user_id", userId)
      .eq("external_offer_id", offerId)
      .eq("status", "completed")
      .single()

    if (existingCompletion) {
      return NextResponse.json({ error: "Offer already completed" }, { status: 400 })
    }

    // Fraud detection
    const fraudCheck = await securityManager.detectFraud(userId, "offer_completion", {
      offerId,
      providerId,
      transactionId,
      ipAddress,
      userAgent,
    })

    if (fraudCheck.blocked) {
      return NextResponse.json(
        {
          error: "Completion blocked due to suspicious activity",
          reason: fraudCheck.reason,
        },
        { status: 403 },
      )
    }

    // Get offer details (from cache or provider)
    const offers = await offerwallManager.getCachedOffers({ limit: 1000 })
    const offer = offers.find((o) => o.id === offerId)

    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 })
    }

    // Verify completion with provider (if real offerwall)
    let verified = false
    if (providerId && transactionId) {
      // In production, verify with actual provider API
      verified = true // Placeholder
    } else {
      // For database offers, auto-verify
      verified = true
    }

    if (!verified) {
      return NextResponse.json({ error: "Offer completion could not be verified" }, { status: 400 })
    }

    // Credit points securely
    const pointsResult = await securityManager.creditPoints(userId, offer.points, "offer_completion", offerId, {
      description: `Completed: ${offer.title}`,
      providerId,
      transactionId,
      ipAddress,
      userAgent,
      fraudScore: fraudCheck.score,
    })

    // Record completion
    await supabase.from("offer_completions").insert({
      external_offer_id: offerId,
      user_id: userId,
      provider_id: providerId,
      transaction_id: transactionId,
      points_earned: offer.points,
      payout_usd: offer.payout,
      status: "completed",
      ip_address: ipAddress,
      user_agent: userAgent,
      completed_at: new Date().toISOString(),
      verified_at: new Date().toISOString(),
    })

    // Handle referral commission (if applicable)
    const { data: profile } = await supabase.from("profiles").select("referred_by").eq("id", userId).single()

    if (profile?.referred_by) {
      const commission = Math.floor(offer.points * 0.1) // 10% commission

      await securityManager.creditPoints(profile.referred_by, commission, "referral_commission", offerId, {
        description: `Referral commission from ${userId}`,
        referredUserId: userId,
        ipAddress,
        userAgent,
      })
    }

    return NextResponse.json({
      success: true,
      pointsEarned: offer.points,
      fraudScore: fraudCheck.score,
      message: fraudCheck.flagged ? "Completion recorded but flagged for review" : "Offer completed successfully!",
    })
  } catch (error: any) {
    console.error("Secure offer completion error:", error)

    // Log security incident
    if (session?.user?.id) {
      await securityManager.detectFraud(session.user.id, "completion_error", {
        error: error.message,
        ipAddress: request.headers.get("x-forwarded-for"),
        userAgent: request.headers.get("user-agent"),
      })
    }

    return NextResponse.json(
      {
        error: "Offer completion failed",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 },
    )
  }
}
