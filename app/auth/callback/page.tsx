'use client'
import { useEffect, useRef } from 'react'
import { sbBrowser } from '@/lib/sb/browser'
import { reportThenContinue } from '@/lib/report'
import { takeGoogleSession } from '@/lib/google-auth'

// Google sends the user back here with an ID token in the URL fragment.
// We verify it came from our own sign-in, hand it to Supabase, then continue.
export default function AuthCallback() {
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const go = (path: string) => window.location.replace(path)

    const run = async () => {
      const hash = new URLSearchParams(window.location.hash.slice(1))
      const query = new URLSearchParams(window.location.search)
      window.history.replaceState(null, '', '/auth/callback') // never leave the token in the address bar

      const err = hash.get('error') || query.get('error')
      if (err && err !== 'access_denied') await reportThenContinue('sign_in', `Google returned: ${err}`)
      if (err) return go(`/?error=${err === 'access_denied' ? 'cancelled' : 'auth'}`)

      const supabase = sbBrowser()
      const idToken = hash.get('id_token')

      // Back button or refresh on this page: no token, but maybe already signed in
      if (!idToken) {
        const { data } = await supabase.auth.getUser()
        return go(data.user ? '/auth/continue' : '/?error=auth')
      }

      const saved = takeGoogleSession()
      if (!saved || saved.state !== hash.get('state')) {
        await reportThenContinue('sign_in', 'Sign-in state didn’t match (expired or opened in another tab)')
        return go('/?error=auth')
      }

      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce: saved.nonce })
      if (error) {
        // The database's sign-up gate (allowed domains / whitelisted emails) blocks new accounts it doesn't know
        if (/signup_not_allowed|Database error saving new user/i.test(error.message)) return go('/?error=not_allowed')
        console.error('Supabase sign-in failed:', error.message)
        await reportThenContinue('sign_in', `Supabase sign-in failed: ${error.message}`)
        return go('/?error=auth')
      }
      go('/auth/continue')
    }

    run().catch(async (e) => {
      await reportThenContinue('sign_in', e)
      go('/?error=auth')
    })
  }, [])

  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F2F1EC', color: '#141414', fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ fontSize: 18 }} role="status">Signing you in…</p>
    </main>
  )
}