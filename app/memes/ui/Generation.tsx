'use client'
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { sbBrowser } from '@/lib/sb/browser'
import { fontVars } from '@/lib/fonts'
import type { Meme } from '@/lib/types'
import MakeMemeDialog from './MakeMemeDialog'
import { reportError, type ErrorAction } from '@/lib/report'

// Meme generation runs here, above every page, so it keeps going while the user browses.
// The dialog only picks the photo; progress lives in a small tray in the corner,
// and any card can be expanded into a full view (and minimized back) at any time.

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
const STEP_DETAIL: Record<string, string> = {
  uploading: 'Uploading your photo',
  describing: 'AI is describing your photo',
  writing: 'AI is writing five captions',
}

type Ctx = {
  openMaker: () => void
  start: (blob: Blob) => void
  created: Meme[]
  running: number
  deleted: number[]
  markDeleted: (id: number) => void
  notify: (message: string) => void
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
  if (!res.ok) {
    const err = new Error(data.error || 'The AI is busy right now. Try again in a minute.') as Error & { detail?: string; status?: number }
    err.detail = data.detail
    err.status = res.status
    throw err
  }
  return data
}

export function GenerationProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([])
  const [created, setCreated] = useState<Meme[]>([])
  const [deleted, setDeleted] = useState<number[]>([])
  const [toast, setToast] = useState('')
  const [makerOpen, setMakerOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
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
      let step: ErrorAction = 'upload'
      try {
        patch(id, { stage: 'uploading', error: undefined, needsSignIn: false })
        const up = await supabase.storage.from('memes').upload(path, blob, { contentType: 'image/jpeg' })
        if (up.error) {
          if (/jwt|auth|unauthorized/i.test(up.error.message)) throw new Error('AUTH')
          throw new Error('The upload didn’t go through. Check your connection and try again.')
        }
        uploaded = true

        step = 'describe'
        patch(id, { stage: 'describing' })
        const d = await post('/api/describe', { path })
        patch(id, { stage: 'writing', description: d.description })

        step = 'captions'
        const c = await post('/api/captions', { path, description: d.description })
        setCreated((list) => [{ ...c.meme, ownerId: user.id, fresh: true }, ...list])
        patch(id, { stage: 'done', meme: c.meme })
      } catch (e: any) {
        if (uploaded) await supabase.storage.from('memes').remove([path]) // no orphaned files
        if (e?.message === 'AUTH') return patch(id, { stage: 'error', error: 'You were signed out.', needsSignIn: true })
        reportError(step, e, { sizeKb: Math.round(blob.size / 1024), status: e?.status, detail: e?.detail })
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
    setExpanded((e) => (e === id ? null : e))
    setJobs((list) => {
      const j = list.find((x) => x.id === id)
      if (j) URL.revokeObjectURL(j.preview)
      return list.filter((x) => x.id !== id)
    })
  }, [])

  const notify = useCallback((message: string) => setToast(message), [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3500)
    return () => clearTimeout(t)
  }, [toast])

  // A deleted meme disappears everywhere: feed, spotlight, Top captions, Battle, and its card in the tray
  const markDeleted = useCallback((id: number) => {
    setDeleted((list) => (list.includes(id) ? list : [...list, id]))
    setCreated((list) => list.filter((m) => m.id !== id))
    setJobs((list) => list.filter((j) => j.meme?.id !== id))
  }, [])

  // Anything that crashes in the browser gets logged for the Error log page
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError('crash', e.error ?? e.message, { source: e.filename, line: e.lineno })
    const onRejection = (e: PromiseRejectionEvent) => reportError('crash', e.reason, { kind: 'unhandled promise' })
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
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

  // The tray only belongs on signed-in Caption Club pages
  const onMemePages = ['/memes', '/profile', '/admin'].some((p) => pathname?.startsWith(p))

  return (
    <GenerationContext.Provider value={{ openMaker, start, created, running, deleted, markDeleted, notify }}>
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
        {toast && <div className="c-toast" role="status">{toast}</div>}
        {onMemePages && jobs.length > 0 && (
          <Tray jobs={jobs} onDismiss={dismiss} onRetry={(j) => run(j.id, j.blob)} onSeen={(id) => patch(id, { seen: true })} onExpand={setExpanded} />
        )}
        {onMemePages && (
          <ExpandedJob
            job={jobs.find((j) => j.id === expanded) ?? null}
            onMinimize={() => setExpanded(null)}
            onRetry={(j) => run(j.id, j.blob)}
            onSeen={(id) => { patch(id, { seen: true }); setExpanded(null) }}
          />
        )}
      </div>
    </GenerationContext.Provider>
  )
}

