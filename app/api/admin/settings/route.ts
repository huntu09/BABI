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

    // Get all settings
    const { data: settings, error } = await supabase.from("system_settings").select("*").order("setting_key")

    if (error) throw error

    // Convert to key-value object
    const settingsObj = {}
    settings?.forEach((setting: any) => {
      settingsObj[setting.setting_key] = setting.setting_value
    })

    return NextResponse.json({ settings: settingsObj })
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
    const { setting_key, setting_value, description } = body

    if (!setting_key) {
      return NextResponse.json({ error: "Setting key required" }, { status: 400 })
    }

    // Get old value for logging
    const { data: oldSetting } = await supabase
      .from("system_settings")
      .select("setting_value")
      .eq("setting_key", setting_key)
      .single()

    // Upsert setting
    const { data: setting, error } = await supabase
      .from("system_settings")
      .upsert(
        {
          setting_key,
          setting_value,
          description,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "setting_key",
        },
      )
      .select()
      .single()

    if (error) throw error

    // Log admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "settings_update",
      target_type: "system_setting",
      target_id: setting.id,
      details: {
        setting_key,
        old_value: oldSetting?.setting_value,
        new_value: setting_value,
      },
    })

    return NextResponse.json({ setting, message: "Setting updated successfully" })
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
    const { action } = body

    if (action === "reset_defaults") {
      // Reset to default settings
      const defaultSettings = [
        { setting_key: "min_withdrawal_amount", setting_value: 2.0, description: "Minimum withdrawal amount in USD" },
        {
          setting_key: "max_withdrawal_amount",
          setting_value: 1000.0,
          description: "Maximum withdrawal amount in USD",
        },
        { setting_key: "referral_commission_rate", setting_value: 0.1, description: "Referral commission rate (10%)" },
        { setting_key: "daily_login_bonus", setting_value: 0.25, description: "Daily login bonus amount" },
        { setting_key: "maintenance_mode", setting_value: false, description: "Platform maintenance mode" },
        { setting_key: "allow_new_registrations", setting_value: true, description: "Allow new user registrations" },
        { setting_key: "fraud_detection_enabled", setting_value: true, description: "Enable fraud detection system" },
      ]

      for (const setting of defaultSettings) {
        await supabase.from("system_settings").upsert(
          {
            ...setting,
            updated_by: user.id,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "setting_key",
          },
        )
      }

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_id: user.id,
        action_type: "settings_reset",
        target_type: "system_setting",
        details: { action: "reset_to_defaults" },
      })

      return NextResponse.json({ message: "Settings reset to defaults successfully" })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
