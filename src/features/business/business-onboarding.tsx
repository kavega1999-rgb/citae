import { useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMyBusiness } from './business.functions';

export function BusinessOnboarding({ onCreated }: { onCreated: () => Promise<unknown> }) {
  const create = useServerFn(createMyBusiness);
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <section className="mx-auto max-w-lg py-6">
    <Store className="mb-4 text-primary" />
    <h2 className="font-display text-2xl">Crea tu negocio</h2>
    <form className="mt-6 space-y-5" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      const form = new FormData(event.currentTarget);
      try {
        await create({ data: { name: String(form.get('name')), slug: String(form.get('slug')).trim().toLowerCase(), activity: String(form.get('activity')), mode: form.get('mode') === 'solo' ? 'solo' : 'business' } });
        await onCreated();
      } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos crear el negocio.'); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm">Nombre del negocio<Input className="mt-2" name="name" required maxLength={150} /></label>
      <label className="block text-sm">Actividad<Input className="mt-2" name="activity" required maxLength={150} /></label>
      <label className="block text-sm">Nombre de tu enlace<Input className="mt-2" name="slug" required minLength={3} maxLength={80} pattern="[a-z0-9]+(-[a-z0-9]+)*" autoCapitalize="none" /></label>
      <fieldset><legend className="mb-3 text-sm">Modalidad</legend><div className="grid gap-3 sm:grid-cols-2">
        <label className="flex min-h-11 items-center gap-3 rounded-md border border-input p-3 text-sm"><input type="radio" className="accent-primary" name="mode" value="business" defaultChecked />Negocio</label>
        <label className="flex min-h-11 items-center gap-3 rounded-md border border-input p-3 text-sm"><input type="radio" className="accent-primary" name="mode" value="solo" />Profesional independiente</label>
      </div></fieldset>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">{busy ? 'Creando negocio…' : 'Crear mi negocio'}</Button>
    </form>
  </section>;
}