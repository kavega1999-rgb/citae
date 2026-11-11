import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { newBookingMessage } from './push-message';

const subscription = z.object({ endpoint: z.string().url().startsWith('https://').max(1000), keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }) });

export const getPushPublicKey = createServerFn({ method: 'GET' }).handler(async () => process.env['VAPID_PUBLIC_KEY'] ?? '');

export const savePushSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(subscription)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc('is_admin');
    if (!isAdmin) throw new Error('Solo el dueño del negocio puede activar avisos.');
    const { data: businessId, error: idError } = await context.supabase.rpc('current_business_id');
    if (idError || !businessId) throw new Error('No encontramos tu negocio.');
    const { error } = await context.supabase.from('push_subscriptions').upsert({ user_id: context.userId, business_id: businessId, endpoint: data.endpoint, p256dh: data.keys.p256dh, auth: data.keys.auth }, { onConflict: 'business_id,endpoint' });
    if (error) throw new Error(error.message);
    return true;
  });

export const removePushSubscription = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(z.object({ endpoint: z.string().max(1000) }))
  .handler(async ({ data, context }) => {
    const { data: businessId } = await context.supabase.rpc('current_business_id');
    await context.supabase.from('push_subscriptions').delete().eq('endpoint', data.endpoint).eq('business_id', businessId ?? '');
    return true;
  });

// Public: authorized only by the reservation's secret token, sends no data back.
export const notifyNewBooking = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ appointmentId: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/) }))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
    const { data: booking, error } = await supabaseAdmin.rpc('get_public_appointment', { p_appointment_id: data.appointmentId, p_token: data.token });
    if (error || !booking) return false;
    const { data: appt } = await supabaseAdmin.from('appointments').select('id, business_id, client_id, start_at, created_at').eq('id', data.appointmentId).maybeSingle();
    // Only alert once, for freshly created bookings.
    if (!appt || Date.now() - Date.parse(appt.created_at) > 10 * 60_000) return false;
    const { data: settings } = await supabaseAdmin.from('business_settings').select('timezone').eq('business_id', appt.business_id).maybeSingle();
    const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('business_id', appt.business_id);
    if (!subs?.length) return true;
    const { data: client } = await supabaseAdmin.from('clients').select('full_name').eq('id', appt.client_id).maybeSingle();
    const { data: lines } = await supabaseAdmin.from('appointment_services').select('service_name').eq('appointment_id', appt.id).order('display_order');
    const services = (lines ?? []).map(s => s.service_name);
    const msg = newBookingMessage({ clientName: client?.full_name ?? 'Un cliente', startAt: appt.start_at, timezone: settings?.timezone ?? 'America/Bogota', services });
    const { buildPushPayload } = await import('@block65/webcrypto-web-push');
    const vapid = { subject: 'mailto:notificaciones@citae.app', publicKey: process.env['VAPID_PUBLIC_KEY']!, privateKey: process.env['VAPID_PRIVATE_KEY']! };
    await Promise.allSettled(subs.map(async s => {
      const payload = await buildPushPayload({ data: JSON.stringify({ ...msg, tag: appt.id, url: '/reservas' }), options: { ttl: 86400, urgency: 'high' } }, { endpoint: s.endpoint, expirationTime: null, keys: { p256dh: s.p256dh, auth: s.auth } }, vapid);
      const res = await fetch(s.endpoint, payload);
      if (res.status === 404 || res.status === 410) await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id);
    }));
    return true;
  });
