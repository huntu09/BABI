"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Trophy, Crown, Star, Target, Award, Users, Calendar, Medal, Flame } from "lucide-react"

interface Level {
  level: number
  name: string
  minPoints: number
  maxPoints: number
  color: string
  icon: string
  perks: string[]
  badge: string
}

interface UserBadge {
  id: string
  name: string
  description: string
  icon: string
  rarity: "common" | "rare" | "epic" | "legendary"
  category: "tasks" | "earnings" | "social" | "special" | "streak"
  requirement: number
  unlocked: boolean
  unlockedAt?: Date
  progress: number
}

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  points: number
  level: number
  badges: number
  avatar: string
  isCurrentUser?: boolean
}

interface GamificationSystemProps {
  user: any
  profile: any
}

export default function GamificationSystem({ user, profile }: GamificationSystemProps) {
  const [userLevel, setUserLevel] = useState<Level | null>(null)
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [weeklyLeaderboard, setWeeklyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [monthlyLeaderboard, setMonthlyLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("all")

  const supabase = createClientComponentClient()

  // Level system configuration
  const levels: Level[] = [
    {
      level: 1,
      name: "Rookie",
      minPoints: 0,
      maxPoints: 999,
      color: "from-gray-500 to-gray-600",
      icon: "🌱",
      badge: "bg-gray-600",
      perks: ["Basic tasks access", "Daily login bonus"],
    },
    {
      level: 2,
      name: "Explorer",
      minPoints: 1000,
      maxPoints: 2499,
      color: "from-green-500 to-green-600",
      icon: "🗺️",
      badge: "bg-green-600",
      perks: ["Survey access", "5% bonus points", "Priority support"],
    },
    {
      level: 3,
      name: "Adventurer",
      minPoints: 2500,
      maxPoints: 4999,
      color: "from-blue-500 to-blue-600",
      icon: "⚔️",
      badge: "bg-blue-600",
      perks: ["Premium tasks", "10% bonus points", "Weekly bonus"],
    },
    {
      level: 4,
      name: "Champion",
      minPoints: 5000,
      maxPoints: 9999,
      color: "from-purple-500 to-purple-600",
      icon: "🏆",
      badge: "bg-purple-600",
      perks: ["Exclusive offers", "15% bonus points", "Monthly bonus", "VIP support"],
    },
    {
      level: 5,
      name: "Legend",
      minPoints: 10000,
      maxPoints: 19999,
      color: "from-orange-500 to-orange-600",
      icon: "👑",
      badge: "bg-orange-600",
      perks: ["All features", "20% bonus points", "Custom rewards", "Direct contact"],
    },
    {
      level: 6,
      name: "Mythic",
      minPoints: 20000,
      maxPoints: 49999,
      color: "from-red-500 to-red-600",
      icon: "🔥",
      badge: "bg-red-600",
      perks: ["Beta features", "25% bonus points", "Personal manager", "Special events"],
    },
    {
      level: 7,
      name: "Divine",
      minPoints: 50000,
      maxPoints: 99999,
      color: "from-pink-500 to-pink-600",
      icon: "✨",
      badge: "bg-pink-600",
      perks: ["Ultimate access", "30% bonus points", "Custom features", "Hall of fame"],
    },
    {
      level: 8,
      name: "Immortal",
      minPoints: 100000,
      maxPoints: 999999,
      color: "from-yellow-400 to-yellow-500",
      icon: "💎",
      badge: "bg-yellow-500",
      perks: ["Legendary status", "50% bonus points", "Platform partnership", "Eternal glory"],
    },
  ]

  useEffect(() => {
    initializeGamification()
  }, [profile])

  const initializeGamification = async () => {
    setLoading(true)
    try {
      // Calculate user level
      const userPoints = profile?.total_earned || 0
      const currentLevel =
        levels.find((level) => userPoints >= level.minPoints && userPoints <= level.maxPoints) || levels[0]
      setUserLevel(currentLevel)

      // Initialize badges
      const userBadges = await calculateBadges()
      setBadges(userBadges)

      // Fetch leaderboards
      await fetchLeaderboards()
    } catch (error) {
      console.error("Error initializing gamification:", error)
    } finally {
      setLoading(false)
    }
  }

  const calculateBadges = async (): Promise<UserBadge[]> => {
    const userStats = {
      tasksCompleted: profile?.completed_tasks || 0,
      totalEarned: profile?.total_earned || 0,
      referrals: profile?.referral_count || 0,
      loginStreak: profile?.login_streak || 0,
      daysActive: Math.floor(
        (Date.now() - new Date(profile?.created_at || Date.now()).getTime()) / (1000 * 60 * 60 * 24),
      ),
    }

    const badgeDefinitions: UserBadge[] = [
      // Task Badges
      {
        id: "first_task",
        name: "First Steps",
        description: "Complete your first task",
        icon: "🚀",
        rarity: "common",
        category: "tasks",
        requirement: 1,
        progress: Math.min(userStats.tasksCompleted, 1),
        unlocked: userStats.tasksCompleted >= 1,
      },
      {
        id: "task_warrior",
        name: "Task Warrior",
        description: "Complete 10 tasks",
        icon: "⚔️",
        rarity: "common",
        category: "tasks",
        requirement: 10,
        progress: Math.min(userStats.tasksCompleted, 10),
        unlocked: userStats.tasksCompleted >= 10,
      },
      {
        id: "task_master",
        name: "Task Master",
        description: "Complete 50 tasks",
        icon: "🎯",
        rarity: "rare",
        category: "tasks",
        requirement: 50,
        progress: Math.min(userStats.tasksCompleted, 50),
        unlocked: userStats.tasksCompleted >= 50,
      },
      {
        id: "task_legend",
        name: "Task Legend",
        description: "Complete 100 tasks",
        icon: "🏆",
        rarity: "epic",
        category: "tasks",
        requirement: 100,
        progress: Math.min(userStats.tasksCompleted, 100),
        unlocked: userStats.tasksCompleted >= 100,
      },
      {
        id: "task_god",
        name: "Task God",
        description: "Complete 500 tasks",
        icon: "👑",
        rarity: "legendary",
        category: "tasks",
        requirement: 500,
        progress: Math.min(userStats.tasksCompleted, 500),
        unlocked: userStats.tasksCompleted >= 500,
      },

      // Earnings Badges
      {
        id: "first_dollar",
        name: "First Dollar",
        description: "Earn your first $1.00",
        icon: "💵",
        rarity: "common",
        category: "earnings",
        requirement: 100,
        progress: Math.min(userStats.totalEarned, 100),
        unlocked: userStats.totalEarned >= 100,
      },
      {
        id: "money_maker",
        name: "Money Maker",
        description: "Earn $10.00 total",
        icon: "💰",
        rarity: "rare",
        category: "earnings",
        requirement: 1000,
        progress: Math.min(userStats.totalEarned, 1000),
        unlocked: userStats.totalEarned >= 1000,
      },
      {
        id: "high_earner",
        name: "High Earner",
        description: "Earn $50.00 total",
        icon: "💎",
        rarity: "epic",
        category: "earnings",
        requirement: 5000,
        progress: Math.min(userStats.totalEarned, 5000),
        unlocked: userStats.totalEarned >= 5000,
      },
      {
        id: "millionaire",
        name: "Point Millionaire",
        description: "Earn $100.00 total",
        icon: "🏦",
        rarity: "legendary",
        category: "earnings",
        requirement: 10000,
        progress: Math.min(userStats.totalEarned, 10000),
        unlocked: userStats.totalEarned >= 10000,
      },

      // Social Badges
      {
        id: "recruiter",
        name: "Recruiter",
        description: "Get your first referral",
        icon: "🤝",
        rarity: "common",
        category: "social",
        requirement: 1,
        progress: Math.min(userStats.referrals, 1),
        unlocked: userStats.referrals >= 1,
      },
      {
        id: "team_builder",
        name: "Team Builder",
        description: "Get 5 referrals",
        icon: "👥",
        rarity: "rare",
        category: "social",
        requirement: 5,
        progress: Math.min(userStats.referrals, 5),
        unlocked: userStats.referrals >= 5,
      },
      {
        id: "network_master",
        name: "Network Master",
        description: "Get 25 referrals",
        icon: "🌐",
        rarity: "epic",
        category: "social",
        requirement: 25,
        progress: Math.min(userStats.referrals, 25),
        unlocked: userStats.referrals >= 25,
      },

      // Streak Badges
      {
        id: "consistent",
        name: "Consistent",
        description: "3 day login streak",
        icon: "🔥",
        rarity: "common",
        category: "streak",
        requirement: 3,
        progress: Math.min(userStats.loginStreak, 3),
        unlocked: userStats.loginStreak >= 3,
      },
      {
        id: "dedicated",
        name: "Dedicated",
        description: "7 day login streak",
        icon: "⚡",
        rarity: "rare",
        category: "streak",
        requirement: 7,
        progress: Math.min(userStats.loginStreak, 7),
        unlocked: userStats.loginStreak >= 7,
      },
      {
        id: "unstoppable",
        name: "Unstoppable",
        description: "30 day login streak",
        icon: "🌟",
        rarity: "epic",
        category: "streak",
        requirement: 30,
        progress: Math.min(userStats.loginStreak, 30),
        unlocked: userStats.loginStreak >= 30,
      },

      // Special Badges
      {
        id: "early_bird",
        name: "Early Bird",
        description: "Join during beta period",
        icon: "🐦",
        rarity: "rare",
        category: "special",
        requirement: 1,
        progress: 1,
        unlocked: true,
      },
      {
        id: "veteran",
        name: "Veteran",
        description: "Active for 30 days",
        icon: "🎖️",
        rarity: "rare",
        category: "special",
        requirement: 30,
        progress: Math.min(userStats.daysActive, 30),
        unlocked: userStats.daysActive >= 30,
      },
      {
        id: "speed_demon",
        name: "Speed Demon",
        description: "Complete 10 tasks in one day",
        icon: "💨",
        rarity: "epic",
        category: "special",
        requirement: 10,
        progress: Math.min(profile?.daily_tasks || 0, 10),
        unlocked: (profile?.daily_tasks || 0) >= 10,
      },
    ]

    return badgeDefinitions
  }

  const fetchLeaderboards = async () => {
    try {
      // All-time leaderboard
      const { data: allTimeData } = await supabase
        .from("profiles")
        .select("id, username, email, total_earned, points")
        .order("total_earned", { ascending: false })
        .limit(50)

      // Weekly leaderboard (mock data for now)
      const { data: weeklyData } = await supabase
        .from("profiles")
        .select("id, username, email, points")
        .order("points", { ascending: false })
        .limit(50)

      // Monthly leaderboard (mock data for now)
      const { data: monthlyData } = await supabase
        .from("profiles")
        .select("id, username, email, total_earned")
        .order("total_earned", { ascending: false })
        .limit(50)

      // Process all-time leaderboard
      const allTimeLeaderboard: LeaderboardEntry[] =
        allTimeData?.map((entry, index) => ({
          rank: index + 1,
          userId: entry.id,
          username: entry.username || entry.email.split("@")[0],
          points: entry.total_earned || 0,
          level:
            levels.find((l) => (entry.total_earned || 0) >= l.minPoints && (entry.total_earned || 0) <= l.maxPoints)
              ?.level || 1,
          badges: badges.filter((b) => b.unlocked).length,
          avatar: entry.username?.[0]?.toUpperCase() || entry.email[0].toUpperCase(),
          isCurrentUser: entry.id === user.id,
        })) || []

      // Process weekly leaderboard
      const weeklyLeaderboardData: LeaderboardEntry[] =
        weeklyData?.map((entry, index) => ({
          rank: index + 1,
          userId: entry.id,
          username: entry.username || entry.email.split("@")[0],
          points: entry.points || 0,
          level:
            levels.find((l) => (entry.points || 0) >= l.minPoints && (entry.points || 0) <= l.maxPoints)?.level || 1,
          badges: 0, // Would need to calculate
          avatar: entry.username?.[0]?.toUpperCase() || entry.email[0].toUpperCase(),
          isCurrentUser: entry.id === user.id,
        })) || []

      // Process monthly leaderboard
      const monthlyLeaderboardData: LeaderboardEntry[] =
        monthlyData?.map((entry, index) => ({
          rank: index + 1,
          userId: entry.id,
          username: entry.username || entry.email.split("@")[0],
          points: entry.total_earned || 0,
          level:
            levels.find((l) => (entry.total_earned || 0) >= l.minPoints && (entry.total_earned || 0) <= l.maxPoints)
              ?.level || 1,
          badges: 0, // Would need to calculate
          avatar: entry.username?.[0]?.toUpperCase() || entry.email[0].toUpperCase(),
          isCurrentUser: entry.id === user.id,
        })) || []

      setLeaderboard(allTimeLeaderboard)
      setWeeklyLeaderboard(weeklyLeaderboardData)
      setMonthlyLeaderboard(monthlyLeaderboardData)
    } catch (error) {
      console.error("Error fetching leaderboards:", error)
    }
  }

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: "from-gray-500 to-gray-600",
      rare: "from-blue-500 to-blue-600",
      epic: "from-purple-500 to-purple-600",
      legendary: "from-yellow-500 to-orange-500",
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getRarityBadgeColor = (rarity: string) => {
    const colors = {
      common: "bg-gray-600",
      rare: "bg-blue-600",
      epic: "bg-purple-600",
      legendary: "bg-yellow-600",
    }
    return colors[rarity as keyof typeof colors] || colors.common
  }

  const getNextLevel = () => {
    const currentPoints = profile?.total_earned || 0
    return levels.find((level) => level.minPoints > currentPoints) || levels[levels.length - 1]
  }

  const filteredBadges = badges.filter((badge) =>
    selectedCategory === "all" ? true : badge.category === selectedCategory,
  )

  const categories = [
    { id: "all", name: "All", icon: Trophy },
    { id: "tasks", name: "Tasks", icon: Target },
    { id: "earnings", name: "Earnings", icon: Star },
    { id: "social", name: "Social", icon: Users },
    { id: "streak", name: "Streak", icon: Flame },
    { id: "special", name: "Special", icon: Award },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <Trophy className="h-8 w-8 animate-pulse mx-auto mb-4" />
          <p>Loading gamification system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Level Card */}
      <Card className={`bg-gradient-to-r ${userLevel?.color} border-0 text-white`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-3xl">
                {userLevel?.icon}
              </div>
              <div>
                <div className="text-2xl font-bold">Level {userLevel?.level}</div>
                <div className="text-lg opacity-90">{userLevel?.name}</div>
                <div className="text-sm opacity-75">
                  {(profile?.total_earned || 0).toLocaleString()} / {getNextLevel().minPoints.toLocaleString()} points
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{badges.filter((b) => b.unlocked).length}</div>
              <div className="text-sm opacity-75">Badges Earned</div>
            </div>
          </div>

          {/* Progress to next level */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to {getNextLevel().name}</span>
              <span>
                {Math.max(0, getNextLevel().minPoints - (profile?.total_earned || 0)).toLocaleString()} points to go
              </span>
            </div>
            <Progress
              value={
                (((profile?.total_earned || 0) - (userLevel?.minPoints || 0)) /
                  ((getNextLevel().minPoints || 1) - (userLevel?.minPoints || 0))) *
                100
              }
              className="h-3 bg-white bg-opacity-20"
            />
          </div>

          {/* Level Perks */}
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Level Perks:</div>
            <div className="flex flex-wrap gap-2">
              {userLevel?.perks.map((perk, index) => (
                <UIBadge key={index} className="bg-white bg-opacity-20 text-white border-0">
                  {perk}
                </UIBadge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="levels">Levels</TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5" />
                <span>Badge Collection</span>
              </CardTitle>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                      selectedCategory === category.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <category.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{category.name}</span>
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBadges.map((badge) => (
                  <Card
                    key={badge.id}
                    className={`transition-all duration-300 ${
                      badge.unlocked
                        ? "bg-gradient-to-r " + getRarityColor(badge.rarity) + " text-white shadow-lg"
                        : "bg-gray-50 opacity-75"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-4">
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                            badge.unlocked ? "bg-white bg-opacity-20" : "bg-gray-200"
                          }`}
                        >
                          {badge.unlocked ? badge.icon : "🔒"}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h4 className={`font-bold ${badge.unlocked ? "text-white" : "text-gray-600"}`}>
                              {badge.name}
                            </h4>
                            <UIBadge className={`${getRarityBadgeColor(badge.rarity)} text-white text-xs`}>
                              {badge.rarity}
                            </UIBadge>
                          </div>
                          <p className={`text-sm mb-3 ${badge.unlocked ? "text-gray-100" : "text-gray-500"}`}>
                            {badge.description}
                          </p>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className={badge.unlocked ? "text-gray-200" : "text-gray-400"}>
                                {badge.progress}/{badge.requirement}
                              </span>
                              {badge.unlocked && <span className="text-green-200 font-medium">✓ Unlocked</span>}
                            </div>
                            <Progress
                              value={(badge.progress / badge.requirement) * 100}
                              className={`h-2 ${badge.unlocked ? "bg-white bg-opacity-20" : "bg-gray-200"}`}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Tabs defaultValue="alltime" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="alltime">All Time</TabsTrigger>
              <TabsTrigger value="weekly">This Week</TabsTrigger>
              <TabsTrigger value="monthly">This Month</TabsTrigger>
            </TabsList>

            <TabsContent value="alltime">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    <span>All Time Leaderboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {leaderboard.slice(0, 10).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                          entry.isCurrentUser ? "bg-blue-50 border-2 border-blue-200" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                              entry.rank === 1
                                ? "bg-yellow-500"
                                : entry.rank === 2
                                  ? "bg-gray-400"
                                  : entry.rank === 3
                                    ? "bg-orange-500"
                                    : "bg-gray-600"
                            }`}
                          >
                            {entry.rank <= 3 ? (entry.rank === 1 ? "👑" : entry.rank === 2 ? "🥈" : "🥉") : entry.rank}
                          </div>
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.avatar}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-sm text-gray-600">Level {entry.level}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.points.toLocaleString()} pts</div>
                          <div className="text-sm text-gray-600">{entry.badges} badges</div>
                        </div>
                        {entry.isCurrentUser && <UIBadge className="bg-blue-600 text-white">You</UIBadge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="weekly">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5 text-green-500" />
                    <span>Weekly Leaderboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {weeklyLeaderboard.slice(0, 10).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                          entry.isCurrentUser ? "bg-green-50 border-2 border-green-200" : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.rank}
                          </div>
                          <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.avatar}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-sm text-gray-600">Level {entry.level}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.points.toLocaleString()} pts</div>
                          <div className="text-sm text-gray-600">This week</div>
                        </div>
                        {entry.isCurrentUser && <UIBadge className="bg-green-600 text-white">You</UIBadge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="monthly">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Medal className="h-5 w-5 text-purple-500" />
                    <span>Monthly Leaderboard</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyLeaderboard.slice(0, 10).map((entry) => (
                      <div
                        key={entry.userId}
                        className={`flex items-center space-x-4 p-4 rounded-lg transition-colors ${
                          entry.isCurrentUser
                            ? "bg-purple-50 border-2 border-purple-200"
                            : "bg-gray-50 hover:bg-gray-100"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.rank}
                          </div>
                          <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                            {entry.avatar}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold">{entry.username}</div>
                          <div className="text-sm text-gray-600">Level {entry.level}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.points.toLocaleString()} pts</div>
                          <div className="text-sm text-gray-600">This month</div>
                        </div>
                        {entry.isCurrentUser && <UIBadge className="bg-purple-600 text-white">You</UIBadge>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Levels Tab */}
        <TabsContent value="levels">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                <span>Level System</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {levels.map((level) => (
                  <Card
                    key={level.level}
                    className={`transition-all duration-300 ${
                      userLevel?.level === level.level
                        ? "bg-gradient-to-r " + level.color + " text-white shadow-lg scale-105"
                        : (profile?.total_earned || 0) >= level.minPoints
                          ? "bg-green-50 border-green-200"
                          : "bg-gray-50"
                    }`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-4">
                        <div
                          className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                            userLevel?.level === level.level
                              ? "bg-white bg-opacity-20"
                              : (profile?.total_earned || 0) >= level.minPoints
                                ? "bg-green-100"
                                : "bg-gray-200"
                          }`}
                        >
                          {level.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3
                              className={`text-xl font-bold ${
                                userLevel?.level === level.level
                                  ? "text-white"
                                  : (profile?.total_earned || 0) >= level.minPoints
                                    ? "text-green-800"
                                    : "text-gray-600"
                              }`}
                            >
                              Level {level.level}: {level.name}
                            </h3>
                            {userLevel?.level === level.level && (
                              <UIBadge className="bg-white bg-opacity-20 text-white border-0">Current</UIBadge>
                            )}
                            {(profile?.total_earned || 0) >= level.minPoints && userLevel?.level !== level.level && (
                              <UIBadge className="bg-green-600 text-white">Unlocked</UIBadge>
                            )}
                          </div>
                          <p
                            className={`text-sm mb-3 ${
                              userLevel?.level === level.level
                                ? "text-gray-100"
                                : (profile?.total_earned || 0) >= level.minPoints
                                  ? "text-green-700"
                                  : "text-gray-500"
                            }`}
                          >
                            {level.minPoints.toLocaleString()} - {level.maxPoints.toLocaleString()} points
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {level.perks.map((perk, index) => (
                              <UIBadge
                                key={index}
                                className={
                                  userLevel?.level === level.level
                                    ? "bg-white bg-opacity-20 text-white border-0"
                                    : (profile?.total_earned || 0) >= level.minPoints
                                      ? "bg-green-100 text-green-800 border-0"
                                      : "bg-gray-200 text-gray-600 border-0"
                                }
                              >
                                {perk}
                              </UIBadge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
