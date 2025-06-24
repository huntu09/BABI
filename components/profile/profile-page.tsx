"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Settings,
  Users,
  LogOut,
  Copy,
  Edit,
  Bell,
  HelpCircle,
  ChevronRight,
  Wallet,
  MessageCircle,
  Download,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import SettingsPage from "./settings-page"
import NotificationsPage from "./notifications-page"
import ReferralsPage from "./referrals-page"
import WithdrawalsPage from "./withdrawals-page"
import PrivacyPolicy from "@/components/legal/privacy-policy"
import TermsOfService from "@/components/legal/terms-of-service"

interface User {
  id: string
  email?: string
  created_at?: string
}

interface Profile {
  id: string
  email?: string
  username?: string
  balance: number // Use balance instead of points
  total_earned: number
  referral_code: string
  account_status?: string
}

interface ProfilePageProps {
  user: User
  profile: Profile
  onBack: () => void
}

export default function ProfilePage({ user, profile, onBack }: ProfilePageProps) {
  const [username, setUsername] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState("profile")
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false)
  const [showTermsOfService, setShowTermsOfService] = useState(false)

  // Set username state
  useState(() => setUsername(profile.username || ""), [profile.username])

  // Fetch fresh profile data when component mounts
  useEffect(() => {
    fetchFreshProfile()
  }, [])

  const fetchFreshProfile = async () => {
    try {
      console.log("🔄 Fetching fresh profile data...")

      const { data: profileData, error } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (error) {
        console.error("❌ Profile fetch error:", error)
        return
      }

      console.log("✅ Fresh profile data:", profileData)
      setCurrentProfile(profileData)
    } catch (error) {
      console.error("❌ Fetch error:", error)
    }
  }

  // Safety checks
  if (!user || !currentProfile) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Profile...</h2>
          <Button onClick={onBack} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  // Ensure safe values
  const safeUser = {
    id: user.id || "",
    email: user.email || "user@example.com",
    created_at: user.created_at || new Date().toISOString(),
  }

  const safeProfile = {
    id: currentProfile.id || user.id || "",
    email: currentProfile.email || user.email || "user@example.com",
    username: currentProfile.username || safeUser.email.split("@")[0] || "User",
    balance: currentProfile.balance || 0, // Use balance from database
    total_earned: currentProfile.total_earned || 0,
    referral_code: currentProfile.referral_code || `REF${safeUser.id.slice(0, 8)}`,
    account_status: currentProfile.account_status || "active",
  }

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("profiles").update({ username: username.trim() }).eq("id", safeUser.id)

      if (error) throw error

      toast({
        title: "Profile Updated! ✅",
        description: "Your profile has been updated successfully.",
      })
      setIsEditing(false)

      // Refresh profile data
      fetchFreshProfile()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const copyReferralCode = () => {
    const referralLink = `https://dropiyo.com/ref/${safeProfile.referral_code}`
    navigator.clipboard.writeText(referralLink)
    toast({
      title: "Copied! 📋",
      description: "Referral link copied to clipboard",
    })
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.push("/")
    } catch (error) {
      console.error("Sign out error:", error)
    }
  }

  // Navigation handlers
  if (showPrivacyPolicy) {
    return <PrivacyPolicy onBack={() => setShowPrivacyPolicy(false)} />
  }

  if (showTermsOfService) {
    return <TermsOfService onBack={() => setShowTermsOfService(false)} />
  }

  if (currentPage === "withdrawals") {
    return <WithdrawalsPage user={safeUser} profile={safeProfile} onBack={() => setCurrentPage("profile")} />
  }

  if (currentPage === "notifications") {
    return <NotificationsPage user={safeUser} profile={safeProfile} onBack={() => setCurrentPage("profile")} />
  }

  if (currentPage === "referrals") {
    return <ReferralsPage user={safeUser} profile={safeProfile} onBack={() => setCurrentPage("profile")} />
  }

  if (currentPage === "settings") {
    return <SettingsPage user={safeUser} profile={safeProfile} onBack={() => setCurrentPage("profile")} />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Clean Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Profile</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        {/* Profile Header - Clean & Simple */}
        <div className="flex items-center space-x-4 py-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-2 border-green-400 flex items-center justify-center text-xl font-medium">
              {safeProfile.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <div className="flex items-center space-x-2 flex-1">
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white text-lg font-medium"
                    placeholder="Enter username"
                    disabled={loading}
                  />
                  <Button
                    size="sm"
                    onClick={handleUpdateProfile}
                    disabled={loading}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {loading ? "..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setUsername(safeProfile.username)
                    }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-medium">{safeProfile.username}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                    className="text-green-400 hover:text-green-300 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
            <p className="text-gray-400 text-sm">{safeUser.email}</p>
          </div>
        </div>

        {/* Balance Card - FIXED: Use actual balance */}
        <Card className="bg-green-600 border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-white">${safeProfile.balance.toFixed(2)}</div>
                <div className="text-green-100 text-sm">Available Balance</div>
              </div>
              <div className="text-right">
                <div className="text-white font-medium">{Math.round(safeProfile.balance * 200)} points</div>
                <div className="text-green-100 text-sm">Total earned: ${safeProfile.total_earned.toFixed(2)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-gray-400 text-sm">Offers Completed</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">0</div>
              <div className="text-gray-400 text-sm">Referrals</div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-medium">Referral Link</h3>
              <Button onClick={copyReferralCode} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                <Copy className="h-4 w-4 mr-1" />
                Copy
              </Button>
            </div>
            <div className="text-gray-400 text-sm break-all">dropiyo.com/ref/{safeProfile.referral_code}</div>
            <div className="text-green-400 text-sm mt-2">Earn 10% commission from referrals</div>
          </CardContent>
        </Card>

        {/* Menu Items - Clean List */}
        <div className="space-y-1">
          <div
            className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            onClick={() => setCurrentPage("withdrawals")}
          >
            <div className="flex items-center space-x-3">
              <Wallet className="h-5 w-5 text-gray-400" />
              <span className="text-white">Withdrawals</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          <div
            className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            onClick={() => window.open("https://t.me/+1sySMQn2uQdjZWQ1", "_blank")}
          >
            <div className="flex items-center space-x-3">
              <MessageCircle className="h-5 w-5 text-gray-400" />
              <span className="text-white">Members Chat</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          <div
            className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            onClick={() => setCurrentPage("notifications")}
          >
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="text-white">Notifications</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          <div
            className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            onClick={() => setCurrentPage("referrals")}
          >
            <div className="flex items-center space-x-3">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-white">Referrals</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          <div
            className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            onClick={() => setCurrentPage("settings")}
          >
            <div className="flex items-center space-x-3">
              <Settings className="h-5 w-5 text-gray-400" />
              <span className="text-white">Settings</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>

          <div
            className="flex items-center justify-between p-4 hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            onClick={() => window.open("https://t.me/dropiyo1", "_blank")}
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="h-5 w-5 text-gray-400" />
              <span className="text-white">Support</span>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400" />
          </div>
        </div>

        {/* Download App Card */}
        <Card className="bg-blue-600 border-0 overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-white font-bold text-lg mb-1">Download our app</h3>
                <p className="text-blue-100 text-sm">Get access to exclusive offers on the app.</p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <Download className="h-6 w-6 text-white" />
                </div>
                <Button size="sm" className="bg-white text-blue-600 hover:bg-gray-100">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out Button */}
        <div className="pt-4 pb-8">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Legal Links */}
        <div className="pt-2 pb-4 space-y-2">
          <div className="flex justify-center space-x-6">
            <button
              onClick={() => setShowPrivacyPolicy(true)}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setShowTermsOfService(true)}
              className="text-gray-400 text-sm hover:text-white transition-colors"
            >
              Terms of Service
            </button>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs">© 2024 Dropiyo. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
