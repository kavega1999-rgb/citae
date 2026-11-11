import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock('@/integrations/supabase/auth-middleware', () => ({ requireSupabaseAuth: {} }));
vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({ middleware: () => ({
    handler: (fn: (input: unknown) => unknown) => () => fn({ context: { supabase: { rpc: mocks.rpc } } }),
    inputValidator: (schema: { parse: (v: unknown) => unknown }) => ({ handler: (fn: (input: unknown) => unknown) => (input: { data: unknown }) => fn({ data: schema.parse(input.data), context: { supabase: { rpc: mocks.rpc } } }) }),
  }) }),
}));
import { createMyBusiness, loadMyBusiness } from '@/features/business/business.functions';
beforeEach(() => vi.resetAllMocks());
describe('business onboarding', () => {
  it('creates a business immediately through the authenticated atomic RPC without platform approval', async () => {
    mocks.rpc.mockResolvedValue({ data: 'business-id', error: null });
    expect(await createMyBusiness({ data: { name: 'Consultorio de prueba', slug: 'consultorio-prueba', activity: 'Consultas', mode: 'business' } })).toBe('business-id');
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('create_my_business', { p_name: 'Consultorio de prueba', p_slug: 'consultorio-prueba', p_activity: 'Consultas', p_agenda_mode: 'business' });
  });
  it('supports an independent professional', async () => {
    mocks.rpc.mockResolvedValue({ data: 'solo-id', error: null });
    await createMyBusiness({ data: { name: 'Profesional de prueba', slug: 'profesional', activity: 'Asesoría', mode: 'solo' } });
    expect(mocks.rpc).toHaveBeenCalledWith('create_my_business', expect.objectContaining({ p_agenda_mode: 'solo' }));
  });
  it('does not accept sales as an agenda mode', async () => {
    await expect(createMyBusiness({ data: { name: 'Prueba', slug: 'prueba', activity: 'Prueba', mode: 'sales' } } as never)).rejects.toThrow();
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it('reads only the signed-in user business and shows no invented business', async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    expect(await loadMyBusiness()).toBeNull();
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith('get_my_business');
  });
});