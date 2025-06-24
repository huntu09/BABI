"use client"

import { Bell, DollarSign, TrendingUp } from "lucide-react"
import { useState } from "react"

interface DashboardHeaderProps {
  user: any
  profile: any
  points: number
  onProfileClick: () => void
}

export default function DashboardHeader({ user, profile, points, onProfileClick }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)

  const safeProfile = profile || {}
  const balance = (points / 200).toFixed(2)
  const totalEarned = (safeProfile.total_earned || 0).toFixed(2)

  return (
    <div className="flex items-center justify-between p-4 pt-12">
      {/* Profile Circle */}
      <div
        className="w-12 h-12 rounded-full border-2 border-green-400 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={onProfileClick}
      >
        <span className="text-green-400 font-bold text-lg">
          {safeProfile?.username?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
        </span>
      </div>

      {/* Enhanced Balance Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-3 rounded-xl shadow-lg flex-1 mx-4 max-w-sm">
        <div className="flex items-center justify-between">
          {/* Main Balance */}
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-white" />
            <div className="text-white">
              <div className="text-2xl font-bold">${balance}</div>
              <div className="text-green-100 text-xs">{Math.round(points).toLocaleString()} points</div>
            </div>
          </div>

          {/* Total Earned */}
          <div className="text-right">
            <div className="flex items-center space-x-1 text-green-100">
              <TrendingUp className="h-3 w-3" />
              <span className="text-xs">Total earned:</span>
            </div>
            <div className="text-white font-semibold text-sm">${totalEarned}</div>
          </div>
        </div>
      </div>

      {/* Notification */}
      <div className="relative">
        <Bell
          className="h-6 w-6 text-green-400 cursor-pointer hover:text-green-300 transition-colors"
          onClick={() => setShowNotifications(!showNotifications)}
        />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>

        {showNotifications && (
          <div className="absolute right-0 top-8 w-64 bg-slate-800 border border-slate-700 rounded-lg p-4 z-50 shadow-xl">
            <h3 className="font-semibold text-white mb-2">Notifications</h3>
            <div className="space-y-2">
              <div className="text-sm text-gray-300 p-2 bg-slate-700 rounded">🎉 New offers available!</div>
              <div className="text-sm text-gray-300 p-2 bg-slate-700 rounded">💰 Daily bonus ready to claim</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
