'use client'
import { useEffect, useMemo, type CSSProperties } from 'react'
import Link from 'next/link'
import { sbBrowser } from '@/lib/sb/browser'
import { leaderOf, type Meme, type User } from '@/lib/types'
import TopBar from './ui/TopBar'
import MemeImage from './ui/MemeImage'
import { useGeneration } from './ui/Generation'

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
  const { openMaker, created } = useGeneration()
  // Memes finished in the background appear at the top, even if they were started on another page
  const memes = useMemo(() => {
    const have = new Set(initialMemes.map((m) => m.id))
    return [...created.filter((m) => !have.has(m.id)), ...initialMemes]
  }, [created, initialMemes])

  useEffect(() => {
    const { data } = sbBrowser().auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') window.location.href = '/'
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // "Meme of the moment": the meme whose leading caption has the most votes
  const scored = memes.map((m) => {
    const lead = leaderOf(m.captions, scores)
    return { meme: m, lead, score: lead ? scores[lead.id] ?? 0 : 0 }
  })
  const top = scored.reduce<(typeof scored)[number] | null>((best, s) => (s.score > (best?.score ?? 0) ? s : best), null)
  const rest = scored.filter((s) => s.meme.id !== top?.meme.id)

  return (
    <>
      <TopBar user={user} />

      <section className="c-hero">
        <h1>Vote on the funniest caption.</h1>
        <p>Every photo gets five AI-written captions. The crowd decides which one becomes the meme.</p>
      </section>

      {loadError && (
        <p className="c-alert" role="alert">
          Memes couldn’t load ({loadError}). If you just set things up, run setup.sql in Supabase.
        </p>
      )}

      {!loadError && memes.length === 0 && (
        <div className="c-empty">
          <h2>Start the first meme</h2>
          <p>Upload a photo and AI will write five captions for everyone to vote on.</p>
          <button className="c-btn c-btn-primary" onClick={openMaker}>Make a meme</button>
        </div>
      )}

      {top && (
        <section className="c-spotlight" aria-labelledby="spotlight-title">
          <Link href={`/memes/${top.meme.id}`} className="c-spotlight-meme" aria-label="Open the meme of the moment">
            <MemeImage url={top.meme.url} caption={top.lead?.content ?? ''} alt={top.meme.description} />
          </Link>
          <div className="c-spotlight-copy">
            <p className="c-kicker" id="spotlight-title">Meme of the moment</p>
            <p className="c-spotlight-caption">“{top.lead?.content}”</p>
            <p className="c-spotlight-score">
              <b>{top.score}</b> {top.score === 1 ? 'vote' : 'votes'} ahead of the pack
            </p>
            <Link href={`/memes/${top.meme.id}`} className="c-btn c-btn-primary">Vote on this one</Link>
          </div>
        </section>
      )}

      {rest.length > 0 && (
        <div className="c-section-head">
          <h2>Latest</h2>
          <span>{memes.length} {memes.length === 1 ? 'meme' : 'memes'}</span>
        </div>
      )}

      <section className="c-grid" aria-label="Memes">
        {rest.map(({ meme: m, lead, score }, i) => (
          <Link
            key={m.id}
            href={`/memes/${m.id}`}
            className={`c-card${m.fresh ? ' is-fresh' : ''}`}
            style={{ '--i': Math.min(i, 9) } as CSSProperties}
          >
            <MemeImage url={m.url} caption={lead?.content ?? ''} alt={m.description} />
            <div className="c-card-foot">
              <span>{score > 0 ? `Leading caption: ${score} ${score === 1 ? 'vote' : 'votes'}` : 'No votes yet'}</span>
              <span className="c-card-cta">Vote <span aria-hidden="true">→</span></span>
            </div>
          </Link>
        ))}
      </section>

    </>
  )
}