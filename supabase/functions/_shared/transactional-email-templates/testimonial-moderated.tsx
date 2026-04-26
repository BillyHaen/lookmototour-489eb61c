import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  eventTitle?: string
  newStatus?: 'approved' | 'rejected'
}

const Email = ({ name, eventTitle, newStatus }: Props) => {
  const approved = newStatus === 'approved'
  return (
    <Html lang="id" dir="ltr">
      <Head />
      <Preview>Testimonimu {approved ? 'disetujui' : 'belum disetujui'}</Preview>
      <Body style={styles.main}>
        <Container style={styles.container}>
          <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
          <Heading style={styles.h1}>
            {approved ? '⭐ Testimoni Disetujui' : '📝 Update Testimoni'}
          </Heading>
          <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
          <Text style={styles.text}>
            {approved
              ? <>Testimoni kamu untuk <strong>{eventTitle}</strong> sudah disetujui dan tampil di halaman event. Terima kasih sudah berbagi pengalaman! 🙌</>
              : <>Testimoni kamu untuk <strong>{eventTitle}</strong> belum bisa kami tampilkan saat ini. Kamu bisa kirim ulang atau hubungi admin jika ada pertanyaan.</>
            }
          </Text>
          <Hr style={styles.divider} />
          <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Props) => d.newStatus === 'approved'
    ? `⭐ Testimoni untuk "${d.eventTitle}" disetujui`
    : `📝 Update testimoni untuk "${d.eventTitle}"`,
  displayName: 'Moderasi Testimoni',
  previewData: { name: 'Budi', eventTitle: 'Sumba Adventure', newStatus: 'approved' },
} satisfies TemplateEntry
