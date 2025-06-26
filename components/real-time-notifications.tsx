"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Bell, X, Gift, DollarSign, Users, Trophy, Star, Zap, Info } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type: "achievement" | "reward" | "offer" | "withdrawal" | "referral" | "system" | "bonus"
  title: string
  message: string
  timestamp: Date
  read: boolean
  data?: any
  priority: "low" | "medium" | "high"
  icon?: string
  color?: string
  user_id?: string // Add to match DB
  is_read?: boolean // Add to match DB
  created_at?: string // Add to match DB
}

interface RealTimeNotificationsProps {
  user: any
  profile: any
  onNotificationClick?: (notification: Notification) => void
}

export default function RealTimeNotifications({ user, profile, onNotificationClick }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const supabase = createClientComponentClient()
  const notificationRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeNotifications()
    const cleanup = setupRealtimeSubscription()
    setupServiceWorker()

    // Listen for custom events
    const handleDailyBonusClaimed = (event: CustomEvent) => {
      const { amount, newBalance } = event.detail
      const notification: Notification = {
        id: `daily_bonus_${Date.now()}`,
        type: "bonus",
        title: "Daily Bonus Claimed! 🎉",
        message: `You earned $${(amount / 100).toFixed(2)}! Your balance is now $${newBalance.toFixed(2)}.`,
        timestamp: new Date(),
        read: false,
        priority: "high",
        icon: "🎁",
        color: "from-green-500 to-emerald-500",
      }
      addNotification(notification)
    }

    window.addEventListener("dailyBonusClaimed", handleDailyBonusClaimed as EventListener)

    return () => {
      cleanup?.()
      window.removeEventListener("dailyBonusClaimed", handleDailyBonusClaimed as EventListener)
    }
  }, [user.id])

  const initializeNotifications = async () => {
    try {
      // Load notifications from database instead of localStorage
      const { data: dbNotifications, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) {
        console.error("Error loading notifications:", error)
        return
      }

      if (dbNotifications && dbNotifications.length > 0) {
        const parsedNotifications = dbNotifications.map((n: any) => ({
          id: n.id,
          type: n.type === "success" ? "reward" : n.type === "error" ? "withdrawal" : "system",
          title: n.title,
          message: n.message,
          timestamp: new Date(n.created_at),
          read: n.is_read,
          priority: n.type === "error" ? "high" : "medium",
          color:
            n.type === "success"
              ? "from-green-500 to-emerald-500"
              : n.type === "error"
                ? "from-red-500 to-red-600"
                : "from-blue-500 to-purple-500",
        }))

        setNotifications(parsedNotifications)
        updateUnreadCount(parsedNotifications)
      } else {
        // Add welcome notification for new users
        await supabase.from("notifications").insert({
          user_id: user.id,
          title: "Welcome to Dropiyo! 🎉",
          message: "Start earning by completing your first offer. Claim your daily bonus too!",
          type: "info",
        })
      }
    } catch (error) {
      console.error("Error initializing notifications:", error)
    }
  }

  const setupRealtimeSubscription = () => {
    console.log("Setting up real-time subscriptions...")
    setIsConnected(true)

    const channel = supabase
      .channel("user_notifications")
      // Subscribe ke notifications table untuk real-time notifications
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload)
          handleDatabaseNotification(payload.new)
        },
      )
      .subscribe((status) => {
        console.log("Subscription status:", status)
        if (status === "SUBSCRIBED") {
          setIsConnected(true)
          console.log("Real-time subscriptions active")
        } else if (status === "CHANNEL_ERROR") {
          setIsConnected(false)
          console.error("Real-time subscription error")
        }
      })

    return () => {
      console.log("Cleaning up subscriptions")
      channel.unsubscribe()
    }
  }

  // Handle notifications dari database
  const handleDatabaseNotification = (dbNotification: any) => {
    const notification: Notification = {
      id: dbNotification.id,
      type: dbNotification.type === "success" ? "reward" : dbNotification.type === "error" ? "withdrawal" : "system",
      title: dbNotification.title,
      message: dbNotification.message,
      timestamp: new Date(dbNotification.created_at),
      read: dbNotification.is_read,
      priority: dbNotification.type === "error" ? "high" : "medium",
      color:
        dbNotification.type === "success"
          ? "from-green-500 to-emerald-500"
          : dbNotification.type === "error"
            ? "from-red-500 to-red-600"
            : "from-blue-500 to-purple-500",
    }

    // Add to local state
    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, 50)
      updateUnreadCount(updated)

      // Show browser notification
      if (Notification.permission === "granted" && !notification.read) {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: notification.id,
        })
      }

      // Show toast for high priority
      if (notification.priority === "high") {
        toast({
          title: notification.title,
          description: notification.message,
        })
      }

      return updated
    })
  }

  const setupServiceWorker = async () => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      try {
        // Register service worker for push notifications
        const registration = await navigator.serviceWorker.register("/sw.js")
        console.log("Service Worker registered:", registration)

        // Request notification permission
        const permission = await Notification.requestPermission()
        if (permission === "granted") {
          console.log("Notification permission granted")
        }
      } catch (error) {
        console.error("Service Worker registration failed:", error)
      }
    }
  }

  const addNotification = (notification: Notification) => {
    setNotifications((prev) => {
      const updated = [notification, ...prev].slice(0, 50)
      updateUnreadCount(updated)

      // Show browser notification if permission granted
      if (Notification.permission === "granted" && !notification.read) {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          tag: notification.id,
        })
      }

      // Show toast for high priority notifications
      if (notification.priority === "high") {
        toast({
          title: notification.title,
          description: notification.message,
        })
      }

      return updated
    })
  }

  const updateUnreadCount = (notificationList: Notification[]) => {
    const count = notificationList.filter((n) => !n.read).length
    setUnreadCount(count)

    // Update document title with unread count
    if (count > 0) {
      document.title = `(${count}) Dropiyo - Get Paid To Complete Tasks`
    } else {
      document.title = "Dropiyo - Get Paid To Complete Tasks"
    }
  }

  const markAsRead = async (notificationId: string) => {
    // Update in database
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .eq("user_id", user.id)

    if (error) {
      console.error("Error marking notification as read:", error)
      return
    }

    // Update local state
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      updateUnreadCount(updated)
      return updated
    })
  }

  const markAllAsRead = async () => {
    // Update all unread notifications in database
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false)

    if (error) {
      console.error("Error marking all notifications as read:", error)
      return
    }

    // Update local state
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }))
      updateUnreadCount(updated)
      return updated
    })
  }

  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.filter((n) => n.id !== notificationId)
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated))
      updateUnreadCount(updated)
      return updated
    })
  }

  // Event handlers for real-time updates
  // const handleTaskCompletion = (task: any) => {
  //   const notification: Notification = {
  //     id: `task_${task.id}_${Date.now()}`,
  //     type: "reward",
  //     title: "Task Completed! 🎉",
  //     message: `You earned ${task.points_earned} points! Keep up the great work.`,
  //     timestamp: new Date(),
  //     read: false,
  //     priority: "medium",
  //     data: task,
  //     icon: "🎯",
  //     color: "from-green-500 to-emerald-500",
  //   }
  //   addNotification(notification)

  //   // Check for achievements
  //   checkAchievements(task)
  // }

  // const handleWithdrawalUpdate = (withdrawal: any) => {
  //   const notification: Notification = {
  //     id: `withdrawal_${withdrawal.id}_${Date.now()}`,
  //     type: "withdrawal",
  //     title: "Withdrawal Processed! 💳",
  //     message: `Your $${(withdrawal.amount / 100).toFixed(2)} withdrawal has been processed successfully.`,
  //     timestamp: new Date(),
  //     read: false,
  //     priority: "high",
  //     data: withdrawal,
  //     icon: "💰",
  //     color: "from-blue-500 to-cyan-500",
  //   }
  //   addNotification(notification)
  // }

  // const handleNewReferral = (referral: any) => {
  //   const notification: Notification = {
  //     id: `referral_${referral.id}_${Date.now()}`,
  //     type: "referral",
  //     title: "New Referral! 👥",
  //     message: "Someone joined using your referral link. You'll earn 10% commission from their activities!",
  //     timestamp: new Date(),
  //     read: false,
  //     priority: "medium",
  //     data: referral,
  //     icon: "🤝",
  //     color: "from-purple-500 to-pink-500",
  //   }
  //   addNotification(notification)
  // }

  // const checkAchievements = (task: any) => {
  //   // Simulate achievement checking
  //   const achievements = [
  //     {
  //       id: "first_task",
  //       title: "First Steps! 🚀",
  //       message: "Congratulations on completing your first task!",
  //       condition: () => true, // Simplified for demo
  //     },
  //     {
  //       id: "points_milestone",
  //       title: "Point Collector! ⭐",
  //       message: "You've earned over 100 points! Amazing progress.",
  //       condition: () => (profile?.points || 0) > 100,
  //     },
  //     {
  //       id: "streak_master",
  //       title: "Streak Master! 🔥",
  //       message: "5 days login streak! You're on fire!",
  //       condition: () => Math.random() > 0.8, // Random for demo
  //     },
  //   ]

  //   achievements.forEach((achievement) => {
  //     if (achievement.condition()) {
  //       const notification: Notification = {
  //         id: `achievement_${achievement.id}_${Date.now()}`,
  //         type: "achievement",
  //         title: achievement.title,
  //         message: achievement.message,
  //         timestamp: new Date(),
  //         read: false,
  //         priority: "high",
  //         icon: "🏆",
  //         color: "from-yellow-500 to-orange-500",
  //       }
  //       addNotification(notification)
  //     }
  //   })
  // }

  // const generateRandomNotification = () => {
  //   const randomNotifications = [
  //     {
  //       type: "offer" as const,
  //       title: "New High-Paying Offer! 💎",
  //       message: "A $15 survey just became available. Complete it before it expires!",
  //       icon: "💎",
  //       color: "from-emerald-500 to-teal-500",
  //     },
  //     {
  //       type: "bonus" as const,
  //       title: "Bonus Multiplier Active! ⚡",
  //       message: "Next 3 offers give 2x points! Limited time only.",
  //       icon: "⚡",
  //       color: "from-yellow-500 to-orange-500",
  //     },
  //     {
  //       type: "system" as const,
  //       title: "Daily Bonus Ready! 🎁",
  //       message: "Don't forget to claim your daily login bonus.",
  //       icon: "🎁",
  //       color: "from-purple-500 to-pink-500",
  //     },
  //   ]

  //   const random = randomNotifications[Math.floor(Math.random() * randomNotifications.length)]
  //   const notification: Notification = {
  //     id: `random_${Date.now()}`,
  //     ...random,
  //     timestamp: new Date(),
  //     read: false,
  //     priority: "medium",
  //   }
  //   addNotification(notification)
  // }

  const getNotificationIcon = (type: string) => {
    const icons = {
      achievement: Trophy,
      reward: Gift,
      offer: Zap,
      withdrawal: DollarSign,
      referral: Users,
      system: Info,
      bonus: Star,
    }
    return icons[type as keyof typeof icons] || Bell
  }

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date()
    const diff = now.getTime() - timestamp.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (days > 0) return `${days}d ago`
    if (hours > 0) return `${hours}h ago`
    if (minutes > 0) return `${minutes}m ago`
    return "Just now"
  }

  const addTestNotification = () => {
    const testNotification: Notification = {
      id: `test_${Date.now()}`,
      type: "system",
      title: "Test Notification 🧪",
      message: "This is a test notification to verify the system is working.",
      timestamp: new Date(),
      read: false,
      priority: "medium",
      icon: "🧪",
      color: "from-blue-500 to-purple-500",
    }
    addNotification(testNotification)
  }

  return (
    <div className="relative">
      {/* Notification Bell */}
      <div className="relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <Bell className="h-6 w-6 text-green-400 hover:text-green-300 transition-colors" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 99 ? "99+" : unreadCount}
          </div>
        )}
        {isConnected && (
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        )}
      </div>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 top-8 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && <Badge className="bg-red-600 text-white text-xs">{unreadCount}</Badge>}
            </div>
            <div className="flex items-center space-x-2">
              {process.env.NODE_ENV === "development" && (
                <Button size="sm" variant="ghost" onClick={addTestNotification} className="text-xs text-blue-400">
                  Test
                </Button>
              )}
              {unreadCount > 0 && (
                <Button size="sm" variant="ghost" onClick={markAllAsRead} className="text-xs text-green-400">
                  Mark all read
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)} className="text-gray-400 p-1">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Connection Status */}
          <div className="px-4 py-2 bg-slate-700 border-b border-slate-600">
            <div className="flex items-center space-x-2 text-xs">
              <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-red-400"}`}></div>
              <span className="text-gray-300">{isConnected ? "Live updates active" : "Connecting..."}</span>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto" ref={notificationRef}>
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="text-gray-400 mb-2">No notifications yet</div>
                <p className="text-gray-500 text-sm">You'll see live updates here</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-700">
                {notifications.map((notification) => {
                  const IconComponent = getNotificationIcon(notification.type)
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-slate-700 cursor-pointer transition-colors ${
                        !notification.read ? "bg-slate-750 border-l-4 border-l-green-400" : ""
                      }`}
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(notification.id)
                        onNotificationClick?.(notification)
                      }}
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-r ${
                            notification.color || "from-blue-500 to-purple-500"
                          } flex items-center justify-center flex-shrink-0`}
                        >
                          {notification.icon ? (
                            <span className="text-lg">{notification.icon}</span>
                          ) : (
                            <IconComponent className="h-5 w-5 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-white text-sm truncate">{notification.title}</h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                            )}
                          </div>
                          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{notification.message}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-500 text-xs">{formatTimeAgo(notification.timestamp)}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteNotification(notification.id)
                              }}
                              className="text-gray-400 hover:text-red-400 p-1"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
