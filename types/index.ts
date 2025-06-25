export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  created_at: string
  badge?: Badge
}

export interface Badge {
  id: string
  name: string
  description?: string
  icon?: string
  requirement_type: string // Gak usah enum dulu, kita cek dulu yang valid
  requirement_value: number
  reward_amount: number
  is_active: boolean
  created_at: string
}

export interface FraudLog {
  id: string
  user_id?: string
  event_type: string // BUKAN type, tapi event_type!
  risk_level: string
  details: Record<string, any>
  ip_address?: string
  user_agent?: string
  confidence_score: number
  created_at: string
}

export interface AdminAction {
  id: string
  admin_id: string // NOT NULL di database!
  action_type: string
  target_type: string
  target_id?: string
  details: Record<string, any>
  reason?: string
  ip_address?: string
  user_agent?: string
  created_at: string
}
