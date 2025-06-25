import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Task, FrontendTask, TaskFilters, TaskStatus, CreateTaskData, TaskType } from "@/types"

export class TaskManager {
  private supabase = createClientComponentClient()

  // ✅ Get tasks with proper business logic
  async getTasks(
    userId: string,
    filters: TaskFilters = {},
    limit = 20,
    offset = 0,
  ): Promise<{
    tasks: FrontendTask[]
    total: number
    hasMore: boolean
  }> {
    try {
      // Build base query
      let query = this.supabase.from("tasks").select("*", { count: "exact" }).eq("is_active", true)

      // ✅ CRITICAL: Filter expired tasks unless explicitly included
      if (!filters.include_expired) {
        query = query.or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      }

      // Apply filters
      if (filters.task_type) {
        query = query.eq("task_type", filters.task_type)
      }
      if (filters.difficulty) {
        query = query.eq("difficulty", filters.difficulty)
      }
      if (filters.task_source) {
        query = query.eq("task_source", filters.task_source)
      }
      if (filters.provider) {
        query = query.eq("provider", filters.provider)
      }
      if (filters.min_reward) {
        query = query.gte("reward_amount", filters.min_reward)
      }
      if (filters.max_reward) {
        query = query.lte("reward_amount", filters.max_reward)
      }
      if (filters.country) {
        query = query.contains("countries", [filters.country])
      }

      // Order by reward amount (highest first)
      query = query.order("reward_amount", { ascending: false })
      query = query.range(offset, offset + limit - 1)

      const { data: tasks, error, count } = await query

      if (error) {
        console.error("Error fetching tasks:", error)
        return { tasks: [], total: 0, hasMore: false }
      }

      // Get user's task completion data
      const { data: userTasks } = await this.supabase
        .from("user_tasks")
        .select("task_id, status, completed_at")
        .eq("user_id", userId)

      const userTaskMap = new Map(userTasks?.map((ut) => [ut.task_id, ut]) || [])

      // ✅ CRITICAL: Get user's daily completion counts
      const today = new Date().toISOString().split("T")[0]
      const { data: dailyCompletions } = await this.supabase
        .from("user_tasks")
        .select("task_id")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", `${today}T00:00:00.000Z`)
        .lt("completed_at", `${today}T23:59:59.999Z`)

      const dailyCompletionMap = new Map()
      dailyCompletions?.forEach((dc) => {
        const count = dailyCompletionMap.get(dc.task_id) || 0
        dailyCompletionMap.set(dc.task_id, count + 1)
      })

      // Transform tasks to frontend format
      const frontendTasks: FrontendTask[] = (tasks || []).map((task) => {
        const userTask = userTaskMap.get(task.id)
        const dailyCompleted = dailyCompletionMap.get(task.id) || 0
        const totalCompleted =
          userTasks?.filter((ut) => ut.task_id === task.id && ut.status === "completed").length || 0

        const status = this.calculateTaskStatus(task, userTask, dailyCompleted, totalCompleted)
        const canComplete = this.canUserCompleteTask(task, dailyCompleted, totalCompleted)

        return {
          ...task,
          points: Math.round(Number(task.reward_amount) * 100), // Convert USD to points
          category: task.task_type, // Map for frontend compatibility
          status,
          is_completed: userTask?.status === "completed",
          can_complete: canComplete,
          completion_progress: {
            daily_completed: dailyCompleted,
            total_completed: totalCompleted,
            expires_in: task.expires_at ? this.getTimeUntilExpiration(task.expires_at) : undefined,
          },
        }
      })

      // ✅ Filter out tasks user can't complete unless explicitly included
      const availableTasks = filters.include_completed
        ? frontendTasks
        : frontendTasks.filter((task) => task.can_complete)

      return {
        tasks: availableTasks,
        total: count || 0,
        hasMore: offset + limit < (count || 0),
      }
    } catch (error) {
      console.error("Error in getTasks:", error)
      return { tasks: [], total: 0, hasMore: false }
    }
  }

  // ✅ Calculate task status based on business rules
  private calculateTaskStatus(task: Task, userTask: any, dailyCompleted: number, totalCompleted: number): TaskStatus {
    // Check if expired
    if (task.expires_at && new Date(task.expires_at) < new Date()) {
      return "expired"
    }

    // Check if user completed or rejected
    if (userTask?.status === "completed") {
      return "completed"
    }

    if (userTask?.status === "rejected") {
      return "expired" // Treat rejected as unavailable
    }

    // Check if in progress
    if (userTask?.status === "in_progress") {
      return "in_progress"
    }

    // Check daily limit
    if (task.daily_limit && dailyCompleted >= task.daily_limit) {
      return "limit_reached"
    }

    // Check total limit
    if (task.total_limit && totalCompleted >= task.total_limit) {
      return "limit_reached"
    }

    return "available"
  }

  // ✅ Check if user can complete task
  private canUserCompleteTask(task: Task, dailyCompleted: number, totalCompleted: number): boolean {
    // Check if expired
    if (task.expires_at && new Date(task.expires_at) < new Date()) {
      return false
    }

    // Check daily limit
    if (task.daily_limit && dailyCompleted >= task.daily_limit) {
      return false
    }

    // Check total limit
    if (task.total_limit && totalCompleted >= task.total_limit) {
      return false
    }

    return true
  }

