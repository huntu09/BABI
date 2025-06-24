import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile data with all needed fields
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(`
        id,
        balance,
        total_earned,
        login_streak,
        referral_code,
        referred_by,
        created_at
      `)
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    // Get completed tasks count and total rewards earned from tasks
    const { data: completedTasks, error: tasksError } = await supabase
      .from("user_tasks")
      .select("id, reward_earned, completed_at, task_id")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })

    if (tasksError) {
      console.error("Error fetching completed tasks:", tasksError)
    }

    const completedTasksCount = completedTasks?.length || 0

    // Get referrals count (people who used this user's referral code)
    const { data: referrals, error: referralsError } = await supabase
      .from("profiles")
      .select("id, created_at")
      .eq("referred_by", user.id)

    if (referralsError) {
      console.error("Error fetching referrals:", referralsError)
    }

    const referralsCount = referrals?.length || 0

    // Get user's earned badges to check what's already earned
    const { data: userBadges, error: badgesError } = await supabase
      .from("user_badges")
      .select("badge_id, earned_at")
      .eq("user_id", user.id)

    if (badgesError) {
      console.error("Error fetching user badges:", badgesError)
    }

    const earnedBadgeIds = userBadges?.map((ub) => ub.badge_id) || []

    // Calculate login streak progress
    const currentStreak = profile.login_streak || 0

    // 🔥 UPDATED: Sustainable achievement rewards
    const achievements = [
      {
        id: "first_steps",
        title: "First Steps",
        description: "Complete your first task",
        icon: "🚀",
        category: "tasks",
        requirement: 1,
        current: Math.min(completedTasksCount, 1),
        reward: 10, // 🔥 REDUCED: was 50, now 10 ($0.10)
        unlocked: completedTasksCount >= 1,
        rarity: "common",
        earned: earnedBadgeIds.includes("first_steps"),
      },
      {
        id: "task_master",
        title: "Task Master",
        description: "Complete 10 tasks",
        icon: "🎯",
        category: "tasks",
        requirement: 10,
        current: Math.min(completedTasksCount, 10),
        reward: 25, // 🔥 REDUCED: was 100, now 25 ($0.25)
        unlocked: completedTasksCount >= 10,
        rarity: "rare",
        earned: earnedBadgeIds.includes("task_master"),
      },
      {
        id: "streak_champion",
        title: "Streak Champion",
        description: "Login for 7 consecutive days",
        icon: "🔥",
        category: "streak",
        requirement: 7,
        current: Math.min(currentStreak, 7),
        reward: 50, // 🔥 REDUCED: was 200, now 50 ($0.50)
        unlocked: currentStreak >= 7,
        rarity: "epic",
        earned: earnedBadgeIds.includes("streak_champion"),
      },
      {
        id: "task_veteran",
        title: "Task Veteran",
        description: "Complete 50 tasks",
        icon: "⭐",
        category: "tasks",
        requirement: 50,
        current: Math.min(completedTasksCount, 50),
        reward: 100, // $1.00 for completing 50 tasks (fair reward)
        unlocked: completedTasksCount >= 50,
        rarity: "legendary",
        earned: earnedBadgeIds.includes("task_veteran"),
      },
      {
        id: "referral_starter",
        title: "Referral Starter",
        description: "Refer your first friend",
        icon: "👥",
        category: "referrals",
        requirement: 1,
        current: Math.min(referralsCount, 1),
        reward: 15, // $0.15 for first referral
        unlocked: referralsCount >= 1,
        rarity: "common",
        earned: earnedBadgeIds.includes("referral_starter"),
      },
      {
        id: "referral_master",
        title: "Referral Master",
        description: "Refer 5 friends",
        icon: "🌟",
        category: "referrals",
        requirement: 5,
        current: Math.min(referralsCount, 5),
        reward: 75, // $0.75 for 5 referrals
        unlocked: referralsCount >= 5,
        rarity: "epic",
        earned: earnedBadgeIds.includes("referral_master"),
      },
    ]

    // Calculate total progress across all achievements
    const totalProgress =
      achievements.reduce((sum, ach) => {
        return sum + (ach.current / ach.requirement) * 100
      }, 0) / achievements.length

    return NextResponse.json({
      success: true,
      achievements,
      stats: {
        completedTasks: completedTasksCount,
        totalEarned: Number(profile.total_earned) || 0,
        currentBalance: Number(profile.balance) || 0,
        currentStreak: currentStreak,
        referrals: referralsCount,
        totalProgress: Math.round(totalProgress),
        accountAge: Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24)),
        earnedBadges: userBadges?.length || 0,
      },
      profile: {
        balance: Number(profile.balance) || 0,
        total_earned: Number(profile.total_earned) || 0,
        login_streak: currentStreak,
        referral_code: profile.referral_code,
      },
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
