'use client'
import { sbBrowser } from './sb/browser'

// What the user was doing when it broke. Shown as filters on the Error log page.
export type ErrorAction =
  | 'upload' | 'describe' | 'captions' | 'vote' | 'battle_pick' | 'delete' | 'download'
  | 'sign_in' | 'profile' | 'crash' | 'load'

// Records an error in the app_errors table so it shows up on /admin/errors.
// Fire-and-forget: reporting must never break the app or show its own error.
const recent = new Map<string, number>()
export function reportError(action: ErrorAction, error: unknown, details?: Record<string, unknown>): Promise<void> {
  try {
    if (typeof window === 'undefined') return Promise.resolve()
    const message = (error instanceof Error ? error.message : typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown error'
    if (message === 'AUTH') return Promise.resolve() // expired sessions are handled by sending people to sign in again

    // Don't log the same error twice within 10 seconds (e.g. a crash loop)
    const key = `${action}:${message}`
    const now = Date.now()
    if (now - (recent.get(key) ?? 0) < 10_000) return Promise.resolve()
    recent.set(key, now)

    const supabase = sbBrowser()
    return (async () => {
      const { data } = await supabase.auth.getUser()
      await supabase.from('app_errors').insert({
        user_id: data.user?.id ?? null,
        user_email: data.user?.email ?? null,
        page: window.location.pathname,
        action,
        message: message.slice(0, 1000),
        details: { ...(details ?? {}), stack: error instanceof Error ? error.stack?.slice(0, 2000) : undefined },
        user_agent: navigator.userAgent.slice(0, 300),
      })
    })().catch(() => {})
  } catch {
    return Promise.resolve() // never throw from the reporter
  }
}

// For pages that leave right after an error: wait for the report, but never more than 1.5 seconds
export function reportThenContinue(action: ErrorAction, error: unknown, details?: Record<string, unknown>) {
  return Promise.race([reportError(action, error, details), new Promise<void>((r) => setTimeout(r, 1500))])
}
