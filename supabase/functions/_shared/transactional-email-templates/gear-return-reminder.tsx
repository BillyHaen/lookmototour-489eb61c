import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  productName?: string
  qty?: number
  returnDate?: string
  vendorName?: string
  vendorPhone?: string
  isVendor?: boolean
}

const Email = ({ name, productName, qty, returnDate, vendorName, vendorPhone, isVendor }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>{`Return gear ${productName ?? ''} hari ini`}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>🔄 Pengingat Return Gear</Heading>
        <Text style={styles.text}>Halo <strong>{name || (isVendor ? 'Tim Vendor' : 'Rider')}</strong>,</Text>
        <Text style={styles.text}>
          {isVendor
            ? 'Penyewa akan kembalikan gear hari ini. Mohon siapkan untuk inspeksi & refund deposit:'
            : 'Hari ini jadwal return gear sewamu. Jangan lupa kembalikan ya:'}
        </Text>
        <div style={styles.card}>
          <Text style={styles.row}><span style={styles.rowLabel}>Gear:</span> <strong>{productName}</strong>{qty && qty > 1 ? ` × ${qty}` : ''}</Text>
          {returnDate && <Text style={styles.row}><span style={styles.rowLabel}>Tanggal Return:</span> <strong>{returnDate}</strong></Text>}
          {vendorName && <Text style={styles.row}><span style={styles.rowLabel}>Vendor:</span> {vendorName}{vendorPhone ? ` (${vendorPhone})` : ''}</Text>}
        </div>
        <Hr style={styles.divider} />
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `🔄 Return gear hari ini: ${d.productName || 'gear'}`,
  displayName: 'Pengingat Return Gear',
  previewData: { name: 'Budi', productName: 'Helm Modular Shoei', qty: 1, returnDate: '20 Mei 2026', vendorName: 'Adventure Gear ID', vendorPhone: '+62812345678' },
} satisfies TemplateEntry
