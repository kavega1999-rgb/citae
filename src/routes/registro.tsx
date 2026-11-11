import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wordmark, pageHead } from '@/components/citae-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/registro')({ head: () => pageHead('Registra tu negocio', 'Crea tu cuenta de CITAE y organiza las citas de tu negocio con un enlace propio.'), component: Registration });
function Registration() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [confirmation, setConfirmation] = useState(false);
  return <main className="mx-auto max-w-md px-5 py-12"><Link to="/" aria-label="CITAE, inicio"><Wordmark /></Link>
    <h1 className="mt-10 font-display text-3xl">Tu negocio en CITAE</h1>
    {confirmation ? <p role="status" className="mt-6">Revisa tu correo para confirmar tu cuenta. Después, inicia sesión para configurar tu negocio.</p> : <form className="mt-7 space-y-5" onSubmit={async event => {
      event.preventDefault(); setBusy(true); setError('');
      const form = new FormData(event.currentTarget);
      try {
        const { data, error } = await supabase.auth.signUp({ email: String(form.get('email')).trim(), password: String(form.get('password')), options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        if (data.session) await navigate({ to: '/' }); else setConfirmation(true);
      } catch (e) { setError(e instanceof Error ? e.message : 'No pudimos registrar tu cuenta.'); }
      finally { setBusy(false); }
    }}>
      <label className="block text-sm">Correo<Input name="email" type="email" autoComplete="email" className="mt-2" required /></label>
      <label className="block text-sm">Contraseña<Input name="password" type="password" autoComplete="new-password" className="mt-2" minLength={8} required /></label>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" type="submit" disabled={busy}>{busy ? 'Creando cuenta…' : 'Crear cuenta'}</Button>
    </form>}
    <Button asChild variant="link" className="mt-5"><Link to="/">Ya tengo cuenta · Ingresar</Link></Button>
  </main>;
}