import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = createServerComponentClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build query - using 'reward_amount' from tasks table
    let query = supabase
      .from("tasks")
      .select("*")
      .eq("is_active", true)
      .order("reward_amount", { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== "all") {
      query = query.eq("task_type", category)
    }

    const { data: tasks, error } = await query

    if (error) {
      console.error("Error fetching tasks:", error)
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }

    // Get user's completed tasks to filter out
    const { data: completedTasks } = await supabase
      .from("user_tasks")
      .select("task_id")
      .eq("user_id", user.id)
      .eq("status", "completed")

    const completedTaskIds = completedTasks?.map((t) => t.task_id) || []

    // Filter out completed tasks and format for frontend
    const availableTasks =
      tasks
        ?.filter((task) => !completedTaskIds.includes(task.id))
        .map((task) => ({
          ...task,
          points: Math.round(Number(task.reward_amount)), // Convert reward_amount to points for frontend
          category: task.task_type, // Map task_type to category
          difficulty: task.difficulty || getTaskDifficulty(Number(task.reward_amount)), // Use existing difficulty or calculate
          estimated_time: task.estimated_time || getEstimatedTime(Number(task.reward_amount)), // Use existing time or calculate
        })) || []

    return NextResponse.json({
      success: true,
      tasks: availableTasks,
      total: availableTasks.length,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getTaskDifficulty(rewardAmount: number): string {
  if (rewardAmount <= 50) return "easy"
  if (rewardAmount <= 150) return "medium"
  return "hard"
}

function getEstimatedTime(rewardAmount: number): string {
  if (rewardAmount <= 25) return "1-2 minutes"
  if (rewardAmount <= 75) return "5-10 minutes"
  if (rewardAmount <= 150) return "10-15 minutes"
  return "15-30 minutes"
}
