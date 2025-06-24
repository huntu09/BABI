"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"

interface CashoutTabProps {
  balance: number // USD balance
  onWithdraw: (amount: number, method: string, details: any) => void
}

export default function CashoutTab({ balance, onWithdraw }: CashoutTabProps) {
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState("")
  const [withdrawAmount, setWithdrawAmount] = useState("")
  const [accountDetails, setAccountDetails] = useState("")
  const [loading, setLoading] = useState(false)

  const paymentMethods = [
    {
      id: "dana",
      name: "DANA",
      icon: "💳",
      minimum: "$2.00",
      fee: "Free",
      processingTime: "Manual (1-24h)",
      color: "from-blue-600 to-blue-700",
      popular: true,
    },
    {
      id: "gopay",
      name: "GoPay",
      icon: "🟢",
      minimum: "$2.00",
      fee: "Free",
      processingTime: "Manual (1-24h)",
      color: "from-green-600 to-green-700",
      popular: true,
    },
    {
      id: "shopeepay",
      name: "ShopeePay",
      icon: "🛒",
      minimum: "$2.00",
      fee: "Free",
      processingTime: "Manual (1-24h)",
      color: "from-orange-600 to-orange-700",
      popular: false,
    },
    {
      id: "ovo",
      name: "OVO",
      icon: "💜",
      minimum: "$2.00",
      fee: "Free",
      processingTime: "Manual (1-24h)",
      color: "from-purple-600 to-purple-700",
      popular: false,
    },
  ]

  const handlePaymentMethodSelect = (methodId: string) => {
    const method = paymentMethods.find((m) => m.id === methodId)
    if (!method) return

    // Check minimum balance
    if (balance < 2.0) {
      toast({
        title: "Insufficient Balance",
        description: "Minimum withdrawal is $2.00",
        variant: "destructive",
      })
      return
    }

    setSelectedMethod(methodId)
    setShowWithdrawModal(true)
  }

  const handleWithdraw = async () => {
    if (!withdrawAmount || !accountDetails) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    const amount = Number.parseFloat(withdrawAmount)

    if (isNaN(amount) || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (amount > balance) {
      toast({
        title: "Insufficient Balance",
        description: `You don't have enough balance. Available: $${balance.toFixed(2)}`,
        variant: "destructive",
      })
      return
    }

    if (amount < 2) {
      toast({
        title: "Minimum Withdrawal",
        description: "Minimum withdrawal amount is $2.00",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)
      console.log("Submitting withdrawal:", { amount, method: selectedMethod, accountDetails })

      await onWithdraw(amount, selectedMethod, accountDetails) // Kirim accountDetails langsung sebagai string

      setShowWithdrawModal(false)
      setWithdrawAmount("")
      setAccountDetails("")
      setSelectedMethod("")
    } catch (error) {
      console.error("Withdrawal error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-20">
      <h2 className="text-2xl font-bold text-white mb-6">Cashout</h2>

      {/* Balance Card */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 border-0 mb-6">
        <CardContent className="p-6 text-center">
          <div className="text-4xl font-bold text-white mb-2">${balance.toFixed(2)}</div>
          <div className="text-green-100 mb-4">Available Balance</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-white">${balance.toFixed(2)}</div>
              <div className="text-green-100">Current Balance</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{balance >= 2 ? "✅ Ready" : "❌ Too Low"}</div>
              <div className="text-green-100">Withdrawal Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Methods</h3>
        <div className="grid gap-3">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className="bg-slate-800 border-slate-700 cursor-pointer hover:bg-slate-700 transition-all duration-200"
              onClick={() => handlePaymentMethodSelect(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-lg flex items-center justify-center text-2xl`}
                  >
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-semibold text-white">{method.name}</h4>
                      {method.popular && <Badge className="bg-green-600 text-white text-xs">Popular</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 mt-1">
                      <div>Min: {method.minimum}</div>
                      <div>Fee: {method.fee}</div>
                      <div>{method.processingTime}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={showWithdrawModal} onOpenChange={setShowWithdrawModal}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle>Withdraw to {paymentMethods.find((m) => m.id === selectedMethod)?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="amount">Amount (USD)</Label>
              <Input
                id="amount"
                type="number"
                placeholder="2.00"
                min="2"
                max={balance.toFixed(2)}
                step="0.01"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">Available: ${balance.toFixed(2)} • Minimum: $2.00</p>
            </div>
            <div>
              <Label htmlFor="account">
                {selectedMethod === "dana"
                  ? "DANA Phone Number"
                  : selectedMethod === "gopay"
                    ? "GoPay Phone Number"
                    : selectedMethod === "shopeepay"
                      ? "ShopeePay Phone Number"
                      : "OVO Phone Number"}
              </Label>
              <Input
                id="account"
                placeholder="08xxxxxxxxxx"
                value={accountDetails}
                onChange={(e) => setAccountDetails(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>
            <div className="bg-slate-700 p-3 rounded text-sm text-gray-300">
              <p>⚠️ Manual Processing: Your withdrawal will be processed manually within 1-24 hours.</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowWithdrawModal(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button onClick={handleWithdraw} className="flex-1 bg-green-600 hover:bg-green-700" disabled={loading}>
                {loading ? "Processing..." : "Withdraw"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
