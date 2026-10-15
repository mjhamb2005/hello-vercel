import type { User } from './types'

// The signed-in person as the app shows them. The photo and name they set on /profile win;
// their Google photo and name are the fallback. Every page's top bar uses this, so a new
// profile photo shows up everywhere at once.
export async function getViewer(
  supabase: any,
  user: { id: string; email?: string | null; user_metadata?: Record<string, any> }
): Promise<User> {
  const meta = user.user_metadata ?? {}
  const [{ data: profile }, adminRes] = await Promise.all([
    supabase.from('profiles').select('first_name, last_name, profile_photo_url').eq('id', user.id).maybeSingle(),
    // Admins (listed in the app_admins table) get the Error log link. Missing table = nobody is admin.
    supabase.rpc('is_app_admin'),
  ])

  const profileName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').trim()
  return {
    id: user.id,
    name: profileName || meta.full_name || meta.name || '',
    avatar: profile?.profile_photo_url || meta.avatar_url || meta.picture || null,
    isAdmin: adminRes?.data === true,
  }
}
