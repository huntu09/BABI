import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import DashboardWithNotifications from "@/components/dashboard-with-notifications"

export default async function DashboardNotificationsPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  return <DashboardWithNotifications user={session.user} profile={profile} />
}
