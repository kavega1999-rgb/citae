import { formatInTimeZone } from 'date-fns-tz';
import { es } from 'date-fns/locale';
export function newBookingMessage(input: { clientName: string; startAt: string; timezone: string; services: string[] }) {
  const when = formatInTimeZone(input.startAt, input.timezone, "EEEE d 'de' MMMM, h:mm a", { locale: es });
  return { title: 'Nueva reserva', body: `${input.clientName} agendó ${input.services.join(', ') || 'una cita'} para el ${when}.` };
}
