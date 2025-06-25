import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { UserBadge } from "@/types"

export class BadgeManager {
  private supabase = createClientComponentClient()

  // Check and award badges for a user
  async checkAndAwardBadges(userId: string): Promise<UserBadge[]> {
    try {
      // Get all active badges
      const { data: badges, error: badgesError } = await this.supabase.from("badges").select("*").eq("is_active", true)

      if (badgesError) throw badgesError

      // Get user's current badges
      const { data: userBadges, error: userBadgesError } = await this.supabase
        .from("user_badges")
        .select("badge_id")
        .eq("user_id", userId)

      if (userBadgesError) throw userBadgesError

      const earnedBadgeIds = new Set(userBadges?.map((ub) => ub.badge_id) || [])
      const newBadges: UserBadge[] = []

      // Check each badge requirement
      for (const badge of badges || []) {
        if (earnedBadgeIds.has(badge.id)) continue

        const meetsRequirement = await this.checkBadgeRequirement(
          userId,
          badge.requirement_type,
          badge.requirement_value,
        )

        if (meetsRequirement) {
          const newBadge = await this.awardBadge(userId, badge.id)
          if (newBadge) {
            newBadges.push(newBadge)

            // Award badge reward if any
            if (badge.reward_amount > 0) {
              await this.awardBadgeReward(userId, badge.id, badge.reward_amount)
            }
          }
        }
      }

      return newBadges
    } catch (error) {
      console.error("Error checking badges:", error)
      return []
    }
  }

  // Check if user meets badge requirement - SESUAI REQUIREMENT_TYPE YANG ADA
  private async checkBadgeRequirement(
    userId: string,
    requirementType: string,
    requirementValue: number,
  ): Promise<boolean> {
    try {
      // Cek berdasarkan requirement_type yang BENAR-BENAR ADA di database
      switch (requirementType) {
        case "task_completion": // Sesuaikan dengan yang ada di DB
          const { count: taskCount } = await this.supabase
            .from("user_tasks")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .eq("status", "completed")
          return (taskCount || 0) >= requirementValue

        case "total_earned": // Sesuaikan dengan yang ada di DB
          const { data: profile } = await this.supabase
            .from("profiles")
            .select("total_earned")
            .eq("id", userId)
            .single()
          return (profile?.total_earned || 0) >= requirementValue

        case "login_days": // Sesuaikan dengan yang ada di DB
          const { data: profileStreak } = await this.supabase
            .from("profiles")
            .select("login_streak")
            .eq("id", userId)
            .single()
          return (profileStreak?.login_streak || 0) >= requirementValue

        case "referral_count": // Sesuaikan dengan yang ada di DB
          const { count: referralCount } = await this.supabase
            .from("referrals")
            .select("*", { count: "exact", head: true })
            .eq("referrer_id", userId)
          return (referralCount || 0) >= requirementValue

        default:
          console.warn(`Unknown requirement type: ${requirementType}`)
          return false
      }
    } catch (error) {
      console.error(`Error checking requirement ${requirementType}:`, error)
      return false
    }
  }

  // Award badge to user - TANPA PROGRESS COLUMN
  private async awardBadge(userId: string, badgeId: string): Promise<UserBadge | null> {
    try {
      const { data, error } = await this.supabase
        .from("user_badges")
        .insert({
          user_id: userId,
          badge_id: badgeId,
          // HAPUS progress: 100 karena column gak ada!
        })
        .select(`
          *,
          badge:badges(*)
        `)
        .single()

      if (error) throw error
      return data as UserBadge
    } catch (error) {
      console.error("Error awarding badge:", error)
      return null
    }
  }

  // Award badge reward points
  private async awardBadgeReward(userId: string, badgeId: string, amount: number) {
    try {
      // Create transaction for badge reward
      const { error: transactionError } = await this.supabase.from("transactions").insert({
        user_id: userId,
        type: "bonus",
        amount: amount,
        description: "Badge reward earned",
        reference_id: badgeId,
        reference_type: "badge",
      })

      if (transactionError) throw transactionError

      // Update user balance
      const { error: balanceError } = await this.supabase.rpc("update_user_balance", {
        p_user_id: userId,
        p_amount: amount,
      })

      if (balanceError) throw balanceError
    } catch (error) {
      console.error("Error awarding badge reward:", error)
    }
  }

  // Get user badges with details
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    try {
      const { data, error } = await this.supabase
        .from("user_badges")
        .select(`
          *,
          badge:badges(*)
        `)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false })

      if (error) throw error
      return data as UserBadge[]
    } catch (error) {
      console.error("Error getting user badges:", error)
      return []
    }
  }
}

export const badgeManager = new BadgeManager()
