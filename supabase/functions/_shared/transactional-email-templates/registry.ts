/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as eventRegistrationConfirmation } from './event-registration-confirmation.tsx'
import { template as gearRentalConfirmation } from './gear-rental-confirmation.tsx'
import { template as paymentStatusUpdate } from './payment-status-update.tsx'
import { template as gearRentalStatusUpdate } from './gear-rental-status-update.tsx'
import { template as eventReminder } from './event-reminder.tsx'
import { template as gearPickupReminder } from './gear-pickup-reminder.tsx'
import { template as gearReturnReminder } from './gear-return-reminder.tsx'
import { template as trackingSessionStarted } from './tracking-session-started.tsx'
import { template as testimonialModerated } from './testimonial-moderated.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'event-registration-confirmation': eventRegistrationConfirmation,
  'gear-rental-confirmation': gearRentalConfirmation,
  'payment-status-update': paymentStatusUpdate,
  'gear-rental-status-update': gearRentalStatusUpdate,
  'event-reminder': eventReminder,
  'gear-pickup-reminder': gearPickupReminder,
  'gear-return-reminder': gearReturnReminder,
  'tracking-session-started': trackingSessionStarted,
  'testimonial-moderated': testimonialModerated,
}
