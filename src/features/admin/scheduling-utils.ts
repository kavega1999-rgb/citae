import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';

export function zonedInput(value: string, timezone: string) {
  return formatInTimeZone(new Date(value), timezone, "yyyy-MM-dd'T'HH:mm");
}
export function schedulingInstant(value: string, timezone: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Indica una fecha y hora válidas.');
  const date = fromZonedTime(value, timezone);
  if (Number.isNaN(date.getTime()) || zonedInput(date.toISOString(), timezone) !== value) throw new Error('Esta hora no existe en la zona horaria del negocio.');
  return date.toISOString();
}
export function closureRange(start: string, end: string, wholeDays: boolean, timezone: string) {
  const first = wholeDays ? `${start}T00:00` : start;
  let last = end;
  if (wholeDays) {
    const day = new Date(`${end}T12:00:00Z`);
    day.setUTCDate(day.getUTCDate() + 1);
    last = `${day.toISOString().slice(0, 10)}T00:00`;
  }
  const start_at = schedulingInstant(first, timezone), end_at = schedulingInstant(last, timezone);
  if (Date.parse(end_at) <= Date.parse(start_at)) throw new Error('El final debe ser posterior al inicio.');
  return { start_at, end_at };
}
type Hours = { weekday: number; opens_at: string; closes_at: string };
export function businessSchedule(professionals: { id: string; is_active: boolean }[], professionalHours: (Hours & { professional_id: string })[], fallback: (Hours & { is_active: boolean })[]) {
  const active = professionals.filter(p => p.is_active);
  const ranges: Hours[] = active.length ? active.flatMap<Hours>(p => {
    const own = professionalHours.filter(h => h.professional_id === p.id);
    return own.length ? own : fallback.filter(h => h.is_active);
  }) : fallback.filter(h => h.is_active);
  return Array.from({ length: 7 }, (_, weekday) => {
    const sorted = ranges.filter(h => h.weekday === weekday).map(h => ({ opens_at: h.opens_at.slice(0, 5), closes_at: h.closes_at.slice(0, 5) })).sort((a,b) => a.opens_at.localeCompare(b.opens_at));
    const merged: { opens_at: string; closes_at: string }[] = [];
    for (const range of sorted) {
      const previous = merged.at(-1);
      if (previous && range.opens_at <= previous.closes_at) previous.closes_at = previous.closes_at > range.closes_at ? previous.closes_at : range.closes_at;
      else merged.push({ ...range });
    }
    return { weekday, ranges: merged };
  });
}