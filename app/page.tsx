import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import LandingPage from "@/components/landing-page"
import DashboardRefactored from "@/components/dashboard/dashboard-refactored"

// Force dynamic rendering for this page
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function Home() {
  try {
    console.log("🔍 Starting authentication check...")

    // Check if Supabase environment variables are set
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error("❌ Supabase environment variables not set")
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Configuration Error</h1>
            <p className="text-gray-600 mb-4">Supabase environment variables are missing</p>
            <div className="text-left bg-gray-100 p-4 rounded">
              <p className="text-sm">Required variables:</p>
              <ul className="text-sm mt-2">
                <li>• NEXT_PUBLIC_SUPABASE_URL</li>
                <li>• NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
          </div>
        </div>
      )
    }

    console.log("🔗 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)

    const supabase = createServerComponentClient({ cookies })

    // Test database connection first
    console.log("🔍 Testing database connection...")
    try {
      const { data: connectionTest, error: connectionError } = await supabase.from("profiles").select("id").limit(1)

      if (connectionError) {
        console.error("❌ Database connection error:", connectionError)

        // Check if it's a table not found error
        if (connectionError.message.includes("relation") && connectionError.message.includes("does not exist")) {
          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Database Setup Required</h1>
                <p className="text-gray-600 mb-4">The database tables haven't been created yet.</p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Next Steps:</strong>
                  </p>
                  <ol className="text-sm text-yellow-700 mt-2 list-decimal list-inside">
                    <li>Go to your Supabase project dashboard</li>
                    <li>Open the SQL Editor</li>
                    <li>Run the database schema script</li>
                  </ol>
                </div>
                <details className="text-left">
                  <summary className="cursor-pointer text-blue-600">Show SQL Scripts to Run</summary>
                  <div className="mt-2 space-y-2">
                    <code className="block bg-gray-100 p-2 rounded text-sm">scripts/001-simplified-schema.sql</code>
                    <code className="block bg-gray-100 p-2 rounded text-sm">scripts/002-fix-rls-policies.sql</code>
                  </div>
                </details>
              </div>
            </div>
          )
        }

        // Other database errors
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Database Connection Error</h1>
              <p className="text-gray-600 mb-4">Unable to connect to the database</p>
              <details className="text-left">
                <summary className="cursor-pointer text-blue-600">Error Details</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(connectionError, null, 2)}
                </pre>
              </details>
              <div className="mt-4 text-sm text-gray-500">
                <p>Check your Supabase project settings and ensure:</p>
                <ul className="mt-2 list-disc list-inside">
                  <li>Project is not paused</li>
                  <li>Environment variables are correct</li>
                  <li>Database is accessible</li>
                </ul>
              </div>
            </div>
          </div>
        )
      }

      console.log("✅ Database connection successful")
    } catch (dbError) {
      console.error("❌ Database test failed:", dbError)
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Database Error</h1>
            <p className="text-gray-600">Failed to connect to database</p>
            <details className="mt-4 text-left">
              <summary className="cursor-pointer">Error Details</summary>
              <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                {dbError instanceof Error ? dbError.message : String(dbError)}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    // Get user authentication
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    console.log("📊 User data:", {
      hasUser: !!user,
      userEmail: user?.email,
      userId: user?.id,
      userError: userError?.message,
    })

    // Handle user error - but don't treat "no user" as an error
    if (userError && userError.message !== "Auth session missing!") {
      console.error("❌ User error:", userError)
      return <LandingPage />
    }

    // No user - show landing page (this is normal for logged out users)
    if (!user) {
      console.log("ℹ️ No user found, showing landing page")
      return <LandingPage />
    }

    // Ensure user has email
    if (!user.email) {
      console.error("❌ User missing email")
      return <LandingPage />
    }

    console.log("✅ Valid user found, checking profile...")

    // Check if profile exists
    const { data: profiles, error: profilesError } = await supabase.from("profiles").select("*").eq("id", user.id)

    console.log("📊 Profiles query result:", {
      profilesCount: profiles?.length || 0,
      profilesError: profilesError?.message,
    })

    let profile = null

    if (profiles && profiles.length > 0) {
      profile = profiles[0]
    }

    if (!profile) {
      console.log("🔧 Creating new profile using secure function...")

      try {
        // Use the secure function to create profile
        const { data: newProfile, error: createError } = await supabase.rpc("create_user_profile", {
          p_user_id: user.id,
          p_user_email: user.email,
          p_user_username: user.email.split("@")[0] || "User",
          p_user_full_name: user.user_metadata?.full_name || null,
          p_user_avatar_url: user.user_metadata?.avatar_url || null,
        })

        if (createError) {
          console.error("❌ Profile creation error:", createError)

          // Check if it's a function not found error
          if (createError.message.includes("function") && createError.message.includes("does not exist")) {
            return (
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-2xl font-bold mb-4">Database Functions Missing</h1>
                  <p className="text-gray-600 mb-4">Required database functions haven't been created</p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
                    <p className="text-sm text-yellow-800">Please run this SQL script in Supabase:</p>
                    <code className="block bg-gray-100 p-2 rounded text-sm mt-2">scripts/002-fix-rls-policies.sql</code>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-2xl font-bold mb-4">Profile Creation Failed</h1>
                <p className="text-gray-600 mb-4">Error: {createError.message}</p>
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer">Error Details</summary>
                  <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(createError, null, 2)}
                  </pre>
                </details>
              </div>
            </div>
          )
        }

        profile = newProfile
        console.log("✅ Profile created successfully:", profile)
      } catch (error) {
        console.error("❌ Error creating profile:", error)
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Setup Error</h1>
              <p className="text-gray-600">Unable to create user profile</p>
              <details className="mt-4 text-left">
                <summary className="cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
                  {error instanceof Error ? error.message : String(error)}
                </pre>
              </details>
            </div>
          </div>
        )
      }
    } else {
      // Update last login for existing users
      try {
        await supabase
          .from("profiles")
          .update({
            last_login: new Date().toISOString(),
          })
          .eq("id", user.id)
        console.log("✅ Updated last login")
      } catch (updateError) {
        console.warn("⚠️ Could not update last login:", updateError)
      }
    }

    console.log("✅ Profile ready, loading dashboard...")
    return <DashboardRefactored user={user} profile={profile} />
  } catch (error) {
    console.error("❌ Page error:", error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Application Error</h1>
          <p className="text-gray-600">Something went wrong</p>
          <details className="mt-4 text-left">
            <summary className="cursor-pointer">Error Details</summary>
            <pre className="mt-2 p-4 bg-gray-100 rounded text-sm overflow-auto">
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
        </div>
      </div>
    )
  }
}
