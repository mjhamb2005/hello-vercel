// Shared routing rules (used by middleware and auth routes)
export const HOME = '/memes'
export const NEXT_COOKIE = 'cc_next'
export const OLD_ROUTES = ['/dashboard', '/protected', '/books', '/jokes', '/gallery']

// Only allow same-site relative paths, so nobody can bounce users to an outside site
export function safePath(p?: string | null) {
  if (!p || !p.startsWith('/') || p.startsWith('//') || p.startsWith('/auth') || p.startsWith('/api') || p === '/') {
    return HOME
  }
  return p
}