'use client'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import SignInButton from './SignInButton'

// The landing page doesn't explain Caption Club, it lets you play one round of it.
// Three photos, two AI captions each: pick the funnier one, then see if the crowd agreed.
type Round = { photo: ReactNode; alt: string; a: string; b: string; crowdA: number }

const ROUNDS: Round[] = [
  {
    photo: <DeadlinePhoto />,
    alt: 'A laptop at night showing an essay with a blank page and a timer reading 4 minutes 59 seconds, surrounded by empty coffee cups',
    a: 'Five minutes left. Time to start the intro.',
    b: 'Coffee number four is doing absolutely nothing.',
    crowdA: 67,
  },
  {
    photo: <ChatPhoto />,
    alt: 'A phone showing a group chat message asking who is in for tonight, seen by 12 people, with no replies',
    a: '12 people saw it. 0 people are coming.',
    b: 'The group chat when it’s time to Venmo me back',
    crowdA: 44,
  },
  {
    photo: <AlarmPhoto />,
    alt: 'An alarm clock reading 5:30 AM next to a bed with a blanket pulled over the pillow',
    a: 'My alarm: it’s time. Me: it is not.',
    b: 'The snooze button doing the most important work of my day',
    crowdA: 31,
  },
]

export default function DemoMeme() {
  const [round, setRound] = useState(0)
  const [pick, setPick] = useState<'a' | 'b' | null>(null)
  const [matches, setMatches] = useState(0)
  const done = round >= ROUNDS.length

  // After a pick, the next photo comes up on its own (or tap "Next")
  useEffect(() => {
    if (!pick) return
    const t = setTimeout(next, 3400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pick, round])

  function choose(side: 'a' | 'b') {
    if (pick) return
    const r = ROUNDS[round]
    const crowd = r.crowdA >= 50 ? 'a' : 'b'
    if (side === crowd) setMatches((m) => m + 1)
    setPick(side)
  }
  function next() {
    setPick(null)
    setRound((n) => n + 1)
  }
  function restart() {
    setRound(0)
    setPick(null)
    setMatches(0)
  }

  if (done) {
    return (
      <div className="c-demo c-game c-lit">
        <div className="c-game-end">
          <p className="c-game-score">{matches}<span>/{ROUNDS.length}</span></p>
          <h2>{matches === ROUNDS.length ? 'You and the crowd are on the same wavelength.' : matches === 0 ? 'You’ve got a contrarian sense of humor.' : 'Your humor has range.'}</h2>
          <p>That was three photos. Now upload your own, AI writes five captions for it, and everyone votes.</p>
          <SignInButton />
          <button className="c-link-btn c-game-again" onClick={restart}>Play again</button>
        </div>
      </div>
    )
  }

  const r = ROUNDS[round]
  const pct = { a: r.crowdA, b: 100 - r.crowdA }
  const crowdSide = r.crowdA >= 50 ? 'a' : 'b'
  const agreed = pick === crowdSide

  return (
    <div className="c-demo c-game c-lit">
      <div className="c-game-top">
        <span>Try it: which caption is funnier?</span>
        <span className="c-game-dots" aria-label={`Photo ${round + 1} of ${ROUNDS.length}`}>
          {ROUNDS.map((_, i) => <i key={i} className={i < round ? 'is-done' : i === round ? 'is-on' : ''} />)}
        </span>
      </div>

      <div className="c-meme c-demo-meme" key={round}>
        <div role="img" aria-label={r.alt}>{r.photo}</div>
        {pick ? (
          <p className="c-meme-text c-game-stamp" style={{ fontSize: '6cqw' }}>{pick === 'a' ? r.a : r.b}</p>
        ) : (
          <span className="c-demo-chip">AI wrote these two captions</span>
        )}
      </div>

      <div className="c-game-picks">
        {(['a', 'b'] as const).map((side) => (
          <button
            key={side + round}
            className={`c-game-pick${pick === side ? ' is-mine' : ''}${pick && side === crowdSide ? ' is-crowd' : ''}`}
            onClick={() => choose(side)}
            disabled={!!pick}
            style={{ '--pct': pick ? `${pct[side]}%` : '0%' } as CSSProperties}
          >
            <b>{side.toUpperCase()}</b>
            <span className="c-game-text">{side === 'a' ? r.a : r.b}</span>
            {pick && <span className="c-game-pct">{pct[side]}%</span>}
          </button>
        ))}
      </div>

      <div className="c-game-result" aria-live="polite">
        {pick ? (
          <>
            <span>{agreed ? `The crowd agrees. ${pct[pick]}% picked it too.` : `Bold pick. Only ${pct[pick]}% agreed.`}</span>
            <button className="c-link-btn" onClick={next}>{round + 1 < ROUNDS.length ? 'Next photo →' : 'See your score →'}</button>
          </>
        ) : (
          <span>Tap one. Your pick becomes the meme.</span>
        )}
      </div>
    </div>
  )
}

// Late night, one laptop, one blank essay, four coffees, and a timer.
function DeadlinePhoto() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id="s1-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#1E2347" />
          <stop offset="1" stopColor="#33284F" />
        </linearGradient>
        <radialGradient id="s1-screen" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#9CC2FF" stopOpacity=".38" />
          <stop offset="1" stopColor="#9CC2FF" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="s1-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7A5238" />
          <stop offset="1" stopColor="#4E3324" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#s1-wall)" />
      <rect width="400" height="300" fill="url(#s1-screen)" />
      <rect x="22" y="30" width="44" height="44" rx="3" fill="#FFE27A" transform="rotate(-6 44 52)" />
      <text x="44" y="50" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#5A4300" transform="rotate(-6 44 52)">DUE</text>
      <text x="44" y="61" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#5A4300" transform="rotate(-6 44 52)">11:59!!</text>
      <rect x="334" y="40" width="42" height="42" rx="3" fill="#FF9EC0" transform="rotate(5 355 61)" />
      <text x="355" y="60" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#6A1838" transform="rotate(5 355 61)">sleep</text>
      <text x="355" y="70" textAnchor="middle" fontSize="7.5" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#6A1838" transform="rotate(5 355 61)">(later)</text>

      <rect x="0" y="222" width="400" height="78" fill="url(#s1-desk)" />
      <rect x="0" y="222" width="400" height="4" fill="#9A6A48" />

      <path d="M104 52h192a10 10 0 0 1 10 10v154H94V62a10 10 0 0 1 10-10z" fill="#1A1C26" />
      <rect x="104" y="62" width="192" height="146" rx="4" fill="#F4F6FB" />
      <rect x="104" y="62" width="192" height="16" rx="4" fill="#DDE4F0" />
      <circle cx="114" cy="70" r="2.8" fill="#FF6B6B" />
      <circle cx="123" cy="70" r="2.8" fill="#FFC94D" />
      <circle cx="132" cy="70" r="2.8" fill="#5BD47A" />
      <text x="200" y="73" textAnchor="middle" fontSize="7.5" fontFamily="system-ui, sans-serif" fill="#55607A">essay_FINAL_v3.docx</text>
      <text x="122" y="100" fontSize="11" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#2E3650">Introduction</text>
      <rect x="122" y="108" width="1.6" height="12" fill="#3B6CFF" />
      <text x="122" y="140" fontSize="7" fontFamily="system-ui, sans-serif" fill="#A0A9BC">Word count: 0</text>
      <rect x="178" y="152" width="104" height="44" rx="8" fill="#FFE8EA" stroke="#FF6B7A" strokeWidth="1.5" />
      <text x="230" y="167" textAnchor="middle" fontSize="7" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#C2283D">SUBMISSION CLOSES IN</text>
      <text x="230" y="187" textAnchor="middle" fontSize="17" fontWeight="900" fontFamily="ui-monospace, monospace" fill="#C2283D">00:04:59</text>
      <path d="M76 222h248l-14 16H90z" fill="#C9CFDB" />
      <path d="M76 222h248v2H76z" fill="#E9EDF4" />

      {[[30, 0], [330, -6], [356, 4], [52, 8]].map(([x, r], i) => (
        <g key={i} transform={`translate(${x} ${i % 2 ? 182 : 186}) rotate(${r})`}>
          <path d="M0 0h26l-3 40H3z" fill={['#F2EEE6', '#E8604C', '#F2EEE6', '#4FA3E0'][i]} />
          <rect x="-2" y="-5" width="30" height="7" rx="2" fill="#3A2A22" />
          <rect x="2" y="14" width="22" height="9" fill="#B07A4A" opacity=".8" />
        </g>
      ))}
    </svg>
  )
}

