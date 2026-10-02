'use client'
import { useEffect, useRef, useState, type DragEvent } from 'react'
import { sbBrowser } from '@/lib/sb/browser'
import type { Meme } from '@/lib/types'

type Stage = 'idle' | 'uploading' | 'describing' | 'writing' | 'done' | 'error'
const STEPS: [Stage, string][] = [
  ['uploading', 'Uploading your photo'],
  ['describing', 'AI is describing your photo'],
  ['writing', 'AI is writing five captions'],
]

// If the session is gone, reload: middleware sends them to sign in and back here afterwards
export const reauth = () => window.location.reload()

// Shrink to max 1600px and convert to JPEG: fast uploads, one format for the AI
async function toJpeg(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale)
  canvas.height = Math.round(bitmap.height * scale)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('No canvas')
  ctx.fillStyle = '#ffffff' // transparent PNGs get white instead of black
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encode failed'))), 'image/jpeg', 0.86)
  )
}

async function post(url: string, body: unknown) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (res.status === 401) throw new Error('AUTH')
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'The AI is busy right now. Try again in a minute.')
  return data
}

export default function MakeMemeDialog({
  open,
  userId,
  onClose,
  onCreated,
  onView,
}: {
  open: boolean
  userId: string
  onClose: () => void
  onCreated: (meme: Meme) => void
  onView: (id: number) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [stage, setStage] = useState<Stage>('idle')
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [meme, setMeme] = useState<Meme | null>(null)
  const [over, setOver] = useState(false)
  const busy = stage === 'uploading' || stage === 'describing' || stage === 'writing'

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  // Warn before leaving the page mid-way
  useEffect(() => {
    if (!busy) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [busy])

  function reset() {
    if (preview) URL.revokeObjectURL(preview)
    setStage('idle')
    setError('')
    setPreview(null)
    setDescription('')
    setMeme(null)
  }

  function close() {
    if (busy) return
    reset()
    onClose()
  }

  function fail(message: string) {
    setStage('error')
    setError(message)
  }

  async function handle(file: File | undefined) {
    if (!file || busy) return
    setError('')
    setDescription('')
    setMeme(null)

    if (!file.type.startsWith('image/')) return fail('That file isn’t an image. Choose a JPG, PNG, WebP or GIF.')
    if (file.size > 25 * 1024 * 1024) return fail('That image is over 25 MB. Choose a smaller one.')

    let blob: Blob
    try {
      blob = await toJpeg(file)
    } catch {
      return fail('Your browser can’t read this image format. Try a JPG or PNG.')
    }
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(blob))

    const supabase = sbBrowser()
    const path = `${userId}/${crypto.randomUUID()}.jpg`
    let uploaded = false

    try {
      setStage('uploading')
      const up = await supabase.storage.from('memes').upload(path, blob, { contentType: 'image/jpeg' })
      if (up.error) {
        if (/jwt|auth|unauthorized/i.test(up.error.message)) throw new Error('AUTH')
        throw new Error('The upload didn’t go through. Check your connection and try again.')
      }
      uploaded = true

      setStage('describing')
      const d = await post('/api/describe', { path })
      setDescription(d.description)

      setStage('writing')
      const c = await post('/api/captions', { path, description: d.description })
      setMeme(c.meme)
      onCreated(c.meme)
      setStage('done')
    } catch (e: any) {
      if (uploaded) await supabase.storage.from('memes').remove([path]) // no orphaned files
      if (e?.message === 'AUTH') return reauth()
      setPreview(null)
      fail(e?.message || 'Something went wrong. Try again.')
    }
  }

  const current = stage === 'done' ? STEPS.length : STEPS.findIndex(([s]) => s === stage)
  const showProgress = busy || stage === 'done'

  return (
    <dialog
      ref={ref}
      className="c-dialog"
      aria-labelledby="make-title"
      onCancel={(e) => {
        e.preventDefault()
        close()
      }}
    >
      <div className="c-dialog-head">
        <h2 id="make-title">Make a meme</h2>
        <button className="c-x" onClick={close} disabled={busy} aria-label="Close">×</button>
      </div>

      {!showProgress && (
        <>
          <label
            className={`c-drop${over ? ' is-over' : ''}`}
            onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true) }}
            onDragLeave={() => setOver(false)}
            onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]) }}
          >
            <input type="file" accept="image/*" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
            <span className="c-drop-icon" aria-hidden="true">+</span>
            <strong>Drop a photo here, or click to choose one</strong>
            <span>AI will describe it, then write five captions for everyone to vote on.</span>
          </label>
          {error && <p className="c-error" role="alert">{error}</p>}
        </>
      )}

      {showProgress && (
        <div className="c-progress">
          {preview && <img className="c-progress-img" src={preview} alt="Your photo" />}
          <div>
            <ol className="c-steps" aria-live="polite">
              {STEPS.map(([s, label], i) => (
                <li key={s} className={i < current ? 'done' : i === current ? 'active' : ''}>
                  <span className="c-dot" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ol>

            {description && (
              <div className="c-ai-box">
                <h3>What the AI sees</h3>
                <p>{description}</p>
              </div>
            )}

            {meme && (
              <div className="c-ai-box c-ai-captions">
                <h3>Five captions, ready for votes</h3>
                <ol>{meme.captions.map((c) => <li key={c.id}>{c.content}</li>)}</ol>
                <div className="c-actions">
                  <button className="c-btn c-btn-primary" onClick={() => { const id = meme.id; reset(); onClose(); onView(id) }}>
                    View your meme
                  </button>
                  <button className="c-btn c-btn-outline" onClick={reset}>Make another</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  )
}