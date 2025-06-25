import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { taskManager } from "@/lib/task-manager"
import type { TaskFilters } from "@/types"

// Force dynamic rendering for this route
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    // Parse filters
    const filters: TaskFilters = {
      task_type: (searchParams.get("category") as any) || (searchParams.get("task_type") as any),
      difficulty: searchParams.get("difficulty") as any,
      task_source: searchParams.get("source") as any,
      provider: searchParams.get("provider") || undefined,
      min_reward: searchParams.get("min_reward") ? Number(searchParams.get("min_reward")) : undefined,
      max_reward: searchParams.get("max_reward") ? Number(searchParams.get("max_reward")) : undefined,
      country: searchParams.get("country") || undefined,
      device: searchParams.get("device") || undefined,
      include_expired: searchParams.get("include_expired") === "true",
      include_completed: searchParams.get("include_completed") === "true",
    }

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

    // ✅ IMPROVED: Use TaskManager with proper business logic
    const result = await taskManager.getTasks(user.id, filters, limit, offset)

    return NextResponse.json({
      success: true,
      tasks: result.tasks,
      total: result.total,
      hasMore: result.hasMore,
      filters: filters, // Return applied filters for debugging
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
