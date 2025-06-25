import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    // Get badges with earned count
    const { data: badges, error } = await supabase
      .from("badges")
      .select(`
        *,
        user_badges(count)
      `)
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ badges })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description, icon, requirement_type, requirement_value, reward_amount } = body

    // Create new badge
    const { data: badge, error } = await supabase
      .from("badges")
      .insert({
        name,
        description,
        icon,
        requirement_type,
        requirement_value,
        reward_amount: reward_amount || 0,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "badge_create",
      target_type: "badge",
      target_id: badge.id,
      details: { badge_name: name, requirement_type, requirement_value },
    })

    return NextResponse.json({ badge, message: "Badge created successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check admin
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single()

    if (!profile?.is_admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 })
    }

    const body = await request.json()
    const { badgeId, action, ...updateData } = body

    if (action === "toggle_active") {
      const { data: badge, error } = await supabase
        .from("badges")
        .update({ is_active: updateData.is_active })
        .eq("id", badgeId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "badge_toggle",
        target_type: "badge",
        target_id: badgeId,
        details: { is_active: updateData.is_active },
      })

      return NextResponse.json({ badge, message: `Badge ${updateData.is_active ? "activated" : "deactivated"}` })
    }

    // Update badge
    const { data: badge, error } = await supabase.from("badges").update(updateData).eq("id", badgeId).select().single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "badge_update",
      target_type: "badge",
      target_id: badgeId,
      details: updateData,
    })

    return NextResponse.json({ badge, message: "Badge updated successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
