import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { offerwallManager } from "@/lib/offerwall-manager"
import { OfferProviderFactory } from "@/lib/offerwall-providers"

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

export async function POST(request: NextRequest, { params }: { params: { provider: string } }) {
  const supabase = createRouteHandlerClient({ cookies })
  const providerId = params.provider

  try {
    console.log(`[${providerId}] POST Callback started`)

    // Check if provider is supported
    const availableProviders = OfferProviderFactory.getAvailableProviders()
    console.log(`Available providers:`, availableProviders)

    if (!availableProviders.includes(providerId)) {
      console.log(`Provider ${providerId} not supported`)
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported provider: ${providerId}`,
        },
        {
          status: 400,
          headers: corsHeaders(),
        },
      )
    }

    const callbackData = await request.json()
    console.log(`[${providerId}] Callback data:`, JSON.stringify(callbackData, null, 2))

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase.from("profiles").select("id").limit(1)

    if (testError) {
      console.error("Supabase connection error:", testError)
      return NextResponse.json(
        {
          success: false,
          error: "Database connection failed",
          details: testError.message,
        },
        {
          status: 500,
          headers: corsHeaders(),
        },
      )
    }

    console.log("Supabase connection OK")

    // Handle the completion
    const completion = await offerwallManager.handleOfferCompletion(providerId, callbackData)
    console.log("Completion result:", completion)

    if (completion) {
      // Log successful completion with better error handling
      try {
        const { error: logError } = await supabase.from("sync_logs").insert({
          type: "completion_callback",
          provider_id: providerId,
          completion_count: 1,
          status: "completed",
        })

        if (logError) {
          console.error("Error inserting sync log:", logError)
        } else {
          console.log("Sync log inserted successfully")
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
        {
          headers: corsHeaders(),
        },
      )
    } else {
      console.log("No completion returned from offerwallManager")
      return NextResponse.json(
        {
          success: false,
          error: "Invalid callback data",
        },
        {
          status: 400,
          headers: corsHeaders(),
        },
      )
    }
  } catch (error: any) {
    console.error(`[${providerId}] Callback error:`, error)
    console.error("Error stack:", error.stack)
    console.error("Error message:", error.message)

    // Log callback error with better error handling
    try {
      await supabase.from("sync_logs").insert({
        type: "completion_callback",
        provider_id: providerId,
        status: "failed",
        error_message: error.message || "Unknown error",
      })
    } catch (logErr) {
      console.error("Failed to log error:", logErr)
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Callback processing failed",
        stack: error.stack,
      },
      {
        status: 500,
        headers: corsHeaders(),
      },
    )
  }
}

// Handle GET requests for providers that use GET callbacks
export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  const providerId = params.provider
  const url = new URL(request.url)

  console.log(`[${providerId}] GET Callback started`)
  console.log(`URL params:`, Object.fromEntries(url.searchParams))

  // Check if provider is supported
  const availableProviders = OfferProviderFactory.getAvailableProviders()
  if (!availableProviders.includes(providerId)) {
    console.log(`Provider ${providerId} not supported in GET`)
    return NextResponse.json(
      { success: false, error: "Unsupported provider" },
      {
        status: 400,
        headers: corsHeaders(),
      },
    )
  }

  // Convert URL params to object
  const callbackData: any = {}
  url.searchParams.forEach((value, key) => {
    callbackData[key] = value
  })

  try {
    console.log(`[${providerId}] GET Callback data:`, JSON.stringify(callbackData, null, 2))

    const completion = await offerwallManager.handleOfferCompletion(providerId, callbackData)
    console.log("GET Completion result:", completion)

    if (completion) {
      return NextResponse.json({ success: true }, { headers: corsHeaders() })
    } else {
      console.log("No completion returned from GET callback")
      return NextResponse.json(
        { success: false },
        {
          status: 400,
          headers: corsHeaders(),
        },
      )
    }
  } catch (error: any) {
    console.error(`[${providerId}] GET Callback error:`, error)
    console.error("GET Error stack:", error.stack)
    return NextResponse.json(
      { success: false, error: error.message },
      {
        status: 500,
        headers: corsHeaders(),
      },
    )
  }
}
