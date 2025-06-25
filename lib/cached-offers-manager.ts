import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { CachedOffer, OfferwallProvider } from "@/types"

export class CachedOffersManager {
  private supabase = createClientComponentClient()

  // Get cached offers with filters
  async getCachedOffers(
    filters: {
      provider?: OfferwallProvider
      category?: string
      minReward?: number
      maxReward?: number
      country?: string
      device?: string
      limit?: number
      offset?: number
    } = {},
  ): Promise<{ offers: CachedOffer[]; total: number }> {
    try {
      let query = this.supabase.from("cached_offers").select("*", { count: "exact" }).eq("is_active", true)

      // Apply filters
      if (filters.provider) {
        query = query.eq("provider", filters.provider)
      }
      if (filters.category) {
        query = query.eq("category", filters.category)
      }
      if (filters.minReward) {
        query = query.gte("reward_amount", filters.minReward)
      }
      if (filters.maxReward) {
        query = query.lte("reward_amount", filters.maxReward)
      }
      if (filters.country) {
        query = query.contains("countries", [filters.country])
      }
      if (filters.device) {
        query = query.contains("devices", [filters.device])
      }

      // Pagination
      if (filters.limit) {
        query = query.limit(filters.limit)
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
      }

      // Order by priority and reward
      query = query.order("priority_score", { ascending: false })
      query = query.order("reward_amount", { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        offers: data as CachedOffer[],
        total: count || 0,
      }
    } catch (error) {
      console.error("Error getting cached offers:", error)
      return { offers: [], total: 0 }
    }
  }

  // Update offer click count
  async trackOfferClick(offerId: string): Promise<void> {
    try {
      await this.supabase.rpc("increment_offer_clicks", {
        offer_id: offerId,
      })
    } catch (error) {
      console.error("Error tracking offer click:", error)
    }
  }

  // Update offer completion count
  async trackOfferCompletion(offerId: string): Promise<void> {
    try {
      await this.supabase.rpc("increment_offer_completions", {
        offer_id: offerId,
      })
    } catch (error) {
      console.error("Error tracking offer completion:", error)
    }
  }

  // Get offer statistics
  async getOfferStats(offerId: string): Promise<{
    clicks: number
    completions: number
    conversionRate: number
  }> {
    try {
      const { data, error } = await this.supabase
        .from("cached_offers")
        .select("clicks_count, completions_count, conversion_rate_percent")
        .eq("id", offerId)
        .single()

      if (error) throw error

      return {
        clicks: data.clicks_count || 0,
        completions: data.completions_count || 0,
        conversionRate: data.conversion_rate_percent || 0,
      }
    } catch (error) {
      console.error("Error getting offer stats:", error)
      return { clicks: 0, completions: 0, conversionRate: 0 }
    }
  }
}

export const cachedOffersManager = new CachedOffersManager()
