import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

// Force dynamic rendering
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { provider, offerId, taskId } = await request.json()

    if (!provider || !offerId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Generate offer URL based on provider
    let offerUrl = ""

    switch (provider) {
      case "cpx_research":
        // CPX Research URL format
        const cpxAppId = process.env.CPX_RESEARCH_APP_ID || "demo"
        const userId = session.user.id
        offerUrl = `https://offers.cpx-research.com/index.php?app_id=${cpxAppId}&ext_user_id=${userId}&survey_id=${offerId.replace("cpx_survey_", "")}`
        break

      case "adgem":
        // AdGem URL format (when implemented)
        offerUrl = `https://api.adgem.com/v1/wall?user_id=${session.user.id}&offer_id=${offerId}`
        break

      default:
        return NextResponse.json({ error: "Unsupported provider" }, { status: 400 })
    }

    // Log the click for tracking
    await supabase.from("offer_clicks").insert({
      user_id: session.user.id,
      task_id: taskId,
      provider: provider,
      external_offer_id: offerId,
      clicked_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      offerUrl,
      provider,
      offerId,
    })
  } catch (error: any) {
    console.error("Error generating offer URL:", error)
    return NextResponse.json({ error: error.message || "Failed to generate offer URL" }, { status: 500 })
  }
}
