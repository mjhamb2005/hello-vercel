import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createSupabaseServer } from '@/lib/supabase-server'

export async function POST(request: Request) {
  const origin = new URL(request.url).origin

  // 1. Who is logged in?
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(`${origin}/login`, 303)

  // 2. Read what they typed in the form
  const formData = await request.formData()
  const firstName = String(formData.get('first_name') ?? '').trim()
  const lastName = String(formData.get('last_name') ?? '').trim()
  const photo = formData.get('photo')

  const updates: {
    first_name: string
    last_name: string
    profile_photo_url?: string
  } = { first_name: firstName, last_name: lastName }

  // 3. If they picked a photo, upload it to the avatars bucket
  if (photo instanceof File && photo.size > 0) {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const path = `${user.id}/avatar` // same spot every time, so a new photo replaces the old one

    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(path, photo, { upsert: true, contentType: photo.type })

    if (uploadError) {
      console.error('Upload error:', uploadError.message)
      return NextResponse.redirect(`${origin}/profile`, 303)
    }

    const { data } = admin.storage.from('avatars').getPublicUrl(path)
    // The ?v= part makes browsers show the new photo instead of an old saved copy
    updates.profile_photo_url = `${data.publicUrl}?v=${Date.now()}`
  }

  // 4. Save name (and photo link) into the profiles table
  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)
  if (error) console.error('Save error:', error.message)

  return NextResponse.redirect(`${origin}/dashboard`, 303)
}