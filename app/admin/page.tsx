import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import AdminDashboard from "@/components/admin-dashboard"

// Force dynamic rendering
export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function AdminPage() {
  const supabase = createServerComponentClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    redirect("/")
  }

  // Check if user is admin
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", session.user.id).single()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  return <AdminDashboard />
}
