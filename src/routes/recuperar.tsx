import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Wordmark, pageHead } from '@/components/citae-shell';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
export const Route=createFileRoute('/recuperar')({head:()=>pageHead('Recuperar acceso','Actualiza tu contraseña de acceso a CITAE.'),component:Recovery});
function Recovery(){const [password,setPassword]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);return <main className="mx-auto max-w-sm px-6 py-16"><Wordmark/><h1 className="mt-10 font-display text-3xl">Nueva contraseña</h1><form className="mt-6 space-y-4" onSubmit={async e=>{e.preventDefault();setBusy(true);const {error}=await supabase.auth.updateUser({password});setBusy(false);setMessage(error?'No pudimos cambiar la contraseña. Abre el enlace de recuperación enviado a tu correo.':'Contraseña actualizada.');}}><label className="block text-sm">Contraseña<Input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={e=>setPassword(e.target.value)}/></label><Button disabled={busy} type="submit">Guardar contraseña</Button><p role="status" className="text-sm">{message}</p><Button asChild variant="link"><Link to="/">Volver a mi espacio</Link></Button></form></main>;}
