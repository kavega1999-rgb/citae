import { describe, it, expect } from 'vitest';
import { businessSchedule, closureRange, schedulingInstant, zonedInput } from '@/features/admin/scheduling-utils';
describe('professional schedules', () => {
  const fallback = [{ weekday: 1, opens_at: '09:00:00', closes_at: '17:00:00', is_active: true }];
  it('uses the only professional schedule as the business schedule', () => {
    expect(businessSchedule([{ id: 'a', is_active: true }], [{ professional_id: 'a', weekday: 1, opens_at: '07:00:00', closes_at: '12:00:00' }], fallback)[1]?.ranges).toEqual([{ opens_at: '07:00', closes_at: '12:00' }]);
  });
  it('combines several schedules without filling a closed gap', () => {
    expect(businessSchedule([{ id: 'a', is_active: true }, { id: 'b', is_active: true }], [{ professional_id: 'a', weekday: 1, opens_at: '07:00', closes_at: '12:00' }, { professional_id: 'b', weekday: 1, opens_at: '14:00', closes_at: '19:00' }], fallback)[1]?.ranges).toEqual([{ opens_at: '07:00', closes_at: '12:00' }, { opens_at: '14:00', closes_at: '19:00' }]);
  });
  it('does not give a professional fallback hours on days absent from their own schedule', () => {
    expect(businessSchedule([{ id: 'a', is_active: true }], [{ professional_id: 'a', weekday: 2, opens_at: '10:00', closes_at: '12:00' }], fallback)[1]?.ranges).toEqual([]);
  });
});
describe('closures', () => {
  it('closes an inclusive whole date using business timezone', () => {
    expect(closureRange('2030-01-01','2030-01-01',true,'America/Bogota')).toEqual({ start_at: '2030-01-01T05:00:00.000Z', end_at: '2030-01-02T05:00:00.000Z' });
  });
  it('closes only specified hours', () => {
    expect(closureRange('2030-01-01T12:00','2030-01-01T13:00',false,'America/Bogota')).toEqual({ start_at: '2030-01-01T17:00:00.000Z', end_at: '2030-01-01T18:00:00.000Z' });
  });
  it('rejects reversed ranges', () => expect(() => closureRange('2030-01-01T13:00','2030-01-01T12:00',false,'America/Bogota')).toThrow());
  it('converts appointment edits in the business timezone, not device timezone', () => {
    expect(schedulingInstant('2030-01-01T10:00','America/Bogota')).toBe('2030-01-01T15:00:00.000Z');
    expect(zonedInput('2030-01-01T15:00:00Z','America/Bogota')).toBe('2030-01-01T10:00');
  });
});