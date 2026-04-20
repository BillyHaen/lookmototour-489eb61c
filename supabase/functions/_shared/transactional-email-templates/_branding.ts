// Shared brand constants for all LookMotoTour transactional email templates.
// Keep visually consistent with auth email templates.

export const SITE_NAME = 'LookMotoTour'
export const SITE_URL = 'https://lookmototour.com'
export const LOGO_URL =
  'https://efrwzkdfkfvedtdrxrfg.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const styles = {
  main: { backgroundColor: '#ffffff', fontFamily: "'Montserrat', 'Inter', Arial, sans-serif" },
  container: { padding: '20px 25px', maxWidth: '560px', margin: '0 auto' },
  logo: { margin: '0 0 24px' },
  h1: { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 16px' },
  h2: { fontSize: '16px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '20px 0 8px' },
  text: { fontSize: '14px', color: 'hsl(220, 10%, 30%)', lineHeight: '1.6', margin: '0 0 16px' },
  muted: { fontSize: '13px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.5', margin: '0 0 12px' },
  link: { color: 'hsl(199, 89%, 48%)', textDecoration: 'underline' },
  button: {
    backgroundColor: 'hsl(199, 89%, 48%)',
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 'bold' as const,
    borderRadius: '12px',
    padding: '12px 24px',
    textDecoration: 'none',
    display: 'inline-block',
  },
  card: {
    backgroundColor: 'hsl(220, 20%, 97%)',
    borderRadius: '12px',
    padding: '16px 20px',
    margin: '16px 0',
  },
  row: { fontSize: '13px', color: 'hsl(220, 10%, 30%)', margin: '4px 0' },
  rowLabel: { color: 'hsl(220, 10%, 50%)', fontWeight: 'normal' as const },
  footer: { fontSize: '12px', color: 'hsl(220, 10%, 50%)', margin: '32px 0 0', textAlign: 'center' as const },
  divider: { border: 'none', borderTop: '1px solid hsl(220, 15%, 90%)', margin: '20px 0' },
}
