'use client'
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { sbBrowser } from '@/lib/sb/browser'
import { leaderOf, type Meme, type User } from '@/lib/types'
import TopBar from './ui/TopBar'
import MemeImage from './ui/MemeImage'
import { useGeneration } from './ui/Generation'
import DeleteMeme from './ui/DeleteMeme'
import { reportError } from '@/lib/report'

type View = 'all' | 'new' | 'mine'

export default function Feed({
  initialMemes,
  scores,
  user,
  loadError,
  votedOn,
  initialView,
}: {
  initialMemes: Meme[]
  scores: Record<number, number>
  user: User
  loadError: string | null
  votedOn: number[]
  initialView: View
}) {
  const router = useRouter()
  const { openMaker, created, deleted, markDeleted, notify } = useGeneration()
  const [view, setViewState] = useState<View>(initialView)
  // Arriving with a different ?view= (e.g. "Your memes" from the account menu) switches the filter
  const [lastInitial, setLastInitial] = useState(initialView)
  if (lastInitial !== initialView) {
    setLastInitial(initialView)
    setViewState(initialView)
  }
  // Keep the filter in the address bar, so "Your memes" is linkable and Back/refresh keep it
  const setView = useCallback((v: View) => {
    setViewState(v)
    window.history.replaceState(null, '', v === 'all' ? '/memes' : `/memes?view=${v}`)
  }, [])
  const [leaving, setLeaving] = useState<number[]>([])

  // Memes finished in the background appear at the top, even if they were started on another page.
  // Deleted memes are gone from every list, including the meme of the moment.
  const memes = useMemo(() => {
    const have = new Set(initialMemes.map((m) => m.id))
    return [...created.filter((m) => !have.has(m.id)), ...initialMemes].filter((m) => !deleted.includes(m.id))
  }, [created, initialMemes, deleted])
  const mine = memes.filter((m) => m.ownerId === user.id)
  const voted = useMemo(() => new Set(votedOn), [votedOn])
  const unvoted = memes.filter((m) => !voted.has(m.id) && m.ownerId !== user.id)

  useEffect(() => {
    if (loadError) reportError('load', loadError, { what: 'feed' })
  }, [loadError])

  useEffect(() => {
    const { data } = sbBrowser().auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') window.location.href = '/'
    })
    return () => data.subscription.unsubscribe()
  }, [])


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

  const shownList = view === 'mine' ? mine : view === 'new' ? unvoted : memes
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
        {memes.length > 0 && (
          <div className="c-hero-actions">
            {unvoted.length > 0 && (
              <Link href={`/memes/${unvoted[0].id}`} className="c-btn c-btn-outline">Vote on a new one</Link>
            )}
            <Link href="/memes/battle" className="c-btn c-btn-outline">Play Battle mode</Link>
          </div>
        )}
      </section>

      <Guide onMake={openMaker} firstUnvoted={unvoted[0]?.id ?? memes[0]?.id ?? null} />

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
              <em className="c-long">Everyone’s</em><em className="c-short">All</em> <span>{memes.length}</span>
            </button>
            <button role="tab" aria-selected={view === 'new'} className={view === 'new' ? 'is-on' : ''} onClick={() => setView('new')}>
              <em className="c-long">Not voted yet</em><em className="c-short">To vote</em> <span>{unvoted.length}</span>
            </button>
            <button role="tab" aria-selected={view === 'mine'} className={view === 'mine' ? 'is-on' : ''} onClick={() => setView('mine')}>
              <em className="c-long">Your memes</em><em className="c-short">Mine</em> <span>{mine.length}</span>
            </button>
          </div>
          <span>{view === 'mine' ? 'Only you can delete your memes.' : view === 'new' ? 'Photos you haven’t judged yet' : 'Newest first'}</span>
        </div>
      )}

      {memes.length > 0 && view === 'new' && unvoted.length === 0 && (
        <div className="c-empty">
          <h2>You’ve judged them all</h2>
          <p>Every photo here has your vote. Make a new one, or see which captions are winning.</p>
          <div className="c-actions" style={{ justifyContent: 'center' }}>
            <button className="c-btn c-btn-primary" onClick={openMaker}>Make a meme</button>
            <Link href="/memes/top" className="c-btn c-btn-outline">Top captions</Link>
          </div>
        </div>
      )}
      {memes.length > 0 && view === 'mine' && mine.length === 0 && (
        <div className="c-empty">
          <h2>You haven’t made a meme yet</h2>
          <p>Upload any photo and AI writes five captions for everyone to vote on.</p>
          <button className="c-btn c-btn-primary" onClick={openMaker}>Make your first meme</button>
        </div>
      )}

      <section className="c-grid" aria-label={view === 'mine' ? 'Your memes' : view === 'new' ? 'Memes you haven’t voted on' : 'Memes'}>
        {rest.map(({ meme: m, lead, score }, i) => {
          const own = m.ownerId === user.id
          return (
            <div key={m.id} className={`c-card-wrap${leaving.includes(m.id) ? ' is-leaving' : ''}`} style={{ '--i': Math.min(i, 9) } as CSSProperties}>
              <Link href={`/memes/${m.id}`} className={`c-card${m.fresh ? ' is-fresh' : ''}`}>
                <MemeImage url={m.url} caption={lead?.content ?? ''} alt={m.description} label={own ? 'Yours' : voted.has(m.id) ? 'Voted ✓' : undefined} />
                <div className="c-card-foot">
                  <span>{score > 0 ? <>Top caption has <b>{score}</b> {score === 1 ? 'vote' : 'votes'}</> : 'No votes yet. Be first.'}</span>
                  <span className="c-card-cta">{voted.has(m.id) || own ? 'Open' : 'Vote'} <span aria-hidden="true">→</span></span>
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


// Remembers (in this browser) that the guide was dismissed
const guideListeners = new Set<() => void>()
const guideStore = {
  get: () => { try { return localStorage.getItem('cc_guide_done') === '1' } catch { return true } },
  set: () => { try { localStorage.setItem('cc_guide_done', '1') } catch {} guideListeners.forEach((l) => l()) },
  subscribe: (l: () => void) => { guideListeners.add(l); return () => { guideListeners.delete(l) } },
}

// First visit only: three steps that show how Caption Club works, each one a button that does it.
// Dismissed for good once closed (remembered in this browser).
function Guide({ onMake, firstUnvoted }: { onMake: () => void; firstUnvoted: number | null }) {
  const done = useSyncExternalStore(guideStore.subscribe, guideStore.get, () => true)
  if (done) return null
  const close = () => guideStore.set()
  return (
    <section className="c-guide" aria-labelledby="guide-title">
      <div className="c-guide-head">
        <h2 id="guide-title">New here? It takes three steps.</h2>
        <button className="c-x" onClick={close} aria-label="Hide this guide">×</button>
      </div>
      <ol>
        <li>
          <b>1</b>
          <div><strong>Upload a photo</strong><span>AI describes it, then writes five captions. It runs in the corner while you browse.</span></div>
          <button className="c-btn c-btn-primary c-btn-sm" onClick={onMake}>Make a meme</button>
        </li>
        <li>
          <b>2</b>
          <div><strong>Vote on captions</strong><span>Up the funny ones, down the duds. The top caption becomes the meme.</span></div>
          {firstUnvoted && <Link href={`/memes/${firstUnvoted}`} className="c-btn c-btn-outline c-btn-sm">Try voting</Link>}
        </li>
        <li>
          <b>3</b>
          <div><strong>Go head to head</strong><span>Battle mode shows two captions at a time. Pick the funnier one.</span></div>
          <Link href="/memes/battle" className="c-btn c-btn-outline c-btn-sm">Play Battle</Link>
        </li>
      </ol>
      <button className="c-link-btn c-guide-done" onClick={close}>Got it, don’t show this again</button>
    </section>
  )
}
