import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { deleteMyBusiness } from './business.functions';

export function DeleteBusiness({ id, name }: { id: string; name: string }) {
  const qc = useQueryClient();
  const remove = useServerFn(deleteMyBusiness);
  const [open, setOpen] = useState(false), [typed, setTyped] = useState(''), [busy, setBusy] = useState(false);
  return <section className="mt-10 rounded-md border border-destructive/40 p-5">
    <h2 className="font-display text-xl">Eliminar negocio</h2>
    <p className="mt-2 max-w-xl text-sm text-muted-foreground">Se borrarán para siempre las reservas, clientes, servicios, profesionales, horarios y pagos de este negocio. Su enlace dejará de funcionar.</p>
    <Button variant="destructive" className="mt-4" onClick={() => { setTyped(''); setOpen(true); }}><Trash2 />Eliminar negocio</Button>
    <Dialog open={open} onOpenChange={v => !busy && setOpen(v)}><DialogContent>
      <DialogTitle>¿Eliminar {name}?</DialogTitle>
      <DialogDescription>Esta acción no se puede deshacer. Escribe el nombre del negocio para confirmar.</DialogDescription>
      <Input aria-label="Nombre del negocio" value={typed} onChange={e => setTyped(e.target.value)} placeholder={name} />
      <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" disabled={busy} onClick={() => setOpen(false)}>Cancelar</Button>
        <Button variant="destructive" disabled={busy || typed.trim() !== name.trim()} onClick={async () => { setBusy(true); try { await remove({ data: { id } }); setOpen(false); toast.success('Negocio eliminado'); await qc.invalidateQueries(); } catch (e) { toast.error(e instanceof Error ? e.message : 'No pudimos eliminar el negocio.'); } finally { setBusy(false); } }}>{busy ? 'Eliminando…' : 'Eliminar definitivamente'}</Button></div>
    </DialogContent></Dialog>
  </section>;
}
