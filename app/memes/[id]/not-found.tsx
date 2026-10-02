import Link from 'next/link'
import { fontVars } from '@/lib/fonts'
import '../../memes.css'

export default function NotFound() {
  return (
    <main className={`c-page ${fontVars}`}>
      <div className="c-empty" style={{ marginTop: 120 }}>
        <h2>This meme doesn’t exist</h2>
        <p>It may have been deleted, or the link is wrong.</p>
        <Link href="/memes" className="c-btn c-btn-primary">See all memes</Link>
      </div>
    </main>
  )
}