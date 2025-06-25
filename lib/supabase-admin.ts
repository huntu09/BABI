import { createClient } from "@supabase/supabase-js"

// Service role client - bypasses ALL RLS
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export const adminQueries = {
  // Get all users - bypasses RLS
  async getAllUsers() {
    const { data, error } = await supabaseAdmin.from("profiles").select("*").order("created_at", { ascending: false })

    return { data, error }
  },

  // Get all withdrawals with user info - bypasses RLS
  async getAllWithdrawals() {
    const { data, error } = await supabaseAdmin
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

    return { data, error }
  },

  // Get all transactions - bypasses RLS
  async getAllTransactions() {
    const { data, error } = await supabaseAdmin
      .from("transactions")
      .select(`
        *,
        profiles:user_id (
          email,
          username
        )
      `)
      .order("created_at", { ascending: false })
      .limit(100)

    return { data, error }
  },

  // Update withdrawal status
  async updateWithdrawal(id: string, updates: any) {
    const { data, error } = await supabaseAdmin.from("withdrawals").update(updates).eq("id", id).select()

    return { data, error }
  },
}
