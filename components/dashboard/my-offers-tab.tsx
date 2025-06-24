"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface MyOffersTabProps {
  user: any
}

export default function MyOffersTab({ user }: MyOffersTabProps) {
  const [userTasks, setUserTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchUserTasks()
  }, [])

  const fetchUserTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_tasks")
        .select(`
          *,
          tasks (
            title,
            description,
            reward_amount,
            provider
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setUserTasks(data || [])
    } catch (error) {
      console.error("Error fetching user tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-400" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "pending":
        return "bg-yellow-600"
      case "failed":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-6 pb-20">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-green-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-6 pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">My Offers</h2>

      {userTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-xl font-semibold text-white mb-2">No offers yet</h3>
          <p className="text-gray-400 mb-6">Start completing offers to see them here</p>
          <Button className="bg-green-600 hover:bg-green-700">Browse Offers</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {userTasks.map((userTask) => (
            <Card key={userTask.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{userTask.tasks?.title || "Unknown Task"}</h3>
                    <p className="text-gray-400 text-sm mb-2">{userTask.tasks?.description || "No description"}</p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {userTask.tasks?.provider || "Unknown"}
                      </Badge>
                      <Badge className={getStatusColor(userTask.status)}>{userTask.status}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-1">
                      {getStatusIcon(userTask.status)}
                      <span className="text-green-400 font-bold">
                        +{userTask.points_earned || Math.round(userTask.tasks?.reward_amount || 0)}
                      </span>
                    </div>
                    <div className="text-gray-400 text-xs">{new Date(userTask.created_at).toLocaleDateString()}</div>
                  </div>
                </div>

                {userTask.completed_at && (
                  <div className="text-green-400 text-xs">
                    Completed: {new Date(userTask.completed_at).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
