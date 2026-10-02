'use client'
import { useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { User } from '@/lib/types'
import TopBar from '../ui/TopBar'
import MemeImage from '../ui/MemeImage'
import MakeMemeDialog from '../ui/MakeMemeDialog'

export type Row = { captionId: number; memeId: number; caption: string; score: number; url: string | null; description: string }

export default function TopList({ rows, user }: { rows: Row[]; user: User }) {
  const router = useRouter()
  const [making, setMaking] = useState(false)

  return (
    <>
      <TopBar user={user} onMake={() => setMaking(true)} />

      <section className="c-hero">
        <h1>Top captions.</h1>
        <p>The ten funniest captions across every meme, ranked by votes.</p>
      </section>

      {rows.length === 0 ? (
        <div className="c-empty">
          <h2>No votes yet</h2>
          <p>Vote on a few captions and the best ones will show up here.</p>
          <Link href="/memes" className="c-btn c-btn-primary">Go vote</Link>
        </div>
      ) : (
        <ol className="c-board">
          {rows.map((r, i) => (
            <li key={r.captionId} style={{ '--i': i } as CSSProperties}>
              <Link href={`/memes/${r.memeId}`} className={`c-board-row${i === 0 ? ' is-first' : ''}`}>
                <span className="c-board-rank">{i + 1}</span>
                <div className="c-board-meme">
                  <MemeImage url={r.url} caption={r.caption} alt={r.description} />
                </div>
                <p className="c-board-caption">{r.caption}</p>
                <span className="c-board-score"><b>{r.score}</b>{r.score === 1 ? 'vote' : 'votes'}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}

      <MakeMemeDialog
        open={making}
        userId={user.id}
        onClose={() => setMaking(false)}
        onCreated={() => {}}
        onView={(id) => router.push(`/memes/${id}`)}
      />
    </>
  )
}