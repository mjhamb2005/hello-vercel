import { NextResponse } from 'next/server'
import { sbServer } from '@/lib/sb/server'
import { finishRequest, logStep, pickChain, render, runStep, startRequest } from '@/lib/chain'

export const maxDuration = 60

// Prompt chain, step 1: pick a chain from the mix, look at the uploaded image and describe it in words.
// Starts a generation_requests row that /api/captions finishes.
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
  if (error || !file) return NextResponse.json({ error: 'We couldn’t find your upload. Try again.', detail: error?.message ?? 'file missing' }, { status: 404 })

  const chain = await pickChain(supabase)
  const requestId = await startRequest(supabase, { userId: user.id, source: 'caption_club', chain, storagePath: path })
  const startedAt = Date.now()
  const step = chain.steps[0]

  try {
    const result = await runStep(step, render(step.template, chain, {}), Buffer.from(await file.arrayBuffer()).toString('base64'))
    await logStep(supabase, requestId, step, { result })
    return NextResponse.json({ description: result.text.slice(0, 2000), requestId })
  } catch (e: any) {
    console.error('describe failed', e)
    await logStep(supabase, requestId, step, { error: e })
    await finishRequest(supabase, requestId, { status: 'failed', startedAt, failedStep: 1, error: String(e?.message ?? e) })
    return NextResponse.json({ error: 'The AI couldn’t read this photo. Try again in a minute.', detail: String(e?.message ?? e).slice(0, 500) }, { status: 502 })
  }
}
