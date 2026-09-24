export const dynamic = 'force-dynamic'
import { supabase } from '@/lib/supabase'

export default async function BooksPage() {
  const { data: books, error } = await supabase
    .from('books')
    .select('*')
    .order('id')

  if (error) {
    return (
      <main style={styles.page}>
        <div style={styles.errorCard}>
          <h1>Something went wrong</h1>
          <p>{error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.eyebrow}>MY LIBRARY</p>
            <h1 style={styles.title}>Bookshelf</h1>
            <p style={styles.subtitle}>
              A collection of books powered by Supabase.
            </p>
          </div>

          <div style={styles.badge}>
            {books?.length ?? 0} books
          </div>
        </div>

        <div style={styles.grid}>
          {books?.map((book, index) => (
            <div key={book.id} style={styles.card}>
              <div style={styles.number}>
                {String(index + 1).padStart(2, '0')}
              </div>

              <div style={styles.bookInfo}>
                <h2 style={styles.bookTitle}>{book.title}</h2>
                <p style={styles.author}>by {book.author}</p>
              </div>

              <div style={styles.arrow}>→</div>
            </div>
          ))}
        </div>

        <footer style={styles.footer}>
          <span>Connected to Supabase</span>
          <span style={styles.dot}>●</span>
          <span>Next.js</span>
        </footer>
      </div>
    </main>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #312e81 100%)',
    color: '#f8fafc',
    padding: '60px 24px',
    fontFamily: 'Arial, sans-serif',
  },

  container: {
    maxWidth: '900px',
    margin: '0 auto',
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: '20px',
    marginBottom: '40px',
  },

  eyebrow: {
    color: '#a5b4fc',
    fontSize: '13px',
    fontWeight: '700',
    letterSpacing: '3px',
    margin: '0 0 10px',
  },

  title: {
    fontSize: '56px',
    lineHeight: '1',
    margin: '0 0 14px',
    letterSpacing: '-2px',
  },

  subtitle: {
    color: '#cbd5e1',
    fontSize: '17px',
    margin: 0,
  },

  badge: {
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: '999px',
    padding: '10px 18px',
    color: '#e0e7ff',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },

  grid: {
    display: 'grid',
    gap: '16px',
  },

  card: {
    display: 'flex',
    alignItems: 'center',
    gap: '22px',
    padding: '24px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '20px',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 12px 30px rgba(0,0,0,0.15)',
  },

  number: {
    color: '#818cf8',
    fontSize: '14px',
    fontWeight: '700',
    minWidth: '30px',
  },

  bookInfo: {
    flex: 1,
  },

  bookTitle: {
    margin: '0 0 7px',
    fontSize: '22px',
    color: '#ffffff',
  },

  author: {
    margin: 0,
    color: '#cbd5e1',
    fontSize: '15px',
  },

  arrow: {
    color: '#a5b4fc',
    fontSize: '26px',
  },

  footer: {
    marginTop: '35px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '10px',
    color: '#94a3b8',
    fontSize: '13px',
  },

  dot: {
    color: '#818cf8',
  },

  errorCard: {
    maxWidth: '600px',
    margin: '100px auto',
    padding: '30px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '20px',
  },
}