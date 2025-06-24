"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// Custom hook for optimized data fetching with caching
export function useOptimizedProfile(userId: string) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Only create supabase client on client side
  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null
    return createClientComponentClient()
  }, [])

  const fetchProfile = useCallback(async () => {
    if (!supabase || !userId) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, email, points, total_earned, referral_code, is_admin, is_banned")
        .eq("id", userId)
        .single()

      if (error) throw error
      setProfile(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  useEffect(() => {
    if (userId && supabase) {
      fetchProfile()
    }
  }, [userId, fetchProfile, supabase])

  const memoizedProfile = useMemo(() => profile, [profile])

  return {
    profile: memoizedProfile,
    loading,
    error,
    refetch: fetchProfile,
  }
}

// Optimized tasks hook
export function useOptimizedTasks(limit = 20) {
  const [tasks, setTasks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)

  const supabase = useMemo(() => {
    if (typeof window === "undefined") return null
    return createClientComponentClient()
  }, [])

  const fetchTasks = useCallback(
    async (offset = 0, reset = false) => {
      if (!supabase) return

      try {
        if (reset) setLoading(true)

        const { data, error } = await supabase
          .from("tasks")
          .select("id, title, description, provider, points, difficulty, estimated_time, url")
          .eq("is_active", true)
          .order("points", { ascending: false })
          .range(offset, offset + limit - 1)

        if (error) throw error

        if (reset) {
          setTasks(data || [])
        } else {
          setTasks((prev) => [...prev, ...(data || [])])
        }

        setHasMore((data?.length || 0) === limit)
      } catch (err) {
        console.error("Error fetching tasks:", err)
      } finally {
        setLoading(false)
      }
    },
    [limit, supabase],
  )

  useEffect(() => {
    if (supabase) {
      fetchTasks(0, true)
    }
  }, [fetchTasks, supabase])

  const loadMore = useCallback(() => {
    if (!loading && hasMore && supabase) {
      fetchTasks(tasks.length)
    }
  }, [fetchTasks, loading, hasMore, tasks.length, supabase])

  return { tasks, loading, hasMore, loadMore, refetch: () => fetchTasks(0, true) }
}
