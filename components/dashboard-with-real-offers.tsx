"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Bell, Heart, Gamepad2, DollarSign, Gift, CreditCard, Clock, CheckCircle, Zap, RefreshCw } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import WithdrawalModal from "./withdrawal-modal"
import ProfilePage from "./profile-page-fixed"

interface DashboardProps {
  user: any
  profile: any
}

export default function DashboardWithRealOffers({ user, profile }: DashboardProps) {
  const [points, setPoints] = useState(profile?.points || 0)
  const [activeTab, setActiveTab] = useState("earn")
  const [showNotifications, setShowNotifications] = useState(false)
  const [showProfilePage, setShowProfilePage] = useState(false)
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [userTasks, setUserTasks] = useState([])
  const [completions, setCompletions] = useState([])

  const supabase = createClientComponentClient()
  const router = useRouter()

  // Load real offers from offerwall providers
  useEffect(() => {
    loadRealOffers()
    loadUserTasks()
    loadCompletions()
  }, [])

  const loadRealOffers = async (useCache = true) => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        cache: useCache.toString(),
        limit: "20",
      })

      const response = await fetch(`/api/offerwall/sync?${params}`)
      const data = await response.json()

      if (data.offers) {
        setOffers(data.offers)
      } else {
        // Fallback to database offers if API fails
        const { data: dbOffers } = await supabase
          .from("tasks")
          .select("*")
          .eq("is_active", true)
          .order("points", { ascending: false })
          .limit(20)

        setOffers(dbOffers || [])
      }
    } catch (error: any) {
      console.error("Error loading offers:", error)

      // Fallback to database offers
      const { data: dbOffers } = await supabase
        .from("tasks")
        .select("*")
        .eq("is_active", true)
        .order("points", { ascending: false })
        .limit(20)

      setOffers(dbOffers || [])
    } finally {
      setLoading(false)
    }
  }

  const loadUserTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("user_tasks")
        .select(`
          *,
          tasks (
            title,
            description,
            provider
          )
        `)
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false })
        .limit(10)

      if (error) throw error
      setUserTasks(data || [])
    } catch (error) {
      console.error("Error loading user tasks:", error)
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
        await loadRealOffers(false)
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

  // If profile page is shown, render it instead of dashboard
  if (showProfilePage) {
    return <ProfilePage user={user} profile={profile} onBack={() => setShowProfilePage(false)} />
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

      // For real offerwall offers
      if (offer.providerId) {
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
      } else {
        // For database offers (fallback)
        const earnedPoints = offer.points

        const { error } = await supabase
          .from("profiles")
          .update({ points: points + earnedPoints })
          .eq("id", user.id)

        if (error) throw error

        setPoints(points + earnedPoints)

        toast({
          title: "Offer Completed! 🎉",
          description: `You earned ${earnedPoints} points`,
        })

        await supabase.from("user_tasks").insert({
          user_id: user.id,
          task_id: offer.id,
          points_earned: earnedPoints,
          status: "completed",
        })

        loadUserTasks()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to complete offer",
        variant: "destructive",
      })
    }
  }

  const getProviderIcon = (providerId: string) => {
    const providerIcons = {
      cpx_research: "📊",
      adgem: "💎",
      lootably: "🎁",
      offertoro: "🐂",
      bitlabs: "🔬",
      ayetstudios: "🎮",
      revenue_universe: "🌌",
      persona_ly: "👤",
    }
    return providerIcons[providerId] || "🌐"
  }

  const getProviderName = (providerId: string) => {
    const providerNames = {
      cpx_research: "CPX Research",
      adgem: "AdGem",
      lootably: "Lootably",
      offertoro: "OfferToro",
      bitlabs: "BitLabs",
      ayetstudios: "AyeT Studios",
      revenue_universe: "Revenue Universe",
      persona_ly: "Persona.ly",
    }
    return providerNames[providerId] || providerId
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-600"
      case "medium":
        return "bg-blue-600"
      case "hard":
        return "bg-red-600"
      default:
        return "bg-blue-600"
    }
  }

  const isOfferCompleted = (offerId: string) => {
    return completions.some((c) => c.external_offer_id === offerId && c.status === "completed")
  }

  const renderEarnTab = () => (
    <div className="pb-20">
      {/* Header with sync button */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Heart className="h-5 w-5 text-green-400" />
            <h2 className="text-xl font-bold text-white">Available Offers</h2>
          </div>
          <Button onClick={syncOffers} disabled={syncing} size="sm" className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing..." : "Sync"}
          </Button>
        </div>

        {/* Real Offers from Providers */}
        <div className="space-y-4">
          {loading ? (
            // Loading skeleton
            [...Array(3)].map((_, i) => (
              <Card key={i} className="bg-slate-800 border-slate-700 animate-pulse">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="h-4 bg-slate-700 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-slate-700 rounded mb-2 w-full"></div>
                      <div className="flex space-x-2">
                        <div className="h-6 w-20 bg-slate-700 rounded"></div>
                        <div className="h-6 w-16 bg-slate-700 rounded"></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="h-6 w-16 bg-slate-700 rounded mb-1"></div>
                      <div className="h-4 w-12 bg-slate-700 rounded"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : offers.length === 0 ? (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-8 text-center">
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-xl font-semibold text-white mb-2">No offers available</h3>
                <p className="text-gray-400 mb-4">Try syncing for new offers</p>
                <Button onClick={syncOffers} disabled={syncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                  Sync Offers
                </Button>
              </CardContent>
            </Card>
          ) : (
            offers.map((offer: any) => {
              const isCompleted = isOfferCompleted(offer.id)
              const isRealOffer = !!offer.providerId

              return (
                <Card
                  key={offer.id}
                  className={`bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-colors ${
                    isCompleted ? "opacity-60" : ""
                  }`}
                  onClick={() => handleOfferClick(offer)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white mb-1 flex-1 pr-4">{offer.title}</h3>
                          <div className="text-right">
                            <div className="text-green-400 font-bold text-lg">{offer.points} pts</div>
                            <div className="text-gray-400 text-sm">
                              ${isRealOffer ? offer.payout?.toFixed(2) : (offer.points / 100).toFixed(2)}
                            </div>
                          </div>
                        </div>

                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{offer.description}</p>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {isRealOffer && (
                              <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                                {getProviderName(offer.providerId)}
                              </Badge>
                            )}
                            <Badge className={`text-white text-xs ${getDifficultyColor(offer.difficulty || "medium")}`}>
                              {offer.difficulty || "medium"}
                            </Badge>
                            {offer.estimatedTime && (
                              <span className="text-gray-400 text-xs flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {offer.estimatedTime}
                              </span>
                            )}
                          </div>

                          {isCompleted && (
                            <Badge className="bg-green-600 text-white text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>

                        {/* Category badge */}
                        {offer.category && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                              {offer.category}
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )

  const renderMyOffersTab = () => (
    <div className="px-4 pt-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">My Offers</h2>
        <div className="flex space-x-2">
          <Badge variant="default" className="bg-green-600">
            {userTasks.length + completions.filter((c) => c.status === "completed").length} Completed
          </Badge>
        </div>
      </div>

      {/* Combined completions from both sources */}
      <div className="space-y-4">
        {[...userTasks, ...completions].length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-2">No completed offers yet</div>
              <Button onClick={() => setActiveTab("earn")} variant="outline" size="sm">
                Start Earning
              </Button>
            </CardContent>
          </Card>
        ) : (
          [...userTasks, ...completions]
            .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
            .map((item: any) => (
              <Card key={`${item.id}-${item.external_offer_id || "task"}`} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-1">
                        {item.tasks?.title || item.external_offer_id || "Completed Offer"}
                      </h3>
                      <p className="text-gray-400 text-xs mb-2">
                        {item.tasks?.description || "Offer completed successfully"}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs border-slate-600 text-gray-300">
                          {item.provider_id ? getProviderName(item.provider_id) : item.tasks?.provider || "Platform"}
                        </Badge>
                        <Badge className="bg-green-600 text-white text-xs">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-sm">+{item.points_earned} pts</div>
                      <div className="text-gray-400 text-xs">{new Date(item.completed_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
        )}
      </div>
    </div>
  )

  const renderCashoutTab = () => {
    const paymentMethods = [
      {
        id: "dana",
        name: "DANA",
        icon: "💳",
        minimum: "$2.00",
        fee: "Free",
        processingTime: "Instant",
        color: "from-blue-600 to-blue-700",
        popular: true,
      },
      {
        id: "gopay",
        name: "GoPay",
        icon: "🟢",
        minimum: "$2.00",
        fee: "Free",
        processingTime: "Instant",
        color: "from-green-600 to-green-700",
        popular: true,
      },
      {
        id: "shopeepay",
        name: "ShopeePay",
        icon: "🛒",
        minimum: "$2.00",
        fee: "Free",
        processingTime: "Instant",
        color: "from-orange-600 to-orange-700",
      },
    ]

    return (
      <div className="px-4 pt-6 pb-20">
        <h2 className="text-2xl font-bold text-white mb-6">Cashout</h2>

        {/* Balance Card */}
        <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 mb-6">
          <CardContent className="p-6 text-center">
            <div className="text-4xl font-bold text-white mb-2">${(points / 100).toFixed(2)}</div>
            <div className="text-green-100 mb-4">Available Balance</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-2xl font-bold text-white">{points}</div>
                <div className="text-green-100">Total Points</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-white">${((profile?.total_earned || 0) / 100).toFixed(2)}</div>
                <div className="text-green-100">Total Earned</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <Card
                key={method.id}
                className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200"
                onClick={() => {
                  if (points < 200) {
                    toast({
                      title: "Insufficient Balance",
                      description: "Minimum withdrawal is $2.00 (200 points)",
                      variant: "destructive",
                    })
                    return
                  }
                  setSelectedPaymentMethod(method.id)
                  setShowWithdrawalModal(true)
                }}
              >
                <CardContent className="p-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center text-2xl`}
                    >
                      {method.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-white">{method.name}</h4>
                        {method.popular && <Badge className="bg-green-600 text-white text-xs">Popular</Badge>}
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mt-1">
                        <div>Min: {method.minimum}</div>
                        <div>Fee: {method.fee}</div>
                        <div>{method.processingTime}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleClaimBonus = async () => {
    try {
      const response = await fetch("/api/claim-bonus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bonusType: "daily_login", points: 25 }),
      })

      const data = await response.json()

      if (data.success) {
        setPoints(points + 25)
        toast({
          title: "Bonus Claimed! 🎉",
          description: "You earned 25 points for your daily login streak!",
        })
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim bonus",
        variant: "destructive",
      })
    }
  }

  const renderRewardsTab = () => (
    <div className="px-4 pt-6 pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">Rewards</h2>

      {/* Daily Bonus Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Daily Bonus</h3>
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-white">Daily Login Bonus</h4>
                  <p className="text-purple-100 text-sm">Claim your daily bonus</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-white font-bold text-lg">+25 points</div>
                <Button
                  size="sm"
                  className="mt-2 bg-white text-purple-600 hover:bg-gray-100 font-semibold"
                  onClick={handleClaimBonus}
                >
                  Claim
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Provider Stats */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Top Providers</h3>
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-gradient-to-r from-blue-600 to-blue-700 border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-white text-sm">CPX Research</h4>
              <p className="text-blue-100 text-xs">High-paying surveys</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-purple-600 to-purple-700 border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">💎</div>
              <h4 className="font-semibold text-white text-sm">AdGem</h4>
              <p className="text-purple-100 text-xs">Premium offers</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-green-600 to-green-700 border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🎁</div>
              <h4 className="font-semibold text-white text-sm">Lootably</h4>
              <p className="text-green-100 text-xs">Quick rewards</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-r from-red-600 to-red-700 border-0">
            <CardContent className="p-4 text-center">
              <div className="text-2xl mb-2">🐂</div>
              <h4 className="font-semibold text-white text-sm">OfferToro</h4>
              <p className="text-red-100 text-xs">Gaming offers</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        {/* Profile Circle */}
        <div
          className="w-12 h-12 rounded-full border-2 border-green-400 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors"
          onClick={() => setShowProfilePage(true)}
        >
          <span className="text-green-400 font-bold text-lg">
            {profile?.username?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </span>
        </div>

        {/* Balance */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-3 rounded-lg flex items-center space-x-2">
          <DollarSign className="h-5 w-5 text-white" />
          <span className="text-white font-bold text-lg">${(points / 100).toFixed(2)}</span>
        </div>

        {/* Notification */}
        <div className="relative">
          <Bell
            className="h-6 w-6 text-green-400 cursor-pointer"
            onClick={() => setShowNotifications(!showNotifications)}
          />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></div>

          {showNotifications && (
            <div className="absolute right-0 top-8 w-64 bg-slate-800 border border-slate-700 rounded-lg p-4 z-50">
              <h3 className="font-semibold text-white mb-2">Notifications</h3>
              <div className="space-y-2">
                <div className="text-sm text-gray-300">🎉 New high-paying offers available!</div>
                <div className="text-sm text-gray-300">💰 Daily bonus ready to claim</div>
                <div className="text-sm text-gray-300">🔥 Real offers from top providers</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === "earn" && renderEarnTab()}
      {activeTab === "offers" && renderMyOffersTab()}
      {activeTab === "cashout" && renderCashoutTab()}
      {activeTab === "rewards" && renderRewardsTab()}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
        <div className="flex items-center justify-around py-3">
          <button
            onClick={() => setActiveTab("earn")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "earn" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <DollarSign className="h-6 w-6" />
            <span className="text-xs font-medium">Earn</span>
          </button>

          <button
            onClick={() => setActiveTab("offers")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "offers" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <Gamepad2 className="h-6 w-6" />
            <span className="text-xs">My Offers</span>
          </button>

          <button
            onClick={() => setActiveTab("cashout")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "cashout" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <CreditCard className="h-6 w-6" />
            <span className="text-xs">Cashout</span>
          </button>

          <button
            onClick={() => setActiveTab("rewards")}
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "rewards" ? "text-green-400" : "text-gray-400"
            }`}
          >
            <Gift className="h-6 w-6" />
            <span className="text-xs">Rewards</span>
          </button>
        </div>
      </div>

      {/* Modals */}
      {showWithdrawalModal && (
        <WithdrawalModal
          paymentMethod={selectedPaymentMethod}
          currentBalance={points}
          onClose={() => setShowWithdrawalModal(false)}
          onSuccess={(amount) => {
            setPoints(points - amount)
            setShowWithdrawalModal(false)
          }}
        />
      )}
    </div>
  )
}
