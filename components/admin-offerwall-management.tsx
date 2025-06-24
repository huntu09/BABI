"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { RefreshCw, DollarSign, CheckCircle, Activity, Shield, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function AdminOfferwallManagement() {
  const [providers, setProviders] = useState([])
  const [stats, setStats] = useState({})
  const [completions, setCompletions] = useState([])
  const [fraudLogs, setFraudLogs] = useState([])
  const [syncLogs, setSyncLogs] = useState([])
  const [loading, setLoading] = useState(true)

  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch provider configs
      const { data: providerData } = await supabase.from("provider_configs").select("*").order("provider_name")

      setProviders(providerData || [])

      // Fetch provider stats
      const { data: statsData } = await supabase
        .from("provider_stats")
        .select("*")
        .gte("date", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])

      // Aggregate stats
      const aggregatedStats = statsData?.reduce((acc, stat) => {
        if (!acc[stat.provider_id]) {
          acc[stat.provider_id] = {
            completions: 0,
            totalPayout: 0,
            totalPoints: 0,
            apiCalls: 0,
            apiErrors: 0,
          }
        }
        acc[stat.provider_id].completions += stat.completions || 0
        acc[stat.provider_id].totalPayout += Number.parseFloat(stat.total_payout || 0)
        acc[stat.provider_id].totalPoints += stat.total_points || 0
        acc[stat.provider_id].apiCalls += stat.api_calls || 0
        acc[stat.provider_id].apiErrors += stat.api_errors || 0
        return acc
      }, {})

      setStats(aggregatedStats || {})

      // Fetch recent completions
      const { data: completionsData } = await supabase
        .from("offer_completions")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(50)

      setCompletions(completionsData || [])

      // Fetch fraud logs
      const { data: fraudData } = await supabase
        .from("offer_fraud_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50)

      setFraudLogs(fraudData || [])

      // Fetch sync logs
      const { data: syncData } = await supabase
        .from("sync_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20)

      setSyncLogs(syncData || [])
    } catch (error) {
      console.error("Error fetching data:", error)
      toast({
        title: "Error",
        description: "Failed to load offerwall data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateProviderConfig = async (providerId: string, updates: any) => {
    try {
      const { error } = await supabase.from("provider_configs").update(updates).eq("provider_id", providerId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Provider configuration updated",
      })

      fetchData()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const triggerSync = async () => {
    try {
      const response = await fetch("/api/offerwall/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ force: true }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Sync Started",
          description: "Offerwall sync has been triggered",
        })
        fetchData()
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const exportData = (type: string) => {
    let data: any[] = []
    let filename = ""

    switch (type) {
      case "completions":
        data = completions
        filename = "offer_completions.csv"
        break
      case "fraud":
        data = fraudLogs
        filename = "fraud_logs.csv"
        break
      case "sync":
        data = syncLogs
        filename = "sync_logs.csv"
        break
    }

    if (data.length === 0) {
      toast({
        title: "No Data",
        description: "No data available to export",
        variant: "destructive",
      })
      return
    }

    const csv = [Object.keys(data[0]).join(","), ...data.map((row) => Object.values(row).join(","))].join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `${filename} downloaded successfully`,
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading offerwall management...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Offerwall Management</h1>
              <p className="text-gray-600">Manage providers, monitor performance, and track revenue</p>
            </div>
            <div className="flex space-x-2">
              <Button onClick={fetchData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={triggerSync} size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Sync Now
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    {Object.values(stats).reduce((sum: number, stat: any) => sum + (stat.completions || 0), 0)}
                  </div>
                  <div className="text-blue-100">Total Completions</div>
                </div>
                <CheckCircle className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">
                    $
                    {Object.values(stats)
                      .reduce((sum: number, stat: any) => sum + (stat.totalPayout || 0), 0)
                      .toFixed(2)}
                  </div>
                  <div className="text-green-100">Total Revenue</div>
                </div>
                <DollarSign className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{providers.filter((p) => p.is_enabled).length}</div>
                  <div className="text-purple-100">Active Providers</div>
                </div>
                <Activity className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{fraudLogs.length}</div>
                  <div className="text-red-100">Fraud Alerts</div>
                </div>
                <Shield className="h-12 w-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="providers" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="completions">Completions</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="fraud">Fraud</TabsTrigger>
            <TabsTrigger value="logs">Logs</TabsTrigger>
          </TabsList>

          {/* Providers Tab */}
          <TabsContent value="providers">
            <Card>
              <CardHeader>
                <CardTitle>Provider Configuration</CardTitle>
                <CardDescription>Manage offerwall provider settings and API configurations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {providers.map((provider: any) => (
                    <Card key={provider.id} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold">{provider.provider_name}</h3>
                            <p className="text-gray-600">{provider.api_url}</p>
                          </div>
                          <div className="flex items-center space-x-4">
                            <Badge variant={provider.is_enabled ? "default" : "secondary"}>
                              {provider.is_enabled ? "Active" : "Inactive"}
                            </Badge>
                            <Switch
                              checked={provider.is_enabled}
                              onCheckedChange={(checked) =>
                                updateProviderConfig(provider.provider_id, { is_enabled: checked })
                              }
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <Label>Rate Limit (per minute)</Label>
                            <Input
                              type="number"
                              value={provider.rate_limit_per_minute}
                              onChange={(e) =>
                                updateProviderConfig(provider.provider_id, {
                                  rate_limit_per_minute: Number.parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Timeout (seconds)</Label>
                            <Input
                              type="number"
                              value={provider.timeout_seconds}
                              onChange={(e) =>
                                updateProviderConfig(provider.provider_id, {
                                  timeout_seconds: Number.parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                          <div>
                            <Label>Retry Attempts</Label>
                            <Input
                              type="number"
                              value={provider.retry_attempts}
                              onChange={(e) =>
                                updateProviderConfig(provider.provider_id, {
                                  retry_attempts: Number.parseInt(e.target.value),
                                })
                              }
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Completions Tab */}
          <TabsContent value="completions">{/* Completions Table */}</TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">{/* Analytics Chart */}</TabsContent>

          {/* Fraud Tab */}
          <TabsContent value="fraud">{/* Fraud Logs Table */}</TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs">{/* Sync Logs Table */}</TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
