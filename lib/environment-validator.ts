// 🔧 ENVIRONMENT VALIDATION FOR PRODUCTION

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY", // For admin operations
] as const

const optionalEnvVars = [
  // Offerwall providers
  "CPX_RESEARCH_API_KEY",
  "ADGEM_API_KEY",
  "LOOTABLY_API_KEY",
  "OFFERTORO_API_KEY",

  // Monitoring & Analytics
  "SENTRY_DSN",
  "MIXPANEL_TOKEN",
  "GOOGLE_ANALYTICS_ID",

  // Email & SMS
  "SENDGRID_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",

  // Payment processors
  "STRIPE_SECRET_KEY",
  "PAYPAL_CLIENT_ID",

  // Security services
  "IPQUALITYSCORE_API_KEY",
  "RECAPTCHA_SECRET_KEY",
] as const

export function validateEnvironment() {
  const missing: string[] = []
  const warnings: string[] = []

  // Check required variables
  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      missing.push(envVar)
    }
  })

  // Check optional but recommended variables
  optionalEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      warnings.push(envVar)
    }
  })

  if (missing.length > 0) {
    throw new Error(`❌ Missing required environment variables: ${missing.join(", ")}`)
  }

  if (warnings.length > 0) {
    console.warn(`⚠️ Missing optional environment variables: ${warnings.join(", ")}`)
  }

  console.log("✅ Environment validation passed")
}

// Validate on startup
if (process.env.NODE_ENV === "production") {
  validateEnvironment()
}
