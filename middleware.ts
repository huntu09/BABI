import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const pathname = request.nextUrl.pathname

  // Skip auth for callback endpoints (external providers)
  if (pathname.startsWith("/api/offerwall/callback/")) {
    console.log(`🔍 Skipping auth for callback: ${pathname}`)
    return res
  }

  // Skip auth for other public API routes
  const publicRoutes = ["/api/auth/callback", "/api/verify-email"]

  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return res
  }

  const supabase = createMiddlewareClient({ req: request, res })

  // Check auth for protected routes
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log(`🔍 Middleware check: {
  path: '${pathname}',
  hasSession: ${!!session},
  userEmail: '${session?.user?.email || "none"}'
}`)

    if (!session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
