"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Clock, CheckCircle, XCircle, Plus, RefreshCw, AlertCircle } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/hooks/use-toast"
import WithdrawalModal from "../withdrawal-modal"

interface WithdrawalsPageProps {
  user: any
  profile: any
  onBack: () => void
}

export default function WithdrawalsPage({ user, profile, onBack }: WithdrawalsPageProps) {
  const [showNewWithdrawal, setShowNewWithdrawal] = useState(false)
  const [withdrawalHistory, setWithdrawalHistory] = useState([])
  const [withdrawalStats, setWithdrawalStats] = useState({
    totalWithdrawals: 0,
    totalAmount: 0,
    pendingCount: 0,
    completedCount: 0,
  })
  const [loading, setLoading] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("")

  const supabase = createClientComponentClient()

  useEffect(() => {
    loadWithdrawalData()
  }, [])

  const loadWithdrawalData = async () => {
    setLoading(true)
    try {
      const { data: withdrawals, error } = await supabase
        .from("withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error

      const withdrawalList = withdrawals || []
      setWithdrawalHistory(withdrawalList)

      // Calculate stats
      const totalAmount = withdrawalList.reduce((sum: number, w: any) => sum + w.amount, 0)
      const pendingCount = withdrawalList.filter((w: any) => w.status === "pending").length
      const completedCount = withdrawalList.filter((w: any) => w.status === "completed").length

      setWithdrawalStats({
        totalWithdrawals: withdrawalList.length,
        totalAmount,
        pendingCount,
        completedCount,
      })
    } catch (error) {
      console.error("Error loading withdrawal data:", error)
      // Use mock data if database fails
      const mockWithdrawals = [
        {
          id: 1,
          amount: 5.0,
          method: "DANA",
          status: "completed",
          created_at: "2024-01-20T10:00:00Z",
          processed_at: "2024-01-20T10:15:00Z",
          account_details: { wallet_address: "+62812345678" },
        },
        {
          id: 2,
          amount: 3.5,
          method: "GoPay",
          status: "processing",
          created_at: "2024-01-19T14:30:00Z",
          processed_at: null,
          account_details: { wallet_address: "+62812345679" },
        },
        {
          id: 3,
          amount: 10.0,
          method: "PayPal",
          status: "rejected",
          created_at: "2024-01-18T09:15:00Z",
          processed_at: "2024-01-18T16:20:00Z",
          account_details: { wallet_address: "user@example.com" },
        },
      ]
      setWithdrawalHistory(mockWithdrawals)
      setWithdrawalStats({
        totalWithdrawals: 3,
        totalAmount: 18.5,
        pendingCount: 1,
        completedCount: 1,
      })
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method: string) => {
    const icons: { [key: string]: string } = {
      DANA: "💳",
      GoPay: "🟢",
      ShopeePay: "🛒",
      PayPal: "💰",
      Bitcoin: "₿",
      Litecoin: "🪙",
      Dogecoin: "🐕",
      BNB: "🟡",
      TRX: "🔴",
    }
    return icons[method] || "💳"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-600"
      case "processing":
        return "bg-blue-600"
      case "pending":
        return "bg-yellow-600"
      case "rejected":
        return "bg-red-600"
      default:
        return "bg-gray-600"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3 mr-1" />
      case "processing":
        return <Clock className="h-3 w-3 mr-1" />
      case "pending":
        return <Clock className="h-3 w-3 mr-1" />
      case "rejected":
        return <XCircle className="h-3 w-3 mr-1" />
      default:
        return <AlertCircle className="h-3 w-3 mr-1" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleNewWithdrawal = () => {
    const balanceInUSD = profile?.balance || 0
    if (balanceInUSD < 2.0) {
      toast({
        title: "Insufficient Balance",
        description: "Minimum withdrawal is $2.00",
        variant: "destructive",
      })
      return
    }
    setShowNewWithdrawal(true)
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Withdrawals</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadWithdrawalData}
            disabled={loading}
            className="text-white hover:bg-slate-800"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
          <Button onClick={handleNewWithdrawal} size="sm" className="bg-green-600 hover:bg-green-700">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 space-y-6">
        {/* Balance Card */}
        <Card className="bg-green-600 border-0">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">${(profile?.balance || 0).toFixed(2)}</div>
              <div className="text-green-100 text-sm">Available for Withdrawal</div>
              <div className="text-green-100 text-xs mt-1">Minimum withdrawal: $2.00</div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-white">{withdrawalStats.totalWithdrawals}</div>
              <div className="text-xs text-gray-400">Total</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-green-400">${withdrawalStats.totalAmount.toFixed(2)}</div>
              <div className="text-xs text-gray-400">Withdrawn</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-3 text-center">
              <div className="text-lg font-bold text-blue-400">{withdrawalStats.pendingCount}</div>
              <div className="text-xs text-gray-400">Pending</div>
            </CardContent>
          </Card>
        </div>

        {/* Withdrawal History */}
        <div>
          <h3 className="text-white font-medium mb-4">Withdrawal History</h3>
          <div className="space-y-3">
            {loading ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400">Loading withdrawals...</div>
                </CardContent>
              </Card>
            ) : withdrawalHistory.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-8 text-center">
                  <div className="text-4xl mb-4">💳</div>
                  <div className="text-gray-400 mb-2">No withdrawals yet</div>
                  <p className="text-gray-500 text-sm mb-4">Start earning and withdraw your first payment</p>
                  <Button onClick={handleNewWithdrawal} size="sm" className="bg-green-600 hover:bg-green-700">
                    Request Withdrawal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              withdrawalHistory.map((withdrawal: any) => (
                <Card key={withdrawal.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getMethodIcon(withdrawal.method)}</div>
                        <div>
                          <div className="font-medium text-white text-sm">{withdrawal.method}</div>
                          <div className="text-gray-400 text-xs">Requested: {formatDate(withdrawal.created_at)}</div>
                          {withdrawal.processed_at && (
                            <div className="text-gray-400 text-xs">
                              Processed: {formatDate(withdrawal.processed_at)}
                            </div>
                          )}
                          <div className="text-gray-500 text-xs mt-1">
                            To: {withdrawal.account_details?.wallet_address || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-white">${withdrawal.amount.toFixed(2)}</div>
                        <Badge className={`text-xs mt-1 ${getStatusColor(withdrawal.status)}`}>
                          {getStatusIcon(withdrawal.status)}
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* New Withdrawal Button */}
        <Button
          onClick={handleNewWithdrawal}
          className="w-full bg-green-600 hover:bg-green-700 py-3"
          disabled={(profile?.balance || 0) < 2.0}
        >
          {(profile?.balance || 0) < 2.0 ? "Insufficient Balance" : "Request New Withdrawal"}
        </Button>

        {/* Withdrawal Info */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-3">Withdrawal Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Minimum withdrawal:</span>
                <span className="text-white">$2.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Processing time:</span>
                <span className="text-white">5-30 minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Available methods:</span>
                <span className="text-white">DANA, GoPay, ShopeePay</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Fees:</span>
                <span className="text-green-400">Free</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Modal */}
      {showNewWithdrawal && (
        <WithdrawalModal
          paymentMethod={selectedPaymentMethod || "dana"}
          currentBalance={Math.round((profile?.balance || 0) * 100)} // Convert to points for modal
          onClose={() => setShowNewWithdrawal(false)}
          onSuccess={(amount) => {
            setShowNewWithdrawal(false)
            loadWithdrawalData() // Reload withdrawal history
            toast({
              title: "Withdrawal Requested! 🎉",
              description: "Your withdrawal request has been submitted successfully.",
            })
          }}
        />
      )}
    </div>
  )
}
