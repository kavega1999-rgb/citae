import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const loadMyBusiness = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.rpc('get_my_business');
  if (error) throw new Error(error.message);
  return data?.[0] ?? null;
});
export const createMyBusiness = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ name: z.string().trim().min(1).max(150), slug: z.string().min(3).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/), activity: z.string().trim().min(1).max(150), mode: z.enum(['business', 'solo']) }))
  .handler(async ({ context, data }) => {
    const result = await context.supabase.rpc('create_my_business', { p_name: data.name, p_slug: data.slug, p_activity: data.activity, p_agenda_mode: data.mode });
    if (result.error) throw new Error(result.error.code === '23505' ? 'Ese enlace ya está ocupado. Elige otro.' : result.error.message);
    return result.data;
  });export const listMyBusinesses = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.rpc('list_my_businesses');
  if (error) throw new Error(error.message);
  return data ?? [];
});
export const switchBusiness = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc('set_active_business', { p_business_id: data.id });
    if (error) throw new Error(error.message);
    return true;
  });

export const deleteMyBusiness = createServerFn({ method: 'POST' }).middleware([requireSupabaseAuth])
  .inputValidator(z.object({ id: z.string().uuid() }))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc('delete_my_business' as never, { p_business_id: data.id } as never);
    if (error) throw new Error(error.message);
    return true;
  });
