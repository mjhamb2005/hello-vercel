import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase-server'
import { fontVars } from '@/lib/fonts'
import { getViewer } from '@/lib/viewer'
import Link from 'next/link'
import TopBar from '../memes/ui/TopBar'
import ProfileForm from './profile-form'
import '../memes.css'

const PROFILE_ERRORS: Record<string, string> = {
  photo: 'Your photo didn’t upload. Try a smaller JPG or PNG.',
  save: 'Your changes didn’t save. Try again.',
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { error: errorKey, saved } = await searchParams
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

  // Your activity: memes made, votes cast, and the best-scoring caption on one of your photos
  const [myMemesRes, myVotesRes, scoresRes] = await Promise.all([
    supabase.from('meme_images').select('id, meme_captions(id, content)').eq('user_id', user.id),
    supabase.from('meme_votes').select('caption_id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.rpc('meme_caption_scores'),
  ])
  const myMemes: any[] = myMemesRes.data ?? []
  const scoreById = new Map(((scoresRes.data as any[]) ?? []).map((s) => [Number(s.caption_id), Number(s.score)]))
  let best: { memeId: number; content: string; score: number } | null = null
  for (const m of myMemes) {
    for (const c of m.meme_captions ?? []) {
      const sc = scoreById.get(c.id) ?? 0
      if (sc > 0 && (!best || sc > best.score)) best = { memeId: m.id, content: c.content, score: sc }
    }
  }
  const votesCast = myVotesRes.count ?? 0

  return (
    <main className={`c-page ${fontVars}`}>
      <TopBar user={viewer} />
      <div className="c-profile">
        <h1>{needsName ? 'Set up your profile' : 'Your profile'}</h1>
        <p>{needsName ? 'Add your name to get started.' : 'Update your name or photo.'}</p>
        {saveError && <p className="c-error c-profile-error" role="alert">{saveError}</p>}
        {saved && !saveError && <p className="c-saved" role="status">Saved. Your new name and photo show everywhere now.</p>}
        <div className="c-profile-card">
          <ProfileForm
            firstName={profile?.first_name ?? ''}
            lastName={profile?.last_name ?? ''}
            photoUrl={profile?.profile_photo_url ?? null}
            firstTime={needsName}
          />
        </div>

        {!needsName && (
          <section className="c-stats" aria-labelledby="stats-title">
            <h2 id="stats-title">Your activity</h2>
            <div className="c-stat-grid">
              <div><b>{myMemes.length}</b><span>{myMemes.length === 1 ? 'meme made' : 'memes made'}</span></div>
              <div><b>{votesCast}</b><span>{votesCast === 1 ? 'vote cast' : 'votes cast'}</span></div>
            </div>
            {best ? (
              <Link href={`/memes/${best.memeId}`} className="c-best">
                <small>Your photo’s funniest caption · {best.score} {best.score === 1 ? 'vote' : 'votes'}</small>
                <span>“{best.content}”</span>
              </Link>
            ) : (
              <p className="c-stats-note">
                {myMemes.length ? 'None of your memes has an upvoted caption yet. Share them around.' : 'Make a meme and the best caption on it shows up here.'}
              </p>
            )}
            <div className="c-actions">
              <Link href="/memes?view=mine" className="c-btn c-btn-outline c-btn-sm">See your memes</Link>
              <Link href="/memes?view=new" className="c-btn c-btn-quiet c-btn-sm">Vote on new ones →</Link>
            </div>
          </section>
        )}
        {viewer.isAdmin && (
          <p className="c-profile-admin">
            You’re an admin. <Link href="/admin/errors">Open the Error log</Link> to see problems people have run into.
          </p>
        )}
      </div>
    </main>
  )
}
