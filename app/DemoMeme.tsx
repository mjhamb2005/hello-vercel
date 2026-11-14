'use client'
import { useEffect, useState, type CSSProperties } from 'react'

const CAPTIONS = [
  'Me reading the AI captions at 2am',
  'The group chat after one good meme',
  'When the caption is a little too accurate',
]
const START = [24, 21, 16]
// Which caption gets the next vote. Scripted so the lead changes hands, then the loop starts over.
const SCRIPT = [1, 0, 1, 1, 2, 1, 1, 2, 2, 0, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2]

// Landing-page preview of the core loop: votes come in, captions re-rank, the leader becomes the meme.
export default function DemoMeme() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setStep((n) => (n + 1) % (SCRIPT.length + 3)), 1100)
    return () => clearInterval(t)
  }, [])

  // Replay the script up to this step (the last few beats just hold the final standings)
  const votes = [...START]
  const played = Math.min(step, SCRIPT.length)
  for (let i = 0; i < played; i++) votes[SCRIPT[i]]++
  const last = step > 0 && step <= SCRIPT.length ? SCRIPT[step - 1] : null

  const order = CAPTIONS.map((_, i) => i).sort((a, b) => votes[b] - votes[a] || a - b)
  const rankOf = (i: number) => order.indexOf(i)
  const leader = order[0]
  const max = votes[leader]

  return (
    <div className="c-demo" aria-label="Example: three AI captions on one photo, re-ranking as votes come in">
      <div className="c-demo-stage c-lit">
        <div className="c-meme c-demo-meme">
          <svg viewBox="0 0 400 300" role="img" aria-label="Three laughing emoji faces crying with laughter">
            <defs>
              <g id="lol">
                <circle r="50" fill="#FFCC33" />
                <circle r="50" fill="none" stroke="#E5A800" strokeWidth="3" />
                <path d="M-30 -14 q10 -14 20 0" stroke="#5A3A0A" strokeWidth="6" fill="none" strokeLinecap="round" />
                <path d="M10 -14 q10 -14 20 0" stroke="#5A3A0A" strokeWidth="6" fill="none" strokeLinecap="round" />
                <path d="M-32 4 h64 a32 32 0 0 1 -64 0z" fill="#5A2A0A" />
                <rect x="-30" y="4" width="60" height="8" rx="2" fill="#FFFFFF" />
                <ellipse cx="0" cy="28" rx="14" ry="7" fill="#F07A7A" />
                <path d="M-46 -6 q-12 18 -3 28 q9 -7 3 -28z" fill="#6EC6FF" />
                <path d="M46 -6 q12 18 3 28 q-9 -7 -3 -28z" fill="#6EC6FF" />
              </g>
              <radialGradient id="demo-bg" cx="50%" cy="20%" r="80%">
                <stop offset="0" stopColor="#3B4AA6" />
                <stop offset="1" stopColor="#1F2766" />
              </radialGradient>
            </defs>
            <rect width="400" height="300" fill="url(#demo-bg)" />
            <circle cx="40" cy="40" r="4" fill="#FFCC33" opacity=".5" />
            <circle cx="360" cy="30" r="3" fill="#FFCC33" opacity=".5" />
            <circle cx="370" cy="170" r="5" fill="#FFCC33" opacity=".4" />
            <circle cx="25" cy="180" r="3" fill="#FFCC33" opacity=".4" />
            <use href="#lol" transform="translate(85 95) rotate(14) scale(.7)" />
            <use href="#lol" transform="translate(318 92) rotate(-16) scale(.78)" />
            <use href="#lol" transform="translate(200 128) rotate(-6) scale(1.3)" />
          </svg>
          <p key={leader} className="c-meme-text" style={{ fontSize: '6.4cqw' }}>{CAPTIONS[leader]}</p>
          <span className="c-meme-label">Headliner</span>
        </div>

        <div className="c-demo-tray" aria-hidden="true">
          <span className="c-demo-tray-thumb" />
          <span>
            <b>Writing five captions…</b>
            <i className="c-demo-tray-bar"><em /></i>
          </span>
        </div>
      </div>

      <ol className="c-demo-list" style={{ '--rows': CAPTIONS.length } as CSSProperties}>
        {CAPTIONS.map((text, i) => (
          <li
            key={text}
            className={`${i === leader ? 'is-on' : ''}${i === last ? ' is-voted' : ''}`}
            style={{ '--rank': rankOf(i), '--w': `${Math.round((votes[i] / max) * 100)}%` } as CSSProperties}
          >
            <span className="c-demo-rank">{rankOf(i) + 1}</span>
            <span className="c-demo-text">{text}</span>
            <span className="c-demo-votes">
              <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3l5.5 7h-11z" fill="currentColor" /></svg>
              <b key={votes[i]}>{votes[i]}</b>
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
