import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { OfferProviderFactory, type Offer, type OfferCompletion, type OfferProviderClient } from "./offerwall-providers"

export class OfferwallManager {
  private supabase = createClientComponentClient()
  private providers: OfferProviderClient[] = []

  constructor() {
    this.initializeProviders()
  }

  private initializeProviders() {
    try {
      this.providers = OfferProviderFactory.getAllClients()
      console.log(`Initialized ${this.providers.length} offerwall providers`)
    } catch (error) {
      console.error("Error initializing providers:", error)
      this.providers = []
    }
  }

  // Add method to reinitialize providers
  reinitializeProviders() {
    this.initializeProviders()
  }

  // Get active providers count
  getActiveProvidersCount(): number {
    return this.providers.length
  }

  // Fetch offers from all providers
  async fetchAllOffers(
    userId: string,
    options: {
      category?: string
      minPayout?: number
      maxPayout?: number
      countries?: string[]
      devices?: string[]
      limit?: number
    } = {},
  ): Promise<Offer[]> {
    const allOffers: Offer[] = []

    if (this.providers.length === 0) {
      console.warn("No active providers available")
      return await this.getCachedOffers(options)
    }

    // Fetch from all enabled providers in parallel
    const providerPromises = this.providers.map(async (provider) => {
      try {
        const offers = await provider.fetchOffers(userId, options)
        console.log(`Fetched ${offers.length} offers from ${provider.constructor.name}`)
        return offers
      } catch (error) {
        console.error(`Error fetching offers from ${provider.constructor.name}:`, error)
        return []
      }
    })

    const providerResults = await Promise.all(providerPromises)

    // Combine all offers
    for (const offers of providerResults) {
      allOffers.push(...offers)
    }

    // Apply filters
    let filteredOffers = allOffers.filter((offer) => offer.isActive)

    if (options.category) {
      filteredOffers = filteredOffers.filter(
        (offer) => offer.category.toLowerCase() === options.category?.toLowerCase(),
      )
    }

    if (options.minPayout) {
      filteredOffers = filteredOffers.filter((offer) => offer.payout >= options.minPayout!)
    }

    if (options.maxPayout) {
      filteredOffers = filteredOffers.filter((offer) => offer.payout <= options.maxPayout!)
    }

    if (options.countries?.length) {
      filteredOffers = filteredOffers.filter((offer) =>
        offer.countries.some((country) => options.countries!.includes(country)),
      )
    }

    if (options.devices?.length) {
      filteredOffers = filteredOffers.filter((offer) =>
        offer.devices.some((device) => options.devices!.includes(device)),
      )
    }

    // Sort by payout (highest first)
    filteredOffers.sort((a, b) => b.payout - a.payout)

    // Apply limit
    if (options.limit) {
      filteredOffers = filteredOffers.slice(0, options.limit)
    }

    // Cache offers in database
    await this.cacheOffers(filteredOffers)

    return filteredOffers
  }

