import { describe, expect, it } from 'vitest';
import { buildWhatsAppConfirmation, whatsappPhone, type ConfirmationAppointment } from '@/features/admin/whatsapp-confirmation';

const appointment: ConfirmationAppointment = { id: 'booking-1', status: 'confirmed', start_at: '2026-11-11T19:30:00Z', duration_minutes: 75, total_amount: 100000, clients: { full_name: 'Ana', phone: '300 123 4567' }, appointment_services: [{ service_name: 'Manicura' }, { service_name: 'Pedicura' }] };
const settings = { business_name: 'Negocio de prueba', timezone: 'America/Bogota', cancellation_policy: 'Cancela con 24 horas de anticipación.' };
const payments = [{ appointment_id: 'booking-1', status: 'approved', amount: 30000 }, { appointment_id: 'booking-1', status: 'under_review', amount: 90000 }, { appointment_id: 'other', status: 'approved', amount: 50000 }];
const text = (url: string | null) => new URL(url ?? 'https://wa.me').searchParams.get('text') ?? '';

describe('direct WhatsApp confirmation', () => {
  it('is unavailable until the reservation is confirmed', () => {
    expect(buildWhatsAppConfirmation({ ...appointment, status: 'pending_verification' }, payments, settings).url).toBeNull();
  });
  it('requires an approved deposit', () => {
    expect(buildWhatsAppConfirmation(appointment, [{ appointment_id: 'booking-1', status: 'under_review', amount: 30000 }], settings).url).toBeNull();
  });
  it('uses the client phone and includes the name, local date, time, services and duration', () => {
    const result = buildWhatsAppConfirmation(appointment, payments, settings);
    expect(result.url).toMatch(/^https:\/\/wa.me\/573001234567\?text=/);
    const message = text(result.url);
    expect(message).toContain('Hola Ana');
    expect(message).toContain('11 de noviembre de 2026');
    expect(message).toMatch(/(?:02|2|14):30/);
    expect(message).toContain('Manicura, Pedicura');
    expect(message).toContain('75 min');
  });
  it('calculates the balance from approved payments for this booking only', () => {
    const message = text(buildWhatsAppConfirmation(appointment, payments, settings).url);
    expect(message).toMatch(/Total del servicio:.*100\.000.*COP/);
    expect(message).toMatch(/Anticipo recibido:.*30\.000.*COP/);
    expect(message).toMatch(/Saldo a cancelar en el establecimiento:.*70\.000.*COP/);
  });
  it('includes the configured cancellation policy but invents no arrival instructions', () => {
    expect(text(buildWhatsAppConfirmation(appointment, payments, settings).url)).toContain(settings.cancellation_policy);
    const message = text(buildWhatsAppConfirmation(appointment, payments, { ...settings, cancellation_policy: null }).url);
    expect(message).not.toContain('Política de cancelación:');
    expect(message).not.toContain('Llegada:');
  });
  it('rejects invalid phones and preserves explicit international country codes', () => {
    expect(whatsappPhone('sin teléfono')).toBeNull();
    expect(whatsappPhone('+34 612 345 678')).toBe('34612345678');
    expect(whatsappPhone('0057 300 123 4567')).toBe('573001234567');
    expect(buildWhatsAppConfirmation({ ...appointment, clients: { full_name: 'Ana', phone: '' } }, payments, settings).url).toBeNull();
  });
});