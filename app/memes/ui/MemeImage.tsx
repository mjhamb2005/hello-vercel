'use client'
import { useState } from 'react'

// Shorter captions get bigger text, so every caption fits the image
export function captionSize(text: string) {
  const n = text.length
  return n <= 24 ? 9 : n <= 45 ? 7.2 : n <= 75 ? 5.8 : 4.6
}

export default function MemeImage({ url, caption, alt, label }: { url: string | null; caption: string; alt: string; label?: string }) {
  const [broken, setBroken] = useState(false)
  return (
    <div className="c-meme">
      {url && !broken ? (
        <img src={url} alt={alt} onError={() => setBroken(true)} />
      ) : (
        <div className="c-meme-missing">This image link expired. Refresh the page to view it.</div>
      )}
      {caption && (
        <p key={caption} className="c-meme-text" style={{ fontSize: `${captionSize(caption)}cqw` }}>{caption}</p>
      )}
      {label && <span className="c-meme-label">{label}</span>}
    </div>
  )
}