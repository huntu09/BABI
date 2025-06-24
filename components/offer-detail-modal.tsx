"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, Clock, CheckCircle, AlertCircle, ExternalLink, Shield, Award, Users, TrendingUp, X } from "lucide-react"

interface OfferDetailModalProps {
  offer: any
  user: any
  isCompleted: boolean
  isCompleting: boolean
  onClose: () => void
  onComplete: () => void
}

export default function OfferDetailModal({
  offer,
  user,
  isCompleted,
  isCompleting,
  onClose,
  onComplete,
}: OfferDetailModalProps) {
  const [showRequirements, setShowRequirements] = useState(false)

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case "easy":
        return "bg-green-600"
      case "medium":
        return "bg-yellow-600"
      case "hard":
        return "bg-red-600"
      default:
        return "bg-blue-600"
    }
  }

  const getProviderIcon = (provider) => {
    const providerLower = provider?.toLowerCase() || ""
    if (providerLower.includes("game")) return "🎮"
    if (providerLower.includes("survey")) return "📊"
    if (providerLower.includes("shop")) return "🛒"
    if (providerLower.includes("app")) return "📱"
    if (providerLower.includes("video")) return "🎥"
    return "🎯"
  }

  const requirements = offer.requirements ? offer.requirements.split(",").map((req) => req.trim()) : []
  const steps = offer.steps ? offer.steps.split(",").map((step) => step.trim()) : []

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="text-xl font-bold">{offer.title}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Offer Header */}
          <div className="relative">
            <div className="h-40 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
              <div className="text-6xl">{getProviderIcon(offer.provider)}</div>

              {/* Status Badges */}
              <div className="absolute top-4 right-4 flex space-x-2">
                {offer.is_trending && (
                  <Badge className="bg-red-600 text-white">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Trending
                  </Badge>
                )}
                {isCompleted && (
                  <Badge className="bg-green-600 text-white">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Offer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{offer.description}</p>
              </div>

              {/* Provider Info */}
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{getProviderIcon(offer.provider)}</div>
                    <div>
                      <h4 className="font-semibold text-white">{offer.provider}</h4>
                      <p className="text-gray-400 text-sm">Trusted Partner</p>
                    </div>
                    <div className="ml-auto">
                      <Badge className="bg-green-600 text-white">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              {requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Requirements</h3>
                  <div className="space-y-2">
                    {requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2 text-sm">
                        <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0" />
                        <span className="text-gray-300">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* Reward Info */}
              <Card className="bg-gradient-to-r from-green-600 to-emerald-600 border-0">
                <CardContent className="p-4 text-center">
                  <div className="text-3xl font-bold text-white mb-1">{offer.points} Points</div>
                  <div className="text-green-100 mb-2">${(offer.points / 100).toFixed(2)} USD</div>
                  <div className="text-green-200 text-sm">Instant payout after completion</div>
                </CardContent>
              </Card>

              {/* Offer Stats */}
              <div className="grid grid-cols-2 gap-3">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <Clock className="h-5 w-5 text-blue-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-white">{offer.estimated_time || "5-10 min"}</div>
                    <div className="text-xs text-gray-400">Est. Time</div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <Badge className={`${getDifficultyColor(offer.difficulty)} text-white mb-1`}>
                      {offer.difficulty || "Easy"}
                    </Badge>
                    <div className="text-xs text-gray-400">Difficulty</div>
                  </CardContent>
                </Card>

                {offer.rating && (
                  <Card className="bg-slate-800 border-slate-700">
                    <CardContent className="p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                        <span className="text-sm font-semibold text-white">{offer.rating.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-400">Rating</div>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-3 text-center">
                    <Users className="h-5 w-5 text-purple-400 mx-auto mb-1" />
                    <div className="text-sm font-semibold text-white">{offer.completion_count || 0}</div>
                    <div className="text-xs text-gray-400">Completed</div>
                  </CardContent>
                </Card>
              </div>

              {/* Steps to Complete */}
              {steps.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">How to Complete</h3>
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                          {index + 1}
                        </div>
                        <span className="text-gray-300 text-sm">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t border-slate-700">
            {isCompleted ? (
              <Button disabled className="flex-1 bg-green-600 text-white">
                <CheckCircle className="h-4 w-4 mr-2" />
                Already Completed
              </Button>
            ) : (
              <>
                <Button
                  onClick={onComplete}
                  disabled={isCompleting}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  {isCompleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Completing...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4 mr-2" />
                      Complete Offer
                    </>
                  )}
                </Button>

                {offer.url && (
                  <Button
                    variant="outline"
                    onClick={() => window.open(offer.url, "_blank")}
                    className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Visit
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Disclaimer */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-400">
                <p className="mb-1">
                  <strong>Important:</strong> Complete all requirements to earn points.
                </p>
                <p>
                  Points will be credited within 24 hours after verification. Contact support if you experience any
                  issues.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
