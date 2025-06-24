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
      const limit = options.limit || 20
      let allTasks: HybridTask[] = []

      // Get sample tasks from tasks table
      if (options.source === "all" || options.source === "sample" || !options.source) {
        const { data: sampleTasks, error: sampleError } = await this.supabase
          .from("tasks")
          .select(`
            id,
            title,
            description,
            reward_amount,
            task_type,
            provider,
            difficulty,
            estimated_time,
            url,
            external_id,
            provider_config,
            task_source
          `)
          .eq("is_active", true)
          .order("reward_amount", { ascending: false })
          .limit(limit)

        if (sampleError) throw sampleError

        // Check which tasks user has completed
        const { data: completedTasks } = await this.supabase
          .from("user_tasks")
          .select("task_id")
          .eq("user_id", userId)
          .eq("status", "completed")

        const completedTaskIds = new Set(completedTasks?.map((t) => t.task_id) || [])

        const formattedSampleTasks: HybridTask[] = (sampleTasks || []).map((task) => ({
          id: task.id,
          title: task.title,
          description: task.description || "",
          reward_amount: Number(task.reward_amount),
          task_type: task.task_type,
          task_source: "sample" as const,
          provider: task.provider || "Sample",
          difficulty: task.difficulty || "easy",
          estimated_time: task.estimated_time || "10 minutes",
          is_completed: completedTaskIds.has(task.id),
          recommendation_score: this.calculateRecommendationScore(task, userId),
          external_offer_id: task.external_id,
          provider_config: task.provider_config,
          url: task.url,
        }))

        allTasks = [...allTasks, ...formattedSampleTasks]
      }

      // Get real offerwall completions (for display purposes)
      if (options.source === "all" || options.source === "offerwall" || !options.source) {
        // For now, we'll create mock offerwall tasks since we don't have a live offerwall API
        // In production, this would fetch from CPX Research, AdGem, etc.
        const mockOfferwallTasks: HybridTask[] = [
          {
            id: "cpx-survey-1",
            title: "Complete Consumer Survey",
            description: "Share your opinion about shopping habits",
            reward_amount: 0.75,
            task_type: "survey",
            task_source: "offerwall",
            provider: "CPX Research",
            difficulty: "easy",
            estimated_time: "5 minutes",
            is_completed: false,
            recommendation_score: 85,
            url: "https://cpx-research.com/survey/123",
          },
          {
            id: "adgem-game-1",
            title: "Play Mobile Game",
            description: "Download and reach level 10",
            reward_amount: 1.25,
            task_type: "app_install",
            task_source: "offerwall",
            provider: "AdGem",
            difficulty: "medium",
            estimated_time: "30 minutes",
            is_completed: false,
            recommendation_score: 90,
            url: "https://adgem.com/offer/456",
          },
          {
            id: "lootably-video-1",
            title: "Watch Video Ads",
            description: "Watch 5 short video advertisements",
            reward_amount: 0.25,
            task_type: "video",
            task_source: "offerwall",
            provider: "Lootably",
            difficulty: "easy",
            estimated_time: "3 minutes",
            is_completed: false,
            recommendation_score: 70,
            url: "https://lootably.com/videos/789",
          },
        ]

        allTasks = [...allTasks, ...mockOfferwallTasks]
      }

      // Apply filters
      let filteredTasks = allTasks

      if (options.category) {
        filteredTasks = filteredTasks.filter((task) => task.task_type === options.category)
      }

      if (options.difficulty) {
        filteredTasks = filteredTasks.filter((task) => task.difficulty === options.difficulty)
      }

      if (options.minPayout) {
        filteredTasks = filteredTasks.filter((task) => task.reward_amount >= options.minPayout!)
      }

      if (options.maxPayout) {
        filteredTasks = filteredTasks.filter((task) => task.reward_amount <= options.maxPayout!)
      }

      // Sort by recommendation score
      filteredTasks.sort((a, b) => b.recommendation_score - a.recommendation_score)

      return filteredTasks.slice(0, limit)
    } catch (error) {
      console.error("Error getting task recommendations:", error)
      return []
    }
  }

  // Calculate recommendation score based on user preferences and task attributes
  private calculateRecommendationScore(task: any, userId: string): number {
    let score = 50 // Base score

    // Higher reward = higher score
    score += Math.min(task.reward_amount * 20, 30)

    // Prefer easier tasks for new users
    if (task.difficulty === "easy") score += 10
    if (task.difficulty === "medium") score += 5

    // Boost popular task types
    if (task.task_type === "survey") score += 15
    if (task.task_type === "video") score += 10
    if (task.task_type === "app_install") score += 20

    // Random factor for variety
    score += Math.random() * 10

    return Math.min(Math.max(score, 0), 100)
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
      // For now, we'll store preferences in localStorage since we don't have a preferences table
      localStorage.setItem("taskPreferences", JSON.stringify(preferences))
      return true
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
        .select("reward_earned")
        .eq("user_id", userId)
        .eq("status", "completed")

      // Get real offer completions
      const { data: offerwallStats } = await this.supabase
        .from("real_offer_completions")
        .select("points_earned, payout_usd")
        .eq("user_id", userId)
        .eq("status", "completed")

      const sampleCompleted = sampleStats?.length || 0
      const offerwallCompleted = offerwallStats?.length || 0
      const totalCompleted = sampleCompleted + offerwallCompleted

      const sampleEarned = sampleStats?.reduce((sum, task) => sum + (Number(task.reward_earned) || 0), 0) || 0
      const offerwallEarned = offerwallStats?.reduce((sum, task) => sum + (Number(task.payout_usd) || 0), 0) || 0
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
      // Return mock providers for now
      return [
        { id: "cpx_research", name: "CPX Research", is_active: true },
        { id: "adgem", name: "AdGem", is_active: true },
        { id: "lootably", name: "Lootably", is_active: true },
        { id: "offertoro", name: "OfferToro", is_active: true },
      ]
    } catch (error) {
      console.error("Error getting offerwall providers:", error)
      return []
    }
  }
}

// Singleton instance
export const hybridTaskManager = new HybridTaskManager()
