// 🎯 APPLICATION CONSTANTS

export const APP_CONFIG = {
  name: "Dropiyo",
  description: "Get Paid To Complete Tasks",
  version: "2.1.0",
  author: "Dropiyo Team",
  website: "https://dropiyo.com",
  supportEmail: "support@dropiyo.com",
  telegramSupport: "https://t.me/dropiyo1",
  telegramChat: "https://t.me/+1sySMQn2uQdjZWQ1",
} as const

export const POINTS_CONFIG = {
  pointsPerDollar: 200, // Changed from 100 to 200
  minimumWithdrawal: 400, // Updated: $2.00 (was 200)
  maximumWithdrawal: 200000, // Updated: $1000.00 (was 100000)
  dailyWithdrawalLimit: 100000, // Updated: $500.00 (was 50000)
  monthlyWithdrawalLimit: 1000000, // Updated: $5000.00 (was 500000)
  referralCommission: 0.1, // 10%
  dailyLoginBonus: 10, // Updated: 10 points = $0.05 (was 5)
} as const

export const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
  fraudScoreThreshold: {
    block: 0.8,
    flag: 0.6,
    warn: 0.4,
  },
  rateLimit: {
    withdrawal: { window: 60, max: 3 },
    offerClick: { window: 60, max: 20 },
    apiCall: { window: 60, max: 100 },
  },
} as const

export const OFFERWALL_PROVIDERS = {
  cpxResearch: {
    id: "cpx_research",
    name: "CPX Research",
    baseUrl: "https://offers.cpx-research.com",
    icon: "📊",
  },
  adgem: {
    id: "adgem",
    name: "AdGem",
    baseUrl: "https://api.adgem.com",
    icon: "💎",
  },
  lootably: {
    id: "lootably",
    name: "Lootably",
    baseUrl: "https://wall.lootably.com",
    icon: "🎁",
  },
  offertoro: {
    id: "offertoro",
    name: "OfferToro",
    baseUrl: "https://www.offertoro.com",
    icon: "🐂",
  },
  bitlabs: {
    id: "bitlabs",
    name: "BitLabs",
    baseUrl: "https://api.bitlabs.ai",
    icon: "🔬",
  },
  ayetstudios: {
    id: "ayetstudios",
    name: "AyeT Studios",
    baseUrl: "https://ayetstudios.com",
    icon: "🎮",
  },
  revenueUniverse: {
    id: "revenue_universe",
    name: "Revenue Universe",
    baseUrl: "https://www.revenueuniverse.com",
    icon: "🌌",
  },
  personaLy: {
    id: "persona_ly",
    name: "Persona.ly",
    baseUrl: "https://persona.ly",
    icon: "👤",
  },
} as const

export const PAYMENT_METHODS = {
  dana: {
    id: "dana",
    name: "DANA",
    icon: "💳",
    minimum: 200,
    fee: 0,
    processingTime: "Instant",
    color: "from-blue-600 to-blue-700",
    popular: true,
  },
  gopay: {
    id: "gopay",
    name: "GoPay",
    icon: "🟢",
    minimum: 200,
    fee: 0,
    processingTime: "Instant",
    color: "from-green-600 to-green-700",
    popular: true,
  },
  shopeepay: {
    id: "shopeepay",
    name: "ShopeePay",
    icon: "🛒",
    minimum: 200,
    fee: 0,
    processingTime: "Instant",
    color: "from-orange-600 to-orange-700",
  },
  ovo: {
    id: "ovo",
    name: "OVO",
    icon: "🟣",
    minimum: 200,
    fee: 0,
    processingTime: "Instant",
    color: "from-purple-600 to-purple-700",
  },
} as const

export const TASK_CATEGORIES = {
  survey: { name: "Survey", icon: "📊", color: "blue" },
  gaming: { name: "Gaming", icon: "🎮", color: "purple" },
  shopping: { name: "Shopping", icon: "🛒", color: "green" },
  social: { name: "Social Media", icon: "📱", color: "pink" },
  video: { name: "Watch Videos", icon: "📺", color: "red" },
  download: { name: "App Download", icon: "📲", color: "indigo" },
  signup: { name: "Sign Up", icon: "✍️", color: "yellow" },
  trial: { name: "Free Trial", icon: "🆓", color: "cyan" },
} as const

export const DIFFICULTY_LEVELS = {
  easy: { name: "Easy", color: "green", multiplier: 1.0 },
  medium: { name: "Medium", color: "blue", multiplier: 1.5 },
  hard: { name: "Hard", color: "red", multiplier: 2.0 },
} as const

export const USER_LEVELS = [
  { level: 1, name: "Beginner", minXp: 0, maxXp: 100, color: "gray" },
  { level: 2, name: "Explorer", minXp: 100, maxXp: 300, color: "green" },
  { level: 3, name: "Achiever", minXp: 300, maxXp: 600, color: "blue" },
  { level: 4, name: "Expert", minXp: 600, maxXp: 1000, color: "purple" },
  { level: 5, name: "Master", minXp: 1000, maxXp: 1500, color: "yellow" },
  { level: 6, name: "Legend", minXp: 1500, maxXp: 2500, color: "red" },
  { level: 7, name: "Champion", minXp: 2500, maxXp: 4000, color: "pink" },
  { level: 8, name: "Elite", minXp: 4000, maxXp: 6000, color: "indigo" },
  { level: 9, name: "Supreme", minXp: 6000, maxXp: 10000, color: "cyan" },
  { level: 10, name: "Legendary", minXp: 10000, maxXp: Number.POSITIVE_INFINITY, color: "gradient" },
] as const

export const BADGE_CATEGORIES = {
  earnings: { name: "Earnings", icon: "💰", color: "yellow" },
  completion: { name: "Completion", icon: "✅", color: "green" },
  referral: { name: "Referral", icon: "👥", color: "blue" },
  streak: { name: "Streak", icon: "🔥", color: "red" },
  special: { name: "Special", icon: "⭐", color: "purple" },
} as const

export const API_ENDPOINTS = {
  auth: {
    login: "/api/auth/login",
    register: "/api/auth/register",
    logout: "/api/auth/logout",
    callback: "/api/auth/callback",
  },
  user: {
    profile: "/api/user/profile",
    updateProfile: "/api/user/update-profile",
    deleteAccount: "/api/user/delete-account",
  },
  offers: {
    list: "/api/offers",
    complete: "/api/offers/complete",
    click: "/api/offerwall/click",
    sync: "/api/offerwall/sync",
  },
  withdrawal: {
    request: "/api/withdrawal/request",
    list: "/api/withdrawal/list",
    cancel: "/api/withdrawal/cancel",
  },
  admin: {
    dashboard: "/api/admin/dashboard",
    users: "/api/admin/users",
    withdrawals: "/api/admin/withdrawals",
    settings: "/api/admin/settings",
  },
} as const

export const ERROR_MESSAGES = {
  generic: "Something went wrong. Please try again.",
  network: "Network error. Please check your connection.",
  unauthorized: "You are not authorized to perform this action.",
  validation: "Please check your input and try again.",
  rateLimit: "Too many requests. Please wait and try again.",
  maintenance: "System is under maintenance. Please try again later.",
} as const

export const SUCCESS_MESSAGES = {
  profileUpdated: "Profile updated successfully!",
  withdrawalRequested: "Withdrawal request submitted successfully!",
  offerCompleted: "Offer completed! Points added to your account.",
  bonusClaimed: "Daily bonus claimed successfully!",
  referralSent: "Referral invitation sent!",
} as const
