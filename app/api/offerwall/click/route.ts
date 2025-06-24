import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
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
    const { offerId } = await request.json()

    if (!offerId) {
      return NextResponse.json({ error: "Offer ID required" }, { status: 400 })
    }

    // Generate offer URL
    const offerUrl = offerwallManager.generateOfferUrl(offerId, session.user.id)

    // Track the click
    const providerId = offerId.split("_")[0]
    const clientIP = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1"
    const userAgent = request.headers.get("user-agent") || ""
    const referrer = request.headers.get("referer") || ""

    // Store click tracking
    await supabase.rpc("track_offer_click", {
      p_user_id: session.user.id,
      p_external_offer_id: offerId,
      p_provider_id: providerId,
      p_ip_address: clientIP,
      p_user_agent: userAgent,
      p_referrer: referrer,
    })

    return NextResponse.json({
      success: true,
      offerUrl,
      offerId,
      providerId,
    })
  } catch (error: any) {
    console.error("Offer click error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to process offer click",
      },
      { status: 500 },
    )
  }
}
