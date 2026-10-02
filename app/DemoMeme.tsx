'use client'
import { useEffect, useState } from 'react'

const DEMO = [
  { text: 'Me reading the AI captions at 2am', votes: 41 },
  { text: 'The group chat after one good meme', votes: 28 },
  { text: 'When the caption is a little too accurate', votes: 17 },
]

// Landing-page preview: captions take turns being "the meme"
export default function DemoMeme() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % DEMO.length), 2800)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="c-demo" aria-label="Example meme with three AI-written captions">
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
          </defs>
          <rect width="400" height="300" fill="#2E3A87" />
          <circle cx="40" cy="40" r="4" fill="#FFCC33" opacity=".5" />
          <circle cx="360" cy="30" r="3" fill="#FFCC33" opacity=".5" />
          <circle cx="370" cy="170" r="5" fill="#FFCC33" opacity=".4" />
          <circle cx="25" cy="180" r="3" fill="#FFCC33" opacity=".4" />
          <use href="#lol" transform="translate(85 95) rotate(14) scale(.7)" />
          <use href="#lol" transform="translate(318 92) rotate(-16) scale(.78)" />
          <use href="#lol" transform="translate(200 128) rotate(-6) scale(1.3)" />
        </svg>
        <p key={i} className="c-meme-text" style={{ fontSize: '6.4cqw' }}>{DEMO[i].text}</p>
      </div>
      <ol className="c-demo-list">
        {DEMO.map((d, n) => (
          <li key={d.text} className={n === i ? 'is-on' : ''}>
            <span>{d.text}</span>
            <b>{d.votes}</b>
          </li>
        ))}
      </ol>
    </div>
  )
}