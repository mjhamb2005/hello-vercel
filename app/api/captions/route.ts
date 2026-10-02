import { NextResponse } from 'next/server'
import { sbServer } from '@/lib/sb/server'
import { writeCaptions } from '@/lib/ai'

export const maxDuration = 60

// Prompt chain, step 2: turn the description into 5 funny captions, then save everything.
export async function POST(request: Request) {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to make a meme.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const path = typeof body?.path === 'string' ? body.path : ''
  const description = typeof body?.description === 'string' ? body.description.trim().slice(0, 2000) : ''
  if (!path.startsWith(`${user.id}/`) || path.includes('..')) {
    return NextResponse.json({ error: 'That upload doesn’t belong to you.' }, { status: 403 })
  }
  if (!description) return NextResponse.json({ error: 'The photo description is missing.' }, { status: 400 })

  let captions: string[]
  try {
    captions = await writeCaptions(description)
  } catch (e) {
    console.error('captions failed', e)
    return NextResponse.json({ error: 'The AI couldn’t write captions. Try again.' }, { status: 502 })
  }

  const { data: image, error: imageError } = await supabase
    .from('meme_images')
    .insert({ user_id: user.id, storage_path: path, description })
    .select('id, description')
    .single()

  if (imageError || !image) {
    const duplicate = imageError?.code === '23505'
    return NextResponse.json(
      { error: duplicate ? 'This photo was already turned into a meme.' : 'We couldn’t save your meme. Try again.' },
      { status: duplicate ? 409 : 500 }
    )
  }

  const { data: rows, error: captionError } = await supabase
    .from('meme_captions')
    .insert(captions.map((content) => ({ image_id: image.id, content })))
    .select('id, content')
    .order('id')

  if (captionError || !rows) {
    await supabase.from('meme_images').delete().eq('id', image.id) // don't leave a meme with no captions
    return NextResponse.json({ error: 'We couldn’t save the captions. Try again.' }, { status: 500 })
  }

  const { data: signed } = await supabase.storage.from('memes').createSignedUrl(path, 60 * 60 * 6)

  return NextResponse.json({
    meme: { id: image.id, url: signed?.signedUrl ?? null, description: image.description, captions: rows },
  })
}