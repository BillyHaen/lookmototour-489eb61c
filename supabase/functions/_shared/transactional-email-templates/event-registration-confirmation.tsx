import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
  totalAmount?: string
  registrationType?: string
  eventUrl?: string
}

const Email = ({ name, eventTitle, eventDate, eventLocation, totalAmount, registrationType, eventUrl }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Pendaftaranmu untuk {eventTitle || 'event'} sudah kami terima!</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>Pendaftaran Diterima 🎉</Heading>
        <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
        <Text style={styles.text}>
          Terima kasih sudah mendaftar untuk <strong>{eventTitle || 'event ini'}</strong>!
          Pendaftaranmu sudah kami terima dan tim kami akan menghubungi via WhatsApp untuk konfirmasi pembayaran.
        </Text>
        <div style={styles.card}>
          <Text style={{ ...styles.row, margin: 0 }}><span style={styles.rowLabel}>Event:</span> <strong>{eventTitle}</strong></Text>
          {eventDate && <Text style={styles.row}><span style={styles.rowLabel}>Tanggal:</span> {eventDate}</Text>}
          {eventLocation && <Text style={styles.row}><span style={styles.rowLabel}>Lokasi:</span> {eventLocation}</Text>}
          {registrationType && <Text style={styles.row}><span style={styles.rowLabel}>Tipe:</span> {registrationType}</Text>}
          {totalAmount && <Text style={styles.row}><span style={styles.rowLabel}>Total:</span> <strong>{totalAmount}</strong></Text>}
        </div>
        {eventUrl && (
          <Button style={styles.button} href={eventUrl}>Lihat Detail Event</Button>
        )}
        <Hr style={styles.divider} />
        <Text style={styles.muted}>
          Pertanyaan? Balas email ini atau hubungi admin kami via WhatsApp dari halaman event.
        </Text>
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Pendaftaran "${d.eventTitle || 'event'}" diterima`,
  displayName: 'Konfirmasi Pendaftaran Event',
  previewData: {
    name: 'Budi',
    eventTitle: 'Sumba Adventure 5D4N',
    eventDate: '15 Mei 2026',
    eventLocation: 'Sumba, NTT',
    totalAmount: 'Rp 8.500.000',
    registrationType: 'Single',
    eventUrl: 'https://lookmototour.com/events/sumba-adventure',
  },
} satisfies TemplateEntry
