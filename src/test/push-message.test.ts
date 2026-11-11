import { expect, test } from 'vitest';
import { newBookingMessage } from '@/features/notifications/push-message';
test('new booking alert uses business timezone', () => {
  const m = newBookingMessage({ clientName: 'Andrea', startAt: '2026-11-12T20:00:00Z', timezone: 'America/Bogota', services: ['Manicure'] });
  expect(m.body).toBe('Andrea agendó Manicure para el jueves 12 de noviembre, 3:00 PM.');
});
