"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, FileText, Globe } from "lucide-react"

interface LegalComplianceProps {
  onAccept: () => void
}

export default function LegalCompliance({ onAccept }: LegalComplianceProps) {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false)
  const [acceptedAge, setAcceptedAge] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)

  const canProceed = acceptedTerms && acceptedPrivacy && acceptedAge

  const termsOfService = `
TERMS OF SERVICE

Last updated: ${new Date().toLocaleDateString()}

1. ACCEPTANCE OF TERMS
By accessing and using this platform, you accept and agree to be bound by the terms and provision of this agreement.

2. ELIGIBILITY
- You must be at least 18 years old to use this service
- You must provide accurate and complete information
- You are responsible for maintaining account security

3. EARNING POINTS
- Points are earned by completing legitimate offers
- Fraudulent activity will result in account suspension
- We reserve the right to verify all completions

4. WITHDRAWALS
- Minimum withdrawal: $2.00 (200 points)
- Processing time: 5-30 minutes for e-wallets
- We may require additional verification for large amounts

5. PROHIBITED ACTIVITIES
- Using VPNs or proxy servers
- Creating multiple accounts
- Attempting to manipulate the system
- Sharing account credentials

6. ACCOUNT SUSPENSION
We reserve the right to suspend accounts for:
- Fraudulent activity
- Violation of terms
- Suspicious behavior patterns

7. LIMITATION OF LIABILITY
The platform is provided "as is" without warranties of any kind.

8. CHANGES TO TERMS
We reserve the right to modify these terms at any time.
  `

  const privacyPolicy = `
PRIVACY POLICY

Last updated: ${new Date().toLocaleDateString()}

1. INFORMATION WE COLLECT
- Email address and profile information
- IP addresses and device information
- Usage data and completion history
- Payment information for withdrawals

2. HOW WE USE INFORMATION
- To provide and improve our services
- To process payments and withdrawals
- To prevent fraud and abuse
- To communicate with users

3. INFORMATION SHARING
- We do not sell personal information
- We may share data with offerwall partners
- We comply with legal requirements

4. DATA SECURITY
- We use industry-standard encryption
- Regular security audits and monitoring
- Secure payment processing

5. YOUR RIGHTS
- Access your personal data
- Request data deletion
- Opt-out of communications
- Data portability

6. COOKIES
We use cookies to improve user experience and analytics.

7. GDPR COMPLIANCE
For EU users, we comply with GDPR requirements.

8. CONTACT US
For privacy concerns, contact: privacy@yourplatform.com
  `

  if (showTerms) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Terms of Service</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded p-4">
            <pre className="whitespace-pre-wrap text-sm">{termsOfService}</pre>
          </ScrollArea>
          <div className="mt-4 flex space-x-2">
            <Button onClick={() => setShowTerms(false)} variant="outline">
              Back
            </Button>
            <Button
              onClick={() => {
                setAcceptedTerms(true)
                setShowTerms(false)
              }}
            >
              Accept Terms
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (showPrivacy) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy Policy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-96 w-full border rounded p-4">
            <pre className="whitespace-pre-wrap text-sm">{privacyPolicy}</pre>
          </ScrollArea>
          <div className="mt-4 flex space-x-2">
            <Button onClick={() => setShowPrivacy(false)} variant="outline">
              Back
            </Button>
            <Button
              onClick={() => {
                setAcceptedPrivacy(true)
                setShowPrivacy(false)
              }}
            >
              Accept Privacy Policy
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Legal Compliance</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
            />
            <div className="space-y-1">
              <label htmlFor="terms" className="text-sm font-medium cursor-pointer">
                I accept the{" "}
                <button onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">
                  Terms of Service
                </button>
              </label>
              <p className="text-xs text-gray-600">
                By accepting, you agree to our platform rules and earning guidelines
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="privacy"
              checked={acceptedPrivacy}
              onCheckedChange={(checked) => setAcceptedPrivacy(checked as boolean)}
            />
            <div className="space-y-1">
              <label htmlFor="privacy" className="text-sm font-medium cursor-pointer">
                I accept the{" "}
                <button onClick={() => setShowPrivacy(true)} className="text-blue-600 hover:underline">
                  Privacy Policy
                </button>
              </label>
              <p className="text-xs text-gray-600">We protect your data and comply with international privacy laws</p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Checkbox
              id="age"
              checked={acceptedAge}
              onCheckedChange={(checked) => setAcceptedAge(checked as boolean)}
            />
            <div className="space-y-1">
              <label htmlFor="age" className="text-sm font-medium cursor-pointer">
                I confirm that I am 18 years or older
              </label>
              <p className="text-xs text-gray-600">Age verification is required for earning and withdrawals</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Globe className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">GDPR & International Compliance</span>
          </div>
          <p className="text-xs text-blue-700">
            We comply with GDPR, CCPA, and other international privacy regulations. Your data is protected and you have
            full control over your information.
          </p>
        </div>

        <Button onClick={onAccept} disabled={!canProceed} className="w-full" size="lg">
          {canProceed ? "Continue to Platform" : "Please Accept All Terms"}
        </Button>
      </CardContent>
    </Card>
  )
}
