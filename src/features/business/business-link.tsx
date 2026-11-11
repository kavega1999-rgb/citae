import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function BusinessLink({ slug }: { slug: string }) {
  const [message, setMessage] = useState('');
  return <section className="my-7 border-y border-border py-5">
    <h2 className="font-display text-xl">Enlace para tus clientes</h2>
    <p className="mt-3 break-all text-sm text-muted-foreground">/agenda/{slug}</p>
    <div className="mt-4 flex flex-wrap gap-3">
      <Button variant="outline" onClick={async () => {
        try { await navigator.clipboard.writeText(new URL(`/agenda/${encodeURIComponent(slug)}`, window.location.origin).toString()); setMessage('Enlace copiado.'); }
        catch { setMessage('No pudimos copiar el enlace. Abre la página y copia su dirección.'); }
      }}><Copy />Copiar enlace</Button>
      <Button asChild variant="ghost"><Link to="/agenda/$slug" params={{ slug }}><ExternalLink />Ver mi página</Link></Button>
    </div>
    {message && <p role="status" className="mt-3 text-sm">{message}</p>}
  </section>;
}