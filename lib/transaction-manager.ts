import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { CreateTransactionData, Transaction, TransactionType, BalanceValidation } from "@/types"

export class TransactionManager {
  private supabase = createClientComponentClient()

  /**
   * 🔥 Create a transaction record with proper validation
   */
  async createTransaction(data: CreateTransactionData): Promise<Transaction | null> {
    try {
      console.log("💰 Creating transaction:", data)

      // Validate transaction data
      if (!data.user_id || !data.type || data.amount === undefined) {
        throw new Error("Missing required transaction fields")
      }

      // Validate transaction type
      const validTypes: TransactionType[] = [
        "earn",
        "withdraw",
        "bonus",
        "refund",
        "referral",
        "daily_bonus",
        "task_completion",
        "offerwall_completion",
        "offerwall_reversal",
        "admin_adjustment",
        "withdraw_pending",
        "admin_test",
        "balance_audit",
      ]

      if (!validTypes.includes(data.type)) {
        throw new Error(`Invalid transaction type: ${data.type}`)
      }

      // Create transaction
      const { data: transaction, error } = await this.supabase
        .from("transactions")
        .insert({
          user_id: data.user_id,
          type: data.type,
          amount: data.amount,
          description: data.description || null,
          reference_id: data.reference_id || null,
          reference_type: data.reference_type || null,
        })
        .select()
        .single()

      if (error) {
        console.error("❌ Transaction creation error:", error)
        throw error
      }

      console.log("✅ Transaction created:", transaction.id)
      return transaction as Transaction
    } catch (error) {
      console.error("❌ TransactionManager.createTransaction error:", error)
      return null
    }
  }

  /**
   * 🔥 Get user transactions with filtering
   */
  async getUserTransactions(
    userId: string,
    options: {
      type?: TransactionType
      limit?: number
      offset?: number
      startDate?: string
      endDate?: string
    } = {},
  ): Promise<Transaction[]> {
    try {
      let query = this.supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })

      if (options.type) {
        query = query.eq("type", options.type)
      }

      if (options.startDate) {
        query = query.gte("created_at", options.startDate)
      }

      if (options.endDate) {
        query = query.lte("created_at", options.endDate)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      return (data || []) as Transaction[]
    } catch (error) {
      console.error("❌ getUserTransactions error:", error)
      return []
    }
  }

  /**
   * 🔥 Calculate user balance from transactions
   */
  async calculateUserBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await this.supabase.from("transactions").select("amount").eq("user_id", userId)

      if (error) throw error

      const totalAmount = (data || []).reduce((sum, transaction) => {
        return sum + Number(transaction.amount)
      }, 0)

      return Number(totalAmount.toFixed(2))
    } catch (error) {
      console.error("❌ calculateUserBalance error:", error)
      return 0
    }
  }

  /**
   * 🔥 Validate balance consistency between profile and transactions
   */
  async validateUserBalance(userId: string): Promise<BalanceValidation> {
    try {
      // Get profile balance
      const { data: profile, error: profileError } = await this.supabase
        .from("profiles")
        .select("balance")
        .eq("id", userId)
        .single()

      if (profileError) throw profileError

      // Calculate balance from transactions
      const calculatedBalance = await this.calculateUserBalance(userId)
      const profileBalance = Number(profile.balance)

      // Get last transaction date
      const { data: lastTransaction } = await this.supabase
        .from("transactions")
        .select("created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      const difference = Number((profileBalance - calculatedBalance).toFixed(2))
      const isConsistent = Math.abs(difference) < 0.01 // Allow 1 cent difference for rounding

      return {
        profile_balance: profileBalance,
        calculated_balance: calculatedBalance,
        difference,
        is_consistent: isConsistent,
        last_transaction_date: lastTransaction?.created_at,
      }
    } catch (error) {
      console.error("❌ validateUserBalance error:", error)
      return {
        profile_balance: 0,
        calculated_balance: 0,
        difference: 0,
        is_consistent: false,
      }
    }
  }

  /**
   * 🔥 Get transaction statistics
   */
  async getTransactionStats(
    userId: string,
    days = 30,
  ): Promise<{
    totalEarned: number
    totalWithdrawn: number
    totalBonuses: number
    transactionCount: number
    avgTransactionAmount: number
  }> {
    try {
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)

      const { data, error } = await this.supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", userId)
        .gte("created_at", startDate.toISOString())

      if (error) throw error

      const transactions = data || []

      const stats = transactions.reduce(
        (acc, transaction) => {
          const amount = Number(transaction.amount)

          if (transaction.type === "withdraw" || transaction.type === "withdraw_pending") {
            acc.totalWithdrawn += Math.abs(amount)
          } else if (transaction.type === "daily_bonus" || transaction.type === "bonus") {
            acc.totalBonuses += amount
          } else if (amount > 0) {
            acc.totalEarned += amount
          }

          acc.transactionCount++
          acc.totalAmount += Math.abs(amount)

          return acc
        },
        {
          totalEarned: 0,
          totalWithdrawn: 0,
          totalBonuses: 0,
          transactionCount: 0,
          totalAmount: 0,
        },
      )

      return {
        totalEarned: Number(stats.totalEarned.toFixed(2)),
        totalWithdrawn: Number(stats.totalWithdrawn.toFixed(2)),
        totalBonuses: Number(stats.totalBonuses.toFixed(2)),
        transactionCount: stats.transactionCount,
        avgTransactionAmount:
          stats.transactionCount > 0 ? Number((stats.totalAmount / stats.transactionCount).toFixed(2)) : 0,
      }
    } catch (error) {
      console.error("❌ getTransactionStats error:", error)
      return {
        totalEarned: 0,
        totalWithdrawn: 0,
        totalBonuses: 0,
        transactionCount: 0,
        avgTransactionAmount: 0,
      }
    }
  }

  /**
   * 🔥 Create earning transaction (positive amount)
   */
  async createEarningTransaction(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<Transaction | null> {
    return this.createTransaction({
      user_id: userId,
      type,
      amount: Math.abs(amount), // Ensure positive
      description,
      reference_id: referenceId,
      reference_type: referenceType as any,
    })
  }

  /**
   * 🔥 Create spending transaction (negative amount)
   */
  async createSpendingTransaction(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
    referenceType?: string,
  ): Promise<Transaction | null> {
    return this.createTransaction({
      user_id: userId,
      type,
      amount: -Math.abs(amount), // Ensure negative
      description,
      reference_id: referenceId,
      reference_type: referenceType as any,
    })
  }
}

// Singleton instance
export const transactionManager = new TransactionManager()
