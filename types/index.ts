// Global type definitions for the application

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  username?: string
  phone?: string
  points: number
  total_earned: number
  referral_code: string
  referred_by?: string
  is_banned: boolean
  is_verified: boolean
  account_status: "active" | "suspended" | "banned"
  suspicious_activity_count: number
  last_login?: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: number
  title: string
  description: string
  points: number
  difficulty: "easy" | "medium" | "hard"
  category: string
  provider: string
  url?: string
  image_url?: string
  requirements?: string[]
  countries?: string[]
  devices?: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Withdrawal {
  id: number
  user_id: string
  amount: number
  method: string
  wallet_address: string
  status: "pending" | "processing" | "completed" | "rejected"
  admin_notes?: string
  ip_address?: string
  device_fingerprint?: string
  risk_score?: number
  requires_manual_review: boolean
  verification_code?: string
  verification_expires_at?: string
  requested_at: string
  processed_at?: string
}

export interface Offer {
  id: string
  providerId: string
  title: string
  description: string
  points: number
  payout: number
  category: string
  difficulty: string
  estimatedTime: string
  requirements: string[]
  countries: string[]
  devices: string[]
  url: string
  imageUrl?: string
  rating?: number
  completions?: number
  isActive: boolean
  expiresAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface OfferCompletion {
  offerId: string
  userId: string
  providerId: string
  transactionId: string
  points: number
  payout: number
  status: "pending" | "completed" | "rejected" | "chargeback"
  completedAt: Date
  verifiedAt?: Date
  ipAddress?: string
  userAgent?: string
}

export interface Referral {
  id: number
  referrer_id: string
  referred_id: string
  commission_earned: number
  created_at: string
  updated_at: string
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  offers: boolean
  rewards: boolean
  withdrawals: boolean
  referrals: boolean
}

export interface DashboardStats {
  totalUsers: number
  activeUsers: number
  totalPaid: number
  pendingWithdrawals: number
  fraudDetected: number
  todaySignups: number
  todayEarnings: number
  conversionRate: number
}

export interface FraudLog {
  id: number
  user_id: string
  type: string
  details: any
  ip_address?: string
  user_agent?: string
  confidence_score: number
  risk_level: "low" | "medium" | "high" | "critical"
  created_at: string
}

export interface AdminAction {
  id: number
  admin_id?: string
  action_type: string
  target_user_id?: string
  details: any
  reason: string
  created_at: string
}

// Component Props Types
export interface DashboardProps {
  user: User
  profile: Profile
}

export interface ProfilePageProps {
  user: User
  profile: Profile
  onBack: () => void
}

export interface WithdrawalModalProps {
  paymentMethod: string
  currentBalance: number
  onClose: () => void
  onSuccess: (amount: number) => void
}

export interface EarnTabProps {
  onOfferClick: (offer: any) => void
}

export interface CashoutTabProps {
  points: number
  onPaymentMethodSelect: (methodId: string) => void
}

export interface RewardsTabProps {
  onClaimBonus: () => void
}

export interface BottomNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

export interface DashboardHeaderProps {
  user: User
  profile: Profile
  points: number
  onProfileClick: () => void
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface WithdrawalResponse extends ApiResponse {
  withdrawalId?: number
  requiresVerification?: boolean
  requiresReview?: boolean
  estimatedProcessing?: string
}

export interface OfferCompletionResponse extends ApiResponse {
  pointsEarned?: number
  fraudScore?: number
}

// Database Table Types
export interface DatabaseTables {
  profiles: Profile
  tasks: Task
  withdrawals: Withdrawal
  referrals: Referral
  fraud_logs: FraudLog
  admin_actions: AdminAction
  offer_completions: {
    id: number
    external_offer_id: string
    user_id: string
    provider_id: string
    transaction_id: string
    points_earned: number
    payout_usd: number
    status: string
    ip_address?: string
    user_agent?: string
    completed_at: string
    verified_at?: string
  }
  cached_offers: {
    id: number
    external_id: string
    provider_id: string
    title: string
    description: string
    points: number
    payout: number
    category: string
    difficulty: string
    estimated_time: string
    requirements: string[]
    countries: string[]
    devices: string[]
    url: string
    image_url?: string
    rating?: number
    completions?: number
    is_active: boolean
    expires_at?: string
    provider_created_at: string
    provider_updated_at: string
    created_at: string
    updated_at: string
  }
}