  // ✅ Get time until expiration
  private getTimeUntilExpiration(expiresAt: string): string {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diff = expiry.getTime() - now.getTime()

    if (diff <= 0) return "Expired"

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

    if (days > 0) return `${days}d ${hours}h`
    if (hours > 0) return `${hours}h ${minutes}m`
    return `${minutes}m`
  }

  // ✅ Complete task with proper validation
  async completeTask(
    userId: string,
    taskId: string,
  ): Promise<{
    success: boolean
    message?: string
    pointsEarned?: number
    newBalance?: number
    error?: string
  }> {
    try {
      // Get task details
      const { data: task, error: taskError } = await this.supabase
        .from("tasks")
        .select("*")
        .eq("id", taskId)
        .eq("is_active", true)
        .single()

      if (taskError || !task) {
        return { success: false, error: "Task not found" }
      }

      // ✅ CRITICAL: Validate task can be completed
      const validation = await this.validateTaskCompletion(userId, task)
      if (!validation.canComplete) {
        return { success: false, error: validation.reason }
      }

      // Call the existing completion API
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      })

      const data = await response.json()

      if (data.success) {
        // ✅ CRITICAL: Update completion count
        await this.updateTaskCompletionCount(taskId)
      }

      return data
    } catch (error) {
      console.error("Error completing task:", error)
      return { success: false, error: "Failed to complete task" }
    }
  }

  // ✅ Validate task completion
  private async validateTaskCompletion(
    userId: string,
    task: Task,
  ): Promise<{
    canComplete: boolean
    reason?: string
  }> {
    // Check if user already has any completion record
    const { data: existingRecord } = await this.supabase
      .from("user_tasks")
      .select("id, status")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .in("status", ["completed", "in_progress"]) // ✅ FIX: Check both statuses
      .single()

    if (existingRecord) {
      if (existingRecord.status === "completed") {
        return { canComplete: false, reason: "Task already completed" }
      }
      if (existingRecord.status === "in_progress") {
        return { canComplete: false, reason: "Task already in progress" }
      }
    }

    // Check if expired
    if (task.expires_at && new Date(task.expires_at) < new Date()) {
      return { canComplete: false, reason: "Task has expired" }
    }

    // Check if user already completed
    const { data: existingCompletion } = await this.supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("task_id", task.id)
      .eq("status", "completed")
      .single()

    if (existingCompletion) {
      return { canComplete: false, reason: "Task already completed" }
    }

    // Check daily limit
    if (task.daily_limit) {
      const today = new Date().toISOString().split("T")[0]
      const { data: dailyCompletions } = await this.supabase
        .from("user_tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("task_id", task.id)
        .eq("status", "completed")
        .gte("completed_at", `${today}T00:00:00.000Z`)
        .lt("completed_at", `${today}T23:59:59.999Z`)

      if (dailyCompletions && dailyCompletions.length >= task.daily_limit) {
        return { canComplete: false, reason: "Daily limit reached for this task" }
      }
    }

    // Check total limit
    if (task.total_limit) {
      const { data: totalCompletions } = await this.supabase
        .from("user_tasks")
        .select("id")
        .eq("user_id", userId)
        .eq("task_id", task.id)
        .eq("status", "completed")

      if (totalCompletions && totalCompletions.length >= task.total_limit) {
        return { canComplete: false, reason: "Total limit reached for this task" }
      }
    }

    return { canComplete: true }
  }

  // ✅ Update task completion count
  private async updateTaskCompletionCount(taskId: string): Promise<void> {
    try {
      const { error } = await this.supabase.rpc("increment_task_completion", {
        task_id: taskId,
      })

      if (error) {
        console.error("Error updating completion count:", error)
      }
    } catch (error) {
      console.error("Error in updateTaskCompletionCount:", error)
    }
  }

  // ✅ Get task statistics
  async getTaskStats(taskId: string): Promise<{
    totalCompletions: number
    dailyCompletions: number
    averageRating: number
    topCountries: string[]
  }> {
    try {
      const { data: completions } = await this.supabase
        .from("user_tasks")
        .select("completed_at, user_id")
        .eq("task_id", taskId)
        .eq("status", "completed")

      const today = new Date().toISOString().split("T")[0]
      const dailyCompletions = completions?.filter((c) => c.completed_at?.startsWith(today)).length || 0

      return {
        totalCompletions: completions?.length || 0,
        dailyCompletions,
        averageRating: 0, // TODO: Implement rating system
        topCountries: [], // TODO: Implement country tracking
      }
    } catch (error) {
      console.error("Error getting task stats:", error)
      return {
        totalCompletions: 0,
        dailyCompletions: 0,
        averageRating: 0,
        topCountries: [],
      }
    }
  }

  // ✅ Create new task (admin function)
  async createTask(taskData: CreateTaskData): Promise<{
    success: boolean
    task?: Task
    error?: string
  }> {
    try {
      const { data: task, error } = await this.supabase
        .from("tasks")
        .insert({
          ...taskData,
          completion_count: 0,
          is_active: true,
        })
        .select()
        .single()

      if (error) {
        console.error("Error creating task:", error)
        return { success: false, error: "Failed to create task" }
      }

      return { success: true, task }
    } catch (error) {
      console.error("Error in createTask:", error)
      return { success: false, error: "Failed to create task" }
    }
  }

  // ✅ Validate task type
  static validateTaskType(taskType: string): taskType is TaskType {
    const validTypes: TaskType[] = ["survey", "offer", "video", "app_install", "signup"]
    return validTypes.includes(taskType as TaskType)
  }
}

// Singleton instance
export const taskManager = new TaskManager()
