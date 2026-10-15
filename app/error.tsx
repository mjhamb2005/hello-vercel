'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { reportError } from '@/lib/report'
import './memes.css'

// Shown instead of a blank page if something on a page crashes. The crash is logged for the Error log.
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError('crash', error, { digest: error.digest, kind: 'page crashed' })
  }, [error])

  return (
    <main className="c-page">
      <div className="c-empty" style={{ marginTop: 120 }}>
        <h2>This page tripped over its own punchline</h2>
        <p>Something went wrong loading it. We’ve logged the problem. Try again, or head back to the feed.</p>
        <div className="c-actions" style={{ justifyContent: 'center' }}>
          <button className="c-btn c-btn-primary" onClick={reset}>Try again</button>
          <Link href="/memes" className="c-btn c-btn-outline">Back to the feed</Link>
        </div>
      </div>
    </main>
  )
}
