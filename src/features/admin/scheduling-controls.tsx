import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { CalendarClock, Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { saveAdmin, deleteAdmin, type loadAdmin } from './admin.functions';
import { loadRescheduleSlots, moveAppointment } from './scheduling.functions';
import { businessSchedule, closureRange, zonedInput } from './scheduling-utils';
import { formatBookingDate, localDate } from '@/features/booking/booking-utils';

type Data = Awaited<ReturnType<typeof loadAdmin>>;
const DAYS = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const errorText = (e: unknown) => e instanceof Error ? e.message : 'No se pudo guardar.';
const selectClass = 'min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm';
async function invalidate(qc: ReturnType<typeof useQueryClient>) {
  await Promise.all([['admin-data'],['admin-professionals'],['available-slots'],['public-hours'],['reschedule-slots']].map(queryKey => qc.invalidateQueries({ queryKey })));
}

export function BusinessSchedule({ data }: { data: Data }) {
  const days = businessSchedule(data.professionals, data.professionalHours, data.hours);
  return <section className="mt-8 border-t border-border pt-5"><h2 className="font-display text-2xl">Horario del negocio</h2><dl className="mt-4 grid gap-x-8 divide-y divide-border sm:grid-cols-2">{days.map(d => <div key={d.weekday} className="flex items-start justify-between gap-4 py-3 text-sm"><dt className="font-medium">{DAYS[d.weekday]}</dt><dd className="text-right text-muted-foreground">{d.ranges.length ? d.ranges.map(r => `${r.opens_at} – ${r.closes_at}`).join(' · ') : 'Cerrado'}</dd></div>)}</dl></section>;
}

export function ClosuresSection({ data, timezone }: { data: Data; timezone: string }) {
  const qc = useQueryClient(), save = useServerFn(saveAdmin), remove = useServerFn(deleteAdmin);
  const [editing, setEditing] = useState<Data['blocks'][number] | 'new' | null>(null);
  const [wholeDays, setWholeDays] = useState(false), [busy, setBusy] = useState(false);
  const existing = editing && editing !== 'new' ? editing : null;
  return <section className="mt-8 border-t border-border pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Cierres y ausencias</h2><Button variant="outline" onClick={() => { setWholeDays(false); setEditing('new'); }}><Plus/>Añadir cierre</Button></div>
    <ul className="mt-4 divide-y divide-border">{data.blocks.map(b => <li key={b.id} className="flex items-start justify-between gap-3 py-4"><div className="min-w-0"><p className="text-sm font-medium">{b.professional_id ? data.professionals.find(p => p.id === b.professional_id)?.full_name ?? 'Profesional' : 'Todo el negocio'}</p><p className="mt-1 text-sm text-muted-foreground">{formatBookingDate(b.start_at,timezone)} – {formatBookingDate(b.end_at,timezone)}</p>{b.reason && <p className="mt-1 break-words text-sm">{b.reason}</p>}</div><div className="flex shrink-0"><Button size="icon" variant="ghost" title="Editar cierre" aria-label="Editar cierre" onClick={() => { setWholeDays(false); setEditing(b); }}><Pencil/></Button><Button size="icon" variant="ghost" title="Eliminar cierre" aria-label="Eliminar cierre" disabled={busy} onClick={async () => { if (!window.confirm('¿Eliminar este cierre y habilitar nuevamente el horario?')) return; setBusy(true); try { await remove({ data: { table: 'blocked_slots', id: b.id } }); await invalidate(qc); toast.success('Cierre eliminado'); } catch(e) { toast.error(errorText(e)); } finally { setBusy(false); } }}><Trash2/></Button></div></li>)}</ul>
    <Dialog open={!!editing} onOpenChange={o => { if (!o && !busy) setEditing(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>{existing ? 'Editar cierre' : 'Añadir cierre'}</DialogTitle><DialogDescription>Las citas existentes se mantienen. Puedes moverlas desde la agenda.</DialogDescription>{editing && <form key={typeof editing === 'string' ? editing : editing.id} className="space-y-4" onSubmit={async e => {
      e.preventDefault(); const f = new FormData(e.currentTarget); setBusy(true);
      try {
        const range = closureRange(String(f.get('start')),String(f.get('end')),wholeDays,timezone);
        await save({ data: { table: 'blocked_slots', ...(existing ? { id: existing.id } : {}), values: { ...range, professional_id: String(f.get('professional')) || null, reason: String(f.get('reason')).trim() || null } } });
        await invalidate(qc); setEditing(null); toast.success('Cierre guardado');
      } catch(e) { toast.error(errorText(e)); } finally { setBusy(false); }
    }}>
      <label className="grid gap-2 text-sm">Aplicar a<select name="professional" className={selectClass} defaultValue={existing?.professional_id ?? ''}><option value="">Todo el negocio</option>{data.professionals.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>
      <label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={wholeDays} onChange={e => setWholeDays(e.target.checked)} className="accent-primary"/>Días completos</label>
      <div className="grid gap-4 sm:grid-cols-2"><label className="grid gap-2 text-sm">Desde<Input key={`start-${wholeDays}`} type={wholeDays ? 'date' : 'datetime-local'} name="start" required defaultValue={existing ? zonedInput(existing.start_at,timezone).slice(0,wholeDays ? 10 : 16) : ''}/></label><label className="grid gap-2 text-sm">{wholeDays ? 'Hasta (incluido)' : 'Hasta'}<Input key={`end-${wholeDays}`} type={wholeDays ? 'date' : 'datetime-local'} name="end" required defaultValue={existing ? zonedInput(existing.end_at,timezone).slice(0,wholeDays ? 10 : 16) : ''}/></label></div>
      <label className="grid gap-2 text-sm">Motivo<Input name="reason" maxLength={500} defaultValue={existing?.reason ?? ''}/></label><Button type="submit" disabled={busy} className="w-full">{busy ? 'Guardando…' : 'Guardar cierre'}</Button>
    </form>}</DialogContent></Dialog>
  </section>;
}

export function RescheduleButton({ appointment, professionals, timezone }: { appointment: Data['appointments'][number]; professionals: Data['professionals']; timezone: string }) {
  const [open,setOpen] = useState(false), [date,setDate] = useState(''), [professional,setProfessional] = useState(appointment.professional_id ?? ''), [selected,setSelected] = useState(''), [busy,setBusy] = useState(false);
  const qc = useQueryClient(), load = useServerFn(loadRescheduleSlots), move = useServerFn(moveAppointment);
  const active = professionals.filter(p => p.is_active);
  const slots = useQuery({ queryKey: ['reschedule-slots',appointment.id,date,professional], queryFn: () => load({ data: { appointment_id: appointment.id, date, professional_id: professional || null } }), enabled: open && !!date && (!active.length || !!professional), retry: false });
  if (!['pending_payment','pending_verification','confirmed'].includes(appointment.status)) return null;
  return <><Button variant="outline" onClick={() => { setDate(localDate(timezone,new Date(appointment.start_at))); setProfessional(appointment.professional_id ?? (active.length === 1 ? active[0]?.id ?? '' : '')); setSelected(''); setOpen(true); }}><CalendarClock/>Mover cita</Button><Dialog open={open} onOpenChange={o => { if (!busy) setOpen(o); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>Mover cita</DialogTitle><DialogDescription>{appointment.clients?.full_name} · {formatBookingDate(appointment.start_at,timezone)}. Los servicios y pagos se conservan.</DialogDescription>
    {active.length > 0 && <label className="grid gap-2 text-sm">Profesional<select aria-label="Profesional de la cita" className={selectClass} value={professional} onChange={e => { setProfessional(e.target.value); setSelected(''); }}><option value="">Seleccionar</option>{active.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}</select></label>}
    <label className="grid gap-2 text-sm">Nueva fecha<Input type="date" min={localDate(timezone)} value={date} onChange={e => { setDate(e.target.value); setSelected(''); }}/></label>
    {slots.isFetching ? <p role="status" className="text-sm">Buscando horarios…</p> : slots.isError ? <div role="alert"><p className="text-sm text-destructive">{errorText(slots.error)}</p><Button variant="ghost" onClick={() => slots.refetch()}>Reintentar</Button></div> : slots.data && <>{slots.data.length ? <div className="grid grid-cols-3 gap-2">{slots.data.map(s => <Button key={s.slot_start} variant={selected === s.slot_start ? 'default' : 'outline'} onClick={() => setSelected(s.slot_start)}>{new Intl.DateTimeFormat('es-CO',{timeZone:timezone,hour:'2-digit',minute:'2-digit'}).format(new Date(s.slot_start))}</Button>)}</div> : <p className="text-sm text-muted-foreground">No hay horarios disponibles para esta selección.</p>}</>}
    <Button disabled={busy || !selected || slots.isFetching || !slots.data?.some(s => s.slot_start === selected)} onClick={async () => { setBusy(true); try { await move({ data: { appointment_id: appointment.id,start_at:selected,professional_id:professional || null } }); await invalidate(qc); setOpen(false); toast.success('Cita reprogramada. Puedes enviar la nueva confirmación por WhatsApp.'); } catch(e) { toast.error(errorText(e)); setSelected(''); await slots.refetch(); } finally { setBusy(false); } }}>{busy ? 'Guardando…' : 'Confirmar cambio'}</Button>
  </DialogContent></Dialog></>;
}