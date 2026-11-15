'use client'
import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import SignInButton from './SignInButton'

// The landing page doesn't explain Caption Club, it lets you play one round of it.
// Three photos, two AI captions each: pick the funnier one, then see if the crowd agreed.
type Round = { photo: ReactNode; alt: string; a: string; b: string; crowdA: number }

const ROUNDS: Round[] = [
  {
    photo: <CatPhoto />,
    alt: 'An orange cat asleep across an open laptop, the essay on screen full of the letter k',
    a: 'I fixed your essay. It’s 9 pages of the letter k now.',
    b: 'This meeting could have been a nap.',
    crowdA: 64,
  },
  {
    photo: <DogPhoto />,
    alt: 'A golden retriever in a party hat staring flatly at a tiny birthday cake with one candle',
    a: 'When they start singing and you don’t know where to look',
    b: 'I asked for steak.',
    crowdA: 41,
  },
  {
    photo: <RaccoonPhoto />,
    alt: 'A raccoon peeking out of a trash can at night, holding a slice of pizza',
    a: 'Me checking the fridge for the fifth time',
    b: 'Just here for the free pizza at the info session',
    crowdA: 29,
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

// A warm, late-night desk scene: an orange cat asleep across the laptop keyboard, mid-essay.
function CatPhoto() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id="c1-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2B2350" />
          <stop offset="1" stopColor="#47305C" />
        </linearGradient>
        <radialGradient id="c1-lamp" cx="18%" cy="8%" r="75%">
          <stop offset="0" stopColor="#FFD58A" stopOpacity=".55" />
          <stop offset=".45" stopColor="#FFB45A" stopOpacity=".12" />
          <stop offset="1" stopColor="#FFB45A" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="c1-desk" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8A5A3A" />
          <stop offset="1" stopColor="#5A3826" />
        </linearGradient>
        <linearGradient id="c1-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFB062" />
          <stop offset="1" stopColor="#E9803A" />
        </linearGradient>
      </defs>

      <rect width="400" height="300" fill="url(#c1-wall)" />
      <rect x="282" y="26" width="86" height="70" rx="4" fill="#1C1736" />
      <path d="M325 26v70M282 61h86" stroke="#3A2F63" strokeWidth="3" />
      <circle cx="350" cy="44" r="7" fill="#FFF3C4" opacity=".85" />
      <circle cx="300" cy="80" r="1.6" fill="#fff" opacity=".7" />
      <circle cx="312" cy="38" r="1.2" fill="#fff" opacity=".6" />
      <rect width="400" height="300" fill="url(#c1-lamp)" />

      <rect x="0" y="212" width="400" height="88" fill="url(#c1-desk)" />
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
      <ellipse cx="248" cy="202" rx="96" ry="34" fill="url(#c1-fur)" />
      <path d="M220 172c-4 10-4 22 0 30M248 169c-4 12-4 24 0 34M276 172c-4 10-4 22 0 30M302 178c-3 8-3 16 0 22" stroke="#C9682A" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".55" />
      <ellipse cx="190" cy="228" rx="22" ry="9" fill="#FFC48A" />
      <ellipse cx="296" cy="230" rx="20" ry="8" fill="#FFC48A" />
      <path d="M128 172l6-34 22 22zM180 166l12-30 10 32z" fill="#E9803A" />
      <path d="M134 150l3-11 9 9zM186 152l6-12 3 13z" fill="#FFB7A8" />
      <ellipse cx="164" cy="190" rx="44" ry="36" fill="url(#c1-fur)" />
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

// A golden retriever in a party hat, deeply unimpressed by a very small cake.
function DogPhoto() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id="c2-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5B2A55" />
          <stop offset="1" stopColor="#7A3A5E" />
        </linearGradient>
        <linearGradient id="c2-fur" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F2C27A" />
          <stop offset="1" stopColor="#D99A4E" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#c2-wall)" />
      <path d="M0 30 Q100 62 200 34 T400 30" stroke="#F4E1C1" strokeWidth="2" fill="none" opacity=".6" />
      {[[22, 38, '#FFCC33'], [62, 47, '#4FC3F7'], [102, 52, '#FF6B8B'], [142, 48, '#7EE08A'], [258, 44, '#FFCC33'], [298, 50, '#4FC3F7'], [338, 46, '#FF6B8B'], [378, 34, '#7EE08A']].map(([x, y, c]) => (
        <path key={String(x)} d={`M${Number(x) - 12} ${Number(y) - 8}h24l-12 22z`} fill={String(c)} />
      ))}
      {/* dog */}
      <path d="M118 300c4-70 34-104 82-104s78 34 82 104z" fill="url(#c2-fur)" />
      <path d="M128 132c-30 8-34 60-14 86 10-20 18-46 22-70z" fill="#C2803D" />
      <path d="M272 132c30 8 34 60 14 86-10-20-18-46-22-70z" fill="#C2803D" />
      <ellipse cx="200" cy="150" rx="74" ry="66" fill="url(#c2-fur)" />
      <ellipse cx="200" cy="184" rx="40" ry="30" fill="#F8DDB0" />
      <ellipse cx="200" cy="168" rx="15" ry="10" fill="#2A1A12" />
      <path d="M200 178v10M200 188q-10 8-18 2M200 188q10 8 18 2" stroke="#2A1A12" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* unimpressed eyes: half-closed lids */}
      <circle cx="170" cy="136" r="9" fill="#2A1A12" />
      <circle cx="230" cy="136" r="9" fill="#2A1A12" />
      <rect x="158" y="124" width="24" height="12" fill="url(#c2-fur)" />
      <rect x="218" y="124" width="24" height="12" fill="url(#c2-fur)" />
      <path d="M159 136h23M219 136h23" stroke="#8A5A2A" strokeWidth="3" strokeLinecap="round" />
      <path d="M160 116l20 -3M220 113l20 3" stroke="#B57A3A" strokeWidth="4" strokeLinecap="round" />
      {/* party hat */}
      <path d="M226 92l-12 -62 46 46z" fill="#4FC3F7" />
      <path d="M220 62l22 -6M223 77l29 -7" stroke="#FFCC33" strokeWidth="5" />
      <circle cx="214" cy="28" r="7" fill="#FF6B8B" />
      <path d="M226 92l34-16" stroke="#E3F4FF" strokeWidth="2" opacity=".6" />
      {/* table and the very small cake */}
      <rect x="0" y="244" width="400" height="56" fill="#F4E9D8" />
      <rect x="0" y="244" width="400" height="5" fill="#FFFFFF" opacity=".7" />
      <ellipse cx="200" cy="258" rx="34" ry="7" fill="#E5D6BF" />
      <rect x="186" y="236" width="28" height="18" rx="4" fill="#FF8FB1" />
      <rect x="186" y="236" width="28" height="6" rx="3" fill="#FFF3F7" />
      <rect x="198.5" y="222" width="3" height="14" fill="#7EC8FF" />
      <path d="M200 211c4 4 4 9 0 11-4-2-4-7 0-11z" fill="#FFCC33" />
      <circle cx="200" cy="217" r="9" fill="#FFCC33" opacity=".25" />
    </svg>
  )
}

