import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="c-page">
      <div className="c-empty" style={{ marginTop: 120 }}>
        <h2>Wrong room</h2>
        <p>There’s no page at this address. The show is back in the feed.</p>
        <Link href="/memes" className="c-btn c-btn-primary">Go to the feed</Link>
      </div>
    </main>
  )
}
