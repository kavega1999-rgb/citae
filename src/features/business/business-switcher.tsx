import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useServerFn } from '@tanstack/react-start';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { BusinessOnboarding } from './business-onboarding';
import { listMyBusinesses, switchBusiness } from './business.functions';

export function BusinessSwitcher({ showCreate = false }: { showCreate?: boolean }) {
  const qc = useQueryClient();
  const list = useServerFn(listMyBusinesses), change = useServerFn(switchBusiness);
  const businesses = useQuery({ queryKey: ['my-businesses'], queryFn: () => list() });
  const [creating, setCreating] = useState(false), [busy, setBusy] = useState(false);
  const active = businesses.data?.find(b => b.is_active);
  const reload = () => qc.invalidateQueries();
  return <div className="flex min-w-0 flex-wrap items-center gap-2">
    {businesses.data && businesses.data.length > 1 && <select aria-label="Negocio que administras" disabled={busy} value={active?.id ?? ''} className="h-11 max-w-56 rounded-md border border-input bg-background px-3 text-sm" onChange={async e => { setBusy(true); try { await change({ data: { id: e.target.value } }); await reload(); toast.success('Cambiaste de negocio'); } catch (err) { toast.error(err instanceof Error ? err.message : 'No pudimos cambiar de negocio.'); } finally { setBusy(false); } }}>
      {businesses.data.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
    </select>}
    {showCreate && <Button variant="outline" onClick={() => setCreating(true)}><Plus />Nuevo negocio</Button>}
    <Dialog open={creating} onOpenChange={setCreating}><DialogContent className="max-h-[90vh] overflow-y-auto"><DialogTitle className="sr-only">Nuevo negocio</DialogTitle><DialogDescription className="sr-only">Crea otro negocio en tu cuenta.</DialogDescription>
      <BusinessOnboarding onCreated={async () => { setCreating(false); await reload(); toast.success('Negocio creado'); }} />
    </DialogContent></Dialog>
  </div>;
}
