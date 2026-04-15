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

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

const LOGO_URL = 'https://efrwzkdfkfvedtdrxrfg.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Konfirmasi email kamu untuk {siteName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt={siteName} height="40" style={logo} />
        <Heading style={h1}>Konfirmasi Email Kamu</Heading>
        <Text style={text}>
          Terima kasih sudah mendaftar di{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          !
        </Text>
        <Text style={text}>
          Silakan konfirmasi alamat email kamu (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) dengan menekan tombol di bawah ini:
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verifikasi Email
        </Button>
        <Text style={footer}>
          Jika kamu tidak membuat akun ini, abaikan saja email ini.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Montserrat', 'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.5', margin: '0 0 25px' }
const link = { color: 'hsl(215, 70%, 35%)', textDecoration: 'underline' }
const button = { backgroundColor: 'hsl(215, 70%, 35%)', color: '#ffffff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
