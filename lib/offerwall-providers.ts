// Offerwall Provider Configurations and API Clients
export interface OfferProvider {
  id: string
  name: string
  apiUrl: string
  enabled: boolean
  config: {
    apiKey?: string
    secretKey?: string
    userId?: string
    subId?: string
    appId?: string
    placementId?: string
    appToken?: string
    [key: string]: any
  }
}

export interface Offer {
  id: string
  providerId: string
  title: string
  description: string
  points: number
  payout: number // in USD
  category: string
  difficulty: string
  estimatedTime: string
  requirements: string[]
  countries: string[]
  devices: string[]
  url: string
  imageUrl?: string
  rating?: number
  completions?: number
  isActive: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OfferCompletion {
  offerId: string
  userId: string
  providerId: string
  transactionId: string
  points: number
  payout: number
  status: "pending" | "completed" | "rejected" | "chargeback"
  completedAt: Date
  verifiedAt?: Date
  ipAddress?: string
  userAgent?: string
}

// Provider Configurations
export const OFFERWALL_PROVIDERS: Record<string, OfferProvider> = {
  cpx_research: {
    id: "cpx_research",
    name: "CPX Research",
    apiUrl: "https://live-api.cpx-research.com",
    enabled: true,
    config: {
      apiKey: process.env.CPX_RESEARCH_API_KEY || "",
      secretKey: process.env.CPX_RESEARCH_SECRET_KEY || "",
      appId: process.env.CPX_RESEARCH_APP_ID || "",
    },
  },
  adgem: {
    id: "adgem",
    name: "AdGem",
    apiUrl: "https://api.adgem.com",
    enabled: true,
    config: {
      apiKey: process.env.ADGEM_API_KEY || "",
      secretKey: process.env.ADGEM_SECRET_KEY || "",
      appId: process.env.ADGEM_APP_ID || "",
    },
  },
  lootably: {
    id: "lootably",
    name: "Lootably",
    apiUrl: "https://wall.lootably.com",
    enabled: true,
    config: {
      apiKey: process.env.LOOTABLY_API_KEY || "",
      placementId: process.env.LOOTABLY_PLACEMENT_ID || "",
    },
  },
  offertoro: {
    id: "offertoro",
    name: "OfferToro",
    apiUrl: "https://www.offertoro.com",
    enabled: true,
    config: {
      apiKey: process.env.OFFERTORO_API_KEY || "",
      secretKey: process.env.OFFERTORO_SECRET_KEY || "",
      appId: process.env.OFFERTORO_APP_ID || "",
    },
  },
  bitlabs: {
    id: "bitlabs",
    name: "BitLabs",
    apiUrl: "https://api.bitlabs.ai",
    enabled: true,
    config: {
      apiKey: process.env.BITLABS_API_KEY || "",
      appToken: process.env.BITLABS_APP_TOKEN || "",
    },
  },
  ayetstudios: {
    id: "ayetstudios",
    name: "AyeT Studios",
    apiUrl: "https://www.ayetstudios.com",
    enabled: true,
    config: {
      apiKey: process.env.AYETSTUDIOS_API_KEY || "",
      secretKey: process.env.AYETSTUDIOS_SECRET_KEY || "",
    },
  },
  revenue_universe: {
    id: "revenue_universe",
    name: "Revenue Universe",
    apiUrl: "https://www.revenueuniverse.com",
    enabled: true,
    config: {
      apiKey: process.env.REVENUE_UNIVERSE_API_KEY || "",
      secretKey: process.env.REVENUE_UNIVERSE_SECRET_KEY || "",
    },
  },
  persona_ly: {
    id: "persona_ly",
    name: "Persona.ly",
    apiUrl: "https://persona.ly",
    enabled: true,
    config: {
      apiKey: process.env.PERSONA_LY_API_KEY || "",
      secretKey: process.env.PERSONA_LY_SECRET_KEY || "",
    },
  },
}

// Base API Client Class
export abstract class OfferProviderClient {
  protected provider: OfferProvider
  protected baseUrl: string

  constructor(provider: OfferProvider) {
    this.provider = provider
    this.baseUrl = provider.apiUrl
  }

