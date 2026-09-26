'use client'

import Script from 'next/script'
import '../ui.css'

const GOOGLE_CLIENT_ID =
  '163865727892-6ckvnstnnmofo5moae58dllfmfrd2jbv.apps.googleusercontent.com'

declare global {
  interface Window {
    google: any
  }
}

export default function LoginPage() {
  function setupGoogleButton() {
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      ux_mode: 'redirect',
      login_uri: `${window.location.origin}/auth/callback`,
    })
    window.google.accounts.id.renderButton(
      document.getElementById('google-button'),
      { theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 280 }
    )
  }

  return (
    <main className="hv-page">
      <div className="hv-card">
        <h1 className="hv-title">Welcome</h1>
        <p className="hv-subtitle">Sign in to see your dashboard and profile.</p>
        <div id="google-button" className="hv-google" />
      </div>
      <Script src="https://accounts.google.com/gsi/client" onReady={setupGoogleButton} />
    </main>
  )
}