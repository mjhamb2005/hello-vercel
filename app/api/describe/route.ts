import { NextResponse } from 'next/server'
import { sbServer } from '@/lib/sb/server'
import { describeImage } from '@/lib/ai'

export const maxDuration = 60

// Prompt chain, step 1: look at the uploaded image and describe it in words.
export async function POST(request: Request) {
  const supabase = await sbServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to make a meme.' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const path = typeof body?.path === 'string' ? body.path : ''
  if (!path.startsWith(`${user.id}/`) || path.includes('..')) {
    return NextResponse.json({ error: 'That upload doesn’t belong to you.' }, { status: 403 })
  }

  const { data: file, error } = await supabase.storage.from('memes').download(path)
  if (error || !file) return NextResponse.json({ error: 'We couldn’t find your upload. Try again.' }, { status: 404 })

  try {
    const description = await describeImage(Buffer.from(await file.arrayBuffer()).toString('base64'))
    if (!description) throw new Error('Empty description')
    return NextResponse.json({ description: description.slice(0, 2000) })
  } catch (e) {
    console.error('describe failed', e)
    return NextResponse.json({ error: 'The AI couldn’t read this photo. Try again in a minute.' }, { status: 502 })
  }
}