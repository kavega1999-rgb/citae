import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

export type SettingsValues = {
  business_name: string; timezone: string; currency: 'COP'; requires_deposit: boolean; deposit_percentage: number;
  buffer_minutes: number; hold_minutes: number; cancellation_policy: string | null; payment_instructions: string | null;
  nequi_number: string | null; daviplata_number: string | null; bank_name: string | null; account_type: string | null; account_number: string | null; account_holder: string | null;
};
type Row = Partial<SettingsValues> & { id?: string };
const ZONES = ['America/Bogota', 'America/Mexico_City', 'America/Lima', 'America/Guayaquil', 'America/Caracas', 'America/Santiago', 'America/Argentina/Buenos_Aires', 'America/New_York', 'Europe/Madrid'];
const txt = (v: FormDataEntryValue | null) => { const s = String(v ?? '').trim(); return s || null; };

function Block({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return <fieldset className="grid gap-4 border-t border-border py-6 md:grid-cols-[220px_minmax(0,1fr)]">
    <div><legend className="font-display text-lg">{title}</legend>{hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}</div>
    <div className="grid min-w-0 gap-4 sm:grid-cols-2">{children}</div>
  </fieldset>;
}
const Field = ({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) => <label className={`block text-sm ${wide ? 'sm:col-span-2' : ''}`}>{label}<div className="mt-2">{children}</div></label>;

export function BusinessSettingsForm({ row, busy, onSave }: { row: Row | null; busy: boolean; onSave: (id: string | undefined, values: SettingsValues) => Promise<void> }) {
  const [deposit, setDeposit] = useState(row?.requires_deposit ?? true);
  return <form className="mt-8" onSubmit={e => {
    e.preventDefault(); const f = new FormData(e.currentTarget);
    void onSave(row?.id, {
      business_name: String(f.get('business_name')).trim(), timezone: String(f.get('timezone')), currency: 'COP', requires_deposit: deposit,
      deposit_percentage: deposit ? Number(f.get('deposit_percentage')) : (row?.deposit_percentage ?? 30), hold_minutes: deposit ? Number(f.get('hold_minutes')) : (row?.hold_minutes ?? 60),
      buffer_minutes: Number(f.get('buffer_minutes')), cancellation_policy: txt(f.get('cancellation_policy')),
      payment_instructions: deposit ? txt(f.get('payment_instructions')) : row?.payment_instructions ?? null,
      nequi_number: deposit ? txt(f.get('nequi_number')) : row?.nequi_number ?? null, daviplata_number: deposit ? txt(f.get('daviplata_number')) : row?.daviplata_number ?? null,
      bank_name: deposit ? txt(f.get('bank_name')) : row?.bank_name ?? null, account_type: deposit ? txt(f.get('account_type')) : row?.account_type ?? null,
      account_number: deposit ? txt(f.get('account_number')) : row?.account_number ?? null, account_holder: deposit ? txt(f.get('account_holder')) : row?.account_holder ?? null,
    });
  }}>
    <h2 className="font-display text-2xl">Configuración del negocio</h2>
    <Block title="Datos generales" hint="Así te ven tus clientes al reservar.">
      <Field label="Nombre del negocio" wide><Input name="business_name" required maxLength={150} defaultValue={row?.business_name ?? ''} /></Field>
      <Field label="Zona horaria"><select name="timezone" defaultValue={row?.timezone ?? 'America/Bogota'} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm">{[...new Set([row?.timezone ?? 'America/Bogota', ...ZONES])].map(z => <option key={z} value={z}>{z.replace(/_/g, ' ')}</option>)}</select></Field>
      <Field label="Moneda"><Input value="COP · Peso colombiano" disabled readOnly /></Field>
    </Block>
    <Block title="Agenda" hint="Tiempo libre que se deja después de cada cita.">
      <Field label="Margen entre citas (minutos)"><Input name="buffer_minutes" type="number" min={0} required defaultValue={row?.buffer_minutes ?? 15} /></Field>
      <Field label="Política de cancelación" wide><Textarea name="cancellation_policy" defaultValue={row?.cancellation_policy ?? ''} placeholder="Ej.: avisa con 24 horas de anticipación." /></Field>
    </Block>
    <Block title="Anticipo" hint="Pide un pago parcial para asegurar la cita.">
      <label className="flex items-center justify-between gap-4 rounded-md border border-border p-4 sm:col-span-2">
        <span><span className="block text-sm font-medium">Pedir anticipo al reservar</span><span className="block text-xs text-muted-foreground">{deposit ? 'La cita se confirma al aprobar el comprobante.' : 'La cita queda confirmada al reservar y se paga en el negocio.'}</span></span>
        <Switch checked={deposit} onCheckedChange={setDeposit} aria-label="Pedir anticipo al reservar" />
      </label>
      {deposit && <>
        <Field label="Porcentaje del anticipo (%)"><Input name="deposit_percentage" type="number" min={1} max={100} step="0.01" required defaultValue={row?.deposit_percentage ?? 30} /></Field>
        <Field label="Plazo para pagar (minutos)"><Input name="hold_minutes" type="number" min={1} required defaultValue={row?.hold_minutes ?? 60} /></Field>
      </>}
    </Block>
    {deposit && <Block title="Medios de pago" hint="Solo se muestran en el paso de pago. Deja vacío lo que no uses.">
      <Field label="Número Nequi"><Input name="nequi_number" inputMode="tel" defaultValue={row?.nequi_number ?? ''} /></Field>
      <Field label="Número Daviplata"><Input name="daviplata_number" inputMode="tel" defaultValue={row?.daviplata_number ?? ''} /></Field>
      <Field label="Banco"><Input name="bank_name" defaultValue={row?.bank_name ?? ''} /></Field>
      <Field label="Tipo de cuenta"><Input name="account_type" defaultValue={row?.account_type ?? ''} placeholder="Ahorros o corriente" /></Field>
      <Field label="Número de cuenta"><Input name="account_number" defaultValue={row?.account_number ?? ''} /></Field>
      <Field label="Titular"><Input name="account_holder" defaultValue={row?.account_holder ?? ''} /></Field>
      <Field label="Instrucciones de pago" wide><Textarea name="payment_instructions" defaultValue={row?.payment_instructions ?? ''} /></Field>
    </Block>}
    <div className="sticky bottom-0 flex justify-end border-t border-border bg-background py-4"><Button type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar configuración'}</Button></div>
  </form>;
}
