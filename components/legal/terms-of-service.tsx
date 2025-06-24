"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, CheckCircle, XCircle, DollarSign, AlertTriangle, Scale } from "lucide-react"

interface TermsOfServiceProps {
  onBack: () => void
}

export default function TermsOfService({ onBack }: TermsOfServiceProps) {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 pt-12">
        <Button variant="ghost" onClick={onBack} className="text-white hover:bg-slate-800 p-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium">Terms of Service</h1>
        <div className="w-10"></div>
      </div>

      <div className="px-4 pb-8 space-y-6">
        {/* Header Card */}
        <Card className="bg-purple-600 border-0">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-white" />
              <div>
                <h2 className="text-white font-bold text-lg">Terms of Service</h2>
                <p className="text-purple-100 text-sm">Last updated: December 22, 2024</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptance */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <Scale className="h-5 w-5 text-blue-400" />
              <span>Acceptance of Terms</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              By using our platform, you agree to these Terms of Service and our Privacy Policy. If you do not agree,
              please do not use our service.
            </p>
          </CardContent>
        </Card>

        {/* Eligibility */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Eligibility Requirements</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• You must be at least 13 years old</li>
              <li>• You must provide accurate information</li>
              <li>• One account per person</li>
              <li>• Must comply with local laws and regulations</li>
            </ul>
          </CardContent>
        </Card>

        {/* Platform Rules */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Platform Rules</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="flex items-center space-x-2 text-green-400 font-medium mb-2">
                <CheckCircle className="h-4 w-4" />
                <span>Allowed Activities</span>
              </h4>
              <ul className="text-gray-300 text-sm space-y-1 ml-6">
                <li>• Complete tasks honestly and according to instructions</li>
                <li>• Refer friends using your unique referral link</li>
                <li>• Request withdrawals when you meet minimum requirements</li>
                <li>• Contact support for legitimate issues</li>
              </ul>
            </div>
            <div>
              <h4 className="flex items-center space-x-2 text-red-400 font-medium mb-2">
                <XCircle className="h-4 w-4" />
                <span>Prohibited Activities</span>
              </h4>
              <ul className="text-gray-300 text-sm space-y-1 ml-6">
                <li>• Creating multiple accounts</li>
                <li>• Using bots, scripts, or automation</li>
                <li>• Providing false information</li>
                <li>• Attempting to manipulate or defraud the system</li>
                <li>• Sharing account credentials</li>
                <li>• Circumventing security measures</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Rewards and Withdrawals */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <DollarSign className="h-5 w-5 text-green-400" />
              <span>Rewards and Withdrawals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Rewards are earned by completing tasks from our partners</li>
              <li>• Minimum withdrawal amount: $2.00 (200 points)</li>
              <li>• Withdrawals processed within 5-30 minutes (subject to verification)</li>
              <li>• We reserve the right to verify task completion</li>
              <li>• Fraudulent activity may result in account suspension</li>
              <li>• Referral commissions: 10% of referred user earnings</li>
            </ul>
          </CardContent>
        </Card>

        {/* Account Termination */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-white">
              <AlertTriangle className="h-5 w-5 text-yellow-400" />
              <span>Account Termination</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-3">We may suspend or terminate accounts for:</p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• Violation of these terms</li>
              <li>• Fraudulent activity</li>
              <li>• Suspicious behavior patterns</li>
              <li>• Legal requirements</li>
              <li>• Abuse of referral system</li>
            </ul>
          </CardContent>
        </Card>

        {/* Limitation of Liability */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Limitation of Liability</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm mb-3">
              Our platform is provided "as is" without warranties. We are not liable for:
            </p>
            <ul className="text-gray-300 text-sm space-y-1 ml-4">
              <li>• Technical issues or downtime</li>
              <li>• Third-party offerwall problems</li>
              <li>• Loss of rewards due to policy violations</li>
              <li>• Changes in task availability</li>
              <li>• Payment processor delays</li>
            </ul>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Changes to Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              We may update these terms at any time. Users will be notified of significant changes. Continued use of the
              platform constitutes acceptance of new terms.
            </p>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-300 text-sm">
              For questions about these terms, contact us at:{" "}
              <a href="mailto:support@dropiyo.com" className="text-blue-400 underline">
                support@dropiyo.com
              </a>
            </p>
            <p className="text-gray-300 text-sm mt-2">
              Or join our Telegram support:{" "}
              <a
                href="https://t.me/dropiyo1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline"
              >
                @dropiyo1
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