// A phone on a dorm desk: one message to the group chat, seen by everyone, answered by no one.
function ChatPhoto() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id="s2-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#3D2A6B" />
          <stop offset="1" stopColor="#7A3A6E" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#s2-bg)" />
      <circle cx="60" cy="60" r="70" fill="#FFB86B" opacity=".12" />
      <circle cx="350" cy="250" r="90" fill="#6BC3FF" opacity=".1" />

      <g transform="rotate(-4 200 160)">
        <rect x="122" y="18" width="156" height="300" rx="26" fill="#14141C" />
        <rect x="130" y="26" width="140" height="284" rx="20" fill="#F2F3F8" />
        <rect x="178" y="32" width="44" height="10" rx="5" fill="#14141C" />
        <rect x="130" y="48" width="140" height="34" fill="#FFFFFF" />
        <circle cx="152" cy="65" r="10" fill="#FFCC33" />
        <text x="152" y="69" textAnchor="middle" fontSize="9" fontWeight="900" fontFamily="system-ui, sans-serif" fill="#5A4300">S</text>
        <text x="168" y="62" fontSize="9" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#1B1E2B">the squad</text>
        <text x="168" y="74" fontSize="7" fontFamily="system-ui, sans-serif" fill="#8A90A2">14 members</text>

        <rect x="140" y="96" width="92" height="22" rx="11" fill="#E2E4EC" />
        <text x="150" y="110" fontSize="7.5" fontFamily="system-ui, sans-serif" fill="#3A3F52">last week: “we should hang”</text>

        <rect x="172" y="168" width="88" height="40" rx="14" fill="#3B82F6" />
        <text x="182" y="184" fontSize="8.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#fff">who’s in for</text>
        <text x="182" y="197" fontSize="8.5" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#fff">tonight??</text>
        <text x="258" y="220" textAnchor="end" fontSize="7" fontWeight="700" fontFamily="system-ui, sans-serif" fill="#8A90A2">Seen by 12</text>

        <rect x="140" y="236" width="44" height="22" rx="11" fill="#E2E4EC" />
        <circle cx="152" cy="247" r="2.5" fill="#9AA0B2" />
        <circle cx="162" cy="247" r="2.5" fill="#9AA0B2" opacity=".7" />
        <circle cx="172" cy="247" r="2.5" fill="#9AA0B2" opacity=".4" />
        <text x="190" y="250" fontSize="6.5" fontFamily="system-ui, sans-serif" fill="#A0A6B6">someone is typing…</text>
      </g>
    </svg>
  )
}

