'use client'
import { useEffect, useState, type CSSProperties } from 'react'

// One photo, the captions AI wrote for it, and the crowd's votes, re-ranking live.
// Every caption is about the photo, so the idea lands without reading anything else.
const CAPTIONS = [
  'I fixed your essay. It’s 9 pages of the letter k now.',
  'This meeting could have been a nap.',
  'Hold on, I’m replying all to your professor.',
]
const START = [31, 27, 22]
// Which caption gets the next vote; scripted so the lead changes hands before the loop restarts
const SCRIPT = [1, 1, 0, 1, 1, 2, 1, 0, 2, 2, 2, 0, 0, 0, 2, 0, 0]
const HOLD = 4

export default function DemoMeme() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setStep((n) => (n + 1) % (SCRIPT.length + HOLD)), 900)
    return () => clearInterval(t)
  }, [])

  const votes = [...START]
  for (let i = 0; i < Math.min(step, SCRIPT.length); i++) votes[SCRIPT[i]]++
  const last = step > 0 && step <= SCRIPT.length ? SCRIPT[step - 1] : null
  const order = CAPTIONS.map((_, i) => i).sort((a, b) => votes[b] - votes[a] || a - b)
  const leader = order[0]
  const max = votes[leader]

  return (
    <div className="c-demo c-lit" aria-label="Example: a photo of a cat asleep on a laptop, three AI captions, and live votes">
      <div className="c-meme c-demo-meme">
        <CatPhoto />
        <span className="c-demo-chip">Your photo</span>
        <p key={leader} className="c-meme-text" style={{ fontSize: '6cqw' }}>{CAPTIONS[leader]}</p>
      </div>

      <div className="c-demo-head">
        <span>AI wrote five captions. Top three:</span>
        <span className="c-demo-live"><i aria-hidden="true" /> Live votes</span>
      </div>
      <ol className="c-demo-list" style={{ '--rows': CAPTIONS.length } as CSSProperties}>
        {CAPTIONS.map((text, i) => (
          <li
            key={text}
            className={`${i === leader ? 'is-on' : ''}${i === last ? ' is-voted' : ''}`}
            style={{ '--rank': order.indexOf(i), '--w': `${Math.round((votes[i] / max) * 100)}%` } as CSSProperties}
          >
            <span className="c-demo-text">{text}</span>
            <b key={votes[i]}>{votes[i]}</b>
          </li>
        ))}
      </ol>
    </div>
  )
}