  abstract fetchOffers(userId: string, options?: any): Promise<Offer[]>
  abstract verifyCompletion(transactionId: string): Promise<OfferCompletion | null>
  abstract generateOfferUrl(offerId: string, userId: string): string
  abstract handleCallback(data: any): Promise<OfferCompletion | null>

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "GPT-Platform/1.0",
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`[${this.provider.name}] API Error:`, error)
      throw error
    }
  }

  protected generateSignature(data: string, secret: string): string {
    if (typeof window !== "undefined") {
      // Client-side fallback
      return btoa(data + secret)
    }

    try {
      const crypto = require("crypto")
      return crypto.createHmac("sha256", secret).update(data).digest("hex")
    } catch (error) {
      console.error("Crypto not available:", error)
      return btoa(data + secret) // Fallback
    }
  }
}

// CPX Research Client
export class CPXResearchClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey || !this.provider.config.appId) {
      console.warn("CPX Research: Missing API credentials")
      return []
    }

    const endpoint = `/v1/get-surveys?app_id=${this.provider.config.appId}&ext_user_id=${userId}`

    try {
      const data = await this.makeRequest(endpoint, {
        headers: {
          "X-API-Key": this.provider.config.apiKey,
        },
      })

      return (
        data.surveys?.map((survey: any) => ({
          id: `cpx_${survey.id}`,
          providerId: "cpx_research",
          title: survey.title || "CPX Research Survey",
          description: survey.description || "Complete this survey to earn points",
          points: Math.floor((survey.payout || 0.5) * 100),
          payout: survey.payout || 0.5,
          category: "survey",
          difficulty: survey.difficulty || "easy",
          estimatedTime: `${survey.time_estimate || 10} minutes`,
          requirements: survey.requirements || [],
          countries: survey.countries || ["US", "GB", "CA"],
          devices: ["mobile", "desktop"],
          url: survey.click_url || "#",
          rating: survey.rating || 4.0,
          completions: survey.completions || 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("CPX Research API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    const surveyId = offerId.replace("cpx_", "")
    return `${this.baseUrl}/v1/survey-redirect?app_id=${this.provider.config.appId}&ext_user_id=${userId}&survey_id=${surveyId}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    if (!this.provider.config.secretKey) {
      throw new Error("CPX Research: Missing secret key for callback verification")
    }

    const expectedSignature = this.generateSignature(
      `${data.user_id}${data.survey_id}${data.reward}${data.status}`,
      this.provider.config.secretKey,
    )

    if (data.signature && data.signature !== expectedSignature) {
      throw new Error("Invalid callback signature")
    }

    return {
      offerId: `cpx_${data.survey_id}`,
      userId: data.user_id,
      providerId: "cpx_research",
      transactionId: data.transaction_id || `cpx_${Date.now()}`,
      points: Math.floor((data.reward || 0.5) * 100),
      payout: data.reward || 0.5,
      status: data.status === "completed" ? "completed" : "rejected",
      completedAt: new Date(),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
    }
  }
}

// AdGem Client - Enhanced Implementation
export class AdGemClient extends OfferProviderClient {
  async fetchOffers(userId: string, options: any = {}): Promise<Offer[]> {
    if (!this.provider.config.apiKey || !this.provider.config.appId) {
      console.warn("AdGem: Missing API credentials")
      return []
    }

    // AdGem API endpoint for fetching offers
    const endpoint = `/v1/offers`
    const params = new URLSearchParams({
      app_id: this.provider.config.appId,
      user_id: userId,
      country: options.country || "ID",
      device: options.device || "mobile",
      limit: (options.limit || 50).toString(),
    })

    try {
      const data = await this.makeRequest(`${endpoint}?${params}`, {
        headers: {
          Authorization: `Bearer ${this.provider.config.apiKey}`,
          "X-API-Version": "1.0",
        },
      })

      if (!data.success || !data.offers) {
        console.warn("AdGem: No offers returned or API error")
        return []
      }

      return data.offers
        .map((offer: any) => ({
          id: `adgem_${offer.id}`,
          providerId: "adgem",
          title: offer.name || offer.title || "AdGem Offer",
          description: offer.description || "Complete this offer to earn points",
          points: Math.floor((offer.payout || 0.8) * 100),
          payout: offer.payout || 0.8,
          category: this.normalizeCategory(offer.category),
          difficulty: this.mapDifficulty(offer.difficulty || offer.rating),
          estimatedTime: `${offer.time_to_complete || 15} minutes`,
          requirements: this.parseRequirements(offer.requirements),
          countries: this.parseCountries(offer.countries),
          devices: this.parseDevices(offer.devices),
          url: offer.click_url || "#",
          imageUrl: offer.icon_url || offer.image_url,
          rating: offer.rating || 4.0,
          completions: offer.completions || 0,
          isActive: offer.is_active !== false && offer.status === "active",
          expiresAt: offer.expires_at ? new Date(offer.expires_at) : undefined,
          createdAt: new Date(offer.created_at || Date.now()),
          updatedAt: new Date(offer.updated_at || Date.now()),
        }))
        .filter((offer) => offer.isActive)
    } catch (error) {
      console.error("AdGem API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    const adgemOfferId = offerId.replace("adgem_", "")
    const params = new URLSearchParams({
      app_id: this.provider.config.appId,
      user_id: userId,
      offer_id: adgemOfferId,
      click_id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    })

    return `${this.baseUrl}/v1/click?${params}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    if (!this.provider.config.apiKey) {
      return null
    }

    const endpoint = `/v1/verify-completion`
    const params = new URLSearchParams({
      transaction_id: transactionId,
      app_id: this.provider.config.appId,
    })

    try {
      const data = await this.makeRequest(`${endpoint}?${params}`, {
        headers: {
          Authorization: `Bearer ${this.provider.config.apiKey}`,
        },
      })

      if (data.completion) {
        return {
          offerId: `adgem_${data.completion.offer_id}`,
          userId: data.completion.user_id,
          providerId: "adgem",
          transactionId: data.completion.transaction_id,
          points: Math.floor(data.completion.payout * 100),
          payout: data.completion.payout,
          status: this.mapStatus(data.completion.status),
          completedAt: new Date(data.completion.completed_at),
          verifiedAt: new Date(),
        }
      }
      return null
    } catch (error) {
      console.error("AdGem verification error:", error)
      return null
    }
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    if (!this.provider.config.secretKey) {
      throw new Error("AdGem: Missing secret key for callback verification")
    }

    // Validate signature
    const expectedSignature = this.generateSignature(
      `${data.user_id}${data.offer_id}${data.amount}${data.status}`,
      this.provider.config.secretKey,
    )

    if (data.signature && data.signature !== expectedSignature) {
      throw new Error("Invalid callback signature")
    }

    return {
      offerId: `adgem_${data.offer_id}`,
      userId: data.user_id,
      providerId: "adgem",
      transactionId: data.transaction_id || `adgem_${Date.now()}`,
      points: Math.floor((data.amount || 0.8) * 100),
      payout: data.amount || 0.8,
      status: this.mapStatus(data.status),
      completedAt: new Date(),
      ipAddress: data.ip_address,
      userAgent: data.user_agent,
    }
  }

  // Helper methods
  private normalizeCategory(category: string): string {
    const categoryMap: Record<string, string> = {
      app: "mobile_app",
      game: "gaming",
      survey: "survey",
      video: "video",
      signup: "registration",
      shopping: "ecommerce",
    }
    return categoryMap[category?.toLowerCase()] || "general"
  }

  private mapDifficulty(rating: number | string): string {
    const numRating = typeof rating === "string" ? Number.parseFloat(rating) : rating
    if (numRating >= 4.5) return "easy"
    if (numRating >= 3.5) return "medium"
    return "hard"
  }

  private parseRequirements(requirements: string | string[]): string[] {
    if (Array.isArray(requirements)) return requirements
    if (typeof requirements === "string") return requirements.split(",").map((r) => r.trim())
    return []
  }

  private parseCountries(countries: string | string[]): string[] {
    if (Array.isArray(countries)) return countries
    if (typeof countries === "string") return countries.split(",").map((c) => c.trim().toUpperCase())
    return ["US", "GB", "CA", "AU", "ID"]
  }

  private parseDevices(devices: string | string[]): string[] {
    if (Array.isArray(devices)) return devices
    if (typeof devices === "string") return devices.split(",").map((d) => d.trim().toLowerCase())
    return ["mobile", "desktop"]
  }

  private mapStatus(status: string | number): "completed" | "rejected" | "chargeback" {
    if (status === "completed" || status === "1" || status === 1) return "completed"
    if (status === "chargeback" || status === "-1" || status === -1) return "chargeback"
    return "rejected"
  }

  protected generateSignature(data: string, secret: string): string {
    try {
      const crypto = require("crypto")
      return crypto
        .createHash("md5")
        .update(data + secret)
        .digest("hex")
    } catch (error) {
      console.error("Crypto not available:", error)
      return btoa(data + secret) // Fallback
    }
  }
}

// Lootably Client
export class LootablyClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey || !this.provider.config.placementId) {
      console.warn("Lootably: Missing API credentials")
      return []
    }

    const endpoint = `/api/v1/offers?placement_id=${this.provider.config.placementId}&user_id=${userId}`

    try {
      const data = await this.makeRequest(endpoint, {
        headers: {
          "X-API-Key": this.provider.config.apiKey,
        },
      })

      return (
        data.data?.map((offer: any) => ({
          id: `lootably_${offer.id}`,
          providerId: "lootably",
          title: offer.title || "Lootably Offer",
          description: offer.description || "Complete this offer to earn points",
          points: Math.floor((offer.reward || 0.3) * 100),
          payout: offer.reward || 0.3,
          category: offer.category || "general",
          difficulty: "easy",
          estimatedTime: `${offer.time || 10} minutes`,
          requirements: [],
          countries: offer.countries || ["US"],
          devices: ["mobile", "desktop"],
          url: offer.link || "#",
          imageUrl: offer.image,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("Lootably API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    return `${this.baseUrl}/click?placement_id=${this.provider.config.placementId}&user_id=${userId}&offer_id=${offerId.replace("lootably_", "")}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    return {
      offerId: `lootably_${data.offer_id}`,
      userId: data.user_id,
      providerId: "lootably",
      transactionId: data.transaction_id || `lootably_${Date.now()}`,
      points: Math.floor((data.reward || 0.3) * 100),
      payout: data.reward || 0.3,
      status: "completed",
      completedAt: new Date(),
    }
  }
}

// OfferToro Client
export class OfferToroClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey || !this.provider.config.appId) {
      console.warn("OfferToro: Missing API credentials")
      return []
    }

    const endpoint = `/api/v1/offers?app_id=${this.provider.config.appId}&user_id=${userId}`

    try {
      const data = await this.makeRequest(endpoint, {
        headers: {
          "X-API-Key": this.provider.config.apiKey,
        },
      })

      return (
        data.offers?.map((offer: any) => ({
          id: `offertoro_${offer.offer_id}`,
          providerId: "offertoro",
          title: offer.offer_name || "OfferToro Offer",
          description: offer.offer_desc || "Complete this offer to earn points",
          points: Math.floor((offer.amount || 0.6) * 100),
          payout: offer.amount || 0.6,
          category: offer.category || "general",
          difficulty: "medium",
          estimatedTime: `${offer.time || 20} minutes`,
          requirements: offer.requirements?.split(",") || [],
          countries: offer.countries?.split(",") || ["US"],
          devices: offer.device?.split(",") || ["mobile", "desktop"],
          url: offer.link || "#",
          imageUrl: offer.image,
          rating: offer.rating || 4.0,
          isActive: offer.is_active !== false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("OfferToro API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    return `${this.baseUrl}/click?app_id=${this.provider.config.appId}&user_id=${userId}&offer_id=${offerId.replace("offertoro_", "")}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    if (!this.provider.config.secretKey) {
      throw new Error("OfferToro: Missing secret key for callback verification")
    }

    const expectedSignature = this.generateSignature(
      `${data.user_id}${data.offer_id}${data.amount}`,
      this.provider.config.secretKey,
    )

    if (data.signature && data.signature !== expectedSignature) {
      throw new Error("Invalid callback signature")
    }

    return {
      offerId: `offertoro_${data.offer_id}`,
      userId: data.user_id,
      providerId: "offertoro",
      transactionId: data.transaction_id || `offertoro_${Date.now()}`,
      points: Math.floor((data.amount || 0.6) * 100),
      payout: data.amount || 0.6,
      status: data.status || "completed",
      completedAt: new Date(),
    }
  }
}

// BitLabs Client
export class BitLabsClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey || !this.provider.config.appToken) {
      console.warn("BitLabs: Missing API credentials")
      return []
    }

    const endpoint = `/v1/surveys?user_id=${userId}`

    try {
      const data = await this.makeRequest(endpoint, {
        headers: {
          "X-API-Token": this.provider.config.apiKey,
          "X-App-Token": this.provider.config.appToken,
        },
      })

      return (
        data.surveys?.map((survey: any) => ({
          id: `bitlabs_${survey.id}`,
          providerId: "bitlabs",
          title: survey.name || "BitLabs Survey",
          description: survey.description || "Complete this survey to earn rewards",
          points: Math.floor((survey.reward || 0.7) * 100),
          payout: survey.reward || 0.7,
          category: "survey",
          difficulty: survey.difficulty || "easy",
          estimatedTime: `${survey.loi || 10} minutes`,
          requirements: [],
          countries: survey.countries || ["US"],
          devices: ["mobile", "desktop"],
          url: survey.click_url || "#",
          rating: 4.5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("BitLabs API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    return `${this.baseUrl}/v1/click?user_id=${userId}&survey_id=${offerId.replace("bitlabs_", "")}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    return {
      offerId: `bitlabs_${data.survey_id}`,
      userId: data.user_id,
      providerId: "bitlabs",
      transactionId: data.transaction_id || `bitlabs_${Date.now()}`,
      points: Math.floor((data.reward || 0.7) * 100),
      payout: data.reward || 0.7,
      status: data.status === "complete" ? "completed" : "rejected",
      completedAt: new Date(),
    }
  }
}

// AyeT Studios Client
export class AyetStudiosClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey) {
      console.warn("AyeT Studios: Missing API credentials")
      return []
    }

    const endpoint = `/api/v1/offers?user_id=${userId}&api_key=${this.provider.config.apiKey}`

    try {
      const data = await this.makeRequest(endpoint)

      return (
        data.offers?.map((offer: any) => ({
          id: `ayetstudios_${offer.id}`,
          providerId: "ayetstudios",
          title: offer.title || "AyeT Studios Offer",
          description: offer.description || "Complete this offer to earn points",
          points: Math.floor((offer.payout || 0.5) * 100),
          payout: offer.payout || 0.5,
          category: offer.category || "general",
          difficulty: "medium",
          estimatedTime: `${offer.time || 15} minutes`,
          requirements: [],
          countries: offer.countries || ["US"],
          devices: ["mobile", "desktop"],
          url: offer.click_url || "#",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("AyeT Studios API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    return `${this.baseUrl}/click?api_key=${this.provider.config.apiKey}&user_id=${userId}&offer_id=${offerId.replace("ayetstudios_", "")}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    if (!this.provider.config.secretKey) {
      throw new Error("AyeT Studios: Missing secret key for callback verification")
    }

    const expectedSignature = this.generateSignature(
      `${data.user_id}${data.offer_id}${data.payout}`,
      this.provider.config.secretKey,
    )

    if (data.signature && data.signature !== expectedSignature) {
      throw new Error("Invalid callback signature")
    }

    return {
      offerId: `ayetstudios_${data.offer_id}`,
      userId: data.user_id,
      providerId: "ayetstudios",
      transactionId: data.transaction_id || `ayetstudios_${Date.now()}`,
      points: Math.floor((data.payout || 0.5) * 100),
      payout: data.payout || 0.5,
      status: data.status === "completed" ? "completed" : "rejected",
      completedAt: new Date(),
    }
  }
}

// Revenue Universe Client
export class RevenueUniverseClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey) {
      console.warn("Revenue Universe: Missing API credentials")
      return []
    }

    const endpoint = `/api/offers?user_id=${userId}&api_key=${this.provider.config.apiKey}`

    try {
      const data = await this.makeRequest(endpoint)

      return (
        data.offers?.map((offer: any) => ({
          id: `revenue_universe_${offer.id}`,
          providerId: "revenue_universe",
          title: offer.name || "Revenue Universe Offer",
          description: offer.description || "Complete this offer to earn rewards",
          points: Math.floor((offer.payout || 0.3) * 100),
          payout: offer.payout || 0.3,
          category: offer.category || "general",
          difficulty: "easy",
          estimatedTime: `${offer.time || 10} minutes`,
          requirements: [],
          countries: offer.countries || ["US"],
          devices: ["mobile", "desktop"],
          url: offer.link || "#",
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("Revenue Universe API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    return `${this.baseUrl}/click?api_key=${this.provider.config.apiKey}&user_id=${userId}&offer_id=${offerId.replace("revenue_universe_", "")}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    return {
      offerId: `revenue_universe_${data.offer_id}`,
      userId: data.user_id,
      providerId: "revenue_universe",
      transactionId: data.transaction_id || `revenue_universe_${Date.now()}`,
      points: Math.floor((data.payout || 0.3) * 100),
      payout: data.payout || 0.3,
      status: "completed",
      completedAt: new Date(),
    }
  }
}

// Persona.ly Client
export class PersonaLyClient extends OfferProviderClient {
  async fetchOffers(userId: string): Promise<Offer[]> {
    if (!this.provider.config.apiKey) {
      console.warn("Persona.ly: Missing API credentials")
      return []
    }

    const endpoint = `/api/v1/surveys?user_id=${userId}&api_key=${this.provider.config.apiKey}`

    try {
      const data = await this.makeRequest(endpoint)

      return (
        data.surveys?.map((survey: any) => ({
          id: `persona_ly_${survey.id}`,
          providerId: "persona_ly",
          title: survey.title || "Persona.ly Survey",
          description: survey.description || "Complete this survey to earn points",
          points: Math.floor((survey.reward || 0.8) * 100),
          payout: survey.reward || 0.8,
          category: "survey",
          difficulty: "easy",
          estimatedTime: `${survey.loi || 12} minutes`,
          requirements: [],
          countries: survey.countries || ["US"],
          devices: ["mobile", "desktop"],
          url: survey.click_url || "#",
          rating: 4.2,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        })) || []
      )
    } catch (error) {
      console.error("Persona.ly API Error:", error)
      return []
    }
  }

  generateOfferUrl(offerId: string, userId: string): string {
    return `${this.baseUrl}/click?api_key=${this.provider.config.apiKey}&user_id=${userId}&survey_id=${offerId.replace("persona_ly_", "")}`
  }

  async verifyCompletion(transactionId: string): Promise<OfferCompletion | null> {
    return null
  }

  async handleCallback(data: any): Promise<OfferCompletion | null> {
    return {
      offerId: `persona_ly_${data.survey_id}`,
      userId: data.user_id,
      providerId: "persona_ly",
      transactionId: data.transaction_id || `persona_ly_${Date.now()}`,
      points: Math.floor((data.reward || 0.8) * 100),
      payout: data.reward || 0.8,
      status: data.status === "complete" ? "completed" : "rejected",
      completedAt: new Date(),
    }
  }
}

// Provider Factory
export class OfferProviderFactory {
  static createClient(providerId: string): OfferProviderClient {
    const provider = OFFERWALL_PROVIDERS[providerId]
    if (!provider) {
      throw new Error(`Unknown provider: ${providerId}`)
    }

    switch (providerId) {
      case "cpx_research":
        return new CPXResearchClient(provider)
      case "adgem":
        return new AdGemClient(provider)
      case "lootably":
        return new LootablyClient(provider)
      case "offertoro":
        return new OfferToroClient(provider)
      case "bitlabs":
        return new BitLabsClient(provider)
      case "ayetstudios":
        return new AyetStudiosClient(provider)
      case "revenue_universe":
        return new RevenueUniverseClient(provider)
      case "persona_ly":
        return new PersonaLyClient(provider)
      default:
        throw new Error(`No client implementation for provider: ${providerId}`)
    }
  }

  static getAllClients(): OfferProviderClient[] {
    const implementedProviders = [
      "cpx_research",
      "adgem",
      "lootably",
      "offertoro",
      "bitlabs",
      "ayetstudios",
      "revenue_universe",
      "persona_ly",
    ]

    return implementedProviders
      .filter((id) => {
        const provider = OFFERWALL_PROVIDERS[id]
        return provider?.enabled && this.hasRequiredCredentials(id)
      })
      .map((id) => {
        try {
          return this.createClient(id)
        } catch (error) {
          console.error(`Failed to create client for ${id}:`, error)
          return null
        }
      })
      .filter((client): client is OfferProviderClient => client !== null)
  }

  static getAvailableProviders(): string[] {
    return [
      "cpx_research",
      "adgem",
      "lootably",
      "offertoro",
      "bitlabs",
      "ayetstudios",
      "revenue_universe",
      "persona_ly",
    ]
  }

  private static hasRequiredCredentials(providerId: string): boolean {
    const provider = OFFERWALL_PROVIDERS[providerId]
    if (!provider) return false

    switch (providerId) {
      case "cpx_research":
        return !!(provider.config.apiKey && provider.config.appId)
      case "adgem":
        return !!(provider.config.apiKey && provider.config.appId)
      case "lootably":
        return !!(provider.config.apiKey && provider.config.placementId)
      case "offertoro":
        return !!(provider.config.apiKey && provider.config.appId)
      case "bitlabs":
        return !!(provider.config.apiKey && provider.config.appToken)
      case "ayetstudios":
        return !!provider.config.apiKey
      case "revenue_universe":
        return !!provider.config.apiKey
      case "persona_ly":
        return !!provider.config.apiKey
      default:
        return false
    }
  }
}
