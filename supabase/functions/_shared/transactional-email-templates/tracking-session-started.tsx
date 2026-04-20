import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  eventTitle?: string
  recipientCount?: number
  manageUrl?: string
}

const Email = ({ name, eventTitle, recipientCount, manageUrl }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Live tracking aktif untuk {eventTitle}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>📍 Live Tracking Aktif</Heading>
        <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
        <Text style={styles.text}>
          Sesi live tracking untuk <strong>{eventTitle}</strong> sudah aktif!
          {recipientCount && recipientCount > 0 ? ` Lokasimu sudah dishare ke ${recipientCount} keluarga.` : ' Tambahkan keluarga di halaman tracking untuk share lokasi.'}
        </Text>
        {manageUrl && <Button style={styles.button} href={manageUrl}>Kelola Sesi Tracking</Button>}
        <Hr style={styles.divider} />
        <Text style={styles.muted}>
          Sesi otomatis berakhir 24 jam setelah event selesai. Stay safe! 🛡️
        </Text>
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `📍 Tracking aktif untuk ${d.eventTitle || 'event'}`,
  displayName: 'Live Tracking Dimulai',
  previewData: { name: 'Budi', eventTitle: 'Sumba Adventure', recipientCount: 2, manageUrl: 'https://lookmototour.com/tracking/manage' },
} satisfies TemplateEntry
