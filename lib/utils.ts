import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency - Convert points to dollars
export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(amount / 100) // 👈 Divide by 100 to convert points to dollars
}

// Format points
export function formatPoints(points: number): string {
  return points.toLocaleString()
}

// Convert points to dollars
export function pointsToDollars(points: number): number {
  return points / 100
}

// Convert dollars to points
export function dollarsToPoints(dollars: number): number {
  return dollars * 100
}

// Format date
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

// Format date with time
export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

// Generate avatar letter
export function getAvatarLetter(name: string): string {
  return name ? name[0].toUpperCase() : "U"
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate phone number
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]+$/
  return phoneRegex.test(phone) && phone.length >= 10
}

// Generate referral code
export function generateReferralCode(userId: string): string {
  return `REF${userId.slice(0, 8).toUpperCase()}`
}

// Calculate commission
export function calculateCommission(amount: number, rate = 0.1): number {
  return Math.floor(amount * rate)
}

// Get risk level color
export function getRiskLevelColor(level: string): string {
  switch (level) {
    case "low":
      return "text-green-400"
    case "medium":
      return "text-yellow-400"
    case "high":
      return "text-orange-400"
    case "critical":
      return "text-red-400"
    default:
      return "text-gray-400"
  }
}

// Get status color
export function getStatusColor(status: string): string {
  switch (status) {
    case "completed":
    case "active":
    case "approved":
      return "bg-green-600"
    case "processing":
    case "pending":
      return "bg-blue-600"
    case "rejected":
    case "banned":
    case "suspended":
      return "bg-red-600"
    case "inactive":
      return "bg-gray-600"
    default:
      return "bg-gray-600"
  }
}

// Truncate text
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

// Sleep function for delays
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Generate random ID
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Check if user is admin
export function isAdmin(profile: any): boolean {
  return profile?.is_admin === true || profile?.role === "admin"
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Debounce function
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Throttle function
export function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}
