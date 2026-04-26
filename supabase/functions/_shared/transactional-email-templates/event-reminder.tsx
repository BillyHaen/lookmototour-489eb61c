import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
  daysUntil?: number
  eventUrl?: string
}

const Email = ({ name, eventTitle, eventDate, eventLocation, daysUntil, eventUrl }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>{daysUntil === 1 ? 'Besok!' : `H-${daysUntil}`} {eventTitle}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>
          {daysUntil === 1 ? '🏍️ Besok berangkat!' : `⏰ H-${daysUntil} Menuju Event`}
        </Heading>
        <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
        <Text style={styles.text}>
          Pengingat untuk event <strong>{eventTitle}</strong>:
        </Text>
        <div style={styles.card}>
          {eventDate && <Text style={styles.row}><span style={styles.rowLabel}>Tanggal:</span> <strong>{eventDate}</strong></Text>}
          {eventLocation && <Text style={styles.row}><span style={styles.rowLabel}>Lokasi:</span> {eventLocation}</Text>}
        </div>
        <Text style={styles.text}>
          Pastikan motor dalam kondisi prima, gear lengkap, dan istirahat cukup. Safety first! 🛡️
        </Text>
        {eventUrl && <Button style={styles.button} href={eventUrl}>Lihat Detail Event</Button>}
        <Hr style={styles.divider} />
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => d.daysUntil === 1
    ? `🏍️ Besok berangkat: ${d.eventTitle}`
    : `H-${d.daysUntil} ${d.eventTitle}`,
  displayName: 'Pengingat Event (H-7 / H-1)',
  previewData: { name: 'Budi', eventTitle: 'Sumba Adventure', eventDate: '15 Mei 2026', eventLocation: 'Sumba, NTT', daysUntil: 1, eventUrl: 'https://lookmototour.com' },
} satisfies TemplateEntry
