"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EarnTabProps {
  onOfferClick: (offer: any) => void
}

export default function EarnTab({ onOfferClick }: EarnTabProps) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [completingTask, setCompletingTask] = useState<number | null>(null)

  const categories = [
    { id: "all", name: "All", icon: "🎯" },
    { id: "survey", name: "Surveys", icon: "📊" },
    { id: "gaming", name: "Gaming", icon: "🎮" },
    { id: "app", name: "Apps", icon: "📱" },
    { id: "video", name: "Videos", icon: "🎥" },
    { id: "social", name: "Social", icon: "👥" },
    { id: "email", name: "Email", icon: "📧" },
    { id: "trial", name: "Trials", icon: "🆓" },
  ]

  useEffect(() => {
    fetchTasks()
  }, [selectedCategory])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        category: selectedCategory,
        limit: "50",
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

  const handleTaskClick = async (task: any) => {
    try {
      setCompletingTask(task.id)

      // Simulate task completion (in real app, this would open external URL)
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Task Completed! 🎉",
          description: data.message,
        })

        // Show new badges if any
        if (data.newBadges && data.newBadges.length > 0) {
          setTimeout(() => {
            toast({
              title: "New Badge Earned! 🏆",
              description: `You earned: ${data.newBadges.map((b: any) => b.name).join(", ")}`,
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
                className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200"
                onClick={() => handleTaskClick(task)}
              >
                <CardContent className="p-0">
                  {/* Task Header */}
                  <div className="relative h-32 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                    <div className="text-4xl">{getCategoryIcon(task.category)}</div>

                    {/* Provider Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="text-white border-white/30 bg-black/20">
                        {task.provider}
                      </Badge>
                    </div>

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
                          {task.category}
                        </Badge>
                        <Badge className={`${getDifficultyColor(task.difficulty)} text-white text-xs`}>
                          {task.difficulty}
                        </Badge>
                      </div>

                      <div className="text-gray-400 text-xs">{task.estimated_time}</div>
                    </div>

                    {/* Action Button */}
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={completingTask === task.id}
                    >
                      {completingTask === task.id ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      {completingTask === task.id ? "Completing..." : "Start Task"}
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
