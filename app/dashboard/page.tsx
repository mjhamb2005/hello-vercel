import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import LogoutButton from './logout-button'
import '../ui.css'

export default async function DashboardPage() {
  const supabase = await createSupabaseServer()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, profile_photo_url')
    .eq('id', user.id)
    .single()

  if (!profile?.first_name || !profile?.last_name) redirect('/profile')

  const initials = (profile.first_name[0] + profile.last_name[0]).toUpperCase()

  return (
    <main className="hv-page">
      <div className="hv-card">
        {profile.profile_photo_url ? (
          <img src={profile.profile_photo_url} alt="" className="hv-avatar" />
        ) : (
          <div className="hv-avatar">{initials}</div>
        )}
        <h1 className="hv-title">Welcome, {profile.first_name}!</h1>
        <p className="hv-subtitle">This page is only visible when you're signed in.</p>
        <div className="hv-stack">
          <a href="/profile" className="hv-button">Edit profile</a>
          <LogoutButton />
        </div>
      </div>
    </main>
  )
}