// Frontend registry of all editable email templates.
// Used by /admin/emails page for displaying template list, variables, and sample data.

export type EmailCategory = 'auth' | 'transactional';

export interface EmailTemplateMeta {
  name: string;
  displayName: string;
  category: EmailCategory;
  description: string;
  defaultSubject: string;
  variables: string[];
  sampleData: Record<string, any>;
}

export const EMAIL_TEMPLATES: EmailTemplateMeta[] = [
  // ===== AUTH =====
  {
    name: 'signup',
    displayName: 'Konfirmasi Pendaftaran (Signup)',
    category: 'auth',
    description: 'Email konfirmasi saat user baru mendaftar akun.',
    defaultSubject: 'Konfirmasi alamat email Anda',
    variables: ['confirmation_url', 'token', 'email'],
    sampleData: {
      confirmation_url: 'https://lookmototour.com/auth/confirm?token=abc123',
      token: '123456',
      email: 'user@example.com',
    },
  },
  {
    name: 'recovery',
    displayName: 'Reset Password',
    category: 'auth',
    description: 'Email saat user request reset password.',
    defaultSubject: 'Reset password Anda',
    variables: ['confirmation_url', 'token', 'email'],
    sampleData: {
      confirmation_url: 'https://lookmototour.com/reset-password?token=abc123',
      token: '123456',
      email: 'user@example.com',
    },
  },
  {
    name: 'magic-link',
    displayName: 'Magic Link Login',
    category: 'auth',
    description: 'Email berisi link login satu kali.',
    defaultSubject: 'Login link Anda',
    variables: ['confirmation_url', 'token', 'email'],
    sampleData: {
      confirmation_url: 'https://lookmototour.com/auth/magic?token=abc123',
      token: '123456',
      email: 'user@example.com',
    },
  },
  {
    name: 'invite',
    displayName: 'Undangan Akun',
    category: 'auth',
    description: 'Email undangan ke user baru oleh admin.',
    defaultSubject: 'Anda diundang ke LookMotoTour',
    variables: ['confirmation_url', 'email'],
    sampleData: {
      confirmation_url: 'https://lookmototour.com/auth/invite?token=abc123',
      email: 'invitee@example.com',
    },
  },
  {
    name: 'email-change',
    displayName: 'Konfirmasi Ubah Email',
    category: 'auth',
    description: 'Email saat user mengubah alamat email.',
    defaultSubject: 'Konfirmasi perubahan email',
    variables: ['confirmation_url', 'token', 'email', 'new_email'],
    sampleData: {
      confirmation_url: 'https://lookmototour.com/auth/confirm-email?token=abc123',
      token: '123456',
      email: 'old@example.com',
      new_email: 'new@example.com',
    },
  },
  {
    name: 'reauthentication',
    displayName: 'Re-autentikasi',
    category: 'auth',
    description: 'Email konfirmasi re-autentikasi untuk aksi sensitif.',
    defaultSubject: 'Konfirmasi identitas Anda',
    variables: ['token', 'email'],
    sampleData: { token: '123456', email: 'user@example.com' },
  },

  // ===== TRANSACTIONAL =====
  {
    name: 'event-registration-confirmation',
    displayName: 'Konfirmasi Pendaftaran Event',
    category: 'transactional',
    description: 'Dikirim setelah user submit pendaftaran event.',
    defaultSubject: 'Pendaftaran event diterima',
    variables: ['name', 'eventTitle', 'eventDate', 'eventLocation', 'totalAmount', 'eventUrl'],
    sampleData: {
      name: 'Budi Santoso',
      eventTitle: 'Sumba Adventure 2026',
      eventDate: '15 Mei 2026',
      eventLocation: 'Sumba, NTT',
      totalAmount: 'Rp 5.500.000',
      eventUrl: 'https://lookmototour.com/events/sumba-adventure',
    },
  },
  {
    name: 'gear-rental-confirmation',
    displayName: 'Konfirmasi Sewa Gear',
    category: 'transactional',
    description: 'Dikirim setelah user submit penyewaan gear.',
    defaultSubject: 'Pesanan sewa gear diterima',
    variables: ['name', 'productName', 'qty', 'startDate', 'endDate', 'totalDays', 'totalPrice', 'depositAmount'],
    sampleData: {
      name: 'Budi Santoso',
      productName: 'Helm Modular AGV',
      qty: 1,
      startDate: '15 Mei 2026',
      endDate: '20 Mei 2026',
      totalDays: 5,
      totalPrice: 'Rp 750.000',
      depositAmount: 'Rp 1.000.000',
    },
  },
  {
    name: 'payment-status-update',
    displayName: 'Update Status Pembayaran',
    category: 'transactional',
    description: 'Dikirim saat admin mengubah status pembayaran registrasi.',
    defaultSubject: 'Update status pembayaran',
    variables: ['name', 'eventTitle', 'paymentStatus', 'totalAmount', 'eventUrl'],
    sampleData: {
      name: 'Budi Santoso',
      eventTitle: 'Sumba Adventure 2026',
      paymentStatus: 'Lunas',
      totalAmount: 'Rp 5.500.000',
      eventUrl: 'https://lookmototour.com/events/sumba-adventure',
    },
  },
  {
    name: 'gear-rental-status-update',
    displayName: 'Update Status Sewa Gear',
    category: 'transactional',
    description: 'Dikirim saat admin/vendor mengubah status sewa gear.',
    defaultSubject: 'Update status sewa gear',
    variables: ['name', 'productName', 'newStatus', 'startDate', 'endDate'],
    sampleData: {
      name: 'Budi Santoso',
      productName: 'Helm Modular AGV',
      newStatus: 'Confirmed',
      startDate: '15 Mei 2026',
      endDate: '20 Mei 2026',
    },
  },
  {
    name: 'event-reminder',
    displayName: 'Reminder Event',
    category: 'transactional',
    description: 'Reminder H-7 dan H-1 sebelum event.',
    defaultSubject: 'Reminder: Event Anda akan dimulai',
    variables: ['name', 'eventTitle', 'eventDate', 'eventLocation', 'daysUntil', 'eventUrl'],
    sampleData: {
      name: 'Budi Santoso',
      eventTitle: 'Sumba Adventure 2026',
      eventDate: '15 Mei 2026',
      eventLocation: 'Sumba, NTT',
      daysUntil: 1,
      eventUrl: 'https://lookmototour.com/events/sumba-adventure',
    },
  },
  {
    name: 'gear-pickup-reminder',
    displayName: 'Reminder Pickup Gear',
    category: 'transactional',
    description: 'Reminder H-1 sebelum tanggal mulai sewa gear.',
    defaultSubject: 'Reminder: Pickup gear sewa',
    variables: ['name', 'productName', 'qty', 'startDate', 'endDate', 'vendorName'],
    sampleData: {
      name: 'Budi Santoso',
      productName: 'Helm Modular AGV',
      qty: 1,
      startDate: 'Besok, 15 Mei 2026',
      endDate: '20 Mei 2026',
      vendorName: 'Gear Vendor LMT',
    },
  },
  {
    name: 'gear-return-reminder',
    displayName: 'Reminder Return Gear',
    category: 'transactional',
    description: 'Reminder di tanggal akhir sewa gear.',
    defaultSubject: 'Reminder: Pengembalian gear',
    variables: ['name', 'productName', 'qty', 'endDate', 'vendorName'],
    sampleData: {
      name: 'Budi Santoso',
      productName: 'Helm Modular AGV',
      qty: 1,
      endDate: 'Hari ini, 20 Mei 2026',
      vendorName: 'Gear Vendor LMT',
    },
  },
  {
    name: 'tracking-session-started',
    displayName: 'Live Tracking Dimulai',
    category: 'transactional',
    description: 'Dikirim ke kontak darurat saat user start live tracking.',
    defaultSubject: 'Live tracking telah dimulai',
    variables: ['recipientName', 'participantName', 'eventTitle', 'trackingUrl', 'expiresAt'],
    sampleData: {
      recipientName: 'Ibu Siti',
      participantName: 'Budi Santoso',
      eventTitle: 'Sumba Adventure 2026',
      trackingUrl: 'https://lookmototour.com/track/abc123',
      expiresAt: '21 Mei 2026 18:00',
    },
  },
  {
    name: 'testimonial-moderated',
    displayName: 'Testimoni Dimoderasi',
    category: 'transactional',
    description: 'Dikirim ke author saat admin approve/reject testimoni.',
    defaultSubject: 'Status testimoni Anda',
    variables: ['name', 'eventTitle', 'newStatus'],
    sampleData: {
      name: 'Budi Santoso',
      eventTitle: 'Sumba Adventure 2026',
      newStatus: 'Approved',
    },
  },
];

export function getTemplateByName(name: string): EmailTemplateMeta | undefined {
  return EMAIL_TEMPLATES.find((t) => t.name === name);
}