// A warm, late-night desk scene: an orange cat asleep across the laptop keyboard, mid-essay.
function CatPhoto() {
  return (
    <svg viewBox="0 0 400 300" role="img" aria-label="An orange cat asleep across an open laptop, the screen full of the letter k">
      <defs>
        <linearGradient id="d-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2350" />
          <stop offset="1" stopColor="#47305C" />
        </linearGradient>
        <radialGradient id="d-lamp" cx="18%" cy="8%" r="75%">
          <stop offset="0" stopColor="#FFD58A" stopOpacity=".55" />
          <stop offset=".45" stopColor="#FFB45A" stopOpacity=".12" />
          <stop offset="1" stopColor="#FFB45A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="d-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A5A3A" />
          <stop offset="1" stopColor="#5A3826" />
        </linearGradient>
        <linearGradient id="d-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB062" />
          <stop offset="1" stopColor="#E9803A" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#d-wall)" />
      <rect x="282" y="26" width="86" height="70" rx="4" fill="#1C1736" />
      <path d="M325 26v70M282 61h86" stroke="#3A2F63" strokeWidth="3" />
      <circle cx="350" cy="44" r="7" fill="#FFF3C4" opacity=".85" />
      <circle cx="300" cy="80" r="1.6" fill="#fff" opacity=".7" />
      <circle cx="312" cy="38" r="1.2" fill="#fff" opacity=".6" />
      <rect width="400" height="300" fill="url(#d-lamp)" />

      <rect x="0" y="212" width="400" height="88" fill="url(#d-desk)" />
      <rect x="0" y="212" width="400" height="4" fill="#A8744E" />

      <path d="M118 72h176a8 8 0 0 1 8 8v126H110V80a8 8 0 0 1 8-8z" fill="#20222E" />
      <rect x="120" y="82" width="172" height="118" rx="3" fill="#F3F5FA" />
      <rect x="120" y="82" width="172" height="13" rx="3" fill="#DCE3F0" />
      <circle cx="128" cy="88.5" r="2.4" fill="#FF6B6B" />
      <circle cx="136" cy="88.5" r="2.4" fill="#FFC94D" />
      <circle cx="144" cy="88.5" r="2.4" fill="#5BD47A" />
      <text x="206" y="91.5" textAnchor="middle" fontSize="7" fontFamily="system-ui, sans-serif" fill="#55607A">essay_FINAL_v3.docx</text>
      <rect x="132" y="104" width="96" height="5" rx="2" fill="#B8C2D6" />
      <rect x="132" y="114" width="140" height="4" rx="2" fill="#D3DAE7" />
      {[132, 145, 158].map((y) => (
        <text key={y} x="132" y={y} fontSize="10" fontFamily="ui-monospace, monospace" fill="#2E3650">kkkkkkkkkkkkkkkkkkkkkk</text>
      ))}
      <text x="132" y="171" fontSize="10" fontFamily="ui-monospace, monospace" fill="#2E3650">kkkkkkkkkkkkk</text>
      <rect x="212" y="163" width="1.5" height="10" fill="#3B6CFF" />

      <path d="M92 212h228l-14 16H106z" fill="#C9CFDB" />
      <path d="M92 212h228v2H92z" fill="#E9EDF4" />

      <rect x="40" y="176" width="34" height="40" rx="5" fill="#E8604C" />
      <path d="M74 186h6a8 8 0 0 1 0 16h-6" stroke="#E8604C" strokeWidth="5" fill="none" />
      <path d="M50 168c-4-6 4-8 0-15M62 168c-4-6 4-8 0-15" stroke="#fff" strokeOpacity=".4" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <text x="57" y="200" textAnchor="middle" fontSize="8" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#FFE3DC">FINALS</text>

      <path d="M336 214c26-4 40-24 30-40" stroke="#E9803A" strokeWidth="13" fill="none" strokeLinecap="round" />
      <ellipse cx="248" cy="202" rx="96" ry="34" fill="url(#d-fur)" />
      <path d="M220 172c-4 10-4 22 0 30M248 169c-4 12-4 24 0 34M276 172c-4 10-4 22 0 30M302 178c-3 8-3 16 0 22" stroke="#C9682A" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".55" />
      <ellipse cx="190" cy="228" rx="22" ry="9" fill="#FFC48A" />
      <ellipse cx="296" cy="230" rx="20" ry="8" fill="#FFC48A" />
      <path d="M128 172l6-34 22 22zM180 166l12-30 10 32z" fill="#E9803A" />
      <path d="M134 150l3-11 9 9zM186 152l6-12 3 13z" fill="#FFB7A8" />
      <ellipse cx="164" cy="190" rx="44" ry="36" fill="url(#d-fur)" />
      <path d="M150 158c2 6 2 10 0 14M164 156v14M178 158c-2 6-2 10 0 14" stroke="#C9682A" strokeWidth="4" fill="none" strokeLinecap="round" opacity=".55" />
      <path d="M140 188q8 7 16 0M172 188q8 7 16 0" stroke="#5A2E14" strokeWidth="3.5" fill="none" strokeLinecap="round" />
      <path d="M160 198l4 4 4-4z" fill="#F07A8A" />
      <path d="M164 202q-4 6-9 4M164 202q4 6 9 4" stroke="#5A2E14" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      <path d="M128 200l-22 -3M128 206l-21 4M200 200l22 -3M200 206l21 4" stroke="#FFF1E3" strokeWidth="1.6" strokeLinecap="round" opacity=".8" />
      <ellipse cx="139" cy="202" rx="7" ry="4" fill="#FF9E8A" opacity=".5" />
      <ellipse cx="189" cy="202" rx="7" ry="4" fill="#FF9E8A" opacity=".5" />
      <text x="94" y="150" fontSize="16" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#FFF3C4" opacity=".9">z</text>
      <text x="86" y="132" fontSize="12" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#FFF3C4" opacity=".7">z</text>
      <text x="96" y="118" fontSize="9" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#FFF3C4" opacity=".5">z</text>
    </svg>
  )
}
