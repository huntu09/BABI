class SecurityManager {
  private supabase: any // Replace 'any' with the actual Supabase client type

  constructor(supabaseClient: any) {
    this.supabase = supabaseClient
  }

  private calculateConfidenceScore(details: Record<string, any>): number {
    // Implement your confidence score calculation logic here
    // This is a placeholder and should be replaced with actual logic
    let score = 0

    if (details.suspiciousActivity) {
      score += 50
    }

    if (details.unusualLocation) {
      score += 30
    }

    if (details.failedLoginAttempts > 3) {
      score += 20
    }

    return score
  }

  // Fix fraud log creation - pakai event_type bukan type
  private async logFraudAttempt(
    userId: string | null,
    eventType: string,
    details: Record<string, any>,
    riskLevel: "low" | "medium" | "high" | "critical" = "medium",
  ) {
    try {
      await this.supabase.from("fraud_logs").insert({
        user_id: userId,
        event_type: eventType, // BUKAN type!
        risk_level: riskLevel,
        details,
        ip_address: details.ip_address,
        user_agent: details.user_agent,
        confidence_score: this.calculateConfidenceScore(details),
      })
    } catch (error) {
      console.error("Error logging fraud attempt:", error)
    }
  }

  async recordLoginAttempt(userId: string | null, isSuccessful: boolean, details: Record<string, any>) {
    try {
      await this.supabase.from("login_attempts").insert({
        user_id: userId,
        successful: isSuccessful,
        ip_address: details.ip_address,
        user_agent: details.user_agent,
        timestamp: new Date(),
      })

      if (!isSuccessful) {
        await this.logFraudAttempt(userId, "failed_login", details, "medium")
      }
    } catch (error) {
      console.error("Error recording login attempt:", error)
    }
  }

  async recordPasswordResetRequest(userId: string | null, details: Record<string, any>) {
    try {
      await this.supabase.from("password_reset_requests").insert({
        user_id: userId,
        ip_address: details.ip_address,
        user_agent: details.user_agent,
        timestamp: new Date(),
      })

      await this.logFraudAttempt(userId, "password_reset_request", details, "low")
    } catch (error) {
      console.error("Error recording password reset request:", error)
    }
  }

  async recordSuspiciousActivity(userId: string | null, activityType: string, details: Record<string, any>) {
    try {
      await this.logFraudAttempt(userId, activityType, details, "high")
    } catch (error) {
      console.error("Error recording suspicious activity:", error)
    }
  }
}

export default SecurityManager
