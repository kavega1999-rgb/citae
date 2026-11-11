import { describe, it, expect } from 'vitest';
import { summarizeByProfessional, groupByDay } from '@/features/admin/admin-overview';
const a = (id: string, pro: string | null, client: string, start: string, status = 'confirmed') => ({ id, client_id: client, start_at: start, status, total_amount: 10000, professional_id: pro, clients: { full_name: client, phone: '' } });
describe('summarizeByProfessional', () => {
  it('assigns clients and totals to each professional, ignoring cancelled', () => {
    const r = summarizeByProfessional([a('1', 'p1', 'Ana', '2030-01-01T15:00:00Z'), a('2', 'p1', 'Ana', '2030-01-02T15:00:00Z'), a('3', 'p2', 'Bea', '2030-01-01T15:00:00Z'), a('4', 'p1', 'Cris', '2030-01-03T15:00:00Z', 'cancelled')], [{ id: 'p1', full_name: 'Uno' }, { id: 'p2', full_name: 'Dos' }], Date.parse('2029-01-01'));
    expect(r.find(g => g.id === 'p1')).toMatchObject({ total: 2, revenue: 20000, clients: [{ name: 'Ana', visits: 2 }] });
    expect(r.find(g => g.id === 'p2')?.total).toBe(1);
    expect(r.some(g => g.id === '')).toBe(false);
  });
});
describe('groupByDay', () => {
  it('groups by the business local day', () => {
    expect(groupByDay([{ start_at: '2030-01-02T03:00:00Z' }, { start_at: '2030-01-01T15:00:00Z' }], 'America/Bogota').map(g => g[0])).toEqual(['2030-01-01']);
  });
});
