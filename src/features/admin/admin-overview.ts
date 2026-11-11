export type OverviewAppointment = { id: string; client_id: string; start_at: string; status: string; total_amount: number; professional_id?: string | null; clients?: { full_name: string; phone: string } | null };
export type OverviewPro = { id: string; full_name: string };
const ACTIVE = ['pending_payment', 'pending_verification', 'confirmed', 'completed'];

/** Groups appointments by professional; unassigned ones go under "Sin profesional". */
export function summarizeByProfessional(appointments: OverviewAppointment[], pros: OverviewPro[], now = Date.now()) {
  const groups = [...pros.map(p => ({ id: p.id, name: p.full_name })), { id: '', name: 'Sin profesional asignado' }].map(g => {
    const own = appointments.filter(a => (a.professional_id ?? '') === g.id);
    const live = own.filter(a => ACTIVE.includes(a.status));
    const upcoming = live.filter(a => Date.parse(a.start_at) > now && a.status !== 'completed').sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at));
    const clients = new Map<string, { name: string; phone: string; visits: number }>();
    for (const a of live) { const c = clients.get(a.client_id) ?? { name: a.clients?.full_name ?? 'Cliente', phone: a.clients?.phone ?? '', visits: 0 }; c.visits++; clients.set(a.client_id, c); }
    return { ...g, total: live.length, upcoming, revenue: live.reduce((s, a) => s + Number(a.total_amount), 0), clients: [...clients.values()].sort((a, b) => b.visits - a.visits) };
  });
  return groups.filter(g => g.id || g.total);
}

/** Groups appointments by local day (YYYY-MM-DD) in ascending order. */
export function groupByDay<T extends { start_at: string }>(rows: T[], tz: string) {
  const key = (d: string) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(d));
  const map = new Map<string, T[]>();
  for (const r of [...rows].sort((a, b) => Date.parse(a.start_at) - Date.parse(b.start_at))) { const k = key(r.start_at); map.set(k, [...(map.get(k) ?? []), r]); }
  return [...map.entries()];
}
