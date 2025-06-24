"use client"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/hooks/use-toast"
import ProfilePage from "../profile/profile-page"
import DashboardHeader from "./dashboard-header"
import EarnTab from "./earn-tab"
import MyOffersTab from "./my-offers-tab" // Default import
import CashoutTab from "./cashout-tab"
import RewardsTab from "./rewards-tab"
import BottomNavigation from "./bottom-navigation"

interface User {
  id: string
  email?: string
  created_at?: string
}

interface Profile {
  id: string
  email?: string
  username?: string
  balance: number
  total_earned: number
  referral_code: string
  status: string
}

interface DashboardRefactorProps {
  user: User
  profile: Profile
}

export default function DashboardRefactored({ user, profile }: DashboardRefactorProps) {
  const [activeTab, setActiveTab] = useState("earn")
  const [showProfile, setShowProfile] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)
  const supabase = createClientComponentClient()

  // Convert balance to points for display (assuming 1 point = $0.01)
  const points = Math.round((currentProfile?.balance || 0) * 100)

  const handleOfferClick = (offer: any) => {
    toast({
      title: "Opening Offer",
      description: `Opening ${offer.title}...`,
    })
    // Here you would typically open the offer URL
    if (offer.url) {
      window.open(offer.url, "_blank")
    }
  }

  const handleClaimBonus = async () => {
    try {
      // Add bonus logic here
      toast({
        title: "Bonus Claimed! 🎉",
        description: "You earned 25 points!",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to claim bonus",
        variant: "destructive",
      })
    }
  }

  const handleWithdraw = async (amount: number, method: string, details: any) => {
    try {
      console.log("💰 Processing withdrawal:", { amount, method, details })

      const response = await fetch("/api/withdrawals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          method: method,
          accountDetails: details,
        }),
      })

      const result = await response.json()
      console.log("📤 Withdrawal response:", result)

      if (!response.ok) {
        throw new Error(result.error || "Failed to process withdrawal")
      }

      toast({
        title: "Withdrawal Requested! 💰",
        description: `Your ${method} withdrawal of $${amount.toFixed(2)} is being processed.`,
      })

      // Update balance if returned from API
      if (result.newBalance !== undefined) {
        setCurrentProfile((prev) => ({ ...prev, balance: result.newBalance }))
      }
    } catch (error: any) {
      console.error("❌ Withdrawal error:", error)
      toast({
        title: "Error",
        description: error?.message || "Failed to process withdrawal",
        variant: "destructive",
      })
    }
  }

  if (showProfile) {
    return <ProfilePage user={user} profile={currentProfile} onBack={() => setShowProfile(false)} />
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <DashboardHeader
        user={user}
        profile={currentProfile}
        points={points}
        onProfileClick={() => setShowProfile(true)}
      />

      {/* Tab Content */}
      <div className="flex-1">
        {activeTab === "earn" && <EarnTab onOfferClick={handleOfferClick} />}

        {activeTab === "offers" && <MyOffersTab user={user} />}

        {activeTab === "cashout" && <CashoutTab balance={currentProfile?.balance || 0} onWithdraw={handleWithdraw} />}

        {activeTab === "rewards" && <RewardsTab onClaimBonus={handleClaimBonus} />}
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
