import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

export const SESSION_COOKIE = '__fimihub_session'

export interface SessionUser {
  id: string
  email: string
}

function getSecret() {
  const raw = process.env.SESSION_SECRET || 'fallback-dev-secret-change-in-production'
  return new TextEncoder().encode(raw)
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ sub: user.id, email: user.email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub || !payload.email) return null
    return { id: payload.sub, email: payload.email as string }
  } catch {
    return null
  }
}

/** For use in Server Components and Server Actions (requires cookies() from next/headers) */
export async function getUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

/** For use in API route handlers (NextRequest) */
export async function getUserFromRequest(req: NextRequest): Promise<SessionUser | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

export function buildSessionCookie(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
}
