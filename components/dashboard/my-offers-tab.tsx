"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, CheckCircle, XCircle, RefreshCw, TrendingUp, Calendar, ExternalLink } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface MyOffersTabProps {
  user: any
}

interface OfferCompletion {
  id: string
  external_offer_id: string
  user_id: string
  provider: string
  transaction_id: string | null
  reward_amount: number
  status: "pending" | "completed" | "rejected"
  ip_address?: string
  user_agent?: string
  completed_at: string | null
  verified_at?: string | null
}

export default function MyOffersTab({ user }: MyOffersTabProps) {
  const [offerCompletions, setOfferCompletions] = useState<OfferCompletion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState("all")
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOfferCompletions()
  }, [])

  const fetchOfferCompletions = async () => {
    try {
      const { data, error } = await supabase
        .from("offerwall_completions")
        .select("*")
        .eq("user_id", user.id)
        .order("completed_at", { ascending: false, nullsLast: true })

      if (error) throw error
      setOfferCompletions(data || [])
    } catch (error) {
      console.error("Error fetching offer completions:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-400" />
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-400" />
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-400" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/20 text-green-400 border-green-500/30"
      case "pending":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      case "rejected":
        return "bg-red-500/20 text-red-400 border-red-500/30"
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30"
    }
  }

  const getProviderColor = (provider: string) => {
    const colors: { [key: string]: string } = {
      cpx_research: "bg-blue-500/20 text-blue-400 border-blue-500/30",
      adgem: "bg-purple-500/20 text-purple-400 border-purple-500/30",
      lootably: "bg-orange-500/20 text-orange-400 border-orange-500/30",
      offertoro: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
      bitlabs: "bg-pink-500/20 text-pink-400 border-pink-500/30",
      ayetstudios: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
      revenue_universe: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      persona_ly: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    }
    return colors[provider] || "bg-gray-500/20 text-gray-400 border-gray-500/30"
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not completed"

    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return "Just now"
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  const formatProviderName = (provider: string) => {
    const names: { [key: string]: string } = {
      cpx_research: "CPX Research",
      adgem: "AdGem",
      lootably: "Lootably",
      offertoro: "OfferToro",
      bitlabs: "BitLabs",
      ayetstudios: "AyeT Studios",
      revenue_universe: "Revenue Universe",
      persona_ly: "Persona.ly",
    }
    return names[provider] || provider.toUpperCase()
  }

  const generateOfferTitle = (provider: string, offerId: string) => {
    const titles: { [key: string]: string[] } = {
      cpx_research: ["Complete Survey", "Answer Questions", "Share Opinion", "Market Research"],
      adgem: ["Install Game", "Play & Reach Level", "Download App", "Complete Tutorial"],
      lootably: ["Watch Videos", "Complete Offer", "Try Service", "Sign Up"],
      offertoro: ["Complete Task", "Try Product", "Download App", "Register Account"],
      bitlabs: ["Take Survey", "Product Testing", "Opinion Poll", "Market Study"],
      ayetstudios: ["Play Game", "Reach Milestone", "Complete Level", "Gaming Task"],
      revenue_universe: ["Complete Offer", "Try Service", "Sign Up", "Download"],
      persona_ly: ["Personality Test", "Complete Quiz", "Answer Survey", "Profile Study"],
    }

    const providerTitles = titles[provider] || ["Complete Offer"]
    const randomTitle = providerTitles[Math.floor(Math.random() * providerTitles.length)]
    return `${randomTitle} #${offerId.slice(-4)}`
  }

  const filteredOffers = offerCompletions.filter((offer) => {
    if (activeFilter === "all") return true
    return offer.status === activeFilter
  })

  const totalEarned = offerCompletions
    .filter((offer) => offer.status === "completed")
    .reduce((sum, offer) => sum + Number(offer.reward_amount), 0)

  const completedCount = offerCompletions.filter((offer) => offer.status === "completed").length
  const pendingCount = offerCompletions.filter((offer) => offer.status === "pending").length
  const rejectedCount = offerCompletions.filter((offer) => offer.status === "rejected").length

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
      {/* Header with Stats */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">My Offers</h2>

        {offerCompletions.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="bg-gradient-to-r from-green-600/20 to-green-500/20 border-green-500/30">
              <CardContent className="p-3 text-center">
                <TrendingUp className="h-5 w-5 text-green-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-green-400">${totalEarned.toFixed(2)}</div>
                <div className="text-xs text-green-300">Total Earned</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 text-center">
                <CheckCircle className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{completedCount}</div>
                <div className="text-xs text-gray-400">Completed</div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardContent className="p-3 text-center">
                <Clock className="h-5 w-5 text-yellow-400 mx-auto mb-1" />
                <div className="text-lg font-bold text-white">{pendingCount}</div>
                <div className="text-xs text-gray-400">Pending</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Tabs */}
        {offerCompletions.length > 0 && (
          <div className="flex space-x-2 mb-4 overflow-x-auto">
            {[
              { key: "all", label: "All", count: offerCompletions.length },
              { key: "completed", label: "Completed", count: completedCount },
              { key: "pending", label: "Pending", count: pendingCount },
              ...(rejectedCount > 0 ? [{ key: "rejected", label: "Rejected", count: rejectedCount }] : []),
            ].map((filter) => (
              <Button
                key={filter.key}
                variant={activeFilter === filter.key ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(filter.key)}
                className={`flex-shrink-0 ${
                  activeFilter === filter.key
                    ? "bg-green-600 hover:bg-green-700 text-white"
                    : "bg-slate-800 border-slate-600 text-gray-300 hover:bg-slate-700"
                }`}
              >
                {filter.label} ({filter.count})
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎯</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {activeFilter === "all" ? "No offers completed yet" : `No ${activeFilter} offers`}
          </h3>
          <p className="text-gray-400 mb-6">
            {activeFilter === "all"
              ? "Start completing offers to see your history here"
              : `You don't have any ${activeFilter} offers`}
          </p>
          {activeFilter !== "all" && (
            <Button
              variant="outline"
              onClick={() => setActiveFilter("all")}
              className="mr-3 border-slate-600 text-gray-300 hover:bg-slate-700"
            >
              View All Offers
            </Button>
          )}
          <Button className="bg-green-600 hover:bg-green-700">
            <ExternalLink className="h-4 w-4 mr-2" />
            Browse New Offers
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOffers.map((offer) => (
            <Card key={offer.id} className="bg-slate-800/80 border-slate-700 hover:bg-slate-800 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getStatusIcon(offer.status)}
                      <h3 className="font-semibold text-white line-clamp-1">
                        {generateOfferTitle(offer.provider, offer.external_offer_id)}
                      </h3>
                    </div>

                    <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                      Complete this {formatProviderName(offer.provider)} offer to earn $
                      {Number(offer.reward_amount).toFixed(2)}
                    </p>

                    <div className="flex items-center space-x-3 flex-wrap gap-2">
                      <Badge className={`text-xs ${getProviderColor(offer.provider)}`}>
                        {formatProviderName(offer.provider)}
                      </Badge>
                      <Badge className={`text-xs ${getStatusColor(offer.status)}`}>{offer.status}</Badge>
                      <div className="flex items-center text-xs text-gray-400">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(offer.completed_at)}
                      </div>
                      {offer.transaction_id && (
                        <div className="text-xs text-gray-500">ID: {offer.transaction_id.slice(-8)}</div>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-4">
                    <div
                      className={`font-bold text-lg mb-1 ${
                        offer.status === "completed"
                          ? "text-green-400"
                          : offer.status === "pending"
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {offer.status === "rejected" ? "-" : "+"}${Number(offer.reward_amount).toFixed(2)}
                    </div>
                    {offer.verified_at && <div className="text-green-400 text-xs">✓ Verified</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
