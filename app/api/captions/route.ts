import { NextResponse } from 'next/server'
import { sbServer } from '@/lib/sb/server'
import { builtInChain, finishRequest, loadChain, pickChain, runTextSteps, startRequest, type Chain } from '@/lib/chain'

export const maxDuration = 60

// Prompt chain, steps 2+: turn the description into captions with the same chain step 1 used, then save everything.
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

  // Continue the request /api/describe started (only the owner can see it). If it's missing, start a fresh one.
  let requestId: number | null = Number.isInteger(body?.requestId) ? body.requestId : null
  let startedAt: string | number = Date.now()
  let chain: Chain
  const { data: req } = requestId
    ? await supabase.from('generation_requests').select('id, chain_id, caption_count, created_at, storage_path').eq('id', requestId).maybeSingle()
    : { data: null }
  if (req && req.storage_path === path) {
    startedAt = req.created_at
    chain = req.chain_id ? await loadChain(supabase, req.chain_id, req.caption_count ?? 5) : builtInChain('Started on built-in prompts', req.caption_count ?? 5)
  } else {
    chain = await pickChain(supabase)
    requestId = await startRequest(supabase, { userId: user.id, source: 'caption_club', chain, storagePath: path })
  }

  let captions: string[]
  let caption_prompt: string
  try {
    ;({ captions, captionPrompt: caption_prompt } = await runTextSteps(supabase, requestId, chain, description))
  } catch (e: any) {
    console.error('captions failed', e)
    await finishRequest(supabase, requestId, { status: 'failed', startedAt, failedStep: e?.failedStep ?? 2, error: String(e?.message ?? e) })
    return NextResponse.json({ error: 'The AI couldn’t write captions. Try again.', detail: String(e?.message ?? e).slice(0, 500) }, { status: 502 })
  }

  const fail = async (status: number, error: string, detail: string) => {
    await finishRequest(supabase, requestId, { status: 'failed', startedAt, error: `Save failed: ${detail}` })
    return NextResponse.json({ error, detail }, { status })
  }

  const { data: image, error: imageError } = await supabase
    .from('meme_images')
    .insert({ user_id: user.id, storage_path: path, description, description_prompt: chain.steps[0].template })
    .select('id, description')
    .single()

  if (imageError || !image) {
    const duplicate = imageError?.code === '23505'
    return fail(duplicate ? 409 : 500, duplicate ? 'This photo was already turned into a meme.' : 'We couldn’t save your meme. Try again.', imageError?.message ?? 'no row')
  }

  const { data: rows, error: captionError } = await supabase
    .from('meme_captions')
    .insert(captions.map((content) => ({ image_id: image.id, content, caption_prompt })))
    .select('id, content')
    .order('id')

  if (captionError || !rows) {
    await supabase.from('meme_images').delete().eq('id', image.id) // don't leave a meme with no captions
    return fail(500, 'We couldn’t save the captions. Try again.', captionError?.message ?? 'no rows')
  }

  await finishRequest(supabase, requestId, { status: 'succeeded', startedAt, memeImageId: image.id })
  const { data: signed } = await supabase.storage.from('memes').createSignedUrl(path, 60 * 60 * 6)

  return NextResponse.json({
    meme: { id: image.id, url: signed?.signedUrl ?? null, description: image.description, captions: rows },
  })
}