// A raccoon peeking out of a trash can at night, pizza secured.
function RaccoonPhoto() {
  return (
    <svg viewBox="0 0 400 300" aria-hidden="true">
      <defs>
        <linearGradient id="c3-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#0F1A3A" />
          <stop offset="1" stopColor="#23305E" />
        </linearGradient>
        <radialGradient id="c3-lamp" cx="20%" cy="12%" r="70%">
          <stop offset="0" stopColor="#FFE7A3" stopOpacity=".55" />
          <stop offset=".5" stopColor="#FFE7A3" stopOpacity=".1" />
          <stop offset="1" stopColor="#FFE7A3" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="c3-can" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#6E7B8C" />
          <stop offset=".5" stopColor="#AEB9C6" />
          <stop offset="1" stopColor="#5E6A7A" />
        </linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#c3-sky)" />
      <rect x="236" y="70" width="120" height="180" fill="#18224A" />
      {[[250, 90], [290, 90], [330, 90], [250, 130], [330, 130], [290, 170]].map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width="22" height="26" fill="#FFD27A" opacity=".75" />
      ))}
      <rect x="70" y="40" width="6" height="210" fill="#2C3655" />
      <path d="M60 40h26l-6 12H66z" fill="#3A4570" />
      <circle cx="73" cy="54" r="6" fill="#FFF0C2" />
      <rect width="400" height="300" fill="url(#c3-lamp)" />
      <rect x="0" y="250" width="400" height="50" fill="#1A2140" />
      {/* can */}
      <path d="M140 150h120l-10 108H150z" fill="url(#c3-can)" />
      <path d="M160 160v90M186 160v92M214 160v92M240 160v90" stroke="#5E6A7A" strokeWidth="3" opacity=".7" />
      {/* raccoon */}
      <path d="M162 124l8-28 20 20zM238 124l-8-28-20 20z" fill="#7C8594" />
      <path d="M168 116l4-12 8 8zM232 116l-4-12-8 8z" fill="#3A3F4A" />
      <ellipse cx="200" cy="140" rx="46" ry="34" fill="#9AA3B0" />
      <path d="M156 136q22-22 44-4q22-18 44 4q-6 16-22 14q-14-2-22-8q-8 6-22 8q-16 2-22-14z" fill="#2B2F38" />
      <circle cx="180" cy="136" r="7" fill="#fff" />
      <circle cx="220" cy="136" r="7" fill="#fff" />
      <circle cx="181" cy="137" r="4.5" fill="#111" />
      <circle cx="221" cy="137" r="4.5" fill="#111" />
      <circle cx="183" cy="135" r="1.6" fill="#fff" />
      <circle cx="223" cy="135" r="1.6" fill="#fff" />
      <ellipse cx="200" cy="160" rx="16" ry="11" fill="#E4E8EE" />
      <ellipse cx="200" cy="155" rx="6" ry="4" fill="#111" />
      {/* lid, propped on the head */}
      <path d="M126 112q74-40 150 -6l-4 10q-72-30-142 6z" fill="#8792A2" />
      <rect x="194" y="90" width="20" height="8" rx="4" fill="#5E6A7A" transform="rotate(-8 204 94)" />
      {/* paws on the rim with pizza */}
      <rect x="132" y="146" width="136" height="10" rx="5" fill="#8C97A7" />
      <ellipse cx="174" cy="150" rx="10" ry="7" fill="#3A3F4A" />
      <path d="M216 150l40 -26 4 34z" fill="#F4C25A" />
      <path d="M220 150l36 -22 3 28z" fill="#FFDD80" />
      <circle cx="236" cy="142" r="4" fill="#D9473A" />
      <circle cx="248" cy="138" r="3.5" fill="#D9473A" />
      <circle cx="250" cy="148" r="3" fill="#D9473A" />
      <ellipse cx="222" cy="152" rx="10" ry="7" fill="#3A3F4A" />
    </svg>
  )
}
