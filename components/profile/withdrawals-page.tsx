"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { ArrowLeft, CheckCircle, Clock, XCircle, AlertCircle, Wallet, TrendingUp, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface Withdrawal {
  id: string
  amount: number
  method: string
  status: string
  account_details: any
  created_at: string
  processed_at: string | null
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case "completed":
      return {
        color: "bg-emerald-500",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        icon: CheckCircle,
        label: "Completed",
      }
    case "processing":
      return {
        color: "bg-blue-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        icon: Clock,
        label: "Processing",
      }
    case "pending":
      return {
        color: "bg-amber-500",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        icon: Clock,
        label: "Pending",
      }
    case "rejected":
      return {
        color: "bg-red-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        icon: XCircle,
        label: "Rejected",
      }
    default:
      return {
        color: "bg-gray-500",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        icon: AlertCircle,
        label: "Unknown",
      }
  }
}

const getMethodIcon = (method: string) => {
  switch (method.toLowerCase()) {
    case "dana":
      return "💙"
    case "gopay":
      return "💚"
    case "ovo":
      return "💜"
    case "crypto":
      return "₿"
    case "paypal":
      return "💰"
    default:
      return "💳"
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return "Today"
  if (diffDays === 2) return "Yesterday"
  if (diffDays <= 7) return `${diffDays - 1} days ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

const formatAccountDetails = (details: any, method: string) => {
  if (typeof details === "string") {
    try {
      details = JSON.parse(details)
    } catch {
      return details
    }
  }

  if (method.toLowerCase() === "crypto") {
    if (details?.wallet_address) {
      const addr = details.wallet_address
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
    if (details?.crypto_type && details?.wallet_address) {
      const addr = details.wallet_address
      return `${details.crypto_type}: ${addr.slice(0, 6)}...${addr.slice(-4)}`
    }
  }

  if (details?.account_number) {
    const num = details.account_number
    return `••••${num.slice(-4)}`
  }
  if (details?.phone) {
    const phone = details.phone
    return `••••${phone.slice(-4)}`
  }
  if (details?.email) {
    const email = details.email
    const [name, domain] = email.split("@")
    return `${name.slice(0, 2)}••••@${domain}`
  }

  return "••••••••"
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchWithdrawals()
  }, [])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setError("User not authenticated")
        return
      }

      const { data, error: fetchError } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (fetchError) {
        console.error("Fetch withdrawals error:", fetchError)
        setError("Failed to load withdrawals")
        return
      }

      setWithdrawals(data || [])
    } catch (err) {
      console.error("Error:", err)
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const totalWithdrawn = withdrawals.filter((w) => w.status === "completed").reduce((sum, w) => sum + w.amount, 0)

  const pendingAmount = withdrawals
    .filter((w) => w.status === "pending" || w.status === "processing")
    .reduce((sum, w) => sum + w.amount, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-16">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-600"></div>
              <Wallet className="absolute inset-0 m-auto h-6 w-6 text-blue-600" />
            </div>
            <p className="text-slate-600 mt-4 font-medium">Loading your withdrawals...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
          </div>
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Something went wrong</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <Button onClick={fetchWithdrawals} className="bg-blue-600 hover:bg-blue-700">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="p-2">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-slate-900">Withdrawals</h1>
        </div>

        {/* Stats Cards */}
        {withdrawals.length > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Card className="border-0 shadow-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Total Withdrawn</span>
                </div>
                <p className="text-2xl font-bold">${totalWithdrawn.toFixed(2)}</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="h-4 w-4 opacity-80" />
                  <span className="text-sm font-medium opacity-90">Pending</span>
                </div>
                <p className="text-2xl font-bold">${pendingAmount.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Withdrawals List */}
        {withdrawals.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Wallet className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-3">No withdrawals yet</h3>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto">
              Start earning and make your first withdrawal to see your transaction history here.
            </p>
            <Button onClick={() => window.history.back()} className="bg-blue-600 hover:bg-blue-700">
              Back to Dashboard
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => {
              const statusConfig = getStatusConfig(withdrawal.status)
              const StatusIcon = statusConfig.icon

              return (
                <Card key={withdrawal.id} className="border-0 shadow-sm hover:shadow-md transition-shadow bg-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl">
                          {getMethodIcon(withdrawal.method)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl font-bold text-slate-900">${withdrawal.amount.toFixed(2)}</span>
                          </div>
                          <p className="text-sm font-medium text-slate-600 capitalize">
                            {withdrawal.method.replace("_", " ")}
                          </p>
                        </div>
                      </div>

                      <div className={`${statusConfig.bgColor} px-3 py-1.5 rounded-full flex items-center gap-1.5`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        <span className={`text-xs font-semibold ${statusConfig.textColor}`}>{statusConfig.label}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between py-2 border-t border-slate-100">
                        <span className="text-sm text-slate-500">Account</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono text-slate-700">
                            {formatAccountDetails(withdrawal.account_details, withdrawal.method)}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 opacity-60 hover:opacity-100"
                            onClick={() => {
                              const details =
                                typeof withdrawal.account_details === "string"
                                  ? withdrawal.account_details
                                  : JSON.stringify(withdrawal.account_details)
                              navigator.clipboard.writeText(details)
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Requested</span>
                        <span className="text-sm font-medium text-slate-700">{formatDate(withdrawal.created_at)}</span>
                      </div>

                      {withdrawal.processed_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-500">Processed</span>
                          <span className="text-sm font-medium text-slate-700">
                            {formatDate(withdrawal.processed_at)}
                          </span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
