import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  eventTitle?: string
  newStatusLabel?: string
  amountPaid?: string
  eventUrl?: string
}

const Email = ({ name, eventTitle, newStatusLabel, amountPaid, eventUrl }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Status pembayaran {eventTitle || 'event'}: {newStatusLabel || 'diperbarui'}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>Update Status Pembayaran</Heading>
        <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
        <Text style={styles.text}>
          Status pembayaran untuk <strong>{eventTitle}</strong> telah diperbarui menjadi:
        </Text>
        <div style={styles.card}>
          <Text style={{ ...styles.h2, margin: 0 }}>{newStatusLabel || '-'}</Text>
          {amountPaid && <Text style={styles.row}>Sudah dibayar: <strong>{amountPaid}</strong></Text>}
        </div>
        {eventUrl && <Button style={styles.button} href={eventUrl}>Lihat Event</Button>}
        <Hr style={styles.divider} />
        <Text style={styles.muted}>
          Jika ada pertanyaan tentang pembayaran, hubungi admin kami via WhatsApp.
        </Text>
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Pembayaran "${d.eventTitle || 'event'}" — ${d.newStatusLabel || 'update'}`,
  displayName: 'Update Status Pembayaran',
  previewData: { name: 'Budi', eventTitle: 'Sumba Adventure', newStatusLabel: 'Lunas', amountPaid: 'Rp 8.500.000', eventUrl: 'https://lookmototour.com' },
} satisfies TemplateEntry
