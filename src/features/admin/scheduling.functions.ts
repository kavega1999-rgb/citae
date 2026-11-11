import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const id = z.string().uuid();
export const rescheduleSlotSchema = z.object({ appointment_id: id, date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), professional_id: id.nullable() });
export const rescheduleSchema = z.object({ appointment_id: id, start_at: z.string().datetime({ offset: true }), professional_id: id.nullable() });
export const loadRescheduleSlots = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(rescheduleSlotSchema).handler(async ({ data, context }) => {
  const owner = await context.supabase.rpc('is_admin');
  if (owner.error || !owner.data) throw new Error('Acceso reservado al propietario.');
  const result = await context.supabase.rpc('get_reschedule_slots', { p_appointment_id: data.appointment_id, p_date: data.date, ...(data.professional_id ? { p_professional_id: data.professional_id } : {}) });
  if (result.error) throw new Error(result.error.message);
  return result.data;
});
export const moveAppointment = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).inputValidator(rescheduleSchema).handler(async ({ data, context }) => {
  const owner = await context.supabase.rpc('is_admin');
  if (owner.error || !owner.data) throw new Error('Acceso reservado al propietario.');
  const result = await context.supabase.rpc('reschedule_appointment', { p_appointment_id: data.appointment_id, p_start_at: data.start_at, ...(data.professional_id ? { p_professional_id: data.professional_id } : {}) });
  if (result.error || !result.data) throw new Error(result.error?.message ?? 'No se pudo mover la cita.');
  return true;
});