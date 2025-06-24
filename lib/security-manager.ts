import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export class SecurityManager {
  private supabase = createClientComponentClient()

  // Enhanced fraud detection
  async detectFraud(userId: string, actionType: string, metadata: any = {}) {
    try {
      const fraudScore = await this.calculateFraudScore(userId, actionType, metadata)

      // Log the activity
      await this.logActivity(userId, actionType, metadata, fraudScore)

      // Auto-block if high risk
      if (fraudScore > 0.8) {
        await this.autoBlock(userId, "high_fraud_score", fraudScore)
        return { blocked: true, reason: "high_fraud_score", score: fraudScore }
      }

      // Flag for review if medium risk
      if (fraudScore > 0.6) {
        await this.flagForReview(userId, actionType, fraudScore)
        return { flagged: true, reason: "medium_fraud_score", score: fraudScore }
      }

      return { allowed: true, score: fraudScore }
    } catch (error) {
      console.error("Fraud detection error:", error)
      return { error: true, message: "Fraud detection failed" }
    }
  }

  // Calculate comprehensive fraud score
  private async calculateFraudScore(userId: string, actionType: string, metadata: any) {
    const { data, error } = await this.supabase.rpc("calculate_fraud_score", {
      p_user_id: userId,
      p_action_type: actionType,
      p_ip_address: metadata.ipAddress,
      p_user_agent: metadata.userAgent,
    })

    if (error) throw error
    return data || 0
  }

  // Log suspicious activity
  private async logActivity(userId: string, actionType: string, metadata: any, fraudScore: number) {
    await this.supabase.from("fraud_logs").insert({
      user_id: userId,
      type: actionType,
      details: metadata,
      ip_address: metadata.ipAddress,
      user_agent: metadata.userAgent,
      confidence_score: fraudScore,
      risk_level: this.getRiskLevel(fraudScore),
    })
  }

  // Auto-block suspicious users
  private async autoBlock(userId: string, reason: string, score: number) {
    await this.supabase
      .from("profiles")
      .update({
        account_status: "suspended",
        suspicious_activity_count: this.supabase.raw("suspicious_activity_count + 1"),
      })
      .eq("id", userId)

    // Log admin action
    await this.supabase.from("admin_actions").insert({
      admin_id: null, // System action
      action_type: "auto_suspend",
      target_user_id: userId,
      details: { reason, fraud_score: score },
      reason: `Auto-suspended due to ${reason} (score: ${score})`,
    })
  }

  // Flag for manual review
  private async flagForReview(userId: string, actionType: string, score: number) {
    await this.supabase.from("suspicious_patterns").insert({
      user_id: userId,
      pattern_type: actionType,
      details: { fraud_score: score },
      severity: "medium",
      auto_action: "flag",
    })
  }

  // Check withdrawal security
  async checkWithdrawalSecurity(userId: string, amount: number, metadata: any) {
    try {
      // Check withdrawal limits
      const { data: limitCheck } = await this.supabase.rpc("check_withdrawal_limits", {
        p_user_id: userId,
        p_amount: amount,
      })

      if (!limitCheck.allowed) {
        return {
          allowed: false,
          reason: limitCheck.reason,
          details: limitCheck,
        }
      }

      // Fraud detection for withdrawal
      const fraudCheck = await this.detectFraud(userId, "withdrawal_request", {
        amount,
        ...metadata,
      })

      if (fraudCheck.blocked) {
        return {
          allowed: false,
          reason: "fraud_detected",
          score: fraudCheck.score,
        }
      }

      // Require manual review for high amounts or flagged users
      const requiresReview = amount > 5000 || fraudCheck.flagged // $50+ or flagged

      return {
        allowed: true,
        requiresManualReview: requiresReview,
        fraudScore: fraudCheck.score,
        dailyRemaining: limitCheck.daily_remaining,
        monthlyRemaining: limitCheck.monthly_remaining,
      }
    } catch (error) {
      console.error("Withdrawal security check error:", error)
      return { allowed: false, reason: "security_check_failed" }
    }
  }

  // Secure point crediting
  async creditPoints(userId: string, amount: number, sourceType: string, sourceId: string, metadata: any = {}) {
    try {
      // Fraud detection first
      const fraudCheck = await this.detectFraud(userId, "point_credit", {
        amount,
        sourceType,
        sourceId,
        ...metadata,
      })

      if (fraudCheck.blocked) {
        throw new Error(`Point credit blocked: ${fraudCheck.reason}`)
      }

      // Use secure database function
      const { data, error } = await this.supabase.rpc("secure_credit_points", {
        p_user_id: userId,
        p_amount: amount,
        p_source_type: sourceType,
        p_source_id: sourceId,
        p_description: metadata.description,
        p_ip_address: metadata.ipAddress,
        p_user_agent: metadata.userAgent,
      })

      if (error) throw error
      if (!data) throw new Error("Point credit failed")

      return { success: true, fraudScore: fraudCheck.score }
    } catch (error) {
      console.error("Secure point credit error:", error)
      throw error
    }
  }

  // Device fingerprinting
  generateDeviceFingerprint(userAgent: string, additionalData: any = {}) {
    const fingerprint = {
      userAgent,
      screen: additionalData.screen,
      timezone: additionalData.timezone,
      language: additionalData.language,
      platform: additionalData.platform,
      timestamp: Date.now(),
    }

    return Buffer.from(JSON.stringify(fingerprint)).toString("base64")
  }

  // Rate limiting check
  async checkRateLimit(userId: string, actionType: string, windowMinutes = 60, maxActions = 10) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000)

    const { count, error } = await this.supabase
      .from("fraud_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("action_type", actionType)
      .gte("created_at", windowStart.toISOString())

    if (error) throw error

    return {
      allowed: (count || 0) < maxActions,
      current: count || 0,
      limit: maxActions,
      windowMinutes,
    }
  }

  private getRiskLevel(score: number): string {
    if (score >= 0.8) return "critical"
    if (score >= 0.6) return "high"
    if (score >= 0.4) return "medium"
    return "low"
  }
}

export const securityManager = new SecurityManager()
