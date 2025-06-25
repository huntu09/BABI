"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Gift,
  Target,
  DollarSign,
  RefreshCw,
  Search,
  TrendingUp,
  AlertTriangle,
} from "lucide-react"
import type { Transaction, TransactionType, BalanceValidation } from "@/types"

interface TransactionHistoryProps {
  userId?: string
  showValidation?: boolean
  limit?: number
}

export default function TransactionHistory({ userId, showValidation = false, limit = 50 }: TransactionHistoryProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [validation, setValidation] = useState<BalanceValidation | null>(null)
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<TransactionType | "all">("all")
  const [page, setPage] = useState(0)

  useEffect(() => {
    fetchTransactions()
    if (showValidation) {
      fetchValidation()
    }
  }, [userId, filterType, page])

  const fetchTransactions = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })

      if (filterType !== "all") {
        params.append("type", filterType)
      }

      if (userId) {
        params.append("userId", userId)
      }

      const response = await fetch(`/api/transactions?${params}`)
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions || [])
        setStats(data.stats)
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to fetch transactions",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching transactions:", error)
      toast({
        title: "Error",
        description: "Failed to fetch transaction history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchValidation = async () => {
    try {
      const response = await fetch("/api/balance/validate")
      const data = await response.json()

      if (data.success) {
        setValidation(data.validation)
      }
    } catch (error) {
      console.error("Error fetching validation:", error)
    }
  }

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case "earn":
      case "task_completion":
      case "offerwall_completion":
        return <Target className="h-4 w-4 text-green-500" />
      case "daily_bonus":
      case "bonus":
        return <Gift className="h-4 w-4 text-purple-500" />
      case "withdraw":
      case "withdraw_pending":
        return <ArrowDownCircle className="h-4 w-4 text-red-500" />
      case "referral":
        return <TrendingUp className="h-4 w-4 text-blue-500" />
      case "refund":
        return <ArrowUpCircle className="h-4 w-4 text-green-500" />
      case "admin_adjustment":
      case "balance_audit":
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <DollarSign className="h-4 w-4 text-gray-500" />
    }
  }

  const getTransactionColor = (type: TransactionType, amount: number) => {
    if (amount > 0) return "text-green-600"
    if (amount < 0) return "text-red-600"
    return "text-gray-600"
  }

  const getTypeLabel = (type: TransactionType) => {
    const labels: Record<TransactionType, string> = {
      earn: "Earning",
      withdraw: "Withdrawal",
      bonus: "Bonus",
      refund: "Refund",
      referral: "Referral",
      daily_bonus: "Daily Bonus",
      task_completion: "Task Reward",
      offerwall_completion: "Offer Reward",
      offerwall_reversal: "Offer Reversal",
      admin_adjustment: "Admin Adjustment",
      withdraw_pending: "Withdrawal Pending",
      admin_test: "Admin Test",
      balance_audit: "Balance Audit",
    }
    return labels[type] || type
  }

  const filteredTransactions = transactions.filter((transaction) => {
    const matchesSearch =
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.type.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Balance Validation Card */}
      {showValidation && validation && (
        <Card className={validation.is_consistent ? "border-green-200" : "border-red-200"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validation.is_consistent ? (
                <div className="flex items-center gap-2 text-green-600">
                  <ArrowUpCircle className="h-5 w-5" />
                  Balance Consistent
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Balance Inconsistency Detected
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Profile Balance</div>
                <div className="font-bold">${validation.profile_balance.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Calculated Balance</div>
                <div className="font-bold">${validation.calculated_balance.toFixed(2)}</div>
              </div>
              <div>
                <div className="text-gray-600">Difference</div>
                <div className={`font-bold ${validation.difference === 0 ? "text-green-600" : "text-red-600"}`}>
                  ${Math.abs(validation.difference).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-600">Last Transaction</div>
                <div className="font-medium">
                  {validation.last_transaction_date
                    ? new Date(validation.last_transaction_date).toLocaleDateString()
                    : "None"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <div>
                  <div className="text-sm text-gray-600">Total Earned</div>
                  <div className="font-bold text-green-600">${stats.totalEarned?.toFixed(2) || "0.00"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-4 w-4 text-red-500" />
                <div>
                  <div className="text-sm text-gray-600">Total Withdrawn</div>
                  <div className="font-bold text-red-600">${stats.totalWithdrawn?.toFixed(2) || "0.00"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-purple-500" />
                <div>
                  <div className="text-sm text-gray-600">Total Bonuses</div>
                  <div className="font-bold text-purple-600">${stats.totalBonuses?.toFixed(2) || "0.00"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-blue-500" />
                <div>
                  <div className="text-sm text-gray-600">Avg Transaction</div>
                  <div className="font-bold text-blue-600">${stats.avgTransactionAmount?.toFixed(2) || "0.00"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction History</span>
            <Button onClick={fetchTransactions} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as TransactionType | "all")}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earn">Earnings</SelectItem>
                <SelectItem value="task_completion">Task Rewards</SelectItem>
                <SelectItem value="daily_bonus">Daily Bonus</SelectItem>
                <SelectItem value="bonus">Bonuses</SelectItem>
                <SelectItem value="referral">Referrals</SelectItem>
                <SelectItem value="withdraw">Withdrawals</SelectItem>
                <SelectItem value="withdraw_pending">Pending Withdrawals</SelectItem>
                <SelectItem value="admin_adjustment">Admin Actions</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Transaction List */}
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    {getTransactionIcon(transaction.type)}
                    <div>
                      <div className="font-medium">{getTypeLabel(transaction.type)}</div>
                      <div className="text-sm text-gray-600 truncate max-w-xs">
                        {transaction.description || "No description"}
                      </div>
                      <div className="text-xs text-gray-500">{new Date(transaction.created_at).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${getTransactionColor(transaction.type, transaction.amount)}`}>
                      {transaction.amount >= 0 ? "+" : ""}${transaction.amount.toFixed(2)}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {transaction.reference_type || "system"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {transactions.length === limit && (
            <div className="flex justify-center gap-2 mt-6">
              <Button onClick={() => setPage(Math.max(0, page - 1))} disabled={page === 0} variant="outline" size="sm">
                Previous
              </Button>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={transactions.length < limit}
                variant="outline"
                size="sm"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
