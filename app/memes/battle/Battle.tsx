'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { sbBrowser } from '@/lib/sb/browser'
import type { Caption, Meme, User } from '@/lib/types'
import TopBar from '../ui/TopBar'
import MemeImage from '../ui/MemeImage'
import { reauth } from '../ui/MakeMemeDialog'

type Round = { meme: Meme; a: Caption; b: Caption }

function shuffle<T>(list: T[]) {
  const out = [...list]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// One round per photo. Prefer captions you haven't voted on yet, so every battle teaches us something new.
function buildRounds(memes: Meme[], votes: Record<number, number>): Round[] {
  return shuffle(memes).map((meme) => {
    const fresh = shuffle(meme.captions.filter((c) => !votes[c.id]))
    const seen = shuffle(meme.captions.filter((c) => votes[c.id]))
    const [a, b] = [...fresh, ...seen]
    return { meme, a, b }
  })
}

export default function Battle({ memes, initialVotes, user }: { memes: Meme[]; initialVotes: Record<number, number>; user: User }) {
  const supabase = sbBrowser()
  const [rounds, setRounds] = useState<Round[]>([])
  const [index, setIndex] = useState(0)
  const [picked, setPicked] = useState<'a' | 'b' | null>(null)
  const [hover, setHover] = useState<'a' | 'b' | null>(null)
  const [picks, setPicks] = useState(0)
  const [streak, setStreak] = useState(0)
  const [toast, setToast] = useState('')

  // Shuffle on the client only, so server and browser render the same first frame
  useEffect(() => setRounds(buildRounds(memes, initialVotes)), [memes, initialVotes])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const round = rounds[index]
  const finished = rounds.length > 0 && index >= rounds.length
  const shown = round ? (picked ? round[picked] : hover ? round[hover] : null) : null

  const next = useCallback(() => {
    setPicked(null)
    setHover(null)
    setIndex((i) => i + 1)
  }, [])

  const choose = useCallback(
    async (side: 'a' | 'b') => {
      if (!round || picked) return
      setPicked(side)
      setPicks((n) => n + 1)
      setStreak((n) => n + 1)
      const winner = round[side]
      const t = setTimeout(next, 900)

      // The winner gets your upvote. Already upvoted? Nothing to save.
      const { data: existing } = await supabase
        .from('meme_votes')
        .select('value')
        .eq('caption_id', winner.id)
        .eq('user_id', user.id)
        .maybeSingle()
      if (existing?.value === 1) return
      const { error } = await supabase
        .from('meme_votes')
        .upsert({ caption_id: winner.id, user_id: user.id, value: 1 }, { onConflict: 'caption_id,user_id' })
      if (error) {
        clearTimeout(t)
        if (/jwt|auth|401/i.test(error.message)) return reauth()
        setToast('That pick didn’t save. Try again.')
        setPicked(null)
        setPicks((n) => n - 1)
        setStreak(0)
      }
    },
    [round, picked, supabase, user.id, next]
  )

  const skip = useCallback(() => {
    if (!round || picked) return
    setStreak(0)
    next()
  }, [round, picked, next])

  // Keyboard: ← / → (or 1 / 2) to pick, S or ↓ to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest('input, textarea, dialog')) return
      if (e.key === 'ArrowLeft' || e.key === '1') { e.preventDefault(); choose('a') }
      else if (e.key === 'ArrowRight' || e.key === '2') { e.preventDefault(); choose('b') }
      else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') { e.preventDefault(); skip() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [choose, skip])

  // Warm the next photo so it appears instantly
  useEffect(() => {
    const url = rounds[index + 1]?.meme.url
    if (url) { const img = new Image(); img.src = url }
  }, [rounds, index])

  const remaining = Math.max(0, rounds.length - index)
  const restart = () => { setRounds(buildRounds(memes, {})); setIndex(0); setStreak(0) }

  const pick = (side: 'a' | 'b', label: string, key: string) => {
    if (!round) return null
    const c = round[side]
    const state = picked === side ? ' is-winner' : picked ? ' is-loser' : hover === side ? ' is-hover' : ''
    return (
      <button
        className={`c-pick${state}`}
        onClick={() => choose(side)}
        onMouseEnter={() => setHover(side)}
        onMouseLeave={() => setHover(null)}
        onFocus={() => setHover(side)}
        onBlur={() => setHover(null)}
        disabled={!!picked}
        aria-label={`Pick caption ${label}: ${c.content}`}
      >
        {picked === side && <span className="c-pick-stamp">Funnier</span>}
        <span className="c-pick-side"><kbd className="c-key">{key}</kbd>Caption {label}</span>
        <p className="c-pick-text">{c.content}</p>
      </button>
    )
  }

  return (
    <>
      <TopBar user={user} />
      <div className="c-battle">
        <div className="c-battle-head">
          <div>
            <h1>Battle mode</h1>
            <p>Two captions, one photo. Pick the funnier one and it gets your upvote.</p>
          </div>
          {rounds.length > 0 && !finished && (
            <div className="c-battle-stats" aria-live="polite">
              <span><b>{picks}</b>picks</span>
              <span><b>{streak}</b>streak</span>
              <span><b>{remaining}</b>left</span>
            </div>
          )}
        </div>

        {memes.length === 0 && (
          <div className="c-empty">
            <h2>No battles yet</h2>
            <p>Battles need photos with captions. Make a meme and it becomes the first round.</p>
            <Link href="/memes" className="c-btn c-btn-primary">Back to the feed</Link>
          </div>
        )}

        {finished && (
          <div className="c-empty">
            <h2>You judged every photo</h2>
            <p>{picks} {picks === 1 ? 'pick' : 'picks'} this round. See where your favorites landed, or go again with new pairs.</p>
            <div className="c-spotlight-actions" style={{ justifyContent: 'center' }}>
              <Link href="/memes/top" className="c-btn c-btn-primary">See top captions</Link>
              <button className="c-btn c-btn-outline" onClick={restart}>Play again</button>
            </div>
          </div>
        )}

        {round && !finished && (
          <>
            <div className="c-arena" key={round.meme.id}>
              <div className="c-arena-meme c-lit">
                <MemeImage url={round.meme.url} caption={shown?.content ?? ''} alt={round.meme.description} label={picked ? 'Winner' : undefined} />
                {!shown && (
                  <span className="c-arena-hint" aria-hidden="true">
                    <span className="c-mouse">Hover a caption to try it here</span>
                    <span className="c-touch">Tap the funnier caption</span>
                  </span>
                )}
              </div>
              <div className="c-arena-a">{pick('a', 'A', '←')}</div>
              <div className="c-arena-b">{pick('b', 'B', '→')}</div>
            </div>
            <div className="c-battle-foot">
              <button className="c-btn c-btn-quiet c-btn-sm" onClick={skip} disabled={!!picked}>
                Skip this photo <kbd className="c-key">S</kbd>
              </button>
              <Link href={`/memes/${round.meme.id}`} className="c-btn c-btn-quiet c-btn-sm">See all five captions</Link>
            </div>
          </>
        )}
      </div>
      {toast && <div className="c-toast" role="status">{toast}</div>}
    </>
  )
}
