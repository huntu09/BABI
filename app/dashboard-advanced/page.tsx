import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardWithAdvancedOffers from "@/components/dashboard-with-advanced-offers"

export default async function AdvancedDashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Get user profile with error handling
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, username, email, points, total_earned, referral_code, is_admin, is_banned")
    .eq("id", session.user.id)
    .single()

  // If profile doesn't exist, create one
  if (error && error.code === "PGRST116") {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: session.user.id,
        email: session.user.email,
        username: session.user.user_metadata?.username || session.user.email?.split("@")[0],
        points: 0,
        total_earned: 0,
        referral_code: `REF${session.user.id.slice(0, 8)}`,
      })
      .select()
      .single()

    return <DashboardWithAdvancedOffers user={session.user} profile={newProfile} />
  }

  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Account Suspended</h1>
          <p className="text-gray-400">Your account has been suspended. Contact support for assistance.</p>
        </div>
      </div>
    )
  }

  return <DashboardWithAdvancedOffers user={session.user} profile={profile} />
}
