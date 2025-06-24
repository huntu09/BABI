"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, XCircle, Plus } from "lucide-react"

interface WithdrawalsPageProps {
  user: any
  profile: any
  onBack: () => void
}

export default function WithdrawalsPage({ user, profile, onBack }: WithdrawalsPageProps) {
  const [showNewWithdrawal, setShowNewWithdrawal] = useState(false)

  const withdrawalHistory = [
    {
      id: 1,
      amount: "$5.00",
      method: "DANA",
      status: "completed",
      date: "2024-01-20",
      icon: "💳",
    },
    {
      id: 2,
      amount: "$3.50",
      method: "GoPay",
      status: "processing",
      date: "2024-01-19",
      icon: "🟢",
    },
    {
      id: 3,
      amount: "$10.00",
      method: "PayPal",
      status: "rejected",
      date: "2024-01-18",
      icon: "💰",
      reason: "Invalid account details",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Withdrawals</h1>
        <Button onClick={() => setShowNewWithdrawal(true)} size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="px-4 space-y-6">
        {/* Balance Card */}
        <Card className="bg-green-600 border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">${((profile?.points || 0) / 100).toFixed(2)}</div>
              <div className="text-green-100 text-sm">Available for Withdrawal</div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-white">15</div>
              <div className="text-xs text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-green-400">$117.80</div>
              <div className="text-xs text-gray-400">Withdrawn</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-400">1</div>
              <div className="text-xs text-gray-400">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        <div>
          <h3 className="text-white font-medium mb-4">Recent Withdrawals</h3>
          <div className="space-y-3">
            {withdrawalHistory.map((withdrawal) => (
              <Card key={withdrawal.id} className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{withdrawal.icon}</div>
                      <div>
                        <div className="font-medium text-white text-sm">{withdrawal.method}</div>
                        <div className="text-gray-400 text-xs">{withdrawal.date}</div>
                        {withdrawal.reason && <div className="text-red-400 text-xs mt-1">{withdrawal.reason}</div>}
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
                        {withdrawal.status === "completed" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {withdrawal.status === "processing" && <Clock className="h-3 w-3 mr-1" />}
                        {withdrawal.status === "rejected" && <XCircle className="h-3 w-3 mr-1" />}
                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* New Withdrawal Button */}
        <Button onClick={() => setShowNewWithdrawal(true)} className="w-full bg-green-600 hover:bg-green-700 py-3">
          Request New Withdrawal
        </Button>
      </div>
    </div>
  )
}