export function Tray({
  jobs,
  onDismiss,
  onRetry,
  onSeen,
  onExpand,
}: {
  jobs: Job[]
  onDismiss: (id: string) => void
  onRetry: (j: Job) => void
  onSeen: (id: string) => void
  onExpand: (id: string) => void
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
            <button className="c-job-thumb" onClick={() => onExpand(j.id)} aria-label="Expand to see full progress">
              <img className="c-job-img" src={j.preview} alt="" />
            </button>
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
                  <div className="c-job-actions">
                    <ExpandButton onClick={() => onExpand(j.id)} />
                  </div>
                </>
              )}

              {done && j.meme && (
                <>
                  <p className="c-job-note">“{j.meme.captions[0]?.content}” and 4 more, ready for votes.</p>
                  <div className="c-job-actions">
                    <Link href={`/memes/${j.meme.id}`} className="c-btn c-btn-primary c-btn-sm" onClick={() => onSeen(j.id)}>
                      View meme
                    </Link>
                    <ExpandButton onClick={() => onExpand(j.id)} />
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
                    <ExpandButton onClick={() => onExpand(j.id)} />
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

function ExpandButton({ onClick }: { onClick: () => void }) {
  return (
    <button className="c-btn c-btn-quiet c-btn-sm c-expand-btn" onClick={onClick}>
      <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
      </svg>
      Expand
    </button>
  )
}

// The full-size view of one meme in progress. Minimize sends it back to the corner; the work keeps going either way.
export function ExpandedJob({
  job,
  onMinimize,
  onRetry,
  onSeen,
}: {
  job: Job | null
  onMinimize: () => void
  onRetry: (j: Job) => void
  onSeen: (id: string) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (job && !d.open) d.showModal()
    if (!job && d.open) d.close()
  }, [job])

  const step = job ? STEPS.findIndex(([s]) => s === job.stage) : -1
  const done = job?.stage === 'done'
  const failed = job?.stage === 'error'
  const current = done ? STEPS.length : step
  const title = done ? 'Your meme is ready' : failed ? 'Couldn’t make this meme' : 'Making your meme'

  return (
    <dialog
      ref={ref}
      className="c-dialog c-expanded"
      aria-labelledby="expanded-title"
      onCancel={(e) => { e.preventDefault(); onMinimize() }}
      onClick={(e) => { if (e.target === e.currentTarget) onMinimize() }}
    >
      {job && (
        <>
          <div className="c-dialog-head">
            <h2 id="expanded-title">{title}</h2>
            <button className="c-btn c-btn-outline c-btn-sm" onClick={onMinimize}>
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 14h6v6M20 10h-6V4M14 10l7-7M3 21l7-7" />
              </svg>
              Minimize
            </button>
          </div>

          <div className="c-progress">
            <img className="c-progress-img" src={job.preview} alt="Your photo" />
            <div>
              {!failed && (
                <ol className="c-steps" aria-live="polite">
                  {STEPS.map(([s], i) => (
                    <li key={s} className={i < current ? 'done' : i === current ? 'active' : ''}>
                      <span className="c-dot" aria-hidden="true" />
                      {STEP_DETAIL[s]}
                    </li>
                  ))}
                </ol>
              )}

              {failed && (
                <div className="c-ai-box is-error">
                  <h3>What went wrong</h3>
                  <p>{job.error}</p>
                </div>
              )}

              {job.description && (
                <div className="c-ai-box">
                  <h3>What the AI sees</h3>
                  <p>{job.description}</p>
                </div>
              )}

              {done && job.meme && (
                <div className="c-ai-box">
                  <h3>Five captions, ready for votes</h3>
                  <ol className="c-ai-captions">{job.meme.captions.map((c) => <li key={c.id}>{c.content}</li>)}</ol>
                </div>
              )}

              {!done && !failed && (
                <p className="c-expanded-note">This keeps running if you minimize it, so feel free to keep voting.</p>
              )}

              <div className="c-actions">
                {done && job.meme && (
                  <Link href={`/memes/${job.meme.id}`} className="c-btn c-btn-primary" onClick={() => onSeen(job.id)}>View your meme</Link>
                )}
                {failed &&
                  (job.needsSignIn ? (
                    <button className="c-btn c-btn-primary" onClick={() => window.location.reload()}>Sign in again</button>
                  ) : (
                    <button className="c-btn c-btn-primary" onClick={() => onRetry(job)}>Try again</button>
                  ))}
                {!done && !failed && <button className="c-btn c-btn-primary" onClick={onMinimize}>Keep browsing</button>}
              </div>
            </div>
          </div>
        </>
      )}
    </dialog>
  )
}
