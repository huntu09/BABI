import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export interface HybridTask {
  id: string
  title: string
  description: string
  reward_amount: number
  task_type: string
  task_source: "sample" | "offerwall"
  provider: string
  difficulty: string
  estimated_time: string
  is_completed: boolean
  recommendation_score: number
  external_offer_id?: string
  provider_config?: any
  url?: string
}

export interface TaskRecommendationOptions {
  limit?: number
  category?: string
  difficulty?: string
  source?: "sample" | "offerwall" | "all"
  minPayout?: number
  maxPayout?: number
}

export class HybridTaskManager {
  private supabase = createClientComponentClient()

  // Get personalized task recommendations
  async getTaskRecommendations(userId: string, options: TaskRecommendationOptions = {}): Promise<HybridTask[]> {
    try {
      const { data, error } = await this.supabase.rpc("get_hybrid_task_recommendations", {
        p_user_id: userId,
        p_limit: options.limit || 20,
      })

      if (error) throw error

      // Apply additional filters if specified
      let filteredTasks = data || []

      if (options.category) {
        filteredTasks = filteredTasks.filter((task: HybridTask) => task.task_type === options.category)
      }

      if (options.source && options.source !== "all") {
        filteredTasks = filteredTasks.filter((task: HybridTask) => task.task_source === options.source)
      }

      if (options.minPayout) {
        filteredTasks = filteredTasks.filter((task: HybridTask) => task.reward_amount >= options.minPayout!)
      }

      if (options.maxPayout) {
        filteredTasks = filteredTasks.filter((task: HybridTask) => task.reward_amount <= options.maxPayout!)
      }

      return filteredTasks
    } catch (error) {
      console.error("Error getting task recommendations:", error)
      return []
    }
  }

  // Complete a sample task
  async completeSampleTask(taskId: string): Promise<{
    success: boolean
    message?: string
    pointsEarned?: number
    newBadges?: any[]
  }> {
    try {
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })

      const data = await response.json()
      return data
    } catch (error) {
      console.error("Error completing sample task:", error)
      return { success: false, message: "Failed to complete task" }
    }
  }

  // Handle real offerwall task click
  async handleOfferwallTask(task: HybridTask): Promise<{
    success: boolean
    offerUrl?: string
    message?: string
  }> {
    try {
      // For CPX Research, generate the offer URL
      if (task.provider === "CPX Research" && task.external_offer_id) {
        const response = await fetch("/api/offerwall/generate-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "cpx_research",
            offerId: task.external_offer_id,
            taskId: task.id,
          }),
        })

        const data = await response.json()

        if (data.success) {
          return {
            success: true,
            offerUrl: data.offerUrl,
            message: `Opening ${task.provider} offer...`,
          }
        }
      }

      // Fallback to direct URL if available
      if (task.url) {
        return {
          success: true,
          offerUrl: task.url,
          message: `Opening ${task.provider} offer...`,
        }
      }

      return {
        success: false,
        message: "Offer URL not available",
      }
    } catch (error) {
      console.error("Error handling offerwall task:", error)
      return { success: false, message: "Failed to open offer" }
    }
  }

  // Update user task preferences
  async updateTaskPreferences(preferences: {
    preferredCategories?: string[]
    preferredDifficulty?: string
    minPayout?: number
    maxPayout?: number
    prefersRealOffers?: boolean
  }): Promise<boolean> {
    try {
      const { error } = await this.supabase.from("user_task_preferences").upsert({
        user_id: (await this.supabase.auth.getUser()).data.user?.id,
        preferred_categories: preferences.preferredCategories,
        preferred_difficulty: preferences.preferredDifficulty,
        min_payout: preferences.minPayout,
        max_payout: preferences.maxPayout,
        prefers_real_offers: preferences.prefersRealOffers,
        updated_at: new Date().toISOString(),
      })

      return !error
    } catch (error) {
      console.error("Error updating task preferences:", error)
      return false
    }
  }

  // Get user's task completion stats
  async getTaskStats(userId: string): Promise<{
    totalCompleted: number
    sampleCompleted: number
    offerwallCompleted: number
    totalEarned: number
    averageRating: number
  }> {
    try {
      // Get sample task completions
      const { data: sampleStats } = await this.supabase
        .from("user_tasks")
        .select("points_earned")
        .eq("user_id", userId)
        .eq("status", "completed")

      // Get real offer completions
      const { data: offerwallStats } = await this.supabase
        .from("real_offer_completions")
        .select("points_earned")
        .eq("user_id", userId)
        .eq("status", "completed")

      const sampleCompleted = sampleStats?.length || 0
      const offerwallCompleted = offerwallStats?.length || 0
      const totalCompleted = sampleCompleted + offerwallCompleted

      const sampleEarned = sampleStats?.reduce((sum, task) => sum + (task.points_earned || 0), 0) || 0
      const offerwallEarned = offerwallStats?.reduce((sum, task) => sum + (task.points_earned || 0), 0) || 0
      const totalEarned = sampleEarned + offerwallEarned

      return {
        totalCompleted,
        sampleCompleted,
        offerwallCompleted,
        totalEarned,
        averageRating: totalCompleted > 0 ? totalEarned / totalCompleted : 0,
      }
    } catch (error) {
      console.error("Error getting task stats:", error)
      return {
        totalCompleted: 0,
        sampleCompleted: 0,
        offerwallCompleted: 0,
        totalEarned: 0,
        averageRating: 0,
      }
    }
  }

  // Get available offerwall providers
  async getOfferwallProviders(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase.from("offerwall_providers").select("*").eq("is_active", true)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Error getting offerwall providers:", error)
      return []
    }
  }
}

// Singleton instance
export const hybridTaskManager = new HybridTaskManager()
