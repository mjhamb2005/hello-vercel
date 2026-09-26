import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import ProfileForm from './profile-form'
import '../ui.css'

export default async function ProfilePage() {
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

  const needsName = !profile?.first_name || !profile?.last_name

  return (
    <main className="hv-page">
      <div className="hv-card">
        <h1 className="hv-title">{needsName ? 'Set up your profile' : 'Your profile'}</h1>
        <p className="hv-subtitle">
          {needsName ? 'Add your name to get started.' : 'Update your name or photo.'}
        </p>
        <ProfileForm
          firstName={profile?.first_name ?? ''}
          lastName={profile?.last_name ?? ''}
          photoUrl={profile?.profile_photo_url ?? null}
        />
        {!needsName && (
          <a href="/dashboard" className="hv-back">← Back to dashboard</a>
        )}
      </div>
    </main>
  )
}