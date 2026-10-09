'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sbBrowser } from '@/lib/sb/browser'
import { fontVars } from '@/lib/fonts'
import type { Meme } from '@/lib/types'
import MakeMemeDialog from './MakeMemeDialog'

// Meme generation runs here, above every page, so it keeps going while the user browses.
// The dialog only picks the photo; progress lives in a small tray in the corner.

export type Stage = 'uploading' | 'describing' | 'writing' | 'done' | 'error'
export type Job = {
  id: string
  blob: Blob
  preview: string
  stage: Stage
  description?: string
  meme?: Meme
  error?: string
  needsSignIn?: boolean
  seen: boolean
}

const STEPS: [Stage, string][] = [
  ['uploading', 'Uploading'],
  ['describing', 'Describing your photo'],
  ['writing', 'Writing five captions'],
]

type Ctx = {
  openMaker: () => void
  start: (blob: Blob) => void
  created: Meme[]
  running: number
}
const GenerationContext = createContext<Ctx | null>(null)

export function useGeneration() {
  const ctx = useContext(GenerationContext)
  if (!ctx) throw new Error('useGeneration must be used inside <GenerationProvider>')
  return ctx
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (res.status === 401) throw new Error('AUTH')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'The AI is busy right now. Try again in a minute.')
  return data
}

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [created, setCreated] = useState<Meme[]>([])
  const [makerOpen, setMakerOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const pathname = usePathname()
  const baseTitle = useRef<string | null>(null)

  const patch = useCallback((id: string, p: Partial<Job>) => {
    setJobs((list) => list.map((j) => (j.id === id ? { ...j, ...p } : j)))
  }, [])

  const run = useCallback(
    async (id: string, blob: Blob) => {
      const supabase = sbBrowser()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return patch(id, { stage: 'error', error: 'You were signed out.', needsSignIn: true })

      const path = `${user.id}/${crypto.randomUUID()}.jpg`
      let uploaded = false
      try {
        patch(id, { stage: 'uploading', error: undefined, needsSignIn: false })
        const up = await supabase.storage.from('memes').upload(path, blob, { contentType: 'image/jpeg' })
        if (up.error) {
          if (/jwt|auth|unauthorized/i.test(up.error.message)) throw new Error('AUTH')
          throw new Error('The upload didn’t go through. Check your connection and try again.')
        }
        uploaded = true

        patch(id, { stage: 'describing' })
        const d = await post('/api/describe', { path })
        patch(id, { stage: 'writing', description: d.description })

        const c = await post('/api/captions', { path, description: d.description })
        setCreated((list) => [{ ...c.meme, fresh: true }, ...list])
        patch(id, { stage: 'done', meme: c.meme })
      } catch (e: any) {
        if (uploaded) await supabase.storage.from('memes').remove([path]) // no orphaned files
        if (e?.message === 'AUTH') return patch(id, { stage: 'error', error: 'You were signed out.', needsSignIn: true })
        patch(id, { stage: 'error', error: e?.message || 'Something went wrong. Try again.' })
      }
    },
    [patch]
  )

  const start = useCallback(
    (blob: Blob) => {
      const id = crypto.randomUUID()
      setJobs((list) => [...list, { id, blob, preview: URL.createObjectURL(blob), stage: 'uploading', seen: false }])
      run(id, blob)
    },
    [run]
  )

  const dismiss = useCallback((id: string) => {
    setJobs((list) => {
      const j = list.find((x) => x.id === id)
      if (j) URL.revokeObjectURL(j.preview)
      return list.filter((x) => x.id !== id)
    })
  }, [])

  const openMaker = useCallback(async () => {
    if (!userId) {
      const { data: { user } } = await sbBrowser().auth.getUser()
      if (!user) return window.location.reload()
      setUserId(user.id)
    }
    setMakerOpen(true)
  }, [userId])

  const running = jobs.filter((j) => j.stage !== 'done' && j.stage !== 'error').length
  const unseen = jobs.filter((j) => j.stage === 'done' && !j.seen).length

  // A full page reload would kill a running job, so warn first. Client-side navigation is fine.
  useEffect(() => {
    if (!running) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [running])

  // If they switched tabs, flag finished memes in the tab title: "(1) Meme ready"
  useEffect(() => {
    if (baseTitle.current === null) baseTitle.current = document.title
    const update = () => {
      if (document.visibilityState === 'visible') {
        document.title = baseTitle.current ?? document.title
        return
      }
      if (unseen > 0) document.title = `(${unseen}) Meme ready · ${baseTitle.current}`
    }
    update()
    document.addEventListener('visibilitychange', update)
    return () => document.removeEventListener('visibilitychange', update)
  }, [unseen])

  // Opening the finished meme counts as seeing it
  useEffect(() => {
    setJobs((list) =>
      list.some((j) => j.meme && pathname === `/memes/${j.meme.id}` && !j.seen)
        ? list.map((j) => (j.meme && pathname === `/memes/${j.meme.id}` ? { ...j, seen: true } : j))
        : list
    )
  }, [pathname])

  // Finished cards tidy themselves away 12 seconds after they've been seen
  useEffect(() => {
    const seenDone = jobs.filter((j) => j.stage === 'done' && j.seen)
    if (!seenDone.length) return
    const t = setTimeout(() => seenDone.forEach((j) => dismiss(j.id)), 12000)
    return () => clearTimeout(t)
  }, [jobs, dismiss])

  // The tray only belongs on the Caption Club pages
  const onMemePages = pathname?.startsWith('/memes') ?? false

  return (
    <GenerationContext.Provider value={{ openMaker, start, created, running }}>
      {children}
      <div className={`c-gen ${fontVars}`}>
        {userId && (
          <MakeMemeDialog
            open={makerOpen}
            onClose={() => setMakerOpen(false)}
            onPicked={(blob) => {
              setMakerOpen(false)
              start(blob)
            }}
          />
        )}
        {onMemePages && jobs.length > 0 && (
          <Tray jobs={jobs} onDismiss={dismiss} onRetry={(j) => run(j.id, j.blob)} onSeen={(id) => patch(id, { seen: true })} />
        )}
      </div>
    </GenerationContext.Provider>
  )
}

function Tray({
  jobs,
  onDismiss,
  onRetry,
  onSeen,
}: {
  jobs: Job[]
  onDismiss: (id: string) => void
  onRetry: (j: Job) => void
  onSeen: (id: string) => void
}) {
  return (
    <section className="c-tray" aria-label="Memes in progress" aria-live="polite">
      {jobs.map((j) => {
        const step = STEPS.findIndex(([s]) => s === j.stage)
        const done = j.stage === 'done'
        const failed = j.stage === 'error'
        const label = done ? 'Your meme is ready' : failed ? 'Couldn’t make this meme' : `${STEPS[step][1]}…`
        return (
          <article key={j.id} className={`c-job${done ? ' is-done' : ''}${failed ? ' is-error' : ''}`}>
            <img className="c-job-img" src={j.preview} alt="" />
            <div className="c-job-body">
              <p className="c-job-title">{label}</p>

              {!done && !failed && (
                <>
                  <div className="c-job-bar" role="progressbar" aria-valuemin={0} aria-valuemax={3} aria-valuenow={step} aria-label="Progress">
                    {STEPS.map(([s], i) => (
                      <span key={s} className={i < step ? 'done' : i === step ? 'active' : ''} />
                    ))}
                  </div>
                  <p className="c-job-note">
                    {j.description ? `AI sees: ${j.description}` : 'Keep browsing. We’ll let you know when it’s ready.'}
                  </p>
                </>
              )}

              {done && j.meme && (
                <>
                  <p className="c-job-note">“{j.meme.captions[0]?.content}” and 4 more, ready for votes.</p>
                  <div className="c-job-actions">
                    <Link href={`/memes/${j.meme.id}`} className="c-btn c-btn-primary c-btn-sm" onClick={() => onSeen(j.id)}>
                      View meme
                    </Link>
                  </div>
                </>
              )}

              {failed && (
                <>
                  <p className="c-job-note">{j.error}</p>
                  <div className="c-job-actions">
                    {j.needsSignIn ? (
                      <button className="c-btn c-btn-primary c-btn-sm" onClick={() => window.location.reload()}>Sign in again</button>
                    ) : (
                      <button className="c-btn c-btn-primary c-btn-sm" onClick={() => onRetry(j)}>Try again</button>
                    )}
                  </div>
                </>
              )}
            </div>
            {(done || failed) && (
              <button className="c-x c-job-x" onClick={() => onDismiss(j.id)} aria-label="Dismiss">×</button>
            )}
          </article>
        )
      })}
    </section>
  )
}
