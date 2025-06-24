"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Search, Filter, Star, Clock, TrendingUp, CheckCircle, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import OfferDetailModal from "./offer-detail-modal"

interface AdvancedOfferSystemProps {
  user: any
  profile: any
  onOfferComplete: (points: number) => void
}

export default function AdvancedOfferSystem({ user, profile, onOfferComplete }: AdvancedOfferSystemProps) {
  const [offers, setOffers] = useState([])
  const [userTasks, setUserTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [sortBy, setSortBy] = useState("points_desc")
  const [showFilters, setShowFilters] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState(null)
  const [completingOffer, setCompletingOffer] = useState(null)

  const supabase = createClientComponentClient()

  const categories = [
    { id: "all", name: "All Offers", icon: "🎯", color: "bg-slate-600" },
    { id: "gaming", name: "Gaming", icon: "🎮", color: "bg-purple-600" },
    { id: "survey", name: "Surveys", icon: "📊", color: "bg-blue-600" },
    { id: "shopping", name: "Shopping", icon: "🛒", color: "bg-green-600" },
    { id: "app", name: "Apps", icon: "📱", color: "bg-orange-600" },
    { id: "video", name: "Videos", icon: "🎥", color: "bg-red-600" },
    { id: "music", name: "Music", icon: "🎵", color: "bg-pink-600" },
    { id: "education", name: "Education", icon: "📚", color: "bg-indigo-600" },
  ]

  const sortOptions = [
    { id: "points_desc", name: "Highest Points", icon: "💰" },
    { id: "points_asc", name: "Lowest Points", icon: "💸" },
    { id: "time_asc", name: "Shortest Time", icon: "⚡" },
    { id: "time_desc", name: "Longest Time", icon: "🕐" },
    { id: "rating_desc", name: "Highest Rated", icon: "⭐" },
    { id: "newest", name: "Newest", icon: "🆕" },
  ]

  useEffect(() => {
    loadOffers()
    loadUserTasks()
  }, [])

  const loadOffers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })

      if (error) throw error
      setOffers(data || [])
    } catch (error) {
      console.error("Error loading offers:", error)
      toast({
        title: "Error",
        description: "Failed to load offers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUserTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_tasks")
        .select("task_id, status, completed_at, points_earned")
        .eq("user_id", user.id)

      if (error) throw error
      setUserTasks(data || [])
    } catch (error) {
      console.error("Error loading user tasks:", error)
    }
  }

  const filteredAndSortedOffers = useMemo(() => {
    const filtered = offers.filter((offer) => {
      // Search filter
      const matchesSearch =
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.provider.toLowerCase().includes(searchQuery.toLowerCase())

      // Category filter
      const matchesCategory = selectedCategory === "all" || offer.category === selectedCategory

      return matchesSearch && matchesCategory
    })

    // Sort offers
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "points_desc":
          return b.points - a.points
        case "points_asc":
          return a.points - b.points
        case "time_asc":
          return (a.estimated_time_minutes || 0) - (b.estimated_time_minutes || 0)
        case "time_desc":
          return (b.estimated_time_minutes || 0) - (a.estimated_time_minutes || 0)
        case "rating_desc":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [offers, searchQuery, selectedCategory, sortBy])

  const handleOfferClick = async (offer) => {
    // Check if already completed
    const isCompleted = userTasks.some((task) => task.task_id === offer.id && task.status === "completed")

    if (isCompleted) {
      toast({
        title: "Already Completed! ✅",
        description: "You have already completed this offer.",
        variant: "destructive",
      })
      return
    }

    setSelectedOffer(offer)
  }

  const handleCompleteOffer = async (offer) => {
    if (completingOffer) return

    setCompletingOffer(offer.id)

    try {
      const response = await fetch("/api/complete-offer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId: offer.id,
          points: offer.points,
          title: offer.title,
        }),
      })

      const data = await response.json()

      if (data.success) {
        onOfferComplete(offer.points)

        toast({
          title: "Offer Completed! 🎉",
          description: `You earned ${offer.points} points from ${offer.title}`,
        })

        // Update user tasks
        await loadUserTasks()
        setSelectedOffer(null)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to complete offer",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete offer",
        variant: "destructive",
      })
    } finally {
      setCompletingOffer(null)
    }
  }

  const getOfferStatus = (offerId) => {
    const userTask = userTasks.find((task) => task.task_id === offerId)
    return userTask?.status || "available"
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-600"
      case "medium":
        return "bg-yellow-600"
      case "hard":
        return "bg-red-600"
      default:
        return "bg-blue-600"
    }
  }

  const getProviderIcon = (provider) => {
    const providerLower = provider?.toLowerCase() || ""
    if (providerLower.includes("game")) return "🎮"
    if (providerLower.includes("survey")) return "📊"
    if (providerLower.includes("shop")) return "🛒"
    if (providerLower.includes("app")) return "📱"
    if (providerLower.includes("video")) return "🎥"
    return "🎯"
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter Header */}
      <div className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search offers, providers, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder-gray-400"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                selectedCategory === category.id
                  ? `${category.color} text-white`
                  : "bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700"
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </Button>
          ))}
        </div>

        {/* Sort and Filter Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="bg-slate-800 border-slate-700 text-gray-300"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-800 border border-slate-700 text-white rounded-md px-3 py-1 text-sm"
            >
              {sortOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>

          <div className="text-sm text-gray-400">{filteredAndSortedOffers.length} offers found</div>
        </div>
      </div>

      {/* Offers Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
      ) : filteredAndSortedOffers.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No offers found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your search or filter criteria</p>
            <Button
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("all")
              }}
              variant="outline"
              className="bg-slate-700 border-slate-600 text-white"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedOffers.map((offer) => {
            const status = getOfferStatus(offer.id)
            const isCompleted = status === "completed"

            return (
              <Card
                key={offer.id}
                className={`bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200 ${
                  isCompleted ? "opacity-60" : ""
                }`}
                onClick={() => handleOfferClick(offer)}
              >
                <CardContent className="p-0">
                  {/* Offer Image/Header */}
                  <div className="relative h-32 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 flex items-center justify-center">
                    <div className="text-4xl">{getProviderIcon(offer.provider)}</div>

                    {/* Status Badge */}
                    {isCompleted && (
                      <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completed
                      </div>
                    )}

                    {/* Trending Badge */}
                    {offer.is_trending && (
                      <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </div>
                    )}
                  </div>

                  {/* Offer Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 flex-1">{offer.title}</h3>
                      <div className="text-right ml-2">
                        <div className="text-green-400 font-bold text-lg">{offer.points} pts</div>
                        <div className="text-gray-400 text-xs">${(offer.points / 100).toFixed(2)}</div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{offer.description}</p>

                    {/* Offer Details */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                          {offer.provider}
                        </Badge>
                        <Badge className={`text-xs text-white ${getDifficultyColor(offer.difficulty)}`}>
                          {offer.difficulty || "Easy"}
                        </Badge>
                      </div>

                      {offer.rating && (
                        <div className="flex items-center text-yellow-400 text-xs">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          {offer.rating.toFixed(1)}
                        </div>
                      )}
                    </div>

                    {/* Time and Requirements */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      {offer.estimated_time && (
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {offer.estimated_time}
                        </div>
                      )}

                      {offer.requirements && (
                        <div className="flex items-center">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          {offer.requirements.split(",").length} req
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Offer Detail Modal */}
      {selectedOffer && (
        <OfferDetailModal
          offer={selectedOffer}
          user={user}
          isCompleted={getOfferStatus(selectedOffer.id) === "completed"}
          isCompleting={completingOffer === selectedOffer.id}
          onClose={() => setSelectedOffer(null)}
          onComplete={() => handleCompleteOffer(selectedOffer)}
        />
      )}
    </div>
  )
}
