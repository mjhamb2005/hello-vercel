'use client'
import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sbBrowser } from '@/lib/sb/browser'
import { leaderOf, type Meme, type User } from '@/lib/types'
import TopBar from './ui/TopBar'
import MemeImage from './ui/MemeImage'
import { useGeneration } from './ui/Generation'
import DeleteMeme from './ui/DeleteMeme'
import { reportError } from '@/lib/report'

export default function Feed({
  initialMemes,
  scores,
  user,
  loadError,
}: {
  initialMemes: Meme[]
  scores: Record<number, number>
  user: User
  loadError: string | null
}) {
  const router = useRouter()
  const { openMaker, created, deleted, markDeleted, notify } = useGeneration()
  const [view, setView] = useState<'all' | 'mine'>('all')
  const [leaving, setLeaving] = useState<number[]>([])

  // Memes finished in the background appear at the top, even if they were started on another page.
  // Deleted memes are gone from every list, including the meme of the moment.
  const memes = useMemo(() => {
    const have = new Set(initialMemes.map((m) => m.id))
    return [...created.filter((m) => !have.has(m.id)), ...initialMemes].filter((m) => !deleted.includes(m.id))
  }, [created, initialMemes, deleted])
  const mine = memes.filter((m) => m.ownerId === user.id)

  useEffect(() => {
    if (loadError) reportError('load', loadError, { what: 'feed' })
  }, [loadError])

  useEffect(() => {
    const { data } = sbBrowser().auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') window.location.href = '/'
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // If you delete your last meme while viewing "Your memes", go back to everyone's
  useEffect(() => {
    if (view === 'mine' && mine.length === 0 && leaving.length === 0) setView('all')
  }, [view, mine.length, leaving.length])

  // Card fades out first, then the meme is removed everywhere and the page re-fetches fresh data
  const onDeleted = useCallback(
    (id: number) => {
      setLeaving((l) => [...l, id])
      notify('Meme deleted.')
      setTimeout(() => {
        markDeleted(id)
        setLeaving((l) => l.filter((x) => x !== id))
        router.refresh()
      }, 280)
    },
    [markDeleted, notify, router]
  )

  const shownList = view === 'mine' ? mine : memes
  const scored = shownList.map((m) => {
    const lead = leaderOf(m.captions, scores)
    return { meme: m, lead, score: lead ? scores[lead.id] ?? 0 : 0 }
  })
  // "Meme of the moment": the meme whose leading caption has the most votes (everyone's view only)
  const top =
    view === 'all' ? scored.reduce<(typeof scored)[number] | null>((best, s) => (s.score > (best?.score ?? 0) ? s : best), null) : null
  const rest = scored.filter((s) => s.meme.id !== top?.meme.id)
  const preview = (m: Meme, caption: string) => ({ url: m.url, caption, alt: m.description })

  return (
    <>
      <TopBar user={user} />

      <section className="c-hero">
        <div>
          <h1>Tonight’s lineup</h1>
          <p>Every photo gets five AI-written captions. Vote for the funniest, and the winner becomes the meme.</p>
        </div>
        {memes.length > 0 && <Link href="/memes/battle" className="c-btn c-btn-outline">Play Battle mode</Link>}
      </section>

      {loadError && (
        <p className="c-alert" role="alert">
          Memes couldn’t load ({loadError}). If you just set things up, run setup.sql in Supabase.
        </p>
      )}

      {!loadError && memes.length === 0 && (
        <div className="c-empty">
          <h2>The stage is empty</h2>
          <p>Upload a photo and AI writes five captions for everyone to vote on.</p>
          <button className="c-btn c-btn-primary" onClick={openMaker}>Make a meme</button>
        </div>
      )}

      {top && (
        <section className={`c-spotlight${leaving.includes(top.meme.id) ? ' is-leaving' : ''}`} aria-labelledby="spotlight-title">
          <div className="c-lit">
            <Link href={`/memes/${top.meme.id}`} className="c-spotlight-meme" aria-label="Open the meme of the moment">
              <MemeImage url={top.meme.url} caption={top.lead?.content ?? ''} alt={top.meme.description} />
            </Link>
          </div>
          <div className="c-spotlight-copy">
            <p className="c-kicker" id="spotlight-title">Meme of the moment</p>
            <p className="c-spotlight-caption">{top.lead?.content}</p>
            <p className="c-spotlight-score">
              <b>{top.score}</b> {top.score === 1 ? 'vote' : 'votes'} for the headliner
            </p>
            <div className="c-spotlight-actions">
              <Link href={`/memes/${top.meme.id}`} className="c-btn c-btn-primary">Vote on all five</Link>
              <Link href="/memes/battle" className="c-btn c-btn-outline">Battle mode</Link>
              {top.meme.ownerId === user.id && (
                <DeleteMeme memeId={top.meme.id} preview={preview(top.meme, top.lead?.content ?? '')} variant="button" onDeleted={onDeleted} />
              )}
            </div>
          </div>
        </section>
      )}

      {memes.length > 0 && (
        <div className="c-section-head">
          <div className="c-filter" role="tablist" aria-label="Which memes to show">
            <button role="tab" aria-selected={view === 'all'} className={view === 'all' ? 'is-on' : ''} onClick={() => setView('all')}>
              Everyone’s <span>{memes.length}</span>
            </button>
            <button role="tab" aria-selected={view === 'mine'} className={view === 'mine' ? 'is-on' : ''} onClick={() => setView('mine')} disabled={mine.length === 0}>
              Your memes <span>{mine.length}</span>
            </button>
          </div>
          <span>{view === 'mine' ? 'Only you can delete your memes.' : 'Newest first'}</span>
        </div>
      )}

      <section className="c-grid" aria-label={view === 'mine' ? 'Your memes' : 'Memes'}>
        {rest.map(({ meme: m, lead, score }, i) => {
          const own = m.ownerId === user.id
          return (
            <div key={m.id} className={`c-card-wrap${leaving.includes(m.id) ? ' is-leaving' : ''}`} style={{ '--i': Math.min(i, 9) } as CSSProperties}>
              <Link href={`/memes/${m.id}`} className={`c-card${m.fresh ? ' is-fresh' : ''}`}>
                <MemeImage url={m.url} caption={lead?.content ?? ''} alt={m.description} label={own ? 'Yours' : undefined} />
                <div className="c-card-foot">
                  <span>{score > 0 ? <>Top caption has <b>{score}</b> {score === 1 ? 'vote' : 'votes'}</> : 'No votes yet. Be first.'}</span>
                  <span className="c-card-cta">Vote <span aria-hidden="true">→</span></span>
                </div>
              </Link>
              {own && <DeleteMeme memeId={m.id} preview={preview(m, lead?.content ?? '')} variant="chip" onDeleted={onDeleted} />}
            </div>
          )
        })}
      </section>
    </>
  )
}
