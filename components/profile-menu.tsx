"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { User, Settings, Users, LogOut, Copy } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface ProfileMenuProps {
  user: any
  profile: any
  onClose: () => void
}

export default function ProfileMenu({ user, profile, onClose }: ProfileMenuProps) {
  const [activeSection, setActiveSection] = useState("profile")
  const [username, setUsername] = useState(profile?.username || "")
  const supabase = createClientComponentClient()
  const router = useRouter()

  const handleUpdateProfile = async () => {
    try {
      const { error } = await supabase.from("profiles").update({ username }).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const copyReferralCode = () => {
    const referralCode = profile?.referral_code || `REF${user.id.slice(0, 8)}`
    navigator.clipboard.writeText(`https://dropiyo.com/ref/${referralCode}`)
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    })
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 text-white">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Profile</span>
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-slate-700 border-slate-600 text-gray-400" />
            </div>

            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter username"
              />
            </div>

            <Button onClick={handleUpdateProfile} className="w-full bg-green-600 hover:bg-green-700">
              Update Profile
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-700 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">{profile?.points || 0}</div>
              <div className="text-xs text-gray-400">Points</div>
            </div>
            <div className="bg-slate-700 p-3 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-400">{profile?.total_earned || 0}</div>
              <div className="text-xs text-gray-400">Total Earned</div>
            </div>
          </div>

          {/* Referral */}
          <div className="space-y-2">
            <Label>Referral Link</Label>
            <div className="flex space-x-2">
              <Input
                value={`dropiyo.com/ref/${profile?.referral_code || `REF${user.id.slice(0, 8)}`}`}
                disabled
                className="bg-slate-700 border-slate-600 text-gray-400 text-sm"
              />
              <Button size="sm" onClick={copyReferralCode} className="bg-blue-600 hover:bg-blue-700">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>

            <Button variant="outline" className="w-full justify-start border-slate-600 text-white hover:bg-slate-700">
              <Users className="h-4 w-4 mr-2" />
              Referrals
            </Button>

            <Button variant="destructive" className="w-full justify-start" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
