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
    const { userId, force = false } = await request.json()

    // Check if sync is needed (avoid too frequent syncs)
    if (!force) {
      const { data: lastSync } = await supabase
        .from("sync_logs")
        .select("created_at")
        .eq("type", "offer_sync")
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (lastSync) {
        const lastSyncTime = new Date(lastSync.created_at)
        const timeSinceLastSync = Date.now() - lastSyncTime.getTime()
        const minSyncInterval = 5 * 60 * 1000 // 5 minutes

        if (timeSinceLastSync < minSyncInterval) {
          return NextResponse.json({
            message: "Sync not needed yet",
            nextSyncIn: minSyncInterval - timeSinceLastSync,
          })
        }
      }
    }

    // Start sync
    await offerwallManager.syncOffers(userId || session.user.id)

    return NextResponse.json({
      success: true,
      message: "Offer sync completed successfully",
    })
  } catch (error: any) {
    console.error("Offer sync error:", error)
    return NextResponse.json(
      {
        error: error.message || "Sync failed",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const url = new URL(request.url)
    const category = url.searchParams.get("category")
    const minPayout = url.searchParams.get("minPayout")
    const maxPayout = url.searchParams.get("maxPayout")
    const limit = url.searchParams.get("limit")
    const useCache = url.searchParams.get("cache") === "true"

    const options = {
      category: category || undefined,
      minPayout: minPayout ? Number.parseFloat(minPayout) : undefined,
      maxPayout: maxPayout ? Number.parseFloat(maxPayout) : undefined,
      limit: limit ? Number.parseInt(limit) : undefined,
    }

    let offers
    if (useCache) {
      offers = await offerwallManager.getCachedOffers(options)
    } else {
      offers = await offerwallManager.fetchAllOffers(session.user.id, options)
    }

    return NextResponse.json({
      offers,
      count: offers.length,
      cached: useCache,
    })
  } catch (error: any) {
    console.error("Fetch offers error:", error)
    return NextResponse.json(
      {
        error: error.message || "Failed to fetch offers",
      },
      { status: 500 },
    )
  }
}
