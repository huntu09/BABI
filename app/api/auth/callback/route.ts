import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  console.log("🔄 Auth callback triggered")

  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const next = requestUrl.searchParams.get("next") ?? "/"

  console.log("📊 Callback params:", {
    hasCode: !!code,
    next,
    origin: requestUrl.origin,
  })

  if (code) {
    try {
      const supabase = createRouteHandlerClient({ cookies })

      console.log("🔄 Exchanging code for session...")
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("❌ Code exchange error:", error)
        return NextResponse.redirect(`${requestUrl.origin}/?error=auth_error`)
      }

      console.log("✅ Session created successfully:", {
        hasSession: !!data.session,
        hasUser: !!data.user,
        userEmail: data.user?.email,
      })

      // Redirect to dashboard after successful auth
      return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
    } catch (error) {
      console.error("❌ Callback error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/?error=callback_error`)
    }
  }

  console.log("⚠️ No code provided, redirecting to home")
  return NextResponse.redirect(`${requestUrl.origin}${next}`)
}
