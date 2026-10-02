'use client'
import { useEffect, useState } from 'react'
import { startGoogleSignIn } from '@/lib/google-auth'

export default function SignInButton() {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // If they hit Back from Google, the page can be restored with the button stuck
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) setBusy(false) }
    window.addEventListener('pageshow', onShow)
    return () => window.removeEventListener('pageshow', onShow)
  }, [])

  async function signIn() {
    setBusy(true)
    setError('')
    try {
      await startGoogleSignIn()
    } catch {
      setError('Couldn’t open Google sign-in. Try again.')
      setBusy(false)
    }
  }

  return (
    <div>
      <button className="c-btn c-btn-primary c-btn-lg" onClick={signIn} disabled={busy}>
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#fff" d="M21.6 12.23c0-.68-.06-1.36-.18-2.02H12v3.83h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.9-1.74 2.97-4.3 2.97-7.33Z" />
          <path fill="#fff" opacity=".85" d="M12 22c2.7 0 4.97-.9 6.63-2.43l-3.23-2.5c-.9.6-2.04.96-3.4.96-2.6 0-4.82-1.76-5.6-4.13H3.06v2.58A10 10 0 0 0 12 22Z" />
          <path fill="#fff" opacity=".7" d="M6.4 13.9a6 6 0 0 1 0-3.8V7.52H3.06a10 10 0 0 0 0 8.96L6.4 13.9Z" />
          <path fill="#fff" opacity=".85" d="M12 5.97c1.47 0 2.79.5 3.83 1.5l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.94 5.52L6.4 10.1C7.18 7.73 9.4 5.97 12 5.97Z" />
        </svg>
        {busy ? 'Opening Google…' : 'Sign in with Google'}
      </button>
      {error && <p className="c-error" role="alert">{error}</p>}
    </div>
  )
}