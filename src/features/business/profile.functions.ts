import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

type Db = { rpc: (name: 'current_business_id') => PromiseLike<{ data: string | null; error: { message: string } | null }> };
async function businessId(db: Db) {
  const { data, error } = await db.rpc('current_business_id');
  if (error || !data) throw new Error('Acceso reservado al propietario del negocio.');
  return data;
}
const id = z.string().uuid();
const color = z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable();
const time = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/);
const mediaPath = z.string().regex(/^[0-9a-f-]{36}\/[a-z]+-[0-9a-f-]{36}\.(jpg|png|webp)$/).nullable();
const ensureOwnPath = (path: string | null, business: string) => { if (path && !path.startsWith(`${business}/`)) throw new Error('Imagen no válida.'); };

export const loadProfessionals = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  await businessId(context.supabase);
  const db = context.supabase;
  const [pros, links, hours] = await Promise.all([
    db.from('professionals').select('*').order('display_order').order('full_name').limit(200),
    db.from('professional_services').select('professional_id,service_id').limit(5000),
    db.from('professional_hours').select('*').order('weekday').order('opens_at').limit(2000),
  ]);
  for (const r of [pros, links, hours]) if (r.error) throw new Error(r.error.message);
  return (pros.data ?? []).map(p => ({ ...p, service_ids: (links.data ?? []).filter(l => l.professional_id === p.id).map(l => l.service_id), hours: (hours.data ?? []).filter(h => h.professional_id === p.id) }));
});

export const saveBranding = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ primary_color: color, secondary_color: color, logo_path: mediaPath }))
  .handler(async ({ data, context }) => {
    const business = await businessId(context.supabase);
    ensureOwnPath(data.logo_path, business);
    const { error } = await context.supabase.from('businesses').update(data).eq('id', business).select('id').single();
    if (error) throw new Error(error.message);
    return true;
  });

export const saveProfessional = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: id.optional(), full_name: z.string().trim().min(1).max(120), specialty: z.string().trim().max(150).nullable(), photo_path: mediaPath, is_active: z.boolean(), display_order: z.number().int().nonnegative(), service_ids: z.array(id).max(200) }))
  .handler(async ({ data, context }) => {
    const business = await businessId(context.supabase);
    ensureOwnPath(data.photo_path, business);
    const db = context.supabase;
    const { id: proId, service_ids, ...values } = data;
    const saved = await (proId ? db.from('professionals').update(values).eq('id', proId) : db.from('professionals').insert(values)).select('id').single();
    if (saved.error) throw new Error(saved.error.message);
    const pid = saved.data.id;
    const cleared = await db.from('professional_services').delete().eq('professional_id', pid);
    if (cleared.error) throw new Error(cleared.error.message);
    if (service_ids.length) {
      const linked = await db.from('professional_services').insert([...new Set(service_ids)].map(service_id => ({ professional_id: pid, service_id })));
      if (linked.error) throw new Error(linked.error.message);
    }
    return pid;
  });

export const deleteProfessional = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id }))
  .handler(async ({ data, context }) => {
    await businessId(context.supabase);
    const { error } = await context.supabase.from('professionals').delete().eq('id', data.id).select('id').single();
    if (error) throw new Error(error.code === '23503' ? 'Este profesional tiene reservas; desactívalo en lugar de eliminarlo.' : error.message);
    return true;
  });

export const saveProfessionalHour = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ professional_id: id, weekday: z.number().int().min(0).max(6), opens_at: time, closes_at: time }).refine(v => v.closes_at > v.opens_at, 'El cierre debe ser posterior a la apertura'))
  .handler(async ({ data, context }) => {
    await businessId(context.supabase);
    const { error } = await context.supabase.from('professional_hours').insert(data).select('id').single();
    if (error) throw new Error(error.message);
    return true;
  });

export const deleteProfessionalHour = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id }))
  .handler(async ({ data, context }) => {
    await businessId(context.supabase);
    const { error } = await context.supabase.from('professional_hours').delete().eq('id', data.id).select('id').single();
    if (error) throw new Error(error.message);
    return true;
  });

/** Signed upload into the owner's own business folder. */
export const prepareMediaUpload = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ kind: z.enum(['logo', 'professional']), extension: z.enum(['jpg', 'png', 'webp']) }))
  .handler(async ({ data, context }) => {
    const business = await businessId(context.supabase);
    const path = `${business}/${data.kind}-${crypto.randomUUID()}.${data.extension}`;
    const { data: signed, error } = await context.supabase.storage.from('business-media').createSignedUploadUrl(path);
    if (error) throw new Error(error.message);
    return { path, token: signed.token };
  });
