import { useQuery } from '@tanstack/react-query';
import type { CSSProperties } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const MEDIA_BUCKET = 'business-media';
const HEX = /^#[0-9a-fA-F]{6}$/;

/** Readable text color (plum or white) for a hex background. */
export function readableOn(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; });
  const l = 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
  return l > 0.4 ? '#49343D' : '#FFFFFF';
}

/** Business colors scoped to the public booking page only. */
export function brandStyle(primary?: string | null, secondary?: string | null): CSSProperties {
  const style: Record<string, string> = {};
  if (primary && HEX.test(primary)) { style['--primary'] = primary; style['--primary-foreground'] = readableOn(primary); style['--ring'] = primary; }
  if (secondary && HEX.test(secondary)) { style['--secondary'] = secondary; style['--secondary-foreground'] = readableOn(secondary); style['--accent'] = `color-mix(in oklab, ${secondary} 22%, white)`; }
  return style as CSSProperties;
}

/** Signed display URLs for business logos and professional photos. */
export function useMediaUrls(paths: string[]) {
  const clean = [...new Set(paths.filter(Boolean))].sort();
  const query = useQuery({
    queryKey: ['business-media', clean], enabled: clean.length > 0, staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.storage.from(MEDIA_BUCKET).createSignedUrls(clean, 3600);
      if (error) throw error;
      const urls: Record<string, string> = {};
      for (const d of data ?? []) if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
      return urls;
    },
  });
  return query.data ?? {} as Record<string, string>;
}

export const imageExtension = (file: File) => {
  if (file.size > 3 * 1024 * 1024) throw new Error('La imagen supera 3 MB.');
  const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' } as Record<string, 'jpg' | 'png' | 'webp'>)[file.type];
  if (!ext) throw new Error('Usa una imagen JPG, PNG o WEBP.');
  return ext;
};
