import { createClient } from "@supabase/supabase-js"

// Admin client with service role (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Service role key
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

// Admin queries that bypass RLS
export const adminQueries = {
  async getAllWithdrawals() {
    return await supabaseAdmin
      .from("withdrawals")
      .select(`
        *,
        profiles:user_id (
          email,
          username,
          balance
        )
      `)
      .order("created_at", { ascending: false })
  },

  async getAllUsers() {
    return await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false })
  },

  async updateWithdrawal(id: string, updates: any) {
    return await supabaseAdmin.from("withdrawals").update(updates).eq("id", id)
  },
}
