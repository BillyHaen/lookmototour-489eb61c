/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface InviteEmailProps {
  siteName: string
  siteUrl: string
  confirmationUrl: string
}

const LOGO_URL = 'https://efrwzkdfkfvedtdrxrfg.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const InviteEmail = ({
  siteName,
  siteUrl,
  confirmationUrl,
}: InviteEmailProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Kamu diundang untuk bergabung di {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} height="40" style={logo} />
        <Heading style={h1}>Kamu Diundang!</Heading>
        <Text style={text}>
          Kamu telah diundang untuk bergabung di{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          . Klik tombol di bawah untuk menerima undangan dan membuat akun.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Terima Undangan
        </Button>
        <Text style={footer}>
          Jika kamu tidak mengharapkan undangan ini, abaikan saja email ini.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default InviteEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Montserrat', 'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'hsl(215, 70%, 35%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(215, 70%, 35%)', color: '#ffffff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
