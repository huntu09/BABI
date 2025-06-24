import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardRefactored from "@/components/dashboard/dashboard-refactored"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile) {
    redirect("/")
  }

  return <DashboardRefactored user={session.user} profile={profile} />
}
