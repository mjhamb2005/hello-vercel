'use client'
import { useEffect, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { sbBrowser } from '@/lib/sb/browser'
import { leaderOf, type Meme, type User } from '@/lib/types'
import TopBar from '../ui/TopBar'
import MemeImage, { captionSize } from '../ui/MemeImage'
import { reauth } from '../ui/MakeMemeDialog'

// Draw the photo plus caption onto a canvas and download it as a PNG
async function downloadMeme(url: string, caption: string, id: number) {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = url
  await img.decode()
  await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas')
  ctx.drawImage(img, 0, 0)

  const family = getComputedStyle(document.querySelector('.c-page')!).getPropertyValue('--c-meme').trim() || 'Impact'
  const size = (canvas.width * captionSize(caption)) / 100
  ctx.font = `${size}px ${family}, Impact, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'bottom'
  ctx.lineJoin = 'round'
  ctx.lineWidth = size * 0.14
  ctx.strokeStyle = '#000'
  ctx.fillStyle = '#fff'

  const words = caption.toUpperCase().split(/\s+/)
  const maxWidth = canvas.width * 0.92
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const test = line ? `${line} ${w}` : w
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line)
      line = w
    } else line = test
  }
  if (line) lines.push(line)

  lines.reverse().forEach((l, i) => {
    const y = canvas.height - canvas.height * 0.04 - i * size * 1.05
    ctx.strokeText(l, canvas.width / 2, y)
    ctx.fillText(l, canvas.width / 2, y)
  })

  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/png'))
  if (!blob) throw new Error('Export failed')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `caption-club-${id}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

const CONFETTI_COLORS = ['#FF4D2E', '#FFD84D', '#141414', '#4D7CFF', '#2EC27E']
const PIECES = Array.from({ length: 28 }, (_, i) => ({
  x: Math.round(Math.cos((i / 28) * Math.PI * 2) * (120 + (i % 5) * 28)),
  y: Math.round(Math.sin((i / 28) * Math.PI * 2) * (90 + (i % 4) * 26) - 40),
  r: (i * 47) % 360,
  c: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  d: 650 + (i % 6) * 70,
}))

export default function Detail({
  meme,
  initialScores,
  initialVotes,
  user,
}: {
  meme: Meme
  initialScores: Record<number, number>
  initialVotes: Record<number, number>
  user: User
}) {
  const supabase = sbBrowser()
  const [scores, setScores] = useState(initialScores)
  const [votes, setVotes] = useState(initialVotes)
  const [pending, setPending] = useState<Record<number, boolean>>({})
  const [preview, setPreview] = useState<number | null>(null)
  const [toast, setToast] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [burst, setBurst] = useState(0)

  function celebrate() {
    setBurst(Date.now())
    setToast('New leader! Your vote just changed the meme.')
    setTimeout(() => setBurst(0), 1300)
  }

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 4000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event: string) => {
      if (event === 'SIGNED_OUT') window.location.href = '/'
    })
    return () => data.subscription.unsubscribe()
  }, [supabase])

  const leader = leaderOf(meme.captions, scores)
  const leaderScore = leader ? scores[leader.id] ?? 0 : 0
  const shown = meme.captions.find((c) => c.id === preview) ?? leader
  const isPreview = preview !== null && preview !== leader?.id

  async function vote(captionId: number, value: 1 | -1) {
    if (pending[captionId]) return
    const prev = votes[captionId] ?? 0
    const next = prev === value ? 0 : value // clicking the same arrow again removes your vote

    // Did this vote crown a new leader? Celebrate it.
    const nextScores = { ...scores, [captionId]: (scores[captionId] ?? 0) - prev + next }
    const before = leaderOf(meme.captions, scores)
    const after = leaderOf(meme.captions, nextScores)
    if (next === 1 && after?.id === captionId && before?.id !== captionId && (nextScores[captionId] ?? 0) > 0) celebrate()

    setPending((p) => ({ ...p, [captionId]: true }))
    setVotes((v) => ({ ...v, [captionId]: next }))
    setScores((s) => ({ ...s, [captionId]: (s[captionId] ?? 0) - prev + next }))

    const { error } =
      next === 0
        ? await supabase.from('meme_votes').delete().eq('caption_id', captionId).eq('user_id', user.id)
        : await supabase
            .from('meme_votes')
            .upsert({ caption_id: captionId, user_id: user.id, value: next }, { onConflict: 'caption_id,user_id' })

    setPending((p) => ({ ...p, [captionId]: false }))
    if (error) {
      setVotes((v) => ({ ...v, [captionId]: prev }))
      setScores((s) => ({ ...s, [captionId]: (s[captionId] ?? 0) - next + prev }))
      if (/jwt|auth|401/i.test(error.message)) return reauth()
      setToast('Your vote didn’t save. Try again.')
    }
  }

  async function download() {
    if (!meme.url || !shown || downloading) return
    setDownloading(true)
    try {
      await downloadMeme(meme.url, leader?.content ?? shown.content, meme.id)
    } catch {
      setToast('Couldn’t create the download. Refresh and try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <TopBar user={user} />

      <div className="c-detail">
        <div className="c-detail-meme">
          <Link href="/memes" className="c-back"><span aria-hidden="true">←</span> All memes</Link>
          <div className="c-meme-wrap">
            <MemeImage
              url={meme.url}
              caption={shown?.content ?? ''}
              alt={meme.description}
              label={isPreview ? 'Preview' : leaderScore > 0 ? 'Leading caption' : undefined}
            />
            {burst > 0 && (
              <div className="c-confetti" key={burst} aria-hidden="true">
                {PIECES.map((p, i) => (
                  <span
                    key={i}
                    style={{ '--x': `${p.x}px`, '--y': `${p.y}px`, '--r': `${p.r}deg`, '--d': `${p.d}ms`, background: p.c } as CSSProperties}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="c-detail-actions">
            <button className="c-btn c-btn-outline" onClick={download} disabled={!meme.url || downloading}>
              {downloading ? 'Preparing…' : 'Download meme'}
            </button>
          </div>
          <details className="c-desc">
            <summary>What the AI saw</summary>
            <p>{meme.description}</p>
          </details>
        </div>

        <section className="c-captions" aria-labelledby="captions-title">
          <h1 id="captions-title">Pick the funniest caption</h1>
          <p className="c-sub">Vote up or down. The top caption becomes the meme. Hover a caption to preview it.</p>

          <ol className="c-cap-list">
            {meme.captions.map((c) => {
              const score = scores[c.id] ?? 0
              const rank = 1 + meme.captions.filter((o) => (scores[o.id] ?? 0) > score).length
              const mine = votes[c.id] ?? 0
              const leading = c.id === leader?.id && score > 0
              return (
                <li
                  key={c.id}
                  className={`c-cap${leading ? ' is-leading' : ''}${preview === c.id ? ' is-preview' : ''}`}
                  onMouseEnter={() => setPreview(c.id)}
                  onMouseLeave={() => setPreview(null)}
                  onFocus={() => setPreview(c.id)}
                  onBlur={() => setPreview(null)}
                >
                  <span className="c-rank" aria-label={`Rank ${rank}`}>{rank}</span>
                  <div className="c-cap-body">
                    {leading && <span className="c-badge">Leading</span>}
                    <p>{c.content}</p>
                  </div>
                  <div className="c-vote" role="group" aria-label={`Vote on: ${c.content}`}>
                    <button
                      className={mine === 1 ? 'on up' : 'up'}
                      aria-label="Upvote"
                      aria-pressed={mine === 1}
                      disabled={pending[c.id]}
                      onClick={() => vote(c.id, 1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3l5.5 7h-11z" fill="currentColor" /></svg>
                    </button>
                    <span key={score} className="c-score" aria-live="polite">{score}</span>
                    <button
                      className={mine === -1 ? 'on down' : 'down'}
                      aria-label="Downvote"
                      aria-pressed={mine === -1}
                      disabled={pending[c.id]}
                      onClick={() => vote(c.id, -1)}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 13l5.5-7h-11z" fill="currentColor" /></svg>
                    </button>
                  </div>
                </li>
              )
            })}
          </ol>
        </section>
      </div>


      {toast && <div className="c-toast" role="status">{toast}</div>}
    </>
  )
}