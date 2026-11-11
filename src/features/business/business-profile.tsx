import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { ImagePlus, Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { MEDIA_BUCKET, imageExtension, readableOn, useMediaUrls } from './business-media';
import { deleteProfessional, deleteProfessionalHour, loadProfessionals, prepareMediaUpload, saveBranding, saveProfessional, saveProfessionalHour } from './profile.functions';

const DAYS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const errorText = (e: unknown) => e instanceof Error ? e.message : 'No se pudo completar la operación.';
type Business = { id: string; name: string; agenda_mode: string; primary_color: string | null; secondary_color: string | null; logo_path: string | null };
type Service = { id: string; name: string };

function useUpload() {
  const prepare = useServerFn(prepareMediaUpload);
  return async (file: File, kind: 'logo' | 'professional') => {
    const signed = await prepare({ data: { kind, extension: imageExtension(file) } });
    const r = await supabase.storage.from(MEDIA_BUCKET).uploadToSignedUrl(signed.path, signed.token, file, { contentType: file.type });
    if (r.error) throw r.error;
    return signed.path;
  };
}

export function BusinessBranding({ business }: { business: Business }) {
  const qc = useQueryClient(), save = useServerFn(saveBranding), upload = useUpload();
  const [primary, setPrimary] = useState(business.primary_color ?? '#49343D');
  const [secondary, setSecondary] = useState(business.secondary_color ?? '#E9C9D0');
  const [logo, setLogo] = useState(business.logo_path);
  const [busy, setBusy] = useState(false);
  const logoUrl = useMediaUrls(logo ? [logo] : [])[logo ?? ''];
  async function persist(next: { logo_path: string | null }) {
    setBusy(true);
    try { await save({ data: { primary_color: primary, secondary_color: secondary, ...next } }); await qc.invalidateQueries({ queryKey: ['my-business'] }); await qc.invalidateQueries({ queryKey: ['public-business'] }); toast.success('Identidad del negocio guardada'); }
    catch (e) { toast.error(errorText(e)); } finally { setBusy(false); }
  }
  return <section className="mt-7 border-t border-border pt-5">
    <h2 className="font-display text-2xl">Identidad del negocio</h2>
    <p className="mt-2 text-sm text-muted-foreground">Se muestra en tu página de reservas.</p>
    <div className="mt-5 grid gap-6 md:grid-cols-[auto_minmax(0,1fr)]">
      <div>
        <div className="flex size-28 items-center justify-center overflow-hidden rounded-md border border-border bg-card">{logoUrl ? <img src={logoUrl} alt="Logo del negocio" className="size-full object-contain" /> : <ImagePlus className="text-muted-foreground" strokeWidth={1.3} />}</div>
        <label className="mt-3 block text-sm">Logo<Input className="mt-2 max-w-56" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setBusy(true); try { const path = await upload(f, 'logo'); setLogo(path); setBusy(false); await persist({ logo_path: path }); } catch (err) { toast.error(errorText(err)); setBusy(false); } }} /></label>
        {logo && <Button variant="ghost" size="sm" className="mt-2" disabled={busy} onClick={() => { setLogo(null); void persist({ logo_path: null }); }}>Quitar logo</Button>}
      </div>
      <form className="space-y-4" onSubmit={e => { e.preventDefault(); void persist({ logo_path: logo }); }}>
        {([['Color principal', primary, setPrimary], ['Color secundario', secondary, setSecondary]] as const).map(([label, value, set]) => <label key={label} className="flex flex-wrap items-center gap-3 text-sm"><span className="w-36">{label}</span><input type="color" aria-label={label} value={value} onChange={e => set(e.target.value)} className="h-11 w-14 cursor-pointer rounded-md border border-input bg-background p-1" /><Input value={value} onChange={e => set(e.target.value)} pattern="#[0-9a-fA-F]{6}" className="w-32" aria-label={`${label} en código`} /></label>)}
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border p-4" aria-label="Vista previa">
          <span className="rounded-md px-4 py-2 text-sm" style={{ background: primary, color: /^#[0-9a-fA-F]{6}$/.test(primary) ? readableOn(primary) : undefined }}>Botón principal</span>
          <span className="rounded-md px-4 py-2 text-sm" style={{ background: secondary, color: /^#[0-9a-fA-F]{6}$/.test(secondary) ? readableOn(secondary) : undefined }}>Detalle secundario</span>
        </div>
        <Button type="submit" disabled={busy}>Guardar colores</Button>
      </form>
    </div>
  </section>;
}

type Pro = Awaited<ReturnType<typeof loadProfessionals>>[number];
export function ProfessionalsSection({ services }: { services: Service[] }) {
  const qc = useQueryClient();
  const load = useServerFn(loadProfessionals), save = useServerFn(saveProfessional), remove = useServerFn(deleteProfessional), addHour = useServerFn(saveProfessionalHour), removeHour = useServerFn(deleteProfessionalHour), upload = useUpload();
  const pros = useQuery({ queryKey: ['admin-professionals'], queryFn: () => load() });
  const photos = useMediaUrls((pros.data ?? []).map(p => p.photo_path ?? ''));
  const [editing, setEditing] = useState<Partial<Pro> | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok = 'Cambios guardados') => { setBusy(true); try { await fn(); toast.success(ok); await Promise.all([['admin-professionals'], ['admin-data'], ['public-professionals'], ['available-slots'], ['public-hours']].map(queryKey => qc.invalidateQueries({ queryKey }))); return true; } catch (e) { toast.error(errorText(e)); return false; } finally { setBusy(false); } };
  const open = (p: Partial<Pro>) => { setEditing(p); setPhoto(p.photo_path ?? null); };
  const editingPhoto = useMediaUrls(photo ? [photo] : [])[photo ?? ''];
  return <section className="mt-8 border-t border-border pt-5">
    <div className="flex flex-wrap justify-between gap-3"><div><h2 className="font-display text-2xl">Profesionales y horarios</h2></div><Button variant="outline" onClick={() => open({ is_active: true, display_order: pros.data?.length ?? 0, service_ids: services.map(s => s.id) })}><Plus />Añadir profesional</Button></div>
    {pros.isLoading ? <p role="status" className="py-6 text-sm">Cargando profesionales…</p> : pros.isError ? <div role="alert" className="py-6"><p className="text-sm">{errorText(pros.error)}</p><Button variant="outline" className="mt-2" onClick={() => pros.refetch()}>Reintentar</Button></div> : !pros.data?.length ? <p className="py-6 text-sm text-muted-foreground">Aún no tienes profesionales. Tus clientes reservan con el negocio.</p> :
      <ul className="mt-5 divide-y divide-border">{pros.data.map(p => <li key={p.id} className="grid gap-4 py-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="flex min-w-0 items-start gap-4"><span className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">{p.photo_path && photos[p.photo_path] ? <img src={photos[p.photo_path]} alt={`Foto de ${p.full_name}`} className="size-full object-cover" /> : <UserRound strokeWidth={1.3} />}</span>
          <div className="min-w-0"><p className="font-medium">{p.full_name}{!p.is_active && <span className="ml-2 text-xs text-muted-foreground">(inactivo)</span>}</p>{p.specialty && <p className="text-sm text-muted-foreground">{p.specialty}</p>}<p className="mt-1 text-xs text-muted-foreground">{p.service_ids.length ? services.filter(s => p.service_ids.includes(s.id)).map(s => s.name).join(' · ') : 'Sin servicios asignados'}</p>
            <div className="mt-2 flex gap-1"><Button variant="ghost" size="icon" aria-label={`Editar ${p.full_name}`} onClick={() => open(p)}><Pencil /></Button><Button variant="ghost" size="icon" aria-label={`Eliminar ${p.full_name}`} disabled={busy} onClick={() => { if (window.confirm(`¿Eliminar a ${p.full_name}?`)) void run(() => remove({ data: { id: p.id } }), 'Profesional eliminado'); }}><Trash2 /></Button></div></div></div>
        <div className="min-w-0"><p className="text-sm font-medium">Horario propio</p>
          {p.hours.length ? <ul className="mt-2 space-y-1 text-sm">{p.hours.map(h => <li key={h.id} className="flex items-center justify-between gap-2"><span>{DAYS[h.weekday]} · {h.opens_at.slice(0, 5)} – {h.closes_at.slice(0, 5)}</span><Button variant="ghost" size="icon" aria-label="Quitar horario" disabled={busy} onClick={() => run(() => removeHour({ data: { id: h.id } }))}><Trash2 /></Button></li>)}</ul> : <p className="mt-1 text-xs text-muted-foreground">Usa el horario del negocio.</p>}
          <form className="mt-3 flex flex-wrap items-end gap-2" onSubmit={async e => { e.preventDefault(); const f = new FormData(e.currentTarget), form = e.currentTarget; if (await run(() => addHour({ data: { professional_id: p.id, weekday: Number(f.get('weekday')), opens_at: String(f.get('opens')), closes_at: String(f.get('closes')) } }))) form.reset(); }}>
            <select name="weekday" aria-label="Día" className="h-11 rounded-md border border-input bg-background px-2 text-sm">{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select>
            <Input name="opens" type="time" aria-label="Desde" required className="w-28" /><Input name="closes" type="time" aria-label="Hasta" required className="w-28" />
            <Button type="submit" variant="outline" disabled={busy}><Plus />Horario</Button>
          </form></div>
      </li>)}</ul>}
    <Dialog open={!!editing} onOpenChange={o => { if (!o && !busy) setEditing(null); }}><DialogContent className="max-h-[85vh] overflow-y-auto"><DialogTitle>{editing?.id ? 'Editar profesional' : 'Añadir profesional'}</DialogTitle><DialogDescription>Nombre, foto y servicios que realiza.</DialogDescription>
      {editing && <form className="space-y-4" onSubmit={e => { e.preventDefault(); const f = new FormData(e.currentTarget); void run(() => save({ data: { ...(editing.id ? { id: editing.id } : {}), full_name: String(f.get('full_name')), specialty: String(f.get('specialty')).trim() || null, photo_path: photo, is_active: f.get('is_active') === 'on', display_order: Number(f.get('display_order')) || 0, service_ids: f.getAll('service_ids').map(String) } })).then(ok => { if (ok) setEditing(null); }); }}>
        <div className="flex items-center gap-4"><span className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-card">{editingPhoto ? <img src={editingPhoto} alt="Foto del profesional" className="size-full object-cover" /> : <UserRound strokeWidth={1.3} />}</span>
          <div><label className="block text-sm">Foto<Input className="mt-2" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async e => { const file = e.target.files?.[0]; if (!file) return; setBusy(true); try { setPhoto(await upload(file, 'professional')); } catch (err) { toast.error(errorText(err)); } finally { setBusy(false); } }} /></label>{photo && <Button type="button" variant="ghost" size="sm" onClick={() => setPhoto(null)}>Quitar foto</Button>}</div></div>
        <label className="block text-sm">Nombre<Input className="mt-2" name="full_name" required maxLength={120} defaultValue={editing.full_name ?? ''} /></label>
        <label className="block text-sm">Especialidad<Input className="mt-2" name="specialty" maxLength={150} defaultValue={editing.specialty ?? ''} /></label>
        <label className="block text-sm">Orden<Input className="mt-2" name="display_order" type="number" min={0} defaultValue={editing.display_order ?? 0} /></label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_active" className="accent-primary" defaultChecked={editing.is_active ?? true} />Activo (visible para reservar)</label>
        <fieldset><legend className="mb-2 text-sm">Servicios que realiza</legend>{services.length ? <div className="grid gap-2 sm:grid-cols-2">{services.map(s => <label key={s.id} className="flex items-center gap-2 text-sm"><input type="checkbox" name="service_ids" value={s.id} className="accent-primary" defaultChecked={editing.service_ids?.includes(s.id)} />{s.name}</label>)}</div> : <p className="text-sm text-muted-foreground">Primero crea servicios.</p>}</fieldset>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? 'Guardando…' : 'Guardar profesional'}</Button>
      </form>}
    </DialogContent></Dialog>
  </section>;
}
