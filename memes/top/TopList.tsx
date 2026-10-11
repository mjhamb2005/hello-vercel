'use client'
import Link from 'next/link'
import type { User } from '@/lib/types'
import TopBar from '../ui/TopBar'
import MemeImage from '../ui/MemeImage'
import { useGeneration } from '../ui/Generation'

export type Row = { captionId: number; memeId: number; caption: string; score: number; url: string | null; description: string }

export default function TopList({ rows: allRows, user }: { rows: Row[]; user: User }) {
  const { deleted } = useGeneration()
  const rows = allRows.filter((r) => !deleted.includes(r.memeId))

  return (
    <>
      <TopBar user={user} />

      <section className="c-hero">
        <div>
          <h1>Top captions</h1>
          <p>The funniest captions across every photo, ranked by votes.</p>
        </div>
      </section>

      {rows.length === 0 ? (
        <div className="c-empty">
          <h2>Nobody’s on the podium yet</h2>
          <p>Vote on a few captions and the best ones show up here.</p>
          <Link href="/memes/battle" className="c-btn c-btn-primary">Start a battle</Link>
        </div>
      ) : (
        <>
          <ol className="c-podium" aria-label="Top three captions">
            {rows.slice(0, 3).map((r, i) => (
              <li key={r.captionId} style={{ display: 'contents' }}>
                <Link href={`/memes/${r.memeId}`} className={`c-place p${i + 1}${i === 0 ? ' c-lit' : ''}`}>
                  <MemeImage url={r.url} caption={r.caption} alt={r.description} />
                  <p className="c-place-caption">{r.caption}</p>
                  <p className="c-place-score" data-place={['1st', '2nd', '3rd'][i]}>
                    <b>{r.score}</b>{r.score === 1 ? 'vote' : 'votes'}
                  </p>
                  <span className="c-block" aria-label={`Place ${i + 1}`}>{i + 1}</span>
                </Link>
              </li>
            ))}
          </ol>

          {rows.length > 3 && (
            <ol className="c-board" start={4}>
              {rows.slice(3).map((r, i) => (
                <li key={r.captionId}>
                  <Link href={`/memes/${r.memeId}`} className="c-board-row">
                    <span className="c-board-rank">{i + 4}</span>
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
        </>
      )}
    </>
  )
}