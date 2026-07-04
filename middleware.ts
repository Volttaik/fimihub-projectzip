import { jwtVerify } from 'jose'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_COOKIE = '__fimihub_session'

function getSecret() {
  return new TextEncoder().encode(process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production')
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  let authenticated = false

  if (token) {
    try {
      await jwtVerify(token, getSecret())
      authenticated = true
    } catch {
      // invalid or expired token
    }
  }

  const protectedRoutes = ['/dashboard', '/post', '/credits']
  const isProtected = protectedRoutes.some(r => request.nextUrl.pathname.startsWith(r))

  if (isProtected && !authenticated) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
