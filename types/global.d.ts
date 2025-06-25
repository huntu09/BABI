// 🔧 COMPREHENSIVE TYPE DEFINITIONS

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  user_id: string
  username: string | null
  full_name: string | null // Add missing field
  avatar_url: string | null // Add missing field
  email: string
  phone: string | null
  balance: number // Fix: was points
  total_earned: number
  referral_code: string
  referred_by: string | null
  is_admin: boolean
  is_banned: boolean
  status: "active" | "suspended" | "pending" // Fix: was account_status
  email_verified: boolean // Add missing field
  email_verified_at: string | null // Add missing field
  login_streak: number // Add missing field
  suspicious_activity_count: number
  last_login: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description: string
  provider: string
  provider_id?: string
  points: number
  payout?: number
  category: string
  difficulty: "easy" | "medium" | "hard"
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
  created_at: string
  updated_at: string
}

export interface UserTask {
  id: string
  user_id: string
  task_id: string
  points_earned: number
  status: "pending" | "completed" | "failed"
  completed_at?: string
  created_at: string
  tasks?: Task
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  method: string
  account_details: Record<string, any>
  status: "pending" | "processing" | "completed" | "rejected"
  admin_notes?: string
  requested_at: string
  processed_at?: string
}

export interface OfferCompletion {
  id: string
  external_offer_id: string
  user_id: string
  provider_id: string
  transaction_id: string
  points_earned: number
  payout_usd: number
  status: "pending" | "completed" | "rejected"
  completed_at: string
  verified_at?: string
  ip_address?: string
  user_agent?: string
}

export interface FraudLog {
  id: string
  user_id: string
  type: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  confidence_score: number
  risk_level: "low" | "medium" | "high" | "critical"
  created_at: string
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Component Props Types
export interface DashboardProps {
  user: User
  profile: Profile
}

export interface AdminDashboardProps {
  user: User
  profile: Profile
}

// Offerwall Types
export interface OfferwallProvider {
  id: string
  name: string
  apiKey: string
  secretKey?: string
  isActive: boolean
  config: Record<string, any>
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

// Security Types
export interface SecurityCheck {
  allowed: boolean
  blocked?: boolean
  flagged?: boolean
  reason?: string
  score?: number
  requiresManualReview?: boolean
}

// Gamification Types
export interface UserLevel {
  id: string
  user_id: string
  current_level: number
  current_xp: number
  total_xp: number
  level_name: string
  next_level_xp: number
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  badge?: Badge
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: string
  requirements: Record<string, any>
  points_reward: number
  is_active: boolean
}

// Analytics Types
export interface AnalyticsData {
  totalUsers: number
  totalPaid: number
  pendingWithdrawals: number
  fraudDetected: number
  dailySignups: number
  dailyCompletions: number
  revenue: number
  conversionRate: number
}

// Form Types
export interface WithdrawalForm {
  amount: number
  method: string
  accountDetails: Record<string, string>
}

export interface ProfileUpdateForm {
  username: string
  email?: string
}

// Error Types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Utility Types
export type LoadingState = "idle" | "loading" | "success" | "error"

export interface PaginationParams {
  page: number
  limit: number
  offset: number
}

export interface FilterParams {
  category?: string
  difficulty?: string
  minPoints?: number
  maxPoints?: number
  provider?: string
  status?: string
}

export interface SortParams {
  field: string
  direction: "asc" | "desc"
}
