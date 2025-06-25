"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import type { FrontendTask } from "@/types"

interface EarnTabProps {
  onOfferClick: (task: FrontendTask) => void // ✅ FIX: Use proper type
}

export default function EarnTab({ onOfferClick }: EarnTabProps) {
  const [tasks, setTasks] = useState<FrontendTask[]>([]) // ✅ FIX: Use proper type
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [completingTask, setCompletingTask] = useState<number | null>(null)

  const categories = [
    { id: "all", name: "All", icon: "🎯" },
    { id: "survey", name: "Surveys", icon: "📊" }, // ✅ FIX: Use DB value
    { id: "video", name: "Videos", icon: "🎥" }, // ✅ FIX: Use DB value
    { id: "app_install", name: "Apps", icon: "📱" }, // ✅ FIX: Use DB value
    { id: "offer", name: "Offers", icon: "🎁" }, // ✅ FIX: Use DB value
    { id: "signup", name: "Signups", icon: "✍️" }, // ✅ FIX: Use DB value
  ]

  useEffect(() => {
    fetchTasks()
  }, [selectedCategory])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        task_type: selectedCategory === "all" ? "" : selectedCategory, // ✅ FIX: Use task_type
        limit: "50",
        include_expired: "false", // ✅ ADD: Filter expired tasks
        include_completed: "false", // ✅ ADD: Filter completed tasks
      })

      const response = await fetch(`/api/tasks?${params}`)
      const data = await response.json()

      if (data.success) {
        setTasks(data.tasks || [])
      } else {
        throw new Error(data.error || "Failed to fetch tasks")
      }
    } catch (error: any) {
      console.error("Error fetching tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load offers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleTaskClick = async (task: FrontendTask) => {
    try {
      // ✅ IMPROVED: Check if task can be completed
      if (!task.can_complete) {
        toast({
          title: "Task Unavailable",
          description:
            task.status === "expired"
              ? "This task has expired"
              : task.status === "limit_reached"
                ? "You've reached the limit for this task"
                : task.status === "completed"
                  ? "You've already completed this task"
                  : "This task is not available",
          variant: "destructive",
        })
        return
      }

      setCompletingTask(task.id)

      // Use TaskManager for completion
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Task Completed! 🎉",
          description: `You earned ${task.points} points!`,
        })

        // Show completion progress if available
        if (task.completion_progress) {
          const progress = task.completion_progress
          setTimeout(() => {
            toast({
              title: "Progress Update 📊",
              description: `Daily: ${progress.daily_completed + 1}/${task.daily_limit || "∞"} | Total: ${progress.total_completed + 1}/${task.total_limit || "∞"}`,
            })
          }, 1000)
        }

        // Refresh tasks list
        fetchTasks()
      } else {
        throw new Error(data.error || "Failed to complete task")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      })
    } finally {
      setCompletingTask(null)
    }
  }

  const filteredTasks = tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-600"
      case "medium":
        return "bg-yellow-600"
      case "hard":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getCategoryIcon = (category: string) => {
    const cat = categories.find((c) => c.id === category)
    return cat?.icon || "🎯"
  }

  const getTaskStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "✓ Completed"
      case "expired":
        return "⏰ Expired"
      case "limit_reached":
        return "🚫 Limit Reached"
      default:
        return "Unavailable"
    }
  }

  return (
    <div className="pb-20">
      {/* Search and Filters */}
      <div className="px-4 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Button onClick={fetchTasks} disabled={loading} variant="outline" className="bg-slate-800 border-slate-700">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Category Filters */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                selectedCategory === category.id
                  ? "bg-green-600 text-white"
                  : "bg-slate-800 border-slate-700 text-gray-300"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="px-4">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
                <CardContent className="p-4">
                  <div className="h-32 bg-slate-700 rounded-lg mb-4"></div>
                  <div className="h-4 bg-slate-700 rounded mb-2"></div>
                  <div className="h-3 bg-slate-700 rounded mb-4"></div>
                  <div className="flex justify-between">
                    <div className="h-6 w-16 bg-slate-700 rounded"></div>
                    <div className="h-6 w-12 bg-slate-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No offers found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or category filter</p>
              <Button onClick={fetchTasks}>Refresh Offers</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => (
              <Card
                key={task.id}
                className={`bg-slate-800 border-slate-700 cursor-pointer transition-all duration-200 ${
                  task.can_complete ? "hover:bg-slate-700" : "opacity-60 cursor-not-allowed"
                }`}
                onClick={() => handleTaskClick(task)}
              >
                <CardContent className="p-0">
                  {/* Task Header */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-4xl">{getCategoryIcon(task.task_type)}</div>

                    {/* Status Badge */}
                    {task.status !== "available" && (
                      <div className="absolute top-2 left-2">
                        <Badge
                          variant="outline"
                          className={`text-white border-white/30 ${
                            task.status === "completed"
                              ? "bg-green-600/20"
                              : task.status === "expired"
                                ? "bg-red-600/20"
                                : task.status === "limit_reached"
                                  ? "bg-yellow-600/20"
                                  : "bg-blue-600/20"
                          }`}
                        >
                          {task.status === "completed"
                            ? "✓ Done"
                            : task.status === "expired"
                              ? "⏰ Expired"
                              : task.status === "limit_reached"
                                ? "🚫 Limit"
                                : task.status}
                        </Badge>
                      </div>
                    )}

                    {/* Points Badge */}
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-600 text-white">+{task.points}</Badge>
                    </div>
                  </div>

                  {/* Task Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 flex-1">{task.title}</h3>
                    </div>

                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{task.description}</p>

                    {/* Task Details */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                          {task.task_type}
                        </Badge>
                        <Badge className={`${getDifficultyColor(task.difficulty)} text-white text-xs`}>
                          {task.difficulty}
                        </Badge>
                      </div>

                      <div className="text-gray-400 text-xs">{task.estimated_time}</div>
                    </div>

                    {/* Progress Info */}
                    {task.completion_progress && (task.daily_limit || task.total_limit) && (
                      <div className="text-xs text-gray-400 mb-3">
                        {task.daily_limit && (
                          <span>
                            Daily: {task.completion_progress.daily_completed}/{task.daily_limit}{" "}
                          </span>
                        )}
                        {task.total_limit && (
                          <span>
                            Total: {task.completion_progress.total_completed}/{task.total_limit}
                          </span>
                        )}
                        {task.completion_progress.expires_in && (
                          <span className="text-yellow-400"> • Expires: {task.completion_progress.expires_in}</span>
                        )}
                      </div>
                    )}

                    {/* Action Button */}
                    <Button
                      className={`w-full text-white ${
                        task.can_complete ? "bg-blue-600 hover:bg-blue-700" : "bg-gray-600 cursor-not-allowed"
                      }`}
                      disabled={completingTask === task.id || !task.can_complete}
                    >
                      {completingTask === task.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      {completingTask === task.id
                        ? "Completing..."
                        : !task.can_complete
                          ? getTaskStatusText(task.status)
                          : "Start Task"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
