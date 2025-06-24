#!/usr/bin/env node

/**
 * 🚀 Dropiyo Environment Setup Script
 * Helps validate and setup environment variables
 */

import { createClient } from "@supabase/supabase-js"
import chalk from "chalk"

interface EnvCheck {
  name: string
  required: boolean
  description: string
  category: string
}

const ENV_CHECKS: EnvCheck[] = [
  // Critical
  { name: "NEXT_PUBLIC_SUPABASE_URL", required: true, description: "Supabase Project URL", category: "Critical" },
  {
    name: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    required: true,
    description: "Supabase Anonymous Key",
    category: "Critical",
  },
  { name: "SUPABASE_SERVICE_ROLE_KEY", required: true, description: "Supabase Service Role Key", category: "Critical" },
  { name: "JWT_SECRET", required: true, description: "JWT Secret Key", category: "Critical" },
  { name: "ENCRYPTION_KEY", required: true, description: "Data Encryption Key", category: "Critical" },

  // Revenue
  { name: "CPX_RESEARCH_API_KEY", required: false, description: "CPX Research API Key", category: "Revenue" },
  { name: "LOOTABLY_API_KEY", required: false, description: "Lootably API Key", category: "Revenue" },
  { name: "ADGEM_API_KEY", required: false, description: "AdGem API Key", category: "Revenue" },

  // Payments
  { name: "DANA_API_KEY", required: false, description: "DANA Payment API", category: "Payments" },
  { name: "GOPAY_API_KEY", required: false, description: "GoPay Payment API", category: "Payments" },

  // Monitoring
  { name: "SENTRY_DSN", required: false, description: "Sentry Error Tracking", category: "Monitoring" },
  { name: "NEXT_PUBLIC_GA_ID", required: false, description: "Google Analytics ID", category: "Monitoring" },
]

async function checkEnvironment() {
  console.log(chalk.blue.bold("\n🚀 Dropiyo Environment Setup Check\n"))

  const results = {
    critical: { passed: 0, total: 0 },
    revenue: { passed: 0, total: 0 },
    payments: { passed: 0, total: 0 },
    monitoring: { passed: 0, total: 0 },
  }

  // Check each environment variable
  for (const check of ENV_CHECKS) {
    const value = process.env[check.name]
    const exists = !!value
    const category = check.category.toLowerCase() as keyof typeof results

    results[category].total++
    if (exists) results[category].passed++

    const status = exists ? chalk.green("✅") : check.required ? chalk.red("❌") : chalk.yellow("⚠️")
    const requiredText = check.required ? chalk.red("(Required)") : chalk.gray("(Optional)")

    console.log(`${status} ${check.name} ${requiredText}`)
    console.log(`   ${chalk.gray(check.description)}`)

    if (check.required && !exists) {
      console.log(`   ${chalk.red("Missing required environment variable!")}`)
    }
    console.log()
  }

  // Test Supabase connection
  console.log(chalk.blue.bold("🔗 Testing Supabase Connection...\n"))

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data, error } = await supabase.from("profiles").select("count").limit(1)

      if (error) {
        console.log(chalk.red("❌ Supabase connection failed:"), error.message)
      } else {
        console.log(chalk.green("✅ Supabase connection successful!"))
      }
    } else {
      console.log(chalk.red("❌ Supabase credentials missing"))
    }
  } catch (error) {
    console.log(chalk.red("❌ Supabase test failed:"), error)
  }

  // Summary
  console.log(chalk.blue.bold("\n📊 Environment Summary:\n"))

  Object.entries(results).forEach(([category, result]) => {
    const percentage = Math.round((result.passed / result.total) * 100)
    const color = percentage === 100 ? chalk.green : percentage >= 50 ? chalk.yellow : chalk.red

    console.log(`${color(`${category.toUpperCase()}: ${result.passed}/${result.total} (${percentage}%)`)}`)
  })

  // Recommendations
  console.log(chalk.blue.bold("\n💡 Next Steps:\n"))

  if (results.critical.passed < results.critical.total) {
    console.log(chalk.red("1. ❗ Fix critical environment variables first"))
  } else {
    console.log(chalk.green("1. ✅ Critical setup complete"))
  }

  if (results.revenue.passed === 0) {
    console.log(chalk.yellow("2. 💰 Setup offerwall providers for revenue"))
    console.log("   - Sign up at: CPX Research, Lootably, AdGem")
  }

  if (results.payments.passed === 0) {
    console.log(chalk.yellow("3. 💳 Configure payment methods"))
    console.log("   - Setup: DANA, GoPay, ShopeePay APIs")
  }

  if (results.monitoring.passed === 0) {
    console.log(chalk.yellow("4. 📊 Add monitoring services"))
    console.log("   - Setup: Sentry, Google Analytics")
  }

  console.log(chalk.blue("\n🚀 Ready to launch Dropiyo! Good luck!\n"))
}

// Run the check
checkEnvironment().catch(console.error)
