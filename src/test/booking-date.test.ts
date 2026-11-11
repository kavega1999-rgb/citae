import { it, expect } from 'vitest';
import { formatBookingDate } from '@/features/booking/booking-utils';
it('does not crash on missing dates', () => { expect(formatBookingDate('null','America/Bogota')).toBe('—'); expect(formatBookingDate(undefined,'America/Bogota')).toBe('—'); });
