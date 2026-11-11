import { describe, expect, it } from 'vitest';
import { slugFromName } from '@/features/business/business-slug';

describe('slugFromName', () => {
  it('builds the link from the business name', () => {
    expect(slugFromName('Spa Studio Luna')).toBe('spa-studio-luna');
  });
  it('removes accents and punctuation', () => {
    expect(slugFromName('Consultoría & Bienestar')).toBe('consultoria-y-bienestar');
    expect(slugFromName('  La Rinconada!! ')).toBe('la-rinconada');
  });
  it('collapses repeated spaces and separators', () => {
    expect(slugFromName('Spa   -- Studio')).toBe('spa-studio');
  });
  it('keeps the link within 80 characters without a trailing dash', () => {
    const slug = slugFromName('a'.repeat(90));
    expect(slug.length).toBeLessThanOrEqual(80);
    expect(slug.endsWith('-')).toBe(false);
  });
  it('returns an empty link for a name with no letters', () => {
    expect(slugFromName('!!!')).toBe('');
  });
});
