"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, RefreshCw, ExternalLink, Zap, Star, TrendingUp } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { hybridTaskManager, type HybridTask } from "@/lib/hybrid-task-manager"

interface HybridEarnTabProps {
  userId: string
}

export default function HybridEarnTab({ userId }: HybridEarnTabProps) {
  const [tasks, setTasks] = useState<HybridTask[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("recommended")
  const [completingTask, setCompletingTask] = useState<string | null>(null)
  const [taskStats, setTaskStats] = useState({
    totalCompleted: 0,
    sampleCompleted: 0,
    offerwallCompleted: 0,
    totalEarned: 0,
    averageRating: 0,
  })

  useEffect(() => {
    loadTasks()
    loadTaskStats()
  }, [activeTab])

  const loadTasks = async () => {
    try {
      setLoading(true)

      const options: any = { limit: 50 }

      switch (activeTab) {
        case "sample":
          options.source = "sample"
          break
        case "offerwall":
          options.source = "offerwall"
          break
        case "high-paying":
          options.minPayout = 1.0
          break
        default:
          options.source = "all"
      }

      const taskList = await hybridTaskManager.getTaskRecommendations(userId, options)
      setTasks(taskList)
    } catch (error) {
      console.error("Error loading tasks:", error)
      toast({
        title: "Error",
        description: "Failed to load tasks. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTaskStats = async () => {
    try {
      const stats = await hybridTaskManager.getTaskStats(userId)
      setTaskStats(stats)
    } catch (error) {
      console.error("Error loading task stats:", error)
    }
  }

  const handleTaskClick = async (task: HybridTask) => {
    try {
      setCompletingTask(task.id)

      if (task.task_source === "sample") {
        // Handle sample task completion
        const result = await hybridTaskManager.completeSampleTask(task.id)

        if (result.success) {
          toast({
            title: "Task Completed! 🎉",
            description: result.message,
          })

          if (result.newBadges && result.newBadges.length > 0) {
            setTimeout(() => {
              toast({
                title: "New Badge Earned! 🏆",
                description: `You earned: ${result.newBadges.map((b) => b.name).join(", ")}`,
              })
            }, 1000)
          }

          loadTasks()
          loadTaskStats()
        } else {
          throw new Error(result.message || "Failed to complete task")
        }
      } else {
        // Handle offerwall task
        const result = await hybridTaskManager.handleOfferwallTask(task)

        if (result.success && result.offerUrl) {
          // Open offer in new tab
          window.open(result.offerUrl, "_blank")

          toast({
            title: "Offer Opened! 🚀",
            description: `Complete the ${task.provider} offer to earn ${Math.floor(task.reward_amount * 1000)} points`,
          })
        } else {
          throw new Error(result.message || "Failed to open offer")
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process task",
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

  const getSourceIcon = (source: string) => {
    return source === "sample" ? <Zap className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />
  }

  const getSourceColor = (source: string) => {
    return source === "sample" ? "bg-blue-600" : "bg-purple-600"
  }

  return (
    <div className="pb-20">
      {/* Stats Overview */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-white">{taskStats.totalCompleted}</div>
              <div className="text-green-100 text-xs">Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-white">{taskStats.totalEarned}</div>
              <div className="text-blue-100 text-xs">Points Earned</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-white">{taskStats.offerwallCompleted}</div>
              <div className="text-purple-100 text-xs">Real Offers</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Button onClick={loadTasks} disabled={loading} variant="outline" className="bg-slate-800 border-slate-700">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Task Categories */}
      <div className="px-4 mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-800">
            <TabsTrigger value="recommended" className="text-xs">
              Recommended
            </TabsTrigger>
            <TabsTrigger value="sample" className="text-xs">
              Quick Tasks
            </TabsTrigger>
            <TabsTrigger value="offerwall" className="text-xs">
              Real Offers
            </TabsTrigger>
            <TabsTrigger value="high-paying" className="text-xs">
              High Pay
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            {loading ? (
              <div className="grid grid-cols-1 gap-4">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-slate-700 rounded mb-2 w-full"></div>
                        </div>
                        <div className="h-6 w-16 bg-slate-700 rounded"></div>
                      </div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-20 bg-slate-700 rounded"></div>
                        <div className="h-6 w-16 bg-slate-700 rounded"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-white mb-2">No tasks found</h3>
                  <p className="text-gray-400 mb-4">Try adjusting your search or category filter</p>
                  <Button onClick={loadTasks}>Refresh Tasks</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredTasks.map((task) => (
                  <Card
                    key={task.id}
                    className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200"
                    onClick={() => handleTaskClick(task)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 pr-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-white text-sm line-clamp-1 flex-1">{task.title}</h3>
                            <Badge
                              className={`${getSourceColor(task.task_source)} text-white text-xs flex items-center space-x-1`}
                            >
                              {getSourceIcon(task.task_source)}
                              <span>{task.task_source === "sample" ? "Quick" : "Real"}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-400 text-xs mb-2 line-clamp-2">{task.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                              {task.provider}
                            </Badge>
                            <Badge className={`${getDifficultyColor(task.difficulty)} text-white text-xs`}>
                              {task.difficulty}
                            </Badge>
                            <span className="text-gray-400 text-xs">{task.estimated_time}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-green-400 font-bold text-sm">
                            +{Math.floor(task.reward_amount * 1000)} pts
                          </div>
                          <div className="text-gray-400 text-xs">${task.reward_amount.toFixed(2)}</div>
                          {task.recommendation_score > 80 && (
                            <Badge className="bg-yellow-600 text-white text-xs mt-1">
                              <Star className="h-3 w-3 mr-1" />
                              Top Pick
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={completingTask === task.id}
                      >
                        {completingTask === task.id ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : task.task_source === "sample" ? (
                          <Zap className="h-4 w-4 mr-2" />
                        ) : (
                          <ExternalLink className="h-4 w-4 mr-2" />
                        )}
                        {completingTask === task.id
                          ? "Processing..."
                          : task.task_source === "sample"
                            ? "Complete Now"
                            : "Start Offer"}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
