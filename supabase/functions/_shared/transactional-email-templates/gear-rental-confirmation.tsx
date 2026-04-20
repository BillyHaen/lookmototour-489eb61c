import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Hr, Html, Img, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { SITE_NAME, SITE_URL, LOGO_URL, styles } from './_branding.ts'

interface Props {
  name?: string
  productName?: string
  qty?: number
  startDate?: string
  endDate?: string
  totalDays?: number
  totalPrice?: string
  deposit?: string
  vendorName?: string
  vendorPhone?: string
}

const Email = ({ name, productName, qty, startDate, endDate, totalDays, totalPrice, deposit, vendorName, vendorPhone }: Props) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Sewa {productName || 'gear'} terkonfirmasi</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Img src={LOGO_URL} alt={SITE_NAME} height="40" style={styles.logo} />
        <Heading style={styles.h1}>Permintaan Sewa Gear Diterima ✅</Heading>
        <Text style={styles.text}>Halo <strong>{name || 'Rider'}</strong>,</Text>
        <Text style={styles.text}>
          Permintaan sewa kamu sudah kami terima. Admin akan menghubungi via WhatsApp untuk konfirmasi pickup & pembayaran.
        </Text>
        <div style={styles.card}>
          <Text style={{ ...styles.row, margin: 0 }}><span style={styles.rowLabel}>Gear:</span> <strong>{productName}</strong>{qty && qty > 1 ? ` × ${qty}` : ''}</Text>
          {startDate && <Text style={styles.row}><span style={styles.rowLabel}>Mulai:</span> {startDate}</Text>}
          {endDate && <Text style={styles.row}><span style={styles.rowLabel}>Selesai:</span> {endDate}</Text>}
          {totalDays && <Text style={styles.row}><span style={styles.rowLabel}>Durasi:</span> {totalDays} hari</Text>}
          {totalPrice && <Text style={styles.row}><span style={styles.rowLabel}>Sewa:</span> <strong>{totalPrice}</strong></Text>}
          {deposit && <Text style={styles.row}><span style={styles.rowLabel}>Deposit:</span> {deposit} (refundable)</Text>}
          {vendorName && <Text style={styles.row}><span style={styles.rowLabel}>Vendor:</span> {vendorName}{vendorPhone ? ` (${vendorPhone})` : ''}</Text>}
        </div>
        <Hr style={styles.divider} />
        <Text style={styles.muted}>
          Status pickup & pengembalian akan kami update via email saat berubah.
        </Text>
        <Text style={styles.footer}>© {SITE_NAME} — {SITE_URL}</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Props) => `Sewa "${d.productName || 'gear'}" diterima`,
  displayName: 'Konfirmasi Sewa Gear',
  previewData: {
    name: 'Budi', productName: 'Helm Modular Shoei', qty: 1,
    startDate: '14 Mei 2026', endDate: '20 Mei 2026', totalDays: 7,
    totalPrice: 'Rp 350.000', deposit: 'Rp 500.000',
    vendorName: 'Adventure Gear ID', vendorPhone: '+62812345678',
  },
} satisfies TemplateEntry
