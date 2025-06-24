"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Copy, Share2 } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ReferralsPageProps {
  user: any
  profile: any
  onBack: () => void
}

export default function ReferralsPage({ user, profile, onBack }: ReferralsPageProps) {
  const copyReferralCode = () => {
    const referralCode = profile?.referral_code || `REF${user.id.slice(0, 8)}`
    navigator.clipboard.writeText(`https://dropiyo.com/ref/${referralCode}`)
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

  const referralData = [
    { name: "John D.", joined: "2 days ago", earned: "$5.20", avatar: "J", status: "active" },
    { name: "Sarah M.", joined: "1 week ago", earned: "$12.80", avatar: "S", status: "active" },
    { name: "Mike R.", joined: "2 weeks ago", earned: "$8.40", avatar: "M", status: "inactive" },
    { name: "Lisa K.", joined: "3 weeks ago", earned: "$15.60", avatar: "L", status: "active" },
    { name: "Tom B.", joined: "1 month ago", earned: "$22.30", avatar: "T", status: "active" },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Referrals</h1>
        <div className="w-10"></div>
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
                  <div className="text-3xl font-bold text-white">5</div>
                  <div className="text-purple-100 text-sm">Total Referrals</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">$12.50</div>
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
              <div className="text-lg font-bold text-white">5</div>
              <div className="text-xs text-gray-400">Active</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-green-400">$64.30</div>
              <div className="text-xs text-gray-400">Total Earned</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-400">$12.50</div>
              <div className="text-xs text-gray-400">This Month</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral List */}
        <div>
          <h3 className="text-white font-medium mb-4">Your Referrals</h3>
          <div className="space-y-3">
            {referralData.map((referral, index) => (
              <Card key={index} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {referral.avatar}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm flex items-center space-x-2">
                          <span>{referral.name}</span>
                          <Badge className={`text-xs ${referral.status === "active" ? "bg-green-600" : "bg-gray-600"}`}>
                            {referral.status}
                          </Badge>
                        </div>
                        <div className="text-gray-400 text-xs">Joined {referral.joined}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-green-400 font-bold text-sm">{referral.earned}</div>
                      <div className="text-gray-400 text-xs">
                        Your commission: ${(Number.parseFloat(referral.earned.replace("$", "")) * 0.1).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
