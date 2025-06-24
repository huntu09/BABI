"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MessageCircle, HelpCircle, Mail, Phone, Clock, CheckCircle } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function CustomerSupport() {
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    category: "",
    priority: "medium",
    message: "",
  })
  const [submitting, setSubmitting] = useState(false)

  const faqItems = [
    {
      question: "How do I earn points?",
      answer: "Complete offers from our partner providers. Each offer shows the points you'll earn upon completion.",
    },
    {
      question: "What's the minimum withdrawal amount?",
      answer: "The minimum withdrawal is $2.00 (200 points). This helps reduce processing fees.",
    },
    {
      question: "How long do withdrawals take?",
      answer: "E-wallet withdrawals (DANA, GoPay, ShopeePay) typically process within 5-30 minutes.",
    },
    {
      question: "Why was my account suspended?",
      answer: "Accounts may be suspended for fraudulent activity, using VPNs, or violating our terms of service.",
    },
    {
      question: "Can I have multiple accounts?",
      answer: "No, only one account per person is allowed. Multiple accounts will result in suspension.",
    },
    {
      question: "How do I verify my account?",
      answer: "Verify your email address and phone number in your profile settings for higher withdrawal limits.",
    },
  ]

  const submitTicket = async () => {
    try {
      setSubmitting(true)

      const response = await fetch("/api/support/ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ticketForm),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Ticket Submitted! 🎫",
          description: `Your ticket #${data.ticketId} has been created. We'll respond within 24 hours.`,
        })
        setTicketForm({ subject: "", category: "", priority: "medium", message: "" })
      } else {
        throw new Error(data.error)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>Customer Support</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold text-blue-800">Response Time</h3>
                <p className="text-blue-600 text-sm">Usually within 2-4 hours</p>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-800">Resolution Rate</h3>
                <p className="text-green-600 text-sm">98% first contact resolution</p>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <MessageCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold text-purple-800">Live Chat</h3>
                <p className="text-purple-600 text-sm">Available 24/7</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="faq" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="ticket">Submit Ticket</TabsTrigger>
              <TabsTrigger value="contact">Contact Info</TabsTrigger>
            </TabsList>

            <TabsContent value="faq" className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center space-x-2">
                <HelpCircle className="h-5 w-5" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <h4 className="font-semibold text-gray-800 mb-2">{item.question}</h4>
                      <p className="text-gray-600 text-sm">{item.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="ticket" className="space-y-4">
              <h3 className="text-lg font-semibold">Submit Support Ticket</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Subject</label>
                    <Input
                      placeholder="Brief description of your issue"
                      value={ticketForm.subject}
                      onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Category</label>
                    <select
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm({ ...ticketForm, category: e.target.value })}
                    >
                      <option value="">Select category</option>
                      <option value="account">Account Issues</option>
                      <option value="withdrawal">Withdrawal Problems</option>
                      <option value="offers">Offer Completion</option>
                      <option value="technical">Technical Support</option>
                      <option value="billing">Billing Questions</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <div className="flex space-x-2">
                    {["low", "medium", "high", "urgent"].map((priority) => (
                      <Button
                        key={priority}
                        variant={ticketForm.priority === priority ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTicketForm({ ...ticketForm, priority })}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Message</label>
                  <Textarea
                    placeholder="Please describe your issue in detail..."
                    rows={6}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                  />
                </div>

                <Button
                  onClick={submitTicket}
                  disabled={submitting || !ticketForm.subject || !ticketForm.message}
                  className="w-full"
                >
                  {submitting ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="contact" className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="h-6 w-6 text-blue-600" />
                      <div>
                        <h4 className="font-semibold">Email Support</h4>
                        <p className="text-sm text-gray-600">support@yourplatform.com</p>
                        <Badge variant="outline" className="mt-1">
                          24/7 Available
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-6 w-6 text-green-600" />
                      <div>
                        <h4 className="font-semibold">WhatsApp Support</h4>
                        <p className="text-sm text-gray-600">+62 812-3456-7890</p>
                        <Badge variant="outline" className="mt-1">
                          9 AM - 9 PM WIB
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">Emergency Contact</h4>
                  <p className="text-yellow-700 text-sm">
                    For urgent account security issues or unauthorized access, contact us immediately at{" "}
                    <strong>emergency@yourplatform.com</strong>
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
