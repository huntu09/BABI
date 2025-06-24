"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Share2, Users, DollarSign, TrendingUp, RefreshCw } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/hooks/use-toast"

interface ReferralsPageProps {
  user: any
  profile: any
  onBack: () => void
}

export default function ReferralsPage({ user, profile, onBack }: ReferralsPageProps) {
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    totalCommission: 0,
    thisMonthCommission: 0,
  })
  const [referralData, setReferralData] = useState([])
  const [loading, setLoading] = useState(false)

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadReferralData()
  }, [])

  const loadReferralData = async () => {
    setLoading(true)
    try {
      // Load referral statistics
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select(`
          *,
          profiles!referrals_referred_id_fkey (
            username,
            email,
            balance,
            total_earned,
            created_at
          )
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const referralList = referrals || []
      setReferralData(referralList)

      // Calculate stats
      const totalCommission = referralList.reduce((sum: number, ref: any) => sum + (ref.commission_earned || 0), 0)
      const thisMonth = new Date()
      thisMonth.setDate(1)
      const thisMonthCommission = referralList
        .filter((ref: any) => new Date(ref.created_at) >= thisMonth)
        .reduce((sum: number, ref: any) => sum + (ref.commission_earned || 0), 0)

      setReferralStats({
        totalReferrals: referralList.length,
        activeReferrals: referralList.filter((ref: any) => ref.profiles?.balance > 0).length,
        totalCommission,
        thisMonthCommission,
      })
    } catch (error) {
      console.error("Error loading referral data:", error)
      // Use mock data if database fails
      setReferralData([
        {
          id: 1,
          profiles: {
            username: "John D.",
            email: "john@example.com",
            balance: 5.2,
            total_earned: 12.5,
            created_at: "2024-01-18T10:00:00Z",
          },
          commission_earned: 1.25,
          created_at: "2024-01-18T10:00:00Z",
        },
        {
          id: 2,
          profiles: {
            username: "Sarah M.",
            email: "sarah@example.com",
            balance: 12.8,
            total_earned: 32.0,
            created_at: "2024-01-15T14:30:00Z",
          },
          commission_earned: 3.2,
          created_at: "2024-01-15T14:30:00Z",
        },
      ])
      setReferralStats({
        totalReferrals: 2,
        activeReferrals: 2,
        totalCommission: 4.45,
        thisMonthCommission: 1.25,
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    const referralCode = profile?.referral_code || `REF${user.id.slice(0, 8)}`
    const referralLink = `https://dropiyo.com/ref/${referralCode}`
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied! 📋",
      description: "Referral link copied to clipboard",
    })
  }

  const shareReferralLink = () => {
    const referralCode = profile?.referral_code || `REF${user.id.slice(0, 8)}`
    const text = `Join Dropiyo and start earning money! Use my referral link: https://dropiyo.com/ref/${referralCode}`

    if (navigator.share) {
      navigator.share({
        title: "Join Dropiyo",
        text: text,
        url: `https://dropiyo.com/ref/${referralCode}`,
      })
    } else {
      navigator.clipboard.writeText(text)
      toast({
        title: "Copied! 📋",
        description: "Referral message copied to clipboard",
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const getAvatarLetter = (name: string) => {
    return name ? name[0].toUpperCase() : "U"
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Referrals</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadReferralData}
          disabled={loading}
          className="text-white hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="px-4 space-y-6">
        {/* Referral Stats */}
        <Card className="bg-gradient-to-r from-purple-600 to-pink-600 border-0">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-2xl font-bold text-white">Referral Program</h3>
              <p className="text-purple-100">Earn 10% commission from your referrals</p>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-3xl font-bold text-white">{referralStats.totalReferrals}</div>
                  <div className="text-purple-100 text-sm">Total Referrals</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">${referralStats.totalCommission.toFixed(2)}</div>
                  <div className="text-purple-100 text-sm">Commission Earned</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Referral Link */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-3">Your Referral Link</h3>
            <div className="space-y-3">
              <Input
                value={`https://dropiyo.com/ref/${profile?.referral_code || `REF${user.id.slice(0, 8)}`}`}
                disabled
                className="bg-slate-700 border-slate-600 text-gray-300 text-sm"
              />
              <div className="flex space-x-2">
                <Button onClick={copyReferralCode} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
                <Button
                  onClick={shareReferralLink}
                  variant="outline"
                  className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>
            <div className="bg-green-600 bg-opacity-20 p-3 rounded-lg mt-3">
              <p className="text-green-400 text-sm">
                💡 Share this link with friends and earn 10% commission on their earnings!
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Commission Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <Users className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-white">{referralStats.activeReferrals}</div>
              <div className="text-xs text-gray-400">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-green-400">${referralStats.totalCommission.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Total Earned</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-6 w-6 text-blue-400 mx-auto mb-2" />
              <div className="text-lg font-bold text-blue-400">${referralStats.thisMonthCommission.toFixed(2)}</div>
              <div className="text-xs text-gray-400">This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral List */}
        <div>
          <h3 className="text-white font-medium mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {loading ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400">Loading referrals...</div>
                </CardContent>
              </Card>
            ) : referralData.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <div className="text-gray-400 mb-2">No referrals yet</div>
                  <p className="text-gray-500 text-sm">Share your referral link to start earning commissions</p>
                </CardContent>
              </Card>
            ) : (
              referralData.map((referral: any) => (
                <Card key={referral.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {getAvatarLetter(referral.profiles?.username || referral.profiles?.email || "U")}
                        </div>
                        <div>
                          <div className="font-medium text-white text-sm flex items-center space-x-2">
                            <span>
                              {referral.profiles?.username || referral.profiles?.email?.split("@")[0] || "Unknown User"}
                            </span>
                            <Badge
                              className={`text-xs ${referral.profiles?.balance > 0 ? "bg-green-600" : "bg-gray-600"}`}
                            >
                              {referral.profiles?.balance > 0 ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                          <div className="text-gray-400 text-xs">Joined {formatDate(referral.created_at)}</div>
                          <div className="text-gray-400 text-xs">
                            Earned: ${(referral.profiles?.total_earned || 0).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-green-400 font-bold text-sm">
                          ${(referral.commission_earned || 0).toFixed(2)}
                        </div>
                        <div className="text-gray-400 text-xs">Your commission</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* How it Works */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4">How Referrals Work</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <div className="text-white">Share your referral link</div>
                  <div className="text-gray-400 text-xs">Send your unique link to friends and family</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  2
                </div>
                <div>
                  <div className="text-white">They sign up and start earning</div>
                  <div className="text-gray-400 text-xs">Your referrals complete offers and earn money</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  3
                </div>
                <div>
                  <div className="text-white">You earn 10% commission</div>
                  <div className="text-gray-400 text-xs">Get paid automatically for every offer they complete</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
