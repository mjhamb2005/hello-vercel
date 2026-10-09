'use client'
import { useEffect, useRef, useState, type DragEvent } from 'react'

// If the session is gone, reload: the proxy sends them to sign in and back here afterwards
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

// Picks and checks the photo, then hands it off. The AI work runs in the background (see Generation.tsx).
export default function MakeMemeDialog({
  open,
  onClose,
  onPicked,
}: {
  open: boolean
  onClose: () => void
  onPicked: (blob: Blob) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState('')
  const [over, setOver] = useState(false)
  const [reading, setReading] = useState(false)

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  function close() {
    setError('')
    onClose()
  }

  async function handle(file: File | undefined) {
    if (!file || reading) return
    setError('')
    if (!file.type.startsWith('image/')) return setError('That file isn’t an image. Choose a JPG, PNG, WebP or GIF.')
    if (file.size > 25 * 1024 * 1024) return setError('That image is over 25 MB. Choose a smaller one.')
    setReading(true)
    try {
      onPicked(await toJpeg(file))
    } catch {
      setError('Your browser can’t read this image format. Try a JPG or PNG.')
    } finally {
      setReading(false)
    }
  }

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
        <button className="c-x" onClick={close} aria-label="Close">×</button>
      </div>

      <label
        className={`c-drop${over ? ' is-over' : ''}`}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files?.[0]) }}
      >
        <input type="file" accept="image/*" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = '' }} />
        <span className="c-drop-icon" aria-hidden="true">+</span>
        <strong>{reading ? 'Reading your photo…' : 'Drop a photo here, or click to choose one'}</strong>
        <span>AI describes it, then writes five captions. It runs in the corner, so you can keep voting while you wait.</span>
      </label>
      {error && <p className="c-error" role="alert">{error}</p>}
    </dialog>
  )
}
