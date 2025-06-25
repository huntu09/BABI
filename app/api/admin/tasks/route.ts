import { type NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Check if user is admin
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

    // Get all tasks
    const { data: tasks, error } = await supabase.from("tasks").select("*").order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json({ tasks })
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
    const {
      title,
      description,
      reward_amount,
      task_type,
      provider,
      requirements,
      daily_limit,
      total_limit,
      countries,
      devices,
      url,
      image_url,
      difficulty,
      estimated_time,
    } = body

    // Create new task
    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title,
        description,
        reward_amount,
        task_type,
        provider,
        requirements: requirements || {},
        daily_limit,
        total_limit,
        countries: countries || [],
        devices: devices || [],
        url,
        image_url,
        difficulty: difficulty || "easy",
        estimated_time: estimated_time || "10 minutes",
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "task_create",
      target_type: "task",
      target_id: task.id,
      details: { task_title: title, reward_amount },
      ip_address: request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip"),
    })

    return NextResponse.json({ task, message: "Task created successfully" })
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
    const { taskId, action, ...updateData } = body

    if (action === "toggle_active") {
      const { data: task, error } = await supabase
        .from("tasks")
        .update({ is_active: updateData.is_active })
        .eq("id", taskId)
        .select()
        .single()

      if (error) throw error

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "task_toggle",
        target_type: "task",
        target_id: taskId,
        details: { is_active: updateData.is_active },
      })

      return NextResponse.json({ task, message: `Task ${updateData.is_active ? "activated" : "deactivated"}` })
    }

    // Update task
    const { data: task, error } = await supabase
      .from("tasks")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "task_update",
      target_type: "task",
      target_id: taskId,
      details: updateData,
    })

    return NextResponse.json({ task, message: "Task updated successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const taskId = searchParams.get("taskId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    // Get task details before deletion
    const { data: task } = await supabase.from("tasks").select("title").eq("id", taskId).single()

    // Delete task
    const { error } = await supabase.from("tasks").delete().eq("id", taskId)

    if (error) throw error

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "task_delete",
      target_type: "task",
      target_id: taskId,
      details: { task_title: task?.title },
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
