'use client'
import { useEffect, useRef, useState } from 'react'
import { sbBrowser } from '@/lib/sb/browser'
import { reauth } from './MakeMemeDialog'
import { reportError } from '@/lib/report'
import MemeImage from './MemeImage'

// Deletes the meme row (its captions and votes go with it via ON DELETE CASCADE),
// then removes the photo from storage. The database only lets owners delete their own memes.
async function deleteMeme(id: number) {
  const supabase = sbBrowser()
  const { data, error } = await supabase.from('meme_images').delete().eq('id', id).select('storage_path')
  if (error) {
    if (/jwt|auth|401/i.test(error.message)) throw new Error('AUTH')
    throw new Error('The meme didn’t delete. Check your connection and try again.')
  }
  if (!data?.length) throw new Error('You can only delete memes you made.')
  await supabase.storage.from('memes').remove(data.map((r: { storage_path: string }) => r.storage_path))
}

const TrashIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
  </svg>
)

export default function DeleteMeme({
  memeId,
  preview,
  variant,
  onDeleted,
}: {
  memeId: number
  preview: { url: string | null; caption: string; alt: string }
  variant: 'chip' | 'button'
  onDeleted: (id: number) => void
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    if (!open && d.open) d.close()
  }, [open])

  function close() {
    if (busy) return
    setError('')
    setOpen(false)
  }

  async function confirm() {
    setBusy(true)
    setError('')
    try {
      await deleteMeme(memeId)
      setOpen(false)
      onDeleted(memeId)
    } catch (e: any) {
      if (e?.message === 'AUTH') return reauth()
      reportError('delete', e, { memeId })
      setError(e?.message || 'The meme didn’t delete. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      {variant === 'chip' ? (
        <button
          className="c-card-del"
          aria-label="Delete this meme"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        >
          <TrashIcon /> Delete
        </button>
      ) : (
        <button className="c-btn c-btn-danger" onClick={() => setOpen(true)}>
          <TrashIcon /> Delete meme
        </button>
      )}

      <dialog
        ref={ref}
        className="c-dialog c-confirm"
        aria-labelledby={`del-title-${memeId}`}
        onCancel={(e) => { e.preventDefault(); close() }}
        onClick={(e) => { if (e.target === e.currentTarget) close() }}
      >
        <div className="c-confirm-thumb">
          <MemeImage url={preview.url} caption={preview.caption} alt={preview.alt} />
        </div>
        <h2 id={`del-title-${memeId}`}>Delete this meme?</h2>
        <p>It disappears for everyone, along with its five captions and all their votes. You can’t undo this.</p>
        {error && <p className="c-error" role="alert">{error}</p>}
        <div className="c-confirm-actions">
          <button className="c-btn c-btn-outline" onClick={close} disabled={busy} autoFocus>Keep it</button>
          <button className="c-btn c-btn-solid-danger" onClick={confirm} disabled={busy}>
            {busy ? 'Deleting…' : 'Delete meme'}
          </button>
        </div>
      </dialog>
    </>
  )
}
