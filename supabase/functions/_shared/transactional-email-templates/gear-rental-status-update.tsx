import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  productName?: string
  newStatusLabel?: string
  notes?: string
}

const Email = ({ name, productName, newStatusLabel, notes }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Status sewa {productName || 'gear'}: {newStatusLabel || 'diperbarui'}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>Update Status Sewa Gear</Heading>
        <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
        <Text style={styles.text}>
          Status sewa <strong>{productName}</strong> telah diperbarui:
        </Text>
        <div style={styles.card}>
          <Text style={{ ...styles.h2, margin: 0 }}>{newStatusLabel || '-'}</Text>
          {notes && <Text style={styles.row}>Catatan: {notes}</Text>}
        </div>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Sewa "${d.productName || 'gear'}" — ${d.newStatusLabel || 'update'}`,
  displayName: 'Update Status Sewa Gear',
  previewData: { name: 'Budi', productName: 'Helm Modular Shoei', newStatusLabel: 'Pickup Dikonfirmasi', notes: 'Pickup besok jam 10 di Kantor LookMotoTour.' },
} satisfies TemplateEntry
