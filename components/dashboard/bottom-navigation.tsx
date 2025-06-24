"use client"

import { DollarSign, Gamepad2, CreditCard, Gift } from "lucide-react"

interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export default function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const tabs = [
    { id: "earn", label: "Earn", icon: DollarSign },
    { id: "offers", label: "My Offers", icon: Gamepad2 },
    { id: "cashout", label: "Cashout", icon: CreditCard },
    { id: "rewards", label: "Rewards", icon: Gift },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
      <div className="flex items-center justify-around py-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center space-y-1 ${
                activeTab === tab.id ? "text-green-400" : "text-gray-400"
              }`}
            >
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
