import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  productName?: string
  qty?: number
  pickupDate?: string
  vendorName?: string
  vendorPhone?: string
  isVendor?: boolean
}

const Email = ({ name, productName, qty, pickupDate, vendorName, vendorPhone, isVendor }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Pickup gear {productName} besok</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>📦 Pengingat Pickup Gear</Heading>
        <Text style={styles.text}>Halo <strong>{name || (isVendor ? 'Tim Vendor' : 'Rider')}</strong>,</Text>
        <Text style={styles.text}>
          {isVendor
            ? <>Penyewa akan pickup gear besok. Mohon disiapkan ya:</>
            : <>Jangan lupa pickup gear sewamu besok:</>}
        </Text>
        <div style={styles.card}>
          <Text style={styles.row}><span style={styles.rowLabel}>Gear:</span> <strong>{productName}</strong>{qty && qty > 1 ? ` × ${qty}` : ''}</Text>
          {pickupDate && <Text style={styles.row}><span style={styles.rowLabel}>Tanggal Pickup:</span> <strong>{pickupDate}</strong></Text>}
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
  subject: (d: Props) => `📦 Pickup gear besok: ${d.productName || 'gear'}`,
  displayName: 'Pengingat Pickup Gear',
  previewData: { name: 'Budi', productName: 'Helm Modular Shoei', qty: 1, pickupDate: '14 Mei 2026', vendorName: 'Adventure Gear ID', vendorPhone: '+62812345678' },
} satisfies TemplateEntry
