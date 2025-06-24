"use client"

import { Bell, DollarSign } from "lucide-react"
import { useState } from "react"

interface DashboardHeaderProps {
  user: any
  profile: any
  points: number
  onProfileClick: () => void
}

export default function DashboardHeader({ user, profile, points, onProfileClick }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <div className="flex items-center justify-between p-4 pt-12">
      {/* Profile Circle */}
      <div
        className="w-12 h-12 rounded-full border-2 border-green-400 flex items-center justify-center cursor-pointer hover:bg-slate-800 transition-colors"
        onClick={onProfileClick}
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
              <div className="text-sm text-gray-300">New offers available!</div>
              <div className="text-sm text-gray-300">Daily bonus ready to claim</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
