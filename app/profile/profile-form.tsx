'use client'

import { useRef, useState } from 'react'

type Props = {
  firstName: string
  lastName: string
  photoUrl: string | null
}

export default function ProfileForm({ firstName, lastName, photoUrl }: Props) {
  const [preview, setPreview] = useState<string | null>(photoUrl)
  const [saving, setSaving] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) {
      alert('Please pick a photo under 4 MB.')
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
      <button
        type="button"
        className="hv-avatar-button"
        onClick={() => fileInput.current?.click()}
        aria-label="Change photo"
      >
        {preview ? (
          <img src={preview} alt="" className="hv-avatar" />
        ) : (
          <div className="hv-avatar">{initials || '+'}</div>
        )}
      </button>
      <button
        type="button"
        className="hv-link-button"
        onClick={() => fileInput.current?.click()}
      >
        {preview ? 'Change photo' : 'Add a photo'}
      </button>
      <input
        ref={fileInput}
        type="file"
        name="photo"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPhotoChange}
        hidden
      />

      <div className="hv-row">
        <div className="hv-field">
          <label className="hv-label" htmlFor="first_name">First name</label>
          <input id="first_name" name="first_name" className="hv-input" defaultValue={firstName} required />
        </div>
        <div className="hv-field">
          <label className="hv-label" htmlFor="last_name">Last name</label>
          <input id="last_name" name="last_name" className="hv-input" defaultValue={lastName} required />
        </div>
      </div>

      <button type="submit" className="hv-button" disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </button>
    </form>
  )
}