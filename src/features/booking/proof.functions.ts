import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
const credentials = z.object({ appointmentId: z.string().uuid(), token: z.string().regex(/^[a-f0-9]{64}$/), extension: z.enum(['jpg','png','pdf']) });
export const prepareProofUpload = createServerFn({ method: 'POST' }).inputValidator(credentials).handler(async ({data}) => {
 const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
 // Authorize this single reservation with its secret capability, never with an ID alone.
 const { data: booking, error } = await supabaseAdmin.rpc('get_public_appointment', { p_appointment_id: data.appointmentId, p_token: data.token });
 if(error || !booking || typeof booking !== 'object' || Array.isArray(booking)) throw new Error('Reserva no válida.');
 const payment = booking['payment'];
 if (!payment || typeof payment !== 'object' || Array.isArray(payment)) throw new Error('Anticipo no disponible.');
 if (!['pending_payment','pending_verification'].includes(String(booking['status'])) || !['pending','rejected'].includes(String(payment['status']))) throw new Error('La reserva no admite comprobantes.');
 if(booking['status'] === 'pending_payment' && (!booking['payment_deadline_at'] || Date.parse(String(booking['payment_deadline_at'])) <= Date.now())) throw new Error('El plazo de pago ha vencido.');
 const path = `${data.appointmentId}/${crypto.randomUUID()}.${data.extension}`;
 const { data: signed, error: uploadError } = await supabaseAdmin.storage.from('payment-proofs').createSignedUploadUrl(path);
 if(uploadError) throw new Error(uploadError.message); return { path, token: signed.token };
});
