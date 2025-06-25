"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Users, DollarSign, RefreshCw, Download, Clock, Menu, X, Shield, Award, FileText, Settings } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface AdminStats {
  totalUsers: number
  activeUsers: number
  bannedUsers: number
  totalPaid: number
  pendingWithdrawals: number
  completedWithdrawals: number
  rejectedWithdrawals: number
  fraudDetected: number
  highRiskUsers: number
  dailySignups: number
  dailyCompletions: number
  revenue: number
  conversionRate: number
  avgUserBalance: number
  topEarner: number
  totalTasks: number
  activeTasks: number
  totalBadges: number
  badgesEarned: number
}

export default function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [withdrawals, setWithdrawals] = useState([])
  const [tasks, setTasks] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showActionModal, setShowActionModal] = useState(false)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [selectedUser, setSelectedUser] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [actionType, setActionType] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedCards, setExpandedCards] = useState<string[]>([])
  const [fraudLogs, setFraudLogs] = useState([])
  const [adminActions, setAdminActions] = useState([])
  const [systemSettings, setSystemSettings] = useState({})
  const [notifications, setNotifications] = useState([])
  const [badges, setBadges] = useState([])
  const [showFraudModal, setShowFraudModal] = useState(false)
  const [selectedFraud, setSelectedFraud] = useState(null)
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    totalPaid: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0,
    rejectedWithdrawals: 0,
    fraudDetected: 0,
    highRiskUsers: 0,
    dailySignups: 0,
    dailyCompletions: 0,
    revenue: 0,
    conversionRate: 0,
    avgUserBalance: 0,
    topEarner: 0,
    totalTasks: 0,
    activeTasks: 0,
    totalBadges: 0,
    badgesEarned: 0,
  })
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  const supabase = createClientComponentClient()
  const [activeTab, setActiveTab] = useState("overview")

  // Tambahkan fungsi yang hilang di bagian atas component, setelah state declarations:

  const createTask = async (taskData: any) => {
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(taskData),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: "Task created successfully",
      })

      fetchData() // Refresh data
      setShowTaskModal(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const updateTask = async (taskId: string, updateData: any) => {
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, ...updateData }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: "Task updated successfully",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const toggleTaskActive = async (taskId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/tasks", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          action: "toggle_active",
          is_active: isActive,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: result.message,
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const createBadge = async (badgeData: any) => {
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/badges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(badgeData),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: "Badge created successfully",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const toggleBadgeActive = async (badgeId: string, isActive: boolean) => {
    try {
      const response = await fetch("/api/admin/badges", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          badgeId,
          action: "toggle_active",
          is_active: isActive,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: result.message,
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleFraudAction = async (fraudId: string, action: string, userId?: string, reason?: string) => {
    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/fraud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, fraudId, userId, reason }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: "Success",
        description: result.message,
      })

      fetchData()
      setShowFraudModal(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const exportDataFunction = async (type: string, format = "csv") => {
    try {
      const response = await fetch(`/api/admin/export?type=${type}&format=${format}`)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error)
      }

      if (format === "csv") {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `${type}_export_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      }

      toast({
        title: "Success",
        description: `${type} data exported successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      console.log("🔍 DEBUG: Starting fetchData...")

      // Debug auth user
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()
      console.log("🔍 DEBUG: Auth user:", user)
      console.log("🔍 DEBUG: Auth error:", authError)

      // Debug withdrawals query
      console.log("🔍 DEBUG: Fetching withdrawals...")
      const withdrawalsResult = await supabase
        .from("withdrawals")
        .select(`
    *,
    profiles:user_id (
      email,
      username,
      balance
    )
  `)
        .order("created_at", { ascending: false })

      console.log("🔍 DEBUG: Withdrawals result:", withdrawalsResult)
      console.log("🔍 DEBUG: Withdrawals data:", withdrawalsResult.data)
      console.log("🔍 DEBUG: Withdrawals error:", withdrawalsResult.error)
      console.log("Fetching comprehensive admin data...")

      // Fetch all data in parallel
      const [
        usersResult,
        sResult,
        tasksResult,
        transactionsResult,
        fraudLogsResult,
        adminActionsResult,
        systemSettingsResult,
        notificationsResult,
        badgesResult,
      ] = await Promise.allSettled([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase
          .from("withdrawals")
          .select(`
    *,
    profiles:user_id (
      email,
      username,
      balance
    )
  `)
          .order("created_at", { ascending: false }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase
          .from("transactions")
          .select("*, profiles!inner(email, username)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("fraud_logs")
          .select("*, profiles(email, username)")
          .order("created_at", { ascending: false })
          .limit(100),
        supabase
          .from("admin_actions")
          .select("*, profiles(email, username)")
          .order("created_at", { ascending: false })
          .limit(50),
        supabase.from("system_settings").select("*"),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(20),
        supabase.from("badges").select("*, user_badges(count)").order("created_at", { ascending: false }),
      ])

      // Process all results
      if (usersResult.status === "fulfilled" && !usersResult.value.error) {
        setUsers(usersResult.value.data || [])
      }
      if (sResult.status === "fulfilled" && !sResult.value.error) {
        setWithdrawals(sResult.value.data || [])
      }
      if (tasksResult.status === "fulfilled" && !tasksResult.value.error) {
        setTasks(tasksResult.value.data || [])
      }
      if (transactionsResult.status === "fulfilled" && !transactionsResult.value.error) {
        setTransactions(transactionsResult.value.data || [])
      }
      if (fraudLogsResult.status === "fulfilled" && !fraudLogsResult.value.error) {
        setFraudLogs(fraudLogsResult.value.data || [])
      }
      if (adminActionsResult.status === "fulfilled" && !adminActionsResult.value.error) {
        setAdminActions(adminActionsResult.value.data || [])
      }
      if (systemSettingsResult.status === "fulfilled" && !systemSettingsResult.value.error) {
        const settingsObj = {}
        systemSettingsResult.value.data?.forEach((setting: any) => {
          settingsObj[setting.setting_key] = setting.setting_value
        })
        setSystemSettings(settingsObj)
      }
      if (notificationsResult.status === "fulfilled" && !notificationsResult.value.error) {
        setNotifications(notificationsResult.value.data || [])
      }
      if (badgesResult.status === "fulfilled" && !badgesResult.value.error) {
        setBadges(badgesResult.value.data || [])
      }

      // Calculate enhanced stats
      calculateEnhancedStats(
        usersResult.status === "fulfilled" ? usersResult.value.data : [],
        sResult.status === "fulfilled" ? sResult.value.data : [],
        tasksResult.status === "fulfilled" ? tasksResult.value.data : [],
        fraudLogsResult.status === "fulfilled" ? fraudLogsResult.value.data : [],
        badgesResult.status === "fulfilled" ? badgesResult.value.data : [],
      )
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to fetch admin data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateEnhancedStats = (
    usersData: any[],
    withdrawalsData: any[],
    tasksData: any[],
    fraudLogsData: any[],
    badgesData: any[],
  ) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const totalUsers = usersData?.length || 0
    const activeUsers = usersData?.filter((u) => u.status === "active" && !u.is_banned).length || 0
    const bannedUsers = usersData?.filter((u) => u.status === "banned").length || 0

    const completedWithdrawals = withdrawalsData?.filter((w) => w.status === "completed") || []
    const pendingWithdrawals = withdrawalsData?.filter((w) => w.status === "pending").length || 0
    const rejectedWithdrawals = withdrawalsData?.filter((w) => w.status === "rejected").length || 0
    const totalPaid = completedWithdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0)

    const fraudDetected = fraudLogsData?.length || 0
    const highRiskUsers =
      fraudLogsData?.filter((f) => f.risk_level === "high" || f.risk_level === "critical").length || 0

    const dailySignups = usersData?.filter((u) => new Date(u.created_at) >= today).length || 0

    const userBalances = usersData?.map((u) => Number(u.balance) || 0) || []
    const avgUserBalance = userBalances.length > 0 ? userBalances.reduce((a, b) => a + b, 0) / userBalances.length : 0
    const topEarner = Math.max(...userBalances, 0)

    const totalTasks = tasksData?.length || 0
    const activeTasks = tasksData?.filter((t) => t.is_active).length || 0

    const totalBadges = badgesData?.length || 0
    const badgesEarned = badgesData?.reduce((sum, badge) => sum + (badge.user_badges?.length || 0), 0) || 0

    const revenue = totalPaid * 0.1
    const conversionRate = totalUsers > 0 ? (completedWithdrawals.length / totalUsers) * 100 : 0

    setStats({
      totalUsers,
      activeUsers,
      bannedUsers,
      totalPaid,
      pendingWithdrawals,
      completedWithdrawals: completedWithdrawals.length,
      rejectedWithdrawals,
      fraudDetected,
      highRiskUsers,
      dailySignups,
      dailyCompletions: 0,
      revenue,
      conversionRate,
      avgUserBalance,
      topEarner,
      totalTasks,
      activeTasks,
      totalBadges,
      badgesEarned,
    })
  }

  const handleWithdrawalAction = async (withdrawal: any, action: "approve" | "reject") => {
    setSelectedWithdrawal(withdrawal)
    setActionType(action)
    setAdminNotes("")
    setShowActionModal(true)
  }

  const confirmWithdrawalAction = async () => {
    if (!selectedWithdrawal || !actionType) return

    try {
      setActionLoading(true)
      const response = await fetch("/api/admin/withdrawal-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          withdrawalId: selectedWithdrawal.id,
          action: actionType,
          adminNotes: adminNotes,
        }),
      })

      const result = await response.json()
      if (!response.ok) throw new Error(result.error)

      toast({
        title: `Withdrawal ${actionType}d`,
        description: result.message,
      })

      setShowActionModal(false)
      setSelectedWithdrawal(null)
      setActionType("")
      setAdminNotes("")
      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const handleUserAction = async (userId: string, action: "ban" | "unban" | "suspend" | "activate") => {
    try {
      const updateData: any = {}

      switch (action) {
        case "ban":
          updateData.status = "banned"
          updateData.balance = 0
          break
        case "unban":
          updateData.status = "active"
          break
        case "suspend":
          updateData.status = "suspended"
          break
        case "activate":
          updateData.status = "active"
          break
      }

      const { error } = await supabase.from("profiles").update(updateData).eq("id", userId)
      if (error) throw error

      if (action === "ban") {
        await supabase.from("transactions").insert({
          user_id: userId,
          type: "admin_adjustment",
          amount: 0,
          description: "Account banned - balance zeroed",
          reference_type: "admin_action",
        })
      }

      toast({
        title: "Success",
        description: `User ${action}ned successfully`,
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const viewUserDetails = (user: any) => {
    setSelectedUser(user)
    setShowUserModal(true)
  }

  const viewTaskDetails = (task: any) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards((prev) => (prev.includes(cardId) ? prev.filter((id) => id !== cardId) : [...prev, cardId]))
  }

  const exportData = (type: string) => {
    let data: any[] = []
    let filename = ""

    switch (type) {
      case "users":
        data = users
        filename = "users_export.csv"
        break
      case "withdrawals":
        data = withdrawals
        filename = "withdrawals_export.csv"
        break
      case "transactions":
        data = transactions
        filename = "transactions_export.csv"
        break
    }

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      })
      return
    }

    const csv = convertToCSV(data)
    downloadCSV(csv, filename)
  }

  const convertToCSV = (data: any[]) => {
    const headers = Object.keys(data[0]).join(",")
    const rows = data.map((row) => Object.values(row).join(","))
    return [headers, ...rows].join("\n")
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const filteredUsers = users.filter((user: any) => {
    const matchesSearch =
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.username?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "active" && user.status === "active" && !user.is_banned) ||
      (filterStatus === "banned" && user.is_banned) ||
      (filterStatus === "suspended" && user.status === "suspended")

    return matchesSearch && matchesFilter
  })

  const filteredWithdrawals = withdrawals.filter((withdrawal: any) => {
    const matchesSearch =
      withdrawal.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      withdrawal.method?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter =
      filterStatus === "all" ||
      (filterStatus === "pending" && withdrawal.status === "pending") ||
      (filterStatus === "completed" && withdrawal.status === "completed") ||
      (filterStatus === "rejected" && withdrawal.status === "rejected")

    return matchesSearch && matchesFilter
  })

  const logAdminAction = async (actionType: string, targetType: string, targetId: string, details: any = {}) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase.from("admin_actions").insert({
          admin_id: user.id,
          action_type: actionType,
          target_type: targetType,
          target_id: targetId,
          details: details,
          reason: adminNotes,
        })
      }
    } catch (error) {
      console.error("Failed to log admin action:", error)
    }
  }

  const updateSystemSetting = async (key: string, value: any) => {
    try {
      const { error } = await supabase
        .from("system_settings")
        .upsert({ setting_key: key, setting_value: value }, { onConflict: "setting_key" })

      if (error) throw error

      await logAdminAction("settings_update", "system", key, { old_value: systemSettings[key], new_value: value })

      setSystemSettings((prev) => ({ ...prev, [key]: value }))

      toast({
        title: "Settings Updated",
        description: `${key} has been updated successfully`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const viewFraudDetails = (fraud: any) => {
    setSelectedFraud(fraud)
    setShowFraudModal(true)
  }

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case "low":
        return "bg-green-100 text-green-800"
      case "medium":
        return "bg-yellow-100 text-yellow-800"
      case "high":
        return "bg-orange-100 text-orange-800"
      case "critical":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  // Mobile Card Component for better mobile display
  const MobileCard = ({
    title,
    children,
    className = "",
  }: { title: string; children: React.ReactNode; className?: string }) => (
    <Card className={`${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  )

  // Mobile Table Component
  const MobileTable = ({ data, renderItem }: { data: any[]; renderItem: (item: any) => React.ReactNode }) => (
    <div className="space-y-3">
      {data.map((item, index) => (
        <Card key={index} className="p-4">
          {renderItem(item)}
        </Card>
      ))}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Loading Admin Dashboard</h3>
            <p className="text-gray-600 text-center">Please wait while we fetch the latest data...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between p-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-600">Dropiyo GPT Platform</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-7xl mx-auto">
        {/* Desktop Header */}
        <div className="hidden lg:block mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">🚀 Admin Dashboard</h1>
              <p className="text-gray-600">Manage your Dropiyo GPT platform with ease</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchData} variant="outline" className="bg-white">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={() => exportDataFunction("users")} variant="outline" className="bg-white">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Grid - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 lg:gap-4 mb-6 lg:mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-2xl font-bold truncate">{stats.totalUsers.toLocaleString()}</div>
                  <div className="text-xs lg:text-sm opacity-90 truncate">Total Users</div>
                  <div className="text-xs opacity-75">+{stats.dailySignups} today</div>
                </div>
                <Users className="h-6 w-6 lg:h-8 lg:w-8 opacity-80 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-2xl font-bold">${stats.totalPaid.toFixed(2)}</div>
                  <div className="text-xs lg:text-sm opacity-90 truncate">Total Paid</div>
                  <div className="text-xs opacity-75">{stats.completedWithdrawals} withdrawals</div>
                </div>
                <DollarSign className="h-6 w-6 lg:h-8 lg:w-8 opacity-80 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-2xl font-bold">{stats.pendingWithdrawals}</div>
                  <div className="text-xs lg:text-sm opacity-90 truncate">Pending</div>
                  <div className="text-xs opacity-75">Needs Review</div>
                </div>
                <Clock className="h-6 w-6 lg:h-8 lg:w-8 opacity-80 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-2xl font-bold">{stats.fraudDetected}</div>
                  <div className="text-xs lg:text-sm opacity-90 truncate">Fraud Detected</div>
                  <div className="text-xs opacity-75">{stats.highRiskUsers} high risk</div>
                </div>
                <Shield className="h-6 w-6 lg:h-8 lg:w-8 opacity-80 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-2xl font-bold">{stats.avgUserBalance.toFixed(2)}</div>
                  <div className="text-xs lg:text-sm opacity-90 truncate">Avg User Balance</div>
                  <div className="text-xs opacity-75">${stats.topEarner.toFixed(2)} top earner</div>
                </div>
                <Award className="h-6 w-6 lg:h-8 lg:w-8 opacity-80 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-3 lg:p-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="text-lg lg:text-2xl font-bold">{stats.totalTasks}</div>
                  <div className="text-xs lg:text-sm opacity-90 truncate">Total Tasks</div>
                  <div className="text-xs opacity-75">{stats.activeTasks} active</div>
                </div>
                <FileText className="h-6 w-6 lg:h-8 lg:w-8 opacity-80 flex-shrink-0" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-First Tabs */}
        <div className="space-y-4 lg:space-y-6">
          {/* Mobile Tab Navigation - Horizontal Scroll */}
          <div className="lg:hidden">
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-2 p-1 bg-muted rounded-lg min-w-max">
                <button
                  onClick={() => setActiveTab("overview")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "overview"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Overview</span>
                </button>
                <button
                  onClick={() => setActiveTab("withdrawals")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "withdrawals"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <DollarSign className="h-4 w-4" />
                  <span>Withdrawals</span>
                  {stats.pendingWithdrawals > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {stats.pendingWithdrawals}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("users")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "users"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span>Users</span>
                </button>
                <button
                  onClick={() => setActiveTab("fraud")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "fraud"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Shield className="h-4 w-4" />
                  <span>Fraud</span>
                  {stats.fraudDetected > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                      {stats.fraudDetected}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("tasks")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "tasks"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Tasks</span>
                </button>
                <button
                  onClick={() => setActiveTab("badges")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "badges"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Award className="h-4 w-4" />
                  <span>Badges</span>
                </button>
                <button
                  onClick={() => setActiveTab("audit")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "audit"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  <span>Audit</span>
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === "settings"
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              <MobileCard title="📊 Recent Activity">
                <div className="space-y-3">
                  {transactions.slice(0, 5).map((transaction: any) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm truncate">{transaction.profiles?.email}</div>
                        <div className="text-xs text-gray-600 truncate">{transaction.description}</div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <div className="font-bold text-green-600 text-sm">${Number(transaction.amount).toFixed(2)}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {transactions.length === 0 && (
                    <div className="text-center py-6 text-gray-500">
                      <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No recent activity</p>
                    </div>
                  )}
                </div>
              </MobileCard>
            </div>
          )}

          {/* Withdrawals Tab */}
          {activeTab === "withdrawals" && (
            <MobileCard title="💳 Withdrawal Management">
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search withdrawals..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-3 py-2 border rounded-md"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Withdrawal List */}
                {filteredWithdrawals.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No withdrawal requests found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredWithdrawals.map((withdrawal: any) => (
                      <Card key={withdrawal.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">
                                {withdrawal.profiles?.email || withdrawal.user_id?.slice(0, 8) + "..."}
                              </div>
                              <div className="text-xs text-gray-500">{withdrawal.profiles?.username}</div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                withdrawal.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : withdrawal.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {withdrawal.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Amount:</span>
                              <div className="font-bold text-green-600">
                                ${Number(withdrawal.amount || 0).toFixed(2)}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Method:</span>
                              <div className="font-medium capitalize">{withdrawal.method}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Balance:</span>
                              <div className="font-medium">${Number(withdrawal.profiles?.balance || 0).toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Date:</span>
                              <div className="font-medium">{new Date(withdrawal.created_at).toLocaleDateString()}</div>
                            </div>
                          </div>

                          <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="text-xs text-gray-600 mb-1">Account Details:</div>
                            <div className="font-mono text-sm font-medium">
                              {withdrawal.account_details ? (
                                typeof withdrawal.account_details === "object" ? (
                                  <div className="space-y-1">
                                    {Object.entries(withdrawal.account_details).map(([key, value]) => (
                                      <div key={key} className="flex justify-between">
                                        <span className="capitalize text-gray-600">{key.replace("_", " ")}:</span>
                                        <span className="font-semibold">{String(value)}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-blue-700">{withdrawal.account_details}</span>
                                )
                              ) : (
                                <span className="text-red-500">No account details provided</span>
                              )}
                            </div>
                          </div>

                          {withdrawal.status === "pending" && (
                            <div className="flex gap-2 pt-2">
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawalAction(withdrawal, "approve")}
                                className="bg-green-600 hover:bg-green-700 flex-1"
                              >
                                ✅ Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleWithdrawalAction(withdrawal, "reject")}
                                className="flex-1"
                              >
                                ❌ Reject
                              </Button>
                            </div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </MobileCard>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <MobileCard title="👥 User Management">
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-3 pr-3 py-2 border rounded-md"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-2 border rounded-md bg-white"
                  >
                    <option value="all">All Users</option>
                    <option value="active">Active</option>
                    <option value="banned">Banned</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>

                {/* User List */}
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No users found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredUsers.slice(0, 20).map((user: any) => (
                      <Card key={user.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{user.email}</div>
                              <div className="text-xs text-gray-500">{user.username || "No username"}</div>
                              {user.referral_code && (
                                <div className="text-xs text-blue-600">Ref: {user.referral_code}</div>
                              )}
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.status === "banned"
                                  ? "bg-red-100 text-red-800"
                                  : user.status === "suspended"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-green-100 text-green-800"
                              }`}
                            >
                              {user.status === "banned" ? "BANNED" : user.status?.toUpperCase() || "ACTIVE"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Balance:</span>
                              <div className="font-bold text-green-600">
                                ${Number(user.balance || 0).toFixed(2)}
                                {user.status === "banned" && <span className="text-red-500 ml-1">(BANNED)</span>}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Earned:</span>
                              <div className="font-medium">${Number(user.total_earned || 0).toFixed(2)}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Joined:</span>
                              <div className="font-medium">{new Date(user.created_at).toLocaleDateString()}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Last Login:</span>
                              <div className="font-medium">
                                {user.last_login ? new Date(user.last_login).toLocaleDateString() : "Never"}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewUserDetails(user)}
                              className="flex-1"
                            >
                              👁️ View
                            </Button>
                            {user.status !== "banned" ? (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleUserAction(user.id, "ban")}
                                className="flex-1"
                              >
                                🚫 Ban
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleUserAction(user.id, "unban")}
                                className="flex-1"
                              >
                                ✅ Unban
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </MobileCard>
          )}

          {/* Fraud Tab */}
          {activeTab === "fraud" && (
            <MobileCard title="🛡️ Fraud Detection">
              <div className="space-y-4">
                {fraudLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No fraud detected. System is monitoring.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fraudLogs.map((fraud: any) => (
                      <Card key={fraud.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{fraud.profiles?.email}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                {fraud.event_type.replace("_", " ")}
                              </div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getRiskLevelColor(fraud.risk_level)}`}
                            >
                              {fraud.risk_level}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Confidence:</span>
                              <div className="font-bold">{(Number(fraud.confidence_score) * 100).toFixed(0)}%</div>
                            </div>
                            <div>
                              <span className="text-gray-600">IP:</span>
                              <div className="font-mono text-xs">{fraud.ip_address}</div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewFraudDetails(fraud)}
                            className="w-full"
                          >
                            👁️ View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </MobileCard>
          )}

          {/* Tasks Tab */}
          {activeTab === "tasks" && (
            <MobileCard title="🎯 Task Management">
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() => {
                    setEditingTask(null)
                    setShowTaskCreationModal(true)
                  }}
                >
                  ➕ Add New Task
                </Button>

                {tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No tasks found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tasks.slice(0, 10).map((task: any) => (
                      <Card key={task.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm truncate">{task.title}</div>
                              <div className="text-xs text-gray-500">{task.provider}</div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                task.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {task.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Type:</span>
                              <div className="font-medium capitalize">{task.task_type}</div>
                            </div>
                            <div>
                              <span className="text-gray-600">Reward:</span>
                              <div className="font-bold text-green-600">
                                ${Number(task.reward_amount || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => viewTaskDetails(task)}
                              className="flex-1"
                            >
                              👁️ View
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingTask(task)
                                setShowTaskCreationModal(true)
                              }}
                              className="flex-1"
                            >
                              ✏️ Edit
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </MobileCard>
          )}

          {/* Badges Tab */}
          {activeTab === "badges" && (
            <MobileCard title="🏆 Badge Management">
              <div className="space-y-4">
                <Button
                  className="w-full"
                  onClick={() =>
                    createBadge({
                      name: "New Badge",
                      description: "Badge description",
                      icon: "🏆",
                      requirement_type: "task_completion",
                      requirement_value: 10,
                      reward_amount: 1.0,
                    })
                  }
                >
                  ➕ Add New Badge
                </Button>

                {badges.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No badges found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {badges.map((badge: any) => (
                      <Card key={badge.id} className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{badge.icon}</div>
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-sm">{badge.name}</div>
                              <div className="text-xs text-gray-600">{badge.description}</div>
                            </div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                badge.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {badge.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-gray-600">Requirement:</span>
                              <div className="font-medium">
                                {badge.requirement_value} {badge.requirement_type.replace("_", " ")}
                              </div>
                            </div>
                            <div>
                              <span className="text-gray-600">Reward:</span>
                              <div className="font-bold text-green-600">${Number(badge.reward_amount).toFixed(2)}</div>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              👁️ View
                            </Button>
                            <Button
                              size="sm"
                              variant={badge.is_active ? "destructive" : "default"}
                              onClick={() => toggleBadgeActive(badge.id, !badge.is_active)}
                              className="flex-1"
                            >
                              {badge.is_active ? "🚫 Disable" : "✅ Enable"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </MobileCard>
          )}

          {/* Audit Tab */}
          {activeTab === "audit" && (
            <MobileCard title="📋 Admin Audit Trail">
              <div className="space-y-4">
                {adminActions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No admin actions recorded yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminActions.map((action: any) => (
                      <Card key={action.id} className="p-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium text-sm">{action.profiles?.email}</div>
                              <div className="text-xs text-gray-500 capitalize">
                                {action.action_type.replace("_", " ")}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {new Date(action.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="text-sm">
                            <span className="text-gray-600">Target:</span>
                            <span className="font-medium ml-1 capitalize">{action.target_type}</span>
                          </div>
                          {action.reason && (
                            <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{action.reason}</div>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </MobileCard>
          )}

          {/* Settings Tab */}
          {activeTab === "settings" && (
            <MobileCard title="⚙️ Platform Settings">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Minimum Withdrawal (USD)</label>
                    <input
                      type="number"
                      defaultValue={systemSettings.min_withdrawal_amount || "2.00"}
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md"
                      onBlur={(e) => updateSystemSetting("min_withdrawal_amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Maximum Withdrawal (USD)</label>
                    <input
                      type="number"
                      defaultValue={systemSettings.max_withdrawal_amount || "1000.00"}
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md"
                      onBlur={(e) => updateSystemSetting("max_withdrawal_amount", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Referral Commission (%)</label>
                    <input
                      type="number"
                      defaultValue={Number(systemSettings.referral_commission_rate || 0.1) * 100}
                      step="1"
                      className="w-full px-3 py-2 border rounded-md"
                      onBlur={(e) => updateSystemSetting("referral_commission_rate", Number(e.target.value) / 100)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Daily Login Bonus (USD)</label>
                    <input
                      type="number"
                      defaultValue={systemSettings.daily_login_bonus || "0.25"}
                      step="0.01"
                      className="w-full px-3 py-2 border rounded-md"
                      onBlur={(e) => updateSystemSetting("daily_login_bonus", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Maintenance Mode</div>
                      <p className="text-sm text-gray-600">Temporarily disable user access</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenance_mode === "true"}
                      onChange={(e) => updateSystemSetting("maintenance_mode", e.target.checked.toString())}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Allow New Registrations</div>
                      <p className="text-sm text-gray-600">Enable/disable new user signups</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.allow_new_registrations !== "false"}
                      onChange={(e) => updateSystemSetting("allow_new_registrations", e.target.checked.toString())}
                      className="w-4 h-4"
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <div className="font-medium">Fraud Detection System</div>
                      <p className="text-sm text-gray-600">Enable automatic fraud detection</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={systemSettings.fraud_detection_enabled !== "false"}
                      onChange={(e) => updateSystemSetting("fraud_detection_enabled", e.target.checked.toString())}
                      className="w-4 h-4"
                    />
                  </div>
                </div>

                <Button className="w-full">💾 Save All Settings</Button>
              </div>
            </MobileCard>
          )}
        </div>
      </div>

      {/* Withdrawal Action Modal */}
      {showActionModal && (
        <Dialog open={showActionModal} onOpenChange={setShowActionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{actionType === "approve" ? "Approve Withdrawal" : "Reject Withdrawal"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p>
                  <strong>User:</strong> {selectedWithdrawal?.profiles?.email}
                </p>
                <p>
                  <strong>Amount:</strong> ${Number(selectedWithdrawal?.amount || 0).toFixed(2)}
                </p>
                <p>
                  <strong>Method:</strong> {selectedWithdrawal?.method}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Admin Notes:</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add notes for this action..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowActionModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={confirmWithdrawalAction}
                disabled={actionLoading}
                className={actionType === "approve" ? "bg-green-600 hover:bg-green-700" : ""}
                variant={actionType === "reject" ? "destructive" : "default"}
              >
                {actionLoading ? "Processing..." : actionType === "approve" ? "Approve" : "Reject"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
