import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { DailyBonus, CreateDailyBonusData } from "@/types"

export class DailyBonusManager {
  private supabase = createClientComponentClient()

  /**
   * 🔥 Check if user can claim daily bonus today
   */
  async canClaimToday(userId: string): Promise<boolean> {
    try {
      const today = new Date().toLocaleDateString("en-CA")

      const { data, error } = await this.supabase
        .from("daily_bonuses")
        .select("id")
        .eq("user_id", userId)
        .eq("bonus_date", today)
        .maybeSingle()

      if (error) throw error

      return !data // Can claim if no record exists
    } catch (error) {
      console.error("❌ canClaimToday error:", error)
      return false
    }
  }

  /**
   * 🔥 Get user's daily bonus history
   */
  async getUserBonusHistory(userId: string, limit = 30): Promise<DailyBonus[]> {
    try {
      const { data, error } = await this.supabase
        .from("daily_bonuses")
        .select("*")
        .eq("user_id", userId)
        .order("bonus_date", { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []) as DailyBonus[]
    } catch (error) {
      console.error("❌ getUserBonusHistory error:", error)
      return []
    }
  }

  /**
   * 🔥 Get daily bonus statistics
   */
  async getBonusStats(userId: string): Promise<{
    totalBonuses: number
    totalAmount: number
    currentStreak: number
    longestStreak: number
    lastClaimDate?: string
  }> {
    try {
      const { data, error } = await this.supabase
        .from("daily_bonuses")
        .select("bonus_date, amount, login_streak")
        .eq("user_id", userId)
        .order("bonus_date", { ascending: false })

      if (error) throw error

      const bonuses = data || []

      if (bonuses.length === 0) {
        return {
          totalBonuses: 0,
          totalAmount: 0,
          currentStreak: 0,
          longestStreak: 0,
        }
      }

      // Calculate statistics
      const totalBonuses = bonuses.length
      const totalAmount = bonuses.reduce((sum, bonus) => sum + Number(bonus.amount), 0)
      const currentStreak = bonuses[0]?.login_streak || 0
      const longestStreak = Math.max(...bonuses.map((b) => b.login_streak || 0))
      const lastClaimDate = bonuses[0]?.bonus_date

      return {
        totalBonuses,
        totalAmount: Number(totalAmount.toFixed(2)),
        currentStreak,
        longestStreak,
        lastClaimDate,
      }
    } catch (error) {
      console.error("❌ getBonusStats error:", error)
      return {
        totalBonuses: 0,
        totalAmount: 0,
        currentStreak: 0,
        longestStreak: 0,
      }
    }
  }

  /**
   * 🔥 Calculate next bonus amount based on streak
   */
  calculateBonusAmount(loginStreak: number): {
    baseAmount: number
    streakBonus: number
    totalAmount: number
  } {
    const baseAmount = 25 // Base bonus points
    const streakBonus = Math.min(loginStreak * 5, 50) // Max 50 extra points
    const totalAmount = baseAmount + streakBonus

    return {
      baseAmount,
      streakBonus,
      totalAmount,
    }
  }

  /**
   * 🔥 Validate daily bonus data
   */
  validateBonusData(data: CreateDailyBonusData): {
    isValid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    if (!data.user_id) {
      errors.push("User ID is required")
    }

    if (!data.bonus_date) {
      errors.push("Bonus date is required")
    }

    if (data.amount <= 0) {
      errors.push("Bonus amount must be positive")
    }

    if (data.streak_count <= 0) {
      errors.push("Streak count must be positive")
    }

    if (data.login_streak <= 0) {
      errors.push("Login streak must be positive")
    }

    // Check if bonus date is not in the future
    const bonusDate = new Date(data.bonus_date)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // End of today

    if (bonusDate > today) {
      errors.push("Bonus date cannot be in the future")
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }
}

// Singleton instance
export const dailyBonusManager = new DailyBonusManager()
