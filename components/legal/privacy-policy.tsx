"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Shield, Eye, Lock, Users, Mail } from "lucide-react"

interface PrivacyPolicyProps {
  onBack: () => void
}

export default function PrivacyPolicy({ onBack }: PrivacyPolicyProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Privacy Policy</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 pb-8 space-y-6">
        {/* Header Card */}
        <Card className="bg-blue-600 border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-white font-bold text-lg">Your Privacy Matters</h2>
                <p className="text-blue-100 text-sm">Last updated: December 22, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Information We Collect */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Eye className="h-5 w-5 text-blue-400" />
              <span>Information We Collect</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="text-white font-medium mb-2">Personal Information</h4>
              <ul className="text-gray-300 text-sm space-y-1 ml-4">
                <li>• Email address (for account creation)</li>
                <li>• Username and profile information</li>
                <li>• Payment information (for withdrawals)</li>
                <li>• Device and browser information</li>
                <li>• IP address and location data</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Usage Information</h4>
              <ul className="text-gray-300 text-sm space-y-1 ml-4">
                <li>• Tasks completed and rewards earned</li>
                <li>• Login times and activity patterns</li>
                <li>• Referral activities</li>
                <li>• Withdrawal requests and history</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Information */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Lock className="h-5 w-5 text-green-400" />
              <span>How We Use Your Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• To provide and maintain our service</li>
              <li>• To process rewards and withdrawals</li>
              <li>• To prevent fraud and ensure security</li>
              <li>• To communicate with you about your account</li>
              <li>• To improve our platform and user experience</li>
            </ul>
          </CardContent>
        </Card>

        {/* Information Sharing */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Users className="h-5 w-5 text-yellow-400" />
              <span>Information Sharing</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-3">
              <strong className="text-white">We do not sell your personal information.</strong> We may share
              information:
            </p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• With offerwall partners (for task completion verification)</li>
              <li>• With payment processors (for withdrawals)</li>
              <li>• When required by law</li>
              <li>• To protect our rights and prevent fraud</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Security */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="h-5 w-5 text-red-400" />
              <span>Data Security</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-3">We implement industry-standard security measures including:</p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• Encryption of sensitive data</li>
              <li>• Secure authentication systems</li>
              <li>• Regular security audits</li>
              <li>• Fraud detection systems</li>
            </ul>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Your Rights</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-3">You have the right to:</p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• Access your personal information</li>
              <li>• Correct inaccurate information</li>
              <li>• Delete your account and data</li>
              <li>• Opt out of marketing communications</li>
            </ul>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Mail className="h-5 w-5 text-purple-400" />
              <span>Contact Us</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              For privacy-related questions, contact us at:{" "}
              <a href="mailto:privacy@dropiyo.com" className="text-blue-400 underline">
                privacy@dropiyo.com
              </a>
            </p>
            <p className="text-gray-400 text-xs mt-3">
              This privacy policy complies with GDPR, CCPA, and other applicable privacy laws.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
