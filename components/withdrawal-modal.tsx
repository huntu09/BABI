"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, AlertCircle, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface WithdrawalModalProps {
  paymentMethod: string
  currentBalance: number
  onClose: () => void
  onSuccess: (amount: number) => void
}

export default function WithdrawalModal({ paymentMethod, currentBalance, onClose, onSuccess }: WithdrawalModalProps) {
  const [amount, setAmount] = useState("")
  const [accountInfo, setAccountInfo] = useState("")
  const [loading, setLoading] = useState(false)

  const paymentMethods: Record<string, any> = {
    dana: {
      name: "DANA",
      icon: "💳",
      minimum: 200, // $2.00 = 200 points
      fee: 0,
      placeholder: "Enter your DANA phone number",
      color: "from-blue-600 to-blue-700",
    },
    gopay: {
      name: "GoPay",
      icon: "🟢",
      minimum: 200,
      fee: 0,
      placeholder: "Enter your GoPay phone number",
      color: "from-green-600 to-green-700",
    },
    shopeepay: {
      name: "ShopeePay",
      icon: "🛒",
      minimum: 200,
      fee: 0,
      placeholder: "Enter your ShopeePay phone number",
      color: "from-orange-600 to-orange-700",
    },
    ltc: {
      name: "Litecoin (LTC)",
      icon: "🪙",
      minimum: 500,
      fee: 50,
      placeholder: "Enter your LTC wallet address",
      color: "from-gray-600 to-gray-700",
    },
    doge: {
      name: "Dogecoin (DOGE)",
      icon: "🐕",
      minimum: 500,
      fee: 25,
      placeholder: "Enter your DOGE wallet address",
      color: "from-yellow-600 to-yellow-700",
    },
    bnb: {
      name: "Binance Coin (BNB)",
      icon: "🟡",
      minimum: 1000,
      fee: 100,
      placeholder: "Enter your BNB wallet address",
      color: "from-yellow-500 to-orange-600",
    },
    trx: {
      name: "TRON (TRX)",
      icon: "🔴",
      minimum: 500,
      fee: 10,
      placeholder: "Enter your TRX wallet address",
      color: "from-red-600 to-red-700",
    },
  }

  const method = paymentMethods[paymentMethod]
  const amountInPoints = Math.floor(Number.parseFloat(amount || "0") * 100)
  const totalWithFee = amountInPoints + method.fee
  const canWithdraw = amountInPoints >= method.minimum && totalWithFee <= currentBalance && accountInfo.trim()

  const handleWithdraw = async () => {
    if (!canWithdraw) return

    setLoading(true)
    try {
      const response = await fetch("/api/request-withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number.parseFloat(amount),
          method: method.name,
          walletAddress: accountInfo,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Withdrawal Requested! 🎉",
          description: `Your ${method.name} withdrawal of $${amount} has been submitted.`,
        })
        onSuccess(totalWithFee)
      } else {
        toast({
          title: "Error",
          description: data.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process withdrawal",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <div className={`w-8 h-8 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center`}>
                {method.icon}
              </div>
              <span>Withdraw to {method.name}</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Balance Info */}
          <div className="bg-slate-700 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400">Available Balance</span>
              <span className="text-green-400 font-bold">${(currentBalance / 100).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Minimum Withdrawal</span>
              <span className="text-white">${(method.minimum / 100).toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Withdrawal Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min={(method.minimum / 100).toString()}
              max={(currentBalance / 100).toFixed(2)}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder="0.00"
            />
            {amountInPoints > 0 && <div className="text-xs text-gray-400">= {amountInPoints} points</div>}
          </div>

          {/* Account Info */}
          <div className="space-y-2">
            <Label htmlFor="account">{method.name} Account</Label>
            <Input
              id="account"
              value={accountInfo}
              onChange={(e) => setAccountInfo(e.target.value)}
              className="bg-slate-700 border-slate-600 text-white"
              placeholder={method.placeholder}
            />
          </div>

          {/* Fee Information */}
          {method.fee > 0 && (
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-3 rounded-lg">
              <div className="flex items-center space-x-2 text-yellow-400">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Transaction Fee</span>
              </div>
              <div className="text-sm text-yellow-300 mt-1">
                A fee of ${(method.fee / 100).toFixed(2)} will be deducted from your balance.
              </div>
            </div>
          )}

          {/* Summary */}
          {amountInPoints > 0 && (
            <div className="bg-slate-700 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Withdrawal Amount</span>
                <span className="text-white">${amount}</span>
              </div>
              {method.fee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Transaction Fee</span>
                  <span className="text-red-400">-${(method.fee / 100).toFixed(2)}</span>
                </div>
              )}
              <hr className="border-slate-600" />
              <div className="flex justify-between font-semibold">
                <span className="text-gray-400">Total Deducted</span>
                <span className="text-white">${(totalWithFee / 100).toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Validation Messages */}
          {amountInPoints > 0 && amountInPoints < method.minimum && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Minimum withdrawal is ${(method.minimum / 100).toFixed(2)}</span>
            </div>
          )}

          {totalWithFee > currentBalance && (
            <div className="flex items-center space-x-2 text-red-400 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Insufficient balance (including fees)</span>
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleWithdraw}
            disabled={!canWithdraw || loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? (
              "Processing..."
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Withdrawal
              </>
            )}
          </Button>

          {/* Processing Time Info */}
          <div className="text-center text-xs text-gray-400">
            Processing time: {paymentMethod.includes("pay") || paymentMethod === "dana" ? "Instant" : "5-30 minutes"}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
