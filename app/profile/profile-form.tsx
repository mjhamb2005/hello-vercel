'use client'

import { useRef, useState } from 'react'

type Props = {
  firstName: string
  lastName: string
  photoUrl: string | null
  firstTime: boolean
}

export default function ProfileForm({ firstName, lastName, photoUrl, firstTime }: Props) {
  const [preview, setPreview] = useState<string | null>(photoUrl)
  const [saving, setSaving] = useState(false)
  const [photoError, setPhotoError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError('')
    if (file.size > 4 * 1024 * 1024) {
      setPhotoError('That photo is over 4 MB. Pick a smaller one.')
      e.target.value = ''
      return
    }
    setPreview(URL.createObjectURL(file)) // show the photo right away
  }

  const initials = ((firstName[0] ?? '') + (lastName[0] ?? '')).toUpperCase()

  return (
    <form
      action="/profile/save"
      method="post"
      encType="multipart/form-data"
      onSubmit={() => setSaving(true)}
    >
      {firstTime && <input type="hidden" name="next" value="feed" />}
      <div className="c-photo">
        <button type="button" className="c-photo-btn" onClick={() => fileInput.current?.click()} aria-label="Change photo">
          {preview ? <img src={preview} alt="" className="c-photo-img" /> : <div className="c-photo-img">{initials || '+'}</div>}
        </button>
        <button type="button" className="c-link-btn" onClick={() => fileInput.current?.click()}>
          {preview ? 'Change photo' : 'Add a photo'}
        </button>
      </div>
      {photoError && <p className="c-error c-photo-error" role="alert">{photoError}</p>}
      <input
        ref={fileInput}
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPhotoChange}
        hidden
      />

      <div className="c-fields">
        <div className="c-field">
          <label htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" defaultValue={firstName} required />
        </div>
        <div className="c-field">
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" defaultValue={lastName} required />
        </div>
      </div>

      <button type="submit" className="c-btn c-btn-primary" disabled={saving}>
        {saving ? 'Saving…' : firstTime ? 'Save and start voting' : 'Save profile'}
      </button>
    </form>
  )
}