import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { buildWhatsAppConfirmation, type ConfirmationAppointment, type ConfirmationPayment, type ConfirmationSettings } from './whatsapp-confirmation';

export function WhatsAppConfirmationButton({ appointment, payments, settings }: {
  appointment: ConfirmationAppointment;
  payments: ConfirmationPayment[];
  settings: ConfirmationSettings | null;
}) {
  const { url, reason } = buildWhatsAppConfirmation(appointment, payments, settings);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const originalMessage = url ? new URL(url).searchParams.get('text') ?? '' : '';
  return <div className="max-w-full">
    <Button variant="outline" disabled={!url} className="h-auto min-h-9 max-w-full whitespace-normal text-left" title={reason ?? 'Abrir confirmación en WhatsApp'} onClick={() => {
      if (url) { setDraft(originalMessage); setOpen(true); }
    }}><MessageCircle className="shrink-0" />Enviar confirmación por WhatsApp</Button>
    {reason && appointment.status === 'confirmed' && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{reason}</p>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogTitle>Confirmación para {appointment.clients?.full_name}</DialogTitle>
        <DialogDescription>WhatsApp · {appointment.clients?.phone}</DialogDescription>
        <label className="block text-sm" htmlFor={`whatsapp-message-${appointment.id}`}>Mensaje</label>
        <Textarea id={`whatsapp-message-${appointment.id}`} value={draft} onChange={event => setDraft(event.target.value)} className="min-h-72 resize-y" />
        <div className="flex flex-wrap justify-between gap-2">
          <Button variant="ghost" onClick={() => setDraft(originalMessage)}>Restaurar mensaje</Button>
          <Button disabled={!url || !draft.trim()} onClick={() => {
            if (!url || !draft.trim()) return;
            const target = new URL(url);
            target.searchParams.set('text', draft.trim());
            window.open(target.toString(), '_blank', 'noopener,noreferrer');
            setOpen(false);
          }}><MessageCircle />Abrir WhatsApp</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>;
}