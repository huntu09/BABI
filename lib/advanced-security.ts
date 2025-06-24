import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export class AdvancedSecurity {
  private supabase = createClientComponentClient()

  // 🛡️ Advanced Fraud Detection
  async detectAdvancedFraud(userId: string, actionType: string, metadata: any) {
    const checks = await Promise.all([
      this.checkVPNProxy(metadata.ipAddress),
      this.checkDeviceFingerprint(userId, metadata.deviceFingerprint),
      this.checkBehavioralPatterns(userId, actionType),
      this.checkGeolocation(userId, metadata.ipAddress),
      this.checkTimePatterns(userId, actionType),
    ])

    const fraudScore = this.calculateAdvancedFraudScore(checks)

    // Log comprehensive fraud data
    await this.logAdvancedFraud(userId, actionType, metadata, checks, fraudScore)

    return {
      fraudScore,
      checks,
      blocked: fraudScore > 0.8,
      flagged: fraudScore > 0.6,
      reasons: checks.filter((check) => check.suspicious).map((check) => check.reason),
    }
  }

  // VPN/Proxy Detection
  private async checkVPNProxy(ipAddress: string) {
    // In production, use a service like IPQualityScore or similar
    const suspiciousRanges = ["10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "127.0.0.0/8"]

    const isSuspicious = suspiciousRanges.some((range) => this.ipInRange(ipAddress, range))

    return {
      type: "vpn_proxy",
      suspicious: isSuspicious,
      reason: isSuspicious ? "VPN/Proxy detected" : null,
      score: isSuspicious ? 0.7 : 0.1,
    }
  }

  // Device Fingerprint Analysis
  private async checkDeviceFingerprint(userId: string, fingerprint: string) {
    const { data: existingFingerprints } = await this.supabase
      .from("user_devices")
      .select("device_fingerprint, user_id")
      .eq("device_fingerprint", fingerprint)
      .neq("user_id", userId)

    const multipleUsers = (existingFingerprints?.length || 0) > 0

    return {
      type: "device_fingerprint",
      suspicious: multipleUsers,
      reason: multipleUsers ? "Device used by multiple accounts" : null,
      score: multipleUsers ? 0.8 : 0.1,
      data: { sharedWith: existingFingerprints?.length || 0 },
    }
  }

  // Behavioral Pattern Analysis
  private async checkBehavioralPatterns(userId: string, actionType: string) {
    const now = new Date()
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000)

    const { data: recentActions } = await this.supabase
      .from("fraud_logs")
      .select("created_at")
      .eq("user_id", userId)
      .eq("type", actionType)
      .gte("created_at", hourAgo.toISOString())

    const actionCount = recentActions?.length || 0
    const suspicious = actionCount > 10 // More than 10 actions per hour

    return {
      type: "behavioral_pattern",
      suspicious,
      reason: suspicious ? "Unusual activity frequency" : null,
      score: Math.min(actionCount / 10, 1) * 0.6,
      data: { actionsPerHour: actionCount },
    }
  }

  // Geolocation Verification
  private async checkGeolocation(userId: string, ipAddress: string) {
    // Get user's typical location from previous logins
    const { data: locations } = await this.supabase
      .from("user_locations")
      .select("country, city, lat, lng")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5)

    // In production, use IP geolocation service
    const currentLocation = await this.getLocationFromIP(ipAddress)

    if (!locations?.length) {
      // First time login, record location
      await this.recordUserLocation(userId, currentLocation)
      return {
        type: "geolocation",
        suspicious: false,
        reason: null,
        score: 0.1,
      }
    }

    // Check if current location is far from usual locations
    const distances = locations.map((loc) =>
      this.calculateDistance(currentLocation.lat, currentLocation.lng, loc.lat, loc.lng),
    )

    const minDistance = Math.min(...distances)
    const suspicious = minDistance > 1000 // More than 1000km from usual location

    return {
      type: "geolocation",
      suspicious,
      reason: suspicious ? "Login from unusual location" : null,
      score: Math.min(minDistance / 1000, 1) * 0.5,
      data: { distanceKm: minDistance },
    }
  }

  // Time Pattern Analysis
  private async checkTimePatterns(userId: string, actionType: string) {
    const { data: actions } = await this.supabase
      .from("fraud_logs")
      .select("created_at")
      .eq("user_id", userId)
      .eq("type", actionType)
      .order("created_at", { ascending: false })
      .limit(10)

    if (!actions?.length)
      return {
        type: "time_pattern",
        suspicious: false,
        reason: null,
        score: 0.1,
      }

    // Check for bot-like regular intervals
    const intervals = []
    for (let i = 1; i < actions.length; i++) {
      const diff = new Date(actions[i - 1].created_at).getTime() - new Date(actions[i].created_at).getTime()
      intervals.push(diff)
    }

    // Check if intervals are suspiciously regular (bot behavior)
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance =
      intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length

    const suspicious = variance < 1000 && avgInterval < 60000 // Very regular, less than 1 minute

    return {
      type: "time_pattern",
      suspicious,
      reason: suspicious ? "Bot-like timing patterns detected" : null,
      score: suspicious ? 0.7 : 0.1,
      data: { avgIntervalMs: avgInterval, variance },
    }
  }

  // Calculate comprehensive fraud score
  private calculateAdvancedFraudScore(checks: any[]) {
    const weights = {
      vpn_proxy: 0.3,
      device_fingerprint: 0.25,
      behavioral_pattern: 0.2,
      geolocation: 0.15,
      time_pattern: 0.1,
    }

    return checks.reduce((total, check) => {
      const weight = weights[check.type as keyof typeof weights] || 0.1
      return total + check.score * weight
    }, 0)
  }

  // Enhanced logging
  private async logAdvancedFraud(userId: string, actionType: string, metadata: any, checks: any[], fraudScore: number) {
    await this.supabase.from("advanced_fraud_logs").insert({
      user_id: userId,
      action_type: actionType,
      fraud_score: fraudScore,
      checks: checks,
      metadata: metadata,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      risk_level: this.getRiskLevel(fraudScore),
      created_at: new Date().toISOString(),
    })
  }

  // Utility functions
  private ipInRange(ip: string, range: string): boolean {
    // Simplified IP range check - use proper library in production
    return ip.startsWith(range.split("/")[0].split(".").slice(0, 2).join("."))
  }

  private async getLocationFromIP(ipAddress: string) {
    // Mock implementation - use real IP geolocation service
    return {
      country: "ID",
      city: "Jakarta",
      lat: -6.2088,
      lng: 106.8456,
    }
  }

  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private async recordUserLocation(userId: string, location: any) {
    await this.supabase.from("user_locations").insert({
      user_id: userId,
      country: location.country,
      city: location.city,
      lat: location.lat,
      lng: location.lng,
      ip_address: location.ipAddress,
    })
  }

  private getRiskLevel(score: number): string {
    if (score >= 0.8) return "critical"
    if (score >= 0.6) return "high"
    if (score >= 0.4) return "medium"
    return "low"
  }
}

export const advancedSecurity = new AdvancedSecurity()
