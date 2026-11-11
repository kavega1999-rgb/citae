import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildWhatsAppConfirmation, type ConfirmationAppointment, type ConfirmationPayment, type ConfirmationSettings } from './whatsapp-confirmation';

export function WhatsAppConfirmationButton({ appointment, payments, settings }: {
  appointment: ConfirmationAppointment;
  payments: ConfirmationPayment[];
  settings: ConfirmationSettings | null;
}) {
  const { url, reason } = buildWhatsAppConfirmation(appointment, payments, settings);
  return <div className="max-w-full">
    <Button variant="outline" disabled={!url} className="h-auto min-h-9 max-w-full whitespace-normal text-left" title={reason ?? 'Abrir confirmación en WhatsApp'} onClick={() => {
      if (url) window.open(url, '_blank', 'noopener,noreferrer');
    }}><MessageCircle className="shrink-0" />Enviar confirmación por WhatsApp</Button>
    {reason && appointment.status === 'confirmed' && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{reason}</p>}
  </div>;
}