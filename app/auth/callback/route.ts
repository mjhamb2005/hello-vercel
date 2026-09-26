import { NextResponse } from 'next/server'
import { createSupabaseServer } from '@/lib/supabase-server'

// Google sends the ID token here after the user logs in
export async function POST(request: Request) {
  const origin = new URL(request.url).origin
  const formData = await request.formData()
  const idToken = formData.get('credential')

  if (typeof idToken === 'string') {
    const supabase = await createSupabaseServer()
    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    })

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`, 303)
    }
    console.error('Login error:', error.message)
  }

  return NextResponse.redirect(`${origin}/login?error=auth`, 303)
}