  // Cache offers in database for faster access
  private async cacheOffers(offers: Offer[]): Promise<void> {
    if (offers.length === 0) return

    try {
      // Clear old cached offers (older than 1 hour)
      await this.supabase
        .from("cached_offers")
        .delete()
        .lt("updated_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())

      // Insert new offers
      const offersToCache = offers.map((offer) => ({
        external_id: offer.id,
        provider_id: offer.providerId,
        title: offer.title,
        description: offer.description,
        points: offer.points,
        payout: offer.payout,
        category: offer.category,
        difficulty: offer.difficulty,
        estimated_time: offer.estimatedTime,
        requirements: offer.requirements,
        countries: offer.countries,
        devices: offer.devices,
        url: offer.url,
        image_url: offer.imageUrl,
        rating: offer.rating,
        completions: offer.completions,
        is_active: offer.isActive,
        expires_at: offer.expiresAt?.toISOString(),
        provider_created_at: offer.createdAt.toISOString(),
        provider_updated_at: offer.updatedAt.toISOString(),
      }))

      const { error } = await this.supabase.from("cached_offers").upsert(offersToCache, {
        onConflict: "external_id,provider_id",
        ignoreDuplicates: false,
      })

      if (error) {
        console.error("Error caching offers:", error)
      } else {
        console.log(`Cached ${offersToCache.length} offers`)
      }
    } catch (error) {
      console.error("Error caching offers:", error)
    }
  }

  // Get cached offers (fallback when API is down)
  async getCachedOffers(
    options: {
      category?: string
      minPayout?: number
      maxPayout?: number
      limit?: number
    } = {},
  ): Promise<Offer[]> {
    try {
      let query = this.supabase
        .from("cached_offers")
        .select("*")
        .eq("is_active", true)
        .gt("updated_at", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // 2 hours cache

      if (options.category) {
        query = query.eq("category", options.category)
      }

      if (options.minPayout) {
        query = query.gte("payout", options.minPayout)
      }

      if (options.maxPayout) {
        query = query.lte("payout", options.maxPayout)
      }

      query = query.order("payout", { ascending: false })

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error

      return (
        data?.map((offer) => ({
          id: offer.external_id,
          providerId: offer.provider_id,
          title: offer.title,
          description: offer.description,
          points: offer.points,
          payout: offer.payout,
          category: offer.category,
          difficulty: offer.difficulty,
          estimatedTime: offer.estimated_time,
          requirements: offer.requirements || [],
          countries: offer.countries || [],
          devices: offer.devices || [],
          url: offer.url,
          imageUrl: offer.image_url,
          rating: offer.rating,
          completions: offer.completions,
          isActive: offer.is_active,
          expiresAt: offer.expires_at ? new Date(offer.expires_at) : undefined,
          createdAt: new Date(offer.provider_created_at),
          updatedAt: new Date(offer.provider_updated_at),
        })) || []
      )
    } catch (error) {
      console.error("Error getting cached offers:", error)
      return []
    }
  }

  // Generate offer URL for user
  generateOfferUrl(offerId: string, userId: string): string {
    const providerId = offerId.split("_")[0]
    const provider = this.providers.find((p) => (p as any).provider?.id === providerId)

    if (!provider) {
      throw new Error(`Provider not found for offer: ${offerId}`)
    }

    return provider.generateOfferUrl(offerId, userId)
  }

  // Handle offer completion callback
  async handleOfferCompletion(providerId: string, callbackData: any): Promise<OfferCompletion | null> {
    try {
      const provider = this.providers.find((p) => (p as any).provider?.id === providerId)

      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`)
      }

      const completion = await provider.handleCallback(callbackData)

      if (completion) {
        // Store completion in database
        await this.storeCompletion(completion)

        // Credit user points
        await this.creditUserPoints(completion)

        // Update provider stats
        await this.updateProviderStats(providerId, completion)

        console.log(`Processed completion for ${completion.offerId}: ${completion.points} points`)
      }

      return completion
    } catch (error) {
      console.error("Error handling offer completion:", error)
      throw error
    }
  }

  // Store completion in database
  private async storeCompletion(completion: OfferCompletion): Promise<void> {
    try {
      const { error } = await this.supabase.from("offerwall_completions").insert({
        external_offer_id: completion.offerId,
        user_id: completion.userId,
        provider: completion.providerId, // ✅ Fixed: was provider_id
        transaction_id: completion.transactionId,
        reward_amount: completion.points, // ✅ Fixed: was points_earned
        status: completion.status,
        completed_at: completion.completedAt.toISOString(),
        verified_at: completion.verifiedAt?.toISOString(),
        ip_address: completion.ipAddress,
        user_agent: completion.userAgent,
      })

      if (error) {
        console.error("Error storing completion:", error)
        throw error
      }
    } catch (error) {
      console.error("Error storing completion:", error)
      throw error
    }
  }

  // Credit user points
  private async creditUserPoints(completion: OfferCompletion): Promise<void> {
    if (completion.status !== "completed") return

    try {
      // Update user points using raw SQL to avoid conflicts
      const { error: updateError } = await this.supabase.rpc("credit_user_points", {
        p_user_id: completion.userId,
        p_points: completion.points,
      })

      if (updateError) {
        console.error("Error crediting points:", updateError)
        throw updateError
      }

      // Handle referral commission
      const { data: profile } = await this.supabase
        .from("profiles")
        .select("referred_by")
        .eq("id", completion.userId)
        .single()

      if (profile?.referred_by) {
        const commission = Math.floor(completion.points * 0.1) // 10% commission

        const { error: commissionError } = await this.supabase.rpc("credit_user_points", {
          p_user_id: profile.referred_by,
          p_points: commission,
        })

        if (commissionError) {
          console.error("Error crediting referral commission:", commissionError)
        }

        // Update referral stats
        await this.supabase
          .from("referrals")
          .update({
            commission_earned: this.supabase.raw("commission_earned + ?", [commission]),
          })
          .eq("referrer_id", profile.referred_by)
          .eq("referred_id", completion.userId)
      }
    } catch (error) {
      console.error("Error crediting user points:", error)
      throw error
    }
  }

  // Update provider statistics
  private async updateProviderStats(providerId: string, completion: OfferCompletion): Promise<void> {
    try {
      const today = new Date().toISOString().split("T")[0]

      const { error } = await this.supabase.from("provider_stats").upsert(
        {
          provider_id: providerId,
          date: today,
          completions: 1,
          total_payout: completion.payout,
          total_points: completion.points,
          api_calls: 0,
          api_errors: 0,
        },
        {
          onConflict: "provider_id,date",
          ignoreDuplicates: false,
        },
      )

      if (error) {
        console.error("Error updating provider stats:", error)
      }
    } catch (error) {
      console.error("Error updating provider stats:", error)
    }
  }

  // Get provider statistics
  async getProviderStats(days = 30): Promise<any[]> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from("provider_stats")
        .select("*")
        .gte("date", startDate.toISOString().split("T")[0])
        .order("date", { ascending: false })

      if (error) throw error

      return data || []
    } catch (error) {
      console.error("Error getting provider stats:", error)
      return []
    }
  }

  // Sync offers (run periodically)
  async syncOffers(userId: string): Promise<void> {
    try {
      console.log("Starting offer sync...")

      const offers = await this.fetchAllOffers(userId, { limit: 1000 })

      console.log(`Synced ${offers.length} offers from ${this.providers.length} providers`)

      // Update sync log
      await this.supabase.from("sync_logs").insert({
        type: "offer_sync",
        provider_count: this.providers.length,
        offer_count: offers.length,
        status: "completed",
        duration_ms: Date.now(),
      })
    } catch (error) {
      console.error("Error syncing offers:", error)

      // Log sync error
      await this.supabase.from("sync_logs").insert({
        type: "offer_sync",
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        duration_ms: Date.now(),
      })

      throw error
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from("sync_logs")
        .select("*")
        .eq("type", "offer_sync")
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== "PGRST116") throw error

      return data
    } catch (error) {
      console.error("Error getting sync status:", error)
      return null
    }
  }
}

// Singleton instance
export const offerwallManager = new OfferwallManager()
