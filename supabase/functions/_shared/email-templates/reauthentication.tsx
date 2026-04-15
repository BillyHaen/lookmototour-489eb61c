/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface ReauthenticationEmailProps {
  token: string
}

const LOGO_URL = 'https://efrwzkdfkfvedtdrxrfg.supabase.co/storage/v1/object/public/email-assets/logo.png'

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="id" dir="ltr">
    <Head />
    <Preview>Kode verifikasi kamu</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src={LOGO_URL} alt="LookMotoTour" height="40" style={logo} />
        <Heading style={h1}>Konfirmasi Identitas</Heading>
        <Text style={text}>Gunakan kode di bawah ini untuk mengonfirmasi identitas kamu:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          Kode ini akan kedaluwarsa dalam beberapa saat. Jika kamu tidak memintanya, abaikan saja email ini.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Montserrat', 'Inter', Arial, sans-serif" }
const container = { padding: '20px 25px' }
const logo = { margin: '0 0 20px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(220, 25%, 10%)', margin: '0 0 20px' }
const text = { fontSize: '14px', color: 'hsl(220, 10%, 45%)', lineHeight: '1.5', margin: '0 0 25px' }
const codeStyle = { fontFamily: 'Courier, monospace', fontSize: '22px', fontWeight: 'bold' as const, color: 'hsl(215, 70%, 35%)', margin: '0 0 30px' }
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