// 5:30 AM. The alarm is going off. The blanket has decided otherwise.
function AlarmPhoto() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id="s3-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#16203F" />
          <stop offset="1" stopColor="#2A2E58" />
        </linearGradient>
        <radialGradient id="s3-glow" cx="28%" cy="58%" r="40%">
          <stop offset="0" stopColor="#FF5A5A" stopOpacity=".35" />
          <stop offset="1" stopColor="#FF5A5A" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="400" height="300" fill="url(#s3-wall)" />
      <rect x="250" y="34" width="110" height="80" rx="4" fill="#0E1530" />
      <path d="M305 34v80M250 74h110" stroke="#2B3466" strokeWidth="3" />
      <circle cx="334" cy="54" r="2" fill="#fff" opacity=".7" />
      <circle cx="270" cy="96" r="1.5" fill="#fff" opacity=".5" />
      <rect width="400" height="300" fill="url(#s3-glow)" />

      {/* bed with a very committed blanket */}
      <rect x="170" y="176" width="230" height="124" fill="#3B3F72" />
      <rect x="182" y="150" width="96" height="44" rx="18" fill="#E9ECF6" />
      <path d="M170 200c40-34 110-40 230-24v124H170z" fill="#6C5CE7" />
      <path d="M170 200c40-34 110-40 230-24" stroke="#8C7FF0" strokeWidth="6" fill="none" />
      <path d="M210 228c30-10 70-12 110-6M240 258c30-8 70-8 120-2" stroke="#5847D6" strokeWidth="5" fill="none" strokeLinecap="round" />
      <ellipse cx="236" cy="186" rx="40" ry="22" fill="#7B6CF0" />

      {/* nightstand and alarm clock */}
      <rect x="40" y="206" width="120" height="94" rx="6" fill="#5A3E2E" />
      <rect x="40" y="206" width="120" height="8" rx="4" fill="#7A563F" />
      <rect x="54" y="150" width="92" height="56" rx="12" fill="#1B1B24" />
      <rect x="62" y="158" width="76" height="40" rx="7" fill="#2A0D10" />
      <text x="100" y="186" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="ui-monospace, monospace" fill="#FF4D4D">5:30</text>
      <text x="132" y="194" textAnchor="end" fontSize="6" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#FF4D4D">AM</text>
      <path d="M50 152l-14-10M150 152l14-10M44 170h-14M156 170h14" stroke="#FFCC33" strokeWidth="4" strokeLinecap="round" />
      <rect x="84" y="140" width="32" height="10" rx="4" fill="#3A3A48" />
      <text x="100" y="135" textAnchor="middle" fontSize="7" fontWeight="800" fontFamily="system-ui, sans-serif" fill="#FFCC33">SNOOZE ×4</text>
    </svg>
  )
}
