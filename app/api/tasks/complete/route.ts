import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { transactionManager } from "@/lib/transaction-manager"

export async function POST(request: Request) {
  try {
    const { taskId } = await request.json()

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const supabase = createServerComponentClient({ cookies })

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get task details
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .select("*")
      .eq("id", taskId)
      .eq("is_active", true)
      .single()

    if (taskError || !task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user already completed this task
    const { data: existingCompletion } = await supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_id", taskId)
      .eq("status", "completed")
      .single()

    if (existingCompletion) {
      return NextResponse.json({ error: "Task already completed" }, { status: 400 })
    }

    // Get reward amount from task
    const rewardAmount = Number(task.reward_amount) || 0

    // Start transaction by creating user_task record with in_progress status first
    const { data: userTask, error: userTaskError } = await supabase
      .from("user_tasks")
      .insert({
        user_id: user.id,
        task_id: taskId,
        status: "in_progress", // ✅ FIX: Start with in_progress
        reward_earned: rewardAmount, // ✅ CORRECT: Already using reward_earned
      })
      .select()
      .single()

    if (userTaskError) {
      console.error("Error creating user task:", userTaskError)
      return NextResponse.json({ error: "Failed to start task" }, { status: 500 })
    }

    // Then update to completed after successful processing
    const { error: completeError } = await supabase
      .from("user_tasks")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", userTask.id)

    if (completeError) {
      console.error("Error completing user task:", completeError)
      // Rollback by deleting the user_task
      await supabase.from("user_tasks").delete().eq("id", userTask.id)
      return NextResponse.json({ error: "Failed to complete task" }, { status: 500 })
    }

    // Update user profile balance and total_earned
    const newBalance = Number(profile.balance) + rewardAmount
    const newTotalEarned = Number(profile.total_earned) + rewardAmount

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        balance: newBalance,
        total_earned: newTotalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating profile:", updateError)
      // Rollback user_task if profile update fails
      await supabase.from("user_tasks").delete().eq("id", userTask.id)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    // 🔥 IMPROVED: Create transaction record with proper reference
    const transaction = await transactionManager.createEarningTransaction(
      user.id,
      rewardAmount,
      "task_completion",
      `Task completed: ${task.title} (${task.provider})`,
      userTask.id,
      "user_task",
    )

    if (!transaction) {
      console.warn("⚠️ Failed to create transaction record for task completion")
    } else {
      console.log("✅ Task completion transaction created:", transaction.id)
    }

    // Check for badge achievements
    await checkAndAwardBadges(supabase, user.id, newTotalEarned, newBalance)

    return NextResponse.json({
      success: true,
      message: "Task completed successfully!",
      pointsEarned: Math.round(rewardAmount),
      newBalance: Math.round(newBalance * 100) / 100, // Round to 2 decimal places
      task: {
        ...task,
        points: Math.round(rewardAmount),
        category: task.task_type,
      },
      transactionId: transaction?.id,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

async function checkAndAwardBadges(supabase: any, userId: string, totalEarned: number, currentBalance: number) {
  try {
    // Get user's completed tasks count
    const { data: completedTasks } = await supabase
      .from("user_tasks")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "completed")

    const completedCount = completedTasks?.length || 0

    // Define badge requirements
    const badgeRequirements = [
      {
        id: "first_steps",
        name: "First Steps",
        type: "tasks_completed",
        requirement: 1,
        current: completedCount,
        reward: 50,
      },
      {
        id: "task_master",
        name: "Task Master",
        type: "tasks_completed",
        requirement: 10,
        current: completedCount,
        reward: 100,
      },
      {
        id: "first_dollar",
        name: "First Dollar",
        type: "amount_earned",
        requirement: 1.0,
        current: totalEarned,
        reward: 25,
      },
    ]

    for (const badge of badgeRequirements) {
      if (badge.current >= badge.requirement) {
        // Check if user already has this badge
        const { data: existingBadge } = await supabase
          .from("user_badges")
          .select("id")
          .eq("user_id", userId)
          .eq("badge_id", badge.id)
          .single()

        if (!existingBadge) {
          // Award the badge
          const { data: newBadge } = await supabase
            .from("user_badges")
            .insert({
              user_id: userId,
              badge_id: badge.id,
              earned_at: new Date().toISOString(),
            })
            .select()
            .single()

          // Add bonus points for badge
          if (badge.reward) {
            const bonusAmount = Number(badge.reward) / 100 // Convert points to USD

            await supabase
              .from("profiles")
              .update({
                balance: currentBalance + bonusAmount,
              })
              .eq("id", userId)

            // 🔥 IMPROVED: Create transaction for badge reward
            const transaction = await transactionManager.createEarningTransaction(
              userId,
              bonusAmount,
              "bonus",
              `Badge earned: ${badge.name} - Achievement bonus`,
              newBadge?.id,
              "badge",
            )

            if (transaction) {
              console.log("✅ Badge reward transaction created:", transaction.id)
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("Error checking badges:", error)
    // Don't throw error here, just log it
  }
}
