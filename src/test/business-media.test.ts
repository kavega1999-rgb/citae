import { describe, expect, it } from 'vitest';
import { brandStyle, imageExtension, readableOn } from '@/features/business/business-media';
describe('business branding', () => {
  it('applies both business colors to the booking page', () => {
    const s = brandStyle('#112233', '#EEDDCC') as Record<string, string>;
    expect(s['--primary']).toBe('#112233');
    expect(s['--secondary']).toBe('#EEDDCC');
  });
  it('ignores invalid colors', () => { expect(brandStyle('red', null)).toEqual({}); });
  it('picks readable text', () => { expect(readableOn('#000000')).toBe('#FFFFFF'); expect(readableOn('#FFFFFF')).toBe('#49343D'); });
  it('accepts only JPG/PNG/WEBP up to 3 MB', () => {
    expect(imageExtension({ type: 'image/png', size: 10 } as File)).toBe('png');
    expect(() => imageExtension({ type: 'image/gif', size: 10 } as File)).toThrow();
    expect(() => imageExtension({ type: 'image/png', size: 3 * 1024 * 1024 + 1 } as File)).toThrow();
  });
});
