"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import {
  Search,
  Filter,
  ExternalLink,
  RefreshCw,
  TrendingUp,
  Clock,
  Star,
  Globe,
  Smartphone,
  Monitor,
  CheckCircle,
  DollarSign,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface RealOfferwallSystemProps {
  user: any
  profile: any
  onOfferComplete: (points: number) => void
}

export default function RealOfferwallSystem({ user, profile, onOfferComplete }: RealOfferwallSystemProps) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedProvider, setSelectedProvider] = useState("all")
  const [sortBy, setSortBy] = useState("payout_desc")
  const [minPayout, setMinPayout] = useState("")
  const [maxPayout, setMaxPayout] = useState("")
  const [showFilters, setShowFilters] = useState(false)
  const [completions, setCompletions] = useState([])
  const [providerStats, setProviderStats] = useState([])
  const [activeTab, setActiveTab] = useState("offers") // Declare setActiveTab variable

  const supabase = createClientComponentClient()

  const providers = [
    { id: "all", name: "All Providers", icon: "🌐", color: "bg-gray-600" },
    { id: "cpx_research", name: "CPX Research", icon: "📊", color: "bg-blue-600" },
    { id: "adgem", name: "AdGem", icon: "💎", color: "bg-purple-600" },
    { id: "lootably", name: "Lootably", icon: "🎁", color: "bg-green-600" },
    { id: "offertoro", name: "OfferToro", icon: "🐂", color: "bg-red-600" },
    { id: "bitlabs", name: "BitLabs", icon: "🔬", color: "bg-indigo-600" },
    { id: "ayetstudios", name: "AyeT Studios", icon: "🎮", color: "bg-orange-600" },
    { id: "revenue_universe", name: "Revenue Universe", icon: "🌌", color: "bg-pink-600" },
    { id: "persona_ly", name: "Persona.ly", icon: "👤", color: "bg-teal-600" },
  ]

  const categories = [
    { id: "all", name: "All Categories", icon: "🎯" },
    { id: "survey", name: "Surveys", icon: "📊" },
    { id: "gaming", name: "Gaming", icon: "🎮" },
    { id: "shopping", name: "Shopping", icon: "🛒" },
    { id: "app", name: "Apps", icon: "📱" },
    { id: "video", name: "Videos", icon: "🎥" },
    { id: "social", name: "Social", icon: "👥" },
    { id: "finance", name: "Finance", icon: "💰" },
    { id: "education", name: "Education", icon: "📚" },
  ]

  useEffect(() => {
    loadOffers()
    loadCompletions()
    loadProviderStats()
  }, [])

  const loadOffers = async (useCache = true) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        cache: useCache.toString(),
        ...(selectedCategory !== "all" && { category: selectedCategory }),
        ...(minPayout && { minPayout }),
        ...(maxPayout && { maxPayout }),
        limit: "50",
      })

      const response = await fetch(`/api/offerwall/sync?${params}`)
      const data = await response.json()

      if (data.offers) {
        setOffers(data.offers)
      } else {
        throw new Error(data.error || "Failed to load offers")
      }
    } catch (error: any) {
      console.error("Error loading offers:", error)
      toast({
        title: "Error",
        description: "Failed to load offers. Using cached data.",
        variant: "destructive",
      })

      // Fallback to cached offers
      if (!useCache) {
        await loadOffers(true)
      }
    } finally {
      setLoading(false)
    }
  }

  const loadCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from("offer_completions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(20)

      if (error) throw error
      setCompletions(data || [])
    } catch (error) {
      console.error("Error loading completions:", error)
    }
  }

  const loadProviderStats = async () => {
    try {
      const { data, error } = await supabase
        .from("provider_stats")
        .select("*")
        .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
        .order("date", { ascending: false })

      if (error) throw error
      setProviderStats(data || [])
    } catch (error) {
      console.error("Error loading provider stats:", error)
    }
  }

  const syncOffers = async () => {
    try {
      setSyncing(true)

      const response = await fetch("/api/offerwall/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, force: true }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sync Complete! 🎉",
          description: "Latest offers have been synced from all providers",
        })
        await loadOffers(false)
      } else {
        throw new Error(data.error || "Sync failed")
      }
    } catch (error: any) {
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync offers",
        variant: "destructive",
      })
    } finally {
      setSyncing(false)
    }
  }

  const handleOfferClick = async (offer: any) => {
    try {
      // Check if already completed
      const isCompleted = completions.some((c) => c.external_offer_id === offer.id && c.status === "completed")

      if (isCompleted) {
        toast({
          title: "Already Completed! ✅",
          description: "You have already completed this offer.",
          variant: "destructive",
        })
        return
      }

      const response = await fetch("/api/offerwall/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offerId: offer.id }),
      })

      const data = await response.json()

      if (data.success) {
        // Open offer in new tab
        window.open(data.offerUrl, "_blank")

        toast({
          title: "Offer Opened! 🚀",
          description: `Complete the offer to earn ${offer.points} points`,
        })
      } else {
        throw new Error(data.error || "Failed to open offer")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open offer",
        variant: "destructive",
      })
    }
  }

  const filteredOffers = offers
    .filter((offer) => {
      const matchesSearch =
        offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        offer.description.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = selectedCategory === "all" || offer.category === selectedCategory
      const matchesProvider = selectedProvider === "all" || offer.providerId === selectedProvider

      return matchesSearch && matchesCategory && matchesProvider
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "payout_desc":
          return b.payout - a.payout
        case "payout_asc":
          return a.payout - b.payout
        case "points_desc":
          return b.points - a.points
        case "points_asc":
          return a.points - b.points
        case "rating_desc":
          return (b.rating || 0) - (a.rating || 0)
        case "newest":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        default:
          return 0
      }
    })

  const getProviderIcon = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    return provider?.icon || "🌐"
  }

  const getProviderColor = (providerId: string) => {
    const provider = providers.find((p) => p.id === providerId)
    return provider?.color || "bg-gray-600"
  }

  const isOfferCompleted = (offerId: string) => {
    return completions.some((c) => c.external_offer_id === offerId && c.status === "completed")
  }

  const renderOffersTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search offers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white"
            />
          </div>
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant="outline"
            className="bg-slate-800 border-slate-700 text-white"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={syncOffers} disabled={syncing} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
        </div>

        {/* Provider Tabs */}
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              variant={selectedProvider === provider.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedProvider(provider.id)}
              className={`flex items-center space-x-2 whitespace-nowrap ${
                selectedProvider === provider.id
                  ? `${provider.color} text-white`
                  : "bg-slate-800 border-slate-700 text-gray-300"
              }`}
            >
              <span>{provider.icon}</span>
              <span>{provider.name}</span>
            </Button>
          ))}
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

        {/* Advanced Filters */}
        {showFilters && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Min Payout ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={minPayout}
                    onChange={(e) => setMinPayout(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Max Payout ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={maxPayout}
                    onChange={(e) => setMaxPayout(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-white mb-2 block">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-slate-700 border border-slate-600 text-white rounded-md px-3 py-2"
                  >
                    <option value="payout_desc">Highest Payout</option>
                    <option value="payout_asc">Lowest Payout</option>
                    <option value="points_desc">Most Points</option>
                    <option value="points_asc">Least Points</option>
                    <option value="rating_desc">Highest Rated</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <Button onClick={() => loadOffers(false)} size="sm">
                  Apply Filters
                </Button>
                <Button
                  onClick={() => {
                    setMinPayout("")
                    setMaxPayout("")
                    setSortBy("payout_desc")
                    setSelectedCategory("all")
                    setSelectedProvider("all")
                    setSearchQuery("")
                  }}
                  variant="outline"
                  size="sm"
                  className="bg-slate-700 border-slate-600 text-white"
                >
                  Clear All
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
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
      ) : filteredOffers.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-white mb-2">No offers found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or sync for new offers</p>
            <Button onClick={syncOffers} disabled={syncing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
              Sync Offers
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOffers.map((offer) => {
            const isCompleted = isOfferCompleted(offer.id)

            return (
              <Card
                key={offer.id}
                className={`bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200 ${
                  isCompleted ? "opacity-60" : ""
                }`}
                onClick={() => handleOfferClick(offer)}
              >
                <CardContent className="p-0">
                  {/* Offer Header */}
                  <div
                    className={`relative h-32 bg-gradient-to-br ${getProviderColor(offer.providerId)} flex items-center justify-center`}
                  >
                    <div className="text-4xl">{getProviderIcon(offer.providerId)}</div>

                    {/* Status Badges */}
                    <div className="absolute top-2 right-2 flex flex-col space-y-1">
                      {isCompleted && (
                        <Badge className="bg-green-600 text-white text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      {offer.rating && offer.rating >= 4.5 && (
                        <Badge className="bg-yellow-600 text-white text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Top Rated
                        </Badge>
                      )}
                    </div>

                    {/* Provider Badge */}
                    <div className="absolute top-2 left-2">
                      <Badge variant="outline" className="text-white border-white/30 bg-black/20">
                        {providers.find((p) => p.id === offer.providerId)?.name || offer.providerId}
                      </Badge>
                    </div>
                  </div>

                  {/* Offer Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white text-sm line-clamp-2 flex-1">{offer.title}</h3>
                      <div className="text-right ml-2">
                        <div className="text-green-400 font-bold text-lg">${offer.payout.toFixed(2)}</div>
                        <div className="text-gray-400 text-xs">{offer.points} pts</div>
                      </div>
                    </div>

                    <p className="text-gray-400 text-xs mb-3 line-clamp-2">{offer.description}</p>

                    {/* Offer Details */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                          {offer.category}
                        </Badge>
                        <Badge className="bg-blue-600 text-white text-xs">{offer.difficulty || "Easy"}</Badge>
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
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {offer.estimatedTime || "10 min"}
                      </div>

                      <div className="flex items-center">
                        <Globe className="h-3 w-3 mr-1" />
                        {offer.countries?.length || 0} countries
                      </div>

                      <div className="flex items-center">
                        {offer.devices?.includes("mobile") && <Smartphone className="h-3 w-3 mr-1" />}
                        {offer.devices?.includes("desktop") && <Monitor className="h-3 w-3" />}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="mt-3">
                      {isCompleted ? (
                        <Button disabled className="w-full bg-green-600 text-white">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Completed
                        </Button>
                      ) : (
                        <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Start Offer
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )

  const renderCompletionsTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Your Completions</h3>
        <Badge className="bg-green-600 text-white">
          {completions.filter((c) => c.status === "completed").length} Completed
        </Badge>
      </div>

      {completions.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-8 text-center">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-semibold text-white mb-2">No completions yet</h3>
            <p className="text-gray-400 mb-4">Complete offers to see them here</p>
            <Button onClick={() => setActiveTab("offers")}>Browse Offers</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {completions.map((completion) => (
            <Card key={completion.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getProviderIcon(completion.provider_id)}</div>
                    <div>
                      <h4 className="font-semibold text-white text-sm">{completion.external_offer_id}</h4>
                      <p className="text-gray-400 text-xs">
                        {providers.find((p) => p.id === completion.provider_id)?.name || completion.provider_id}
                      </p>
                      <p className="text-gray-500 text-xs">{new Date(completion.completed_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-green-400 font-bold">+{completion.points_earned} pts</div>
                    <div className="text-gray-400 text-sm">${completion.payout_usd.toFixed(2)}</div>
                    <Badge
                      variant={
                        completion.status === "completed"
                          ? "default"
                          : completion.status === "pending"
                            ? "secondary"
                            : "destructive"
                      }
                      className="mt-1"
                    >
                      {completion.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )

  const renderStatsTab = () => {
    const totalCompletions = completions.filter((c) => c.status === "completed").length
    const totalEarned = completions.filter((c) => c.status === "completed").reduce((sum, c) => sum + c.points_earned, 0)
    const totalPayout = completions
      .filter((c) => c.status === "completed")
      .reduce((sum, c) => sum + Number.parseFloat(c.payout_usd), 0)

    const providerBreakdown = providers
      .filter((p) => p.id !== "all")
      .map((provider) => {
        const providerCompletions = completions.filter((c) => c.provider_id === provider.id && c.status === "completed")
        return {
          ...provider,
          completions: providerCompletions.length,
          earned: providerCompletions.reduce((sum, c) => sum + c.points_earned, 0),
          payout: providerCompletions.reduce((sum, c) => sum + Number.parseFloat(c.payout_usd), 0),
        }
      })
      .filter((p) => p.completions > 0)
      .sort((a, b) => b.earned - a.earned)

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{totalCompletions}</div>
              <div className="text-blue-100">Total Completions</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">{totalEarned.toLocaleString()}</div>
              <div className="text-green-100">Points Earned</div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 text-white">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold">${totalPayout.toFixed(2)}</div>
              <div className="text-purple-100">USD Earned</div>
            </CardContent>
          </Card>
        </div>

        {/* Provider Breakdown */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Provider Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {providerBreakdown.length === 0 ? (
              <p className="text-gray-400 text-center py-8">No completions yet</p>
            ) : (
              <div className="space-y-4">
                {providerBreakdown.map((provider) => (
                  <div key={provider.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-10 h-10 ${provider.color} rounded-lg flex items-center justify-center text-white`}
                      >
                        {provider.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">{provider.name}</h4>
                        <p className="text-gray-400 text-sm">{provider.completions} completions</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold">{provider.earned} pts</div>
                      <div className="text-gray-400 text-sm">${provider.payout.toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {completions.slice(0, 5).map((completion) => (
              <div
                key={completion.id}
                className="flex items-center justify-between py-2 border-b border-slate-700 last:border-b-0"
              >
                <div className="flex items-center space-x-2">
                  <div className="text-lg">{getProviderIcon(completion.provider_id)}</div>
                  <div>
                    <p className="text-white text-sm font-medium">
                      {providers.find((p) => p.id === completion.provider_id)?.name}
                    </p>
                    <p className="text-gray-400 text-xs">{new Date(completion.completed_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="text-green-400 font-bold text-sm">+{completion.points_earned} pts</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Real Offerwall System</h2>
          <p className="text-gray-400">Complete offers from top providers to earn points</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-600 text-white">{offers.length} Available</Badge>
          <Badge className="bg-green-600 text-white">{providers.filter((p) => p.id !== "all").length} Providers</Badge>
        </div>
      </div>

      <Tabs defaultValue={activeTab} className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-slate-800">
          <TabsTrigger value="offers" className="text-white">
            <DollarSign className="h-4 w-4 mr-2" />
            Offers
          </TabsTrigger>
          <TabsTrigger value="completions" className="text-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Completions
          </TabsTrigger>
          <TabsTrigger value="stats" className="text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Stats
          </TabsTrigger>
        </TabsList>

        <TabsContent value="offers">{renderOffersTab()}</TabsContent>

        <TabsContent value="completions">{renderCompletionsTab()}</TabsContent>

        <TabsContent value="stats">{renderStatsTab()}</TabsContent>
      </Tabs>
    </div>
  )
}
