export type ConfirmationAppointment = {
  id: string;
  status: string;
  start_at: string;
  duration_minutes: number;
  total_amount: number;
  clients: { full_name: string; phone: string } | null;
  appointment_services: { service_name: string }[];
};
export type ConfirmationPayment = { appointment_id: string; status: string; amount: number };
export type ConfirmationSettings = { business_name: string; timezone: string; cancellation_policy: string | null };

export function whatsappPhone(value: string): string | null {
  const trimmed = value.trim();
  if (!/^[+\d\s().-]+$/.test(trimmed)) return null;
  let digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('00')) digits = digits.slice(2);
  // Local Colombian mobile numbers need their international country code.
  if (digits.length === 10 && digits.startsWith('3')) digits = `57${digits}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function buildWhatsAppConfirmation(
  appointment: ConfirmationAppointment,
  payments: ConfirmationPayment[],
  settings: ConfirmationSettings | null,
): { url: string | null; reason: string | null } {
  if (appointment.status !== 'confirmed') return { url: null, reason: 'Disponible cuando la reserva esté confirmada.' };
  const own = payments.filter(p => p.appointment_id === appointment.id);
  const paid = own.filter(p => p.status === 'approved').reduce((sum, p) => sum + p.amount, 0);
  // Businesses without deposits confirm at booking time and have no payment rows.
  if (own.length > 0 && paid <= 0) return { url: null, reason: 'El anticipo aún no está aprobado.' };
  if (!settings) return { url: null, reason: 'Falta la configuración del negocio.' };
  const phone = whatsappPhone(appointment.clients?.phone ?? '');
  if (!phone) return { url: null, reason: 'Revisa el teléfono de la clienta; debe incluir un número válido con código de país.' };
  const money = (amount: number) => `${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount)} COP`;
  const date = new Date(appointment.start_at);
  const lines = [
    `Hola ${appointment.clients?.full_name},`,
    `Tu reserva en ${settings.business_name} está confirmada.`,
    '',
    `Fecha: ${new Intl.DateTimeFormat('es-CO', { timeZone: settings.timezone, dateStyle: 'full' }).format(date)}`,
    `Hora: ${new Intl.DateTimeFormat('es-CO', { timeZone: settings.timezone, hour: '2-digit', minute: '2-digit' }).format(date)} (${settings.timezone})`,
    `Tratamientos: ${appointment.appointment_services.map(s => s.service_name).join(', ')}`,
    `Duración estimada: ${appointment.duration_minutes} min`,
    '',
    `Total del servicio: ${money(appointment.total_amount)}`,
  ];
  if (own.length > 0) lines.push(`Anticipo recibido: ${money(paid)}`, `Saldo a cancelar en el establecimiento: ${money(Math.max(0, appointment.total_amount - paid))}`);
  else lines.push('Pagas el total en el establecimiento.');
  if (settings.cancellation_policy?.trim()) lines.push('', `Política de cancelación: ${settings.cancellation_policy.trim()}`);
  // There is no arrival-instructions field in the existing business schema.
  // Do not reuse private notes or payment instructions as arrival instructions.
  return { url: `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`, reason: null };
}