import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardWithGamification from "@/components/dashboard-with-gamification"

export default async function DashboardGamificationPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Fetch user profile with gamification data
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      *,
      user_levels(*),
      user_badges(*),
      user_stats(*)
    `)
    .eq("id", session.user.id)
    .single()

  return <DashboardWithGamification user={session.user} profile={profile} />
}
