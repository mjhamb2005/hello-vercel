import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { fontVars } from '@/lib/fonts'
import TopBar from '../memes/ui/TopBar'
import ProfileForm from './profile-form'
import '../memes.css'

export default async function ProfilePage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, profile_photo_url')
    .eq('id', user.id)
    .single()

  const needsName = !profile?.first_name || !profile?.last_name
  const meta = user.user_metadata ?? {}

  return (
    <main className={`c-page ${fontVars}`}>
      <TopBar user={{ id: user.id, name: meta.full_name ?? meta.name ?? '', avatar: meta.avatar_url ?? meta.picture ?? null }} />
      <div className="c-profile">
        <h1>{needsName ? 'Set up your profile' : 'Your profile'}</h1>
        <p>{needsName ? 'Add your name to get started.' : 'Update your name or photo.'}</p>
        <div className="c-profile-card">
          <ProfileForm
            firstName={profile?.first_name ?? ''}
            lastName={profile?.last_name ?? ''}
            photoUrl={profile?.profile_photo_url ?? null}
          />
        </div>
      </div>
    </main>
  )
}
