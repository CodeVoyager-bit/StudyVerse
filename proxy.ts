import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Server-side guard for signed-in-only routes (see `config.matcher`).
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = `?next=${encodeURIComponent(request.nextUrl.pathname)}`
    return NextResponse.redirect(url)
  }
  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*', '/task/:path*', '/note/:path*', '/pomodoro/:path*', '/planner/:path*', '/gpa/:path*', '/quotes/:path*',
    '/subjects/:path*', '/resources/:path*', '/flashcards/:path*', '/attendance/:path*', '/exams/:path*',
    '/groups/:path*', '/more/:path*', '/settings/:path*',
  ],
}
