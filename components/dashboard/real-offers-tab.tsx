"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, RefreshCw, ExternalLink, Star } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface RealOffer {
  id: string
  title: string
  description: string
  reward_amount: number
  provider: string
  difficulty: string
  estimated_time: string
  url: string
  category: string
  countries: string[]
  is_featured: boolean
}

interface RealOffersTabProps {
  userId: string
}

export default function RealOffersTab({ userId }: RealOffersTabProps) {
  const [offers, setOffers] = useState<RealOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeProvider, setActiveProvider] = useState("all")
  const [completingOffer, setCompletingOffer] = useState<string | null>(null)
  const [stats, setStats] = useState({
    totalOffers: 0,
    highPayingOffers: 0,
    featuredOffers: 0,
    averageReward: 0,
  })

  const providers = [
    { id: "all", name: "All Offers", color: "bg-blue-600" },
    { id: "cpx_research", name: "CPX Research", color: "bg-green-600" },
    { id: "adgem", name: "AdGem", color: "bg-purple-600" },
    { id: "lootably", name: "Lootably", color: "bg-orange-600" },
    { id: "offertoro", name: "OfferToro", color: "bg-red-600" },
  ]

  useEffect(() => {
    loadOffers()
  }, [activeProvider])

  const loadOffers = async () => {
    try {
      setLoading(true)

      // Mock real offers data (replace with actual API calls)
      const mockOffers: RealOffer[] = [
        {
          id: "1",
          title: "Complete Survey about Shopping Habits",
          description: "Share your shopping preferences in this 10-minute survey",
          reward_amount: 0.75,
          provider: "cpx_research",
          difficulty: "easy",
          estimated_time: "10 minutes",
          url: "https://cpx-research.com/survey/123",
          category: "survey",
          countries: ["US", "CA", "UK"],
          is_featured: true,
        },
        {
          id: "2",
          title: "Install & Play Mobile Game",
          description: "Download Candy Crush and reach level 10",
          reward_amount: 1.5,
          provider: "adgem",
          difficulty: "medium",
          estimated_time: "30 minutes",
          url: "https://adgem.com/offer/456",
          category: "app_install",
          countries: ["US", "CA"],
          is_featured: false,
        },
        {
          id: "3",
          title: "Sign up for Streaming Service",
          description: "Create account and start free trial",
          reward_amount: 2.0,
          provider: "lootably",
          difficulty: "easy",
          estimated_time: "5 minutes",
          url: "https://lootably.com/offer/789",
          category: "signup",
          countries: ["US"],
          is_featured: true,
        },
        {
          id: "4",
          title: "Watch Video Series",
          description: "Watch 5 short videos about finance",
          reward_amount: 0.5,
          provider: "offertoro",
          difficulty: "easy",
          estimated_time: "15 minutes",
          url: "https://offertoro.com/offer/101",
          category: "video",
          countries: ["US", "CA", "UK", "AU"],
          is_featured: false,
        },
        {
          id: "5",
          title: "Complete Profile Survey",
          description: "Fill out detailed profile information",
          reward_amount: 1.25,
          provider: "cpx_research",
          difficulty: "easy",
          estimated_time: "8 minutes",
          url: "https://cpx-research.com/survey/202",
          category: "survey",
          countries: ["US", "CA", "UK"],
          is_featured: true,
        },
      ]

      // Filter by provider
      const filteredOffers =
        activeProvider === "all" ? mockOffers : mockOffers.filter((offer) => offer.provider === activeProvider)

      setOffers(filteredOffers)

      // Calculate stats
      setStats({
        totalOffers: filteredOffers.length,
        highPayingOffers: filteredOffers.filter((o) => o.reward_amount >= 1.0).length,
        featuredOffers: filteredOffers.filter((o) => o.is_featured).length,
        averageReward: filteredOffers.reduce((sum, o) => sum + o.reward_amount, 0) / filteredOffers.length || 0,
      })
    } catch (error) {
      console.error("Error loading offers:", error)
      toast({
        title: "Error",
        description: "Failed to load offers. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOfferClick = async (offer: RealOffer) => {
    try {
      setCompletingOffer(offer.id)

      // Track offer click
      await fetch("/api/offerwall/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          offerId: offer.id,
          provider: offer.provider,
        }),
      })

      // Open offer in new tab
      window.open(offer.url, "_blank")

      toast({
        title: "Offer Opened! 🚀",
        description: `Complete the ${offer.provider} offer to earn $${offer.reward_amount.toFixed(2)}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to open offer",
        variant: "destructive",
      })
    } finally {
      setCompletingOffer(null)
    }
  }

  const filteredOffers = offers.filter(
    (offer) =>
      offer.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      offer.description.toLowerCase().includes(searchQuery.toLowerCase()),
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

  const getProviderColor = (provider: string) => {
    const providerData = providers.find((p) => p.id === provider)
    return providerData?.color || "bg-gray-600"
  }

  return (
    <div className="pb-20">
      {/* Stats Overview */}
      <div className="px-4 mb-6">
        <div className="grid grid-cols-4 gap-2 mb-4">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-white">{stats.totalOffers}</div>
              <div className="text-blue-100 text-xs">Available</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-white">{stats.highPayingOffers}</div>
              <div className="text-green-100 text-xs">High Pay</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0">
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-white">{stats.featuredOffers}</div>
              <div className="text-purple-100 text-xs">Featured</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-orange-600 to-orange-700 border-0">
            <CardContent className="p-2 text-center">
              <div className="text-sm font-bold text-white">${stats.averageReward.toFixed(2)}</div>
              <div className="text-orange-100 text-xs">Avg Reward</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
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
          <Button onClick={loadOffers} disabled={loading} variant="outline" className="bg-slate-800 border-slate-700">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Provider Filter - Horizontal Scroll */}
      <div className="px-4 mb-6">
        <div className="flex space-x-3 overflow-x-auto scrollbar-hide pb-2">
          {providers.map((provider) => (
            <Button
              key={provider.id}
              onClick={() => setActiveProvider(provider.id)}
              variant={activeProvider === provider.id ? "default" : "outline"}
              className={`
                flex-shrink-0 whitespace-nowrap text-sm
                ${
                  activeProvider === provider.id
                    ? `${provider.color} text-white hover:opacity-90`
                    : "bg-slate-800 border-slate-700 text-gray-300 hover:bg-slate-700"
                }
              `}
            >
              {provider.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Offers List */}
      <div className="px-4">
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
        ) : filteredOffers.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-white mb-2">No offers found</h3>
              <p className="text-gray-400 mb-4">Try adjusting your search or provider filter</p>
              <Button onClick={loadOffers}>Refresh Offers</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredOffers.map((offer) => (
              <Card
                key={offer.id}
                className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200"
                onClick={() => handleOfferClick(offer)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-white text-sm line-clamp-1 flex-1">{offer.title}</h3>
                        {offer.is_featured && (
                          <Badge className="bg-yellow-600 text-white text-xs flex items-center space-x-1">
                            <Star className="h-3 w-3" />
                            <span>Featured</span>
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{offer.description}</p>
                      <div className="flex items-center space-x-2">
                        <Badge className={`${getProviderColor(offer.provider)} text-white text-xs`}>
                          {providers.find((p) => p.id === offer.provider)?.name || offer.provider}
                        </Badge>
                        <Badge className={`${getDifficultyColor(offer.difficulty)} text-white text-xs`}>
                          {offer.difficulty}
                        </Badge>
                        <span className="text-gray-400 text-xs">{offer.estimated_time}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-sm">
                        +{Math.floor(offer.reward_amount * 200)} pts
                      </div>
                      <div className="text-gray-400 text-xs">${offer.reward_amount.toFixed(2)}</div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={completingOffer === offer.id}
                  >
                    {completingOffer === offer.id ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    {completingOffer === offer.id ? "Opening..." : "Start Offer"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
