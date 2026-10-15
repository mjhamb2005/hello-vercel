import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { fontVars } from '@/lib/fonts'
import { getViewer } from '@/lib/viewer'
import TopBar from '../memes/ui/TopBar'
import ProfileForm from './profile-form'
import '../memes.css'

const PROFILE_ERRORS: Record<string, string> = {
  photo: 'Your photo didn’t upload. Try a smaller JPG or PNG.',
  save: 'Your changes didn’t save. Try again.',
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error: errorKey } = await searchParams
  const saveError = errorKey ? PROFILE_ERRORS[errorKey] ?? PROFILE_ERRORS.save : null
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, profile_photo_url')
    .eq('id', user.id)
    .single()

  const needsName = !profile?.first_name || !profile?.last_name
  const viewer = await getViewer(supabase, user)

  return (
    <main className={`c-page ${fontVars}`}>
      <TopBar user={viewer} />
      <div className="c-profile">
        <h1>{needsName ? 'Set up your profile' : 'Your profile'}</h1>
        <p>{needsName ? 'Add your name to get started.' : 'Update your name or photo.'}</p>
        {saveError && <p className="c-error c-profile-error" role="alert">{saveError}</p>}
        <div className="c-profile-card">
          <ProfileForm
            firstName={profile?.first_name ?? ''}
            lastName={profile?.last_name ?? ''}
            photoUrl={profile?.profile_photo_url ?? null}
          />
        </div>
        {viewer.isAdmin && (
          <p className="c-profile-admin">
            You’re an admin. <a href="/admin/errors">Open the Error log</a> to see problems people have run into.
          </p>
        )}
      </div>
    </main>
  )
}
