"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { ArrowLeft, User, Lock, Globe, DollarSign, Clock, Shield, Eye } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { toast } from "@/hooks/use-toast"

interface SettingsPageProps {
  user: any
  profile: any
  onBack: () => void
}

export default function SettingsPage({ user, profile, onBack }: SettingsPageProps) {
  const [username, setUsername] = useState(profile?.username || "")
  const [email, setEmail] = useState(user.email || "")
  const [phone, setPhone] = useState(profile?.phone || "")
  const [darkMode, setDarkMode] = useState(true)
  const [twoFactor, setTwoFactor] = useState(false)
  const [language, setLanguage] = useState("en")
  const [currency, setCurrency] = useState("USD")
  const [timezone, setTimezone] = useState("UTC+7")
  const [loading, setLoading] = useState(false)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const supabase = createClientComponentClient()

  // Load user preferences
  useEffect(() => {
    loadUserPreferences()
  }, [])

  const loadUserPreferences = async () => {
    try {
      // Load from localStorage or database
      const savedLanguage = localStorage.getItem("language") || "en"
      const savedCurrency = localStorage.getItem("currency") || "USD"
      const savedTimezone = localStorage.getItem("timezone") || "UTC+7"

      setLanguage(savedLanguage)
      setCurrency(savedCurrency)
      setTimezone(savedTimezone)
    } catch (error) {
      console.error("Error loading preferences:", error)
    }
  }

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Username cannot be empty",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          username: username.trim(),
          phone: phone.trim(),
        })
        .eq("id", user.id)

      if (error) throw error

      // Save preferences to localStorage
      localStorage.setItem("language", language)
      localStorage.setItem("currency", currency)
      localStorage.setItem("timezone", timezone)

      toast({
        title: "Settings Updated! ✅",
        description: "Your settings have been saved successfully.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "Please fill in all password fields",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords do not match",
        variant: "destructive",
      })
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (error) throw error

      toast({
        title: "Password Updated! ✅",
        description: "Your password has been changed successfully.",
      })

      setShowPasswordChange(false)
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Settings</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 space-y-6">
        {/* Account Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Account Information</span>
            </h3>
            <div className="space-y-4">
              <div>
                <Label className="text-gray-300 text-sm">Username</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder="Enter username"
                  disabled={loading}
                />
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Email</Label>
                <Input value={email} disabled className="bg-slate-700 border-slate-600 text-gray-400 mt-1" />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label className="text-gray-300 text-sm">Phone Number (Optional)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white mt-1"
                  placeholder="Enter phone number"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleUpdateProfile}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Security</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm">Two-Factor Authentication</div>
                  <div className="text-gray-400 text-xs">Add extra security to your account</div>
                </div>
                <Switch
                  checked={twoFactor}
                  onCheckedChange={setTwoFactor}
                  disabled={true} // Disabled for now
                />
              </div>

              {!showPasswordChange ? (
                <Button
                  variant="outline"
                  className="w-full border-slate-600 text-white hover:bg-slate-700"
                  onClick={() => setShowPasswordChange(true)}
                >
                  <Lock className="h-4 w-4 mr-2" />
                  Change Password
                </Button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label className="text-gray-300 text-sm">Current Password</Label>
                    <Input
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Enter current password"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-sm">New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <Label className="text-gray-300 text-sm">Confirm New Password</Label>
                    <Input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white mt-1"
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={handlePasswordChange}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowPasswordChange(false)
                        setPasswordData({
                          currentPassword: "",
                          newPassword: "",
                          confirmPassword: "",
                        })
                      }}
                      className="flex-1 border-slate-600 text-white hover:bg-slate-700"
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full border-slate-600 text-white hover:bg-slate-700"
                onClick={() =>
                  toast({
                    title: "Coming Soon",
                    description: "Login history feature will be available soon",
                  })
                }
              >
                <Eye className="h-4 w-4 mr-2" />
                View Login History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* App Preferences */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4">App Preferences</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-white text-sm">Dark Mode</div>
                  <div className="text-gray-400 text-xs">Use dark theme</div>
                </div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>

              <div>
                <Label className="text-gray-300 text-sm flex items-center space-x-2">
                  <Globe className="h-4 w-4" />
                  <span>Language</span>
                </Label>
                <select
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white mt-1"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <option value="en">English</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="es">Español</option>
                </select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Currency</span>
                </Label>
                <select
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white mt-1"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="IDR">IDR (Rp)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <Label className="text-gray-300 text-sm flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>Time Zone</span>
                </Label>
                <select
                  className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md text-white mt-1"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                >
                  <option value="UTC+7">UTC+7 (Jakarta)</option>
                  <option value="UTC+0">UTC+0 (London)</option>
                  <option value="UTC-5">UTC-5 (New York)</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* App Information */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4">App Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Version</span>
                <span className="text-white">2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Updated</span>
                <span className="text-white">Jan 21, 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Build</span>
                <span className="text-white">210.1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Legal */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <h3 className="text-white font-medium mb-4">Legal</h3>
            <div className="space-y-2">
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-700"
                onClick={() => window.open("/terms", "_blank")}
              >
                Terms of Service
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-700"
                onClick={() => window.open("/privacy", "_blank")}
              >
                Privacy Policy
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-gray-300 hover:text-white hover:bg-slate-700"
                onClick={() => window.open("/cookies", "_blank")}
              >
                Cookie Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
