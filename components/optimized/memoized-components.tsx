"use client"

import type React from "react"
import { memo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Memoized offer card to prevent unnecessary re-renders
export const OfferCard = memo(function OfferCard({
  offer,
  onClick,
}: {
  offer: any
  onClick: (offer: any) => void
}) {
  return (
    <Card
      className="min-w-[300px] bg-slate-800 border-slate-700 overflow-hidden cursor-pointer hover:bg-slate-700 transition-colors"
      onClick={() => onClick(offer)}
    >
      <div className="relative">
        <div className="h-32 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 flex items-center justify-center">
          <div className="text-4xl">{offer.image || "🎯"}</div>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-white mb-1 truncate">{offer.title}</h3>
        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{offer.description}</p>
        <div className="flex items-center justify-between">
          <span className="text-green-400 font-bold text-lg">{offer.amount}</span>
          <Badge className="bg-blue-600 text-white text-xs">{offer.difficulty || "Easy"}</Badge>
        </div>
      </CardContent>
    </Card>
  )
})

// Memoized stats card
export const StatsCard = memo(function StatsCard({
  title,
  value,
  icon,
  color = "text-white",
}: {
  title: string
  value: string | number
  icon?: React.ReactNode
  color?: string
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4 text-center">
        {icon && <div className="mb-2">{icon}</div>}
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-gray-400 text-sm">{title}</div>
      </CardContent>
    </Card>
  )
})

// Memoized withdrawal item
export const WithdrawalItem = memo(function WithdrawalItem({
  withdrawal,
}: {
  withdrawal: any
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{withdrawal.icon || "💳"}</div>
            <div>
              <div className="font-medium text-white text-sm">{withdrawal.method}</div>
              <div className="text-gray-400 text-xs">{withdrawal.date}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-white">{withdrawal.amount}</div>
            <Badge
              className={`text-xs mt-1 ${
                withdrawal.status === "completed"
                  ? "bg-green-600"
                  : withdrawal.status === "processing"
                    ? "bg-blue-600"
                    : "bg-red-600"
              }`}
            >
              {withdrawal.status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})
