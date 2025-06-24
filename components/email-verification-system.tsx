"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Mail, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface EmailVerificationProps {
  user: any
  onVerified: () => void
}

export default function EmailVerificationSystem({ user, onVerified }: EmailVerificationProps) {
  const [verificationCode, setVerificationCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [verified, setVerified] = useState(user.email_confirmed_at !== null)

  const supabase = createClientComponentClient()

  const sendVerificationEmail = async () => {
    try {
      setResending(true)

      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
      })

      if (error) throw error

      toast({
        title: "Verification Email Sent! 📧",
        description: "Please check your email and click the verification link",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setResending(false)
    }
  }

  const verifyCode = async () => {
    try {
      setLoading(true)

      // In production, implement custom verification
      const response = await fetch("/api/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: verificationCode }),
      })

      const data = await response.json()

      if (data.success) {
        setVerified(true)
        onVerified()
        toast({
          title: "Email Verified! ✅",
          description: "Your email has been successfully verified",
        })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (verified) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-800">Email Verified</h3>
              <p className="text-green-600 text-sm">Your email address has been verified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-yellow-50 border-yellow-200">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          <span>Email Verification Required</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-yellow-700 text-sm">
          Please verify your email address to unlock all features and secure your account.
        </p>

        <div className="flex space-x-2">
          <Button onClick={sendVerificationEmail} disabled={resending} variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            {resending ? "Sending..." : "Send Verification Email"}
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-yellow-800">Or enter verification code:</label>
          <div className="flex space-x-2">
            <Input
              placeholder="Enter 6-digit code"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              maxLength={6}
              className="flex-1"
            />
            <Button onClick={verifyCode} disabled={loading || verificationCode.length !== 6} size="sm">
              {loading ? <Clock className="h-4 w-4 animate-spin" /> : "Verify"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
