import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const id = z.string().uuid();
const text = z.string().trim().min(1);
const optional = z.string().nullable().optional();
const service = z.object({ name: text, description: optional, price: z.number().int().nonnegative(), duration_minutes: z.number().int().positive(), display_order: z.number().int().nonnegative(), is_active: z.boolean() });
const client = z.object({ full_name: text, phone: text.max(30), email: z.union([z.string().email(), z.literal(''), z.null()]).optional(), notes: optional });
const settings = z.object({ business_name: text, timezone: text.refine(v => { try { new Intl.DateTimeFormat('es', { timeZone: v }); return true; } catch { return false; } }, 'Zona horaria inválida'), currency: z.literal('COP'), deposit_percentage: z.number().min(0).max(100), buffer_minutes: z.number().int().nonnegative(), hold_minutes: z.number().int().positive(), cancellation_policy: optional, payment_instructions: optional, nequi_number: optional, daviplata_number: optional, bank_name: optional, account_type: optional, account_number: optional, account_holder: optional });
const hours = z.object({ weekday: z.number().int().min(0).max(6), opens_at: text, closes_at: text, interval_minutes: z.number().int().positive(), slot_mode: z.enum(['interval','specific']), is_active: z.boolean() }).refine(v => v.closes_at > v.opens_at, 'El cierre debe ser posterior a la apertura');
const block = z.object({ start_at: z.string().datetime({ offset: true }), end_at: z.string().datetime({ offset: true }), reason: optional }).refine(v => Date.parse(v.end_at) > Date.parse(v.start_at), 'El final debe ser posterior al inicio');
export const editSchema = z.discriminatedUnion('table', [
 z.object({ table: z.literal('services'), id: id.optional(), values: service }),
 z.object({ table: z.literal('clients'), id: id.optional(), values: client }),
 z.object({ table: z.literal('business_settings'), id: id.optional(), values: settings }),
 z.object({ table: z.literal('business_hours'), id: id.optional(), values: hours }),
 z.object({ table: z.literal('business_hour_slots'), id: id.optional(), values: z.object({ business_hours_id: id, slot_time: text, display_order: z.number().int().nonnegative() }) }),
 z.object({ table: z.literal('blocked_slots'), id: id.optional(), values: block }),
]);
async function owner(db: Parameters<typeof requireOwner>[0]) { await requireOwner(db); }
async function requireOwner(db: { rpc: (name: 'is_admin') => PromiseLike<{ data: boolean | null; error: { message: string } | null }> }) {
 const { data, error } = await db.rpc('is_admin');
 if (error || !data) throw new Error('Acceso reservado al propietario del negocio.');
}
export const loadAdmin = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
 await owner(context.supabase);
 const db = context.supabase;
 const results = await Promise.all([
 db.from('services').select('*').order('display_order').limit(500),
 db.from('clients').select('*').order('created_at', { ascending: false }).limit(500),
 db.from('appointments').select('id,client_id,start_at,end_at,duration_minutes,total_amount,status,admin_notes,client_notes,cancellation_reason,payment_deadline_at,clients(full_name,phone),appointment_services(service_name,unit_price,duration_minutes)').order('start_at', { ascending: false }).limit(500),
 db.from('payments').select('*').order('created_at', { ascending: false }).limit(500),
 db.from('business_settings').select('*').limit(1),
 db.from('business_hours').select('*').order('weekday').limit(500),
 db.from('business_hour_slots').select('*').order('slot_time').limit(500),
 db.from('blocked_slots').select('*').order('start_at').limit(500),
 ]);
 for (const r of results) if (r.error) throw new Error(r.error.message);
 return { services: results[0].data ?? [], clients: results[1].data ?? [], appointments: results[2].data ?? [], payments: results[3].data ?? [], settings: results[4].data?.[0] ?? null, hours: results[5].data ?? [], slots: results[6].data ?? [], blocks: results[7].data ?? [] };
});
export const saveAdmin = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => editSchema.parse(v)).handler(async ({ data, context }) => {
 await owner(context.supabase);
 // The discriminated union validates each table's allowed columns before the database call.
 const query = data.id ? context.supabase.from(data.table).update(data.values).eq('id', data.id) : context.supabase.from(data.table).insert(data.values);
 const { error } = await query.select('id').single(); if (error) throw new Error(error.message); return true;
});
export const deleteAdmin = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ table: z.enum(['business_hours','business_hour_slots','blocked_slots']), id })).handler(async ({ data, context }) => {
 await owner(context.supabase); const { error } = await context.supabase.from(data.table).delete().eq('id',data.id).select('id').single(); if(error) throw new Error(error.message); return true;
});
export const updateAppointment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id, status: z.enum(['cancelled','completed','no_show']).optional(), admin_notes: z.string().optional(), cancellation_reason: z.string().optional() })).handler(async ({ data, context }) => {
 await owner(context.supabase); const { id: appointmentId, ...values } = data;
 const { error } = await context.supabase.from('appointments').update(values).eq('id',appointmentId).select('id').single(); if(error) throw new Error(error.message); return true;
});
export const reviewPayment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ id, approve: z.boolean(), reason: z.string().trim().max(500).optional() })).handler(async ({ data, context }) => {
 await owner(context.supabase);
 if (!data.approve && !data.reason) throw new Error('Indica el motivo del rechazo.');
 const result = data.approve ? await context.supabase.rpc('approve_payment',{p_payment_id:data.id}) : await context.supabase.rpc('reject_payment',{p_payment_id:data.id,p_rejection_reason:data.reason ?? ''});
 if(result.error) throw new Error(result.error.message); return result.data;
});
export const viewProof = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(z.object({ path: text })).handler(async ({ data, context }) => {
 await owner(context.supabase); const { data: result, error } = await context.supabase.storage.from('payment-proofs').createSignedUrl(data.path,60); if(error) throw new Error(error.message); return result.signedUrl;
});
