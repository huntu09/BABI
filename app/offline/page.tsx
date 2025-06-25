"use client"

import { Wifi, RefreshCw, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700">
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wifi className="h-10 w-10 text-gray-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
            <p className="text-gray-400">No internet connection detected. Some features may be limited.</p>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-700 rounded-lg p-4">
              <h3 className="font-semibold text-white mb-2">Available Offline:</h3>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• View cached dashboard</li>
                <li>• Check your balance</li>
                <li>• Browse completed tasks</li>
                <li>• View profile information</li>
              </ul>
            </div>

            <div className="flex space-x-3">
              <Button onClick={() => window.location.reload()} className="flex-1 bg-green-600 hover:bg-green-700">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full border-slate-600 text-white hover:bg-slate-700">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </Link>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-gray-500">
              Dropiyo works offline with cached content. Connect to internet for full functionality.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
