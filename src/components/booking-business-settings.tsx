import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type SettingsRow = Database["public"]["Functions"]["get_public_booking_settings"]["Returns"][number];
type PaymentField = "payment_instructions" | "nequi_number" | "daviplata_number" | "bank_name" | "account_type" | "account_number" | "account_holder";
export type PublicBookingSettings = Omit<SettingsRow, PaymentField> & {
  [K in PaymentField]: string | null;
};

export async function fetchPublicBookingSettings(slug?: string): Promise<PublicBookingSettings | null> {
  const { data, error } = slug ? await supabase.rpc("get_public_booking_settings", { p_business_slug: slug }) : await supabase.rpc("get_public_booking_settings");
  if (error) throw error;
  return data?.[0] ?? null;
}

export function configuredPaymentMethods(settings: PublicBookingSettings) {
  return [
    settings.nequi_number?.trim() ? { name: "Nequi", details: [settings.nequi_number] } : null,
    settings.daviplata_number?.trim() ? { name: "Daviplata", details: [settings.daviplata_number] } : null,
    settings.bank_name?.trim() && settings.account_number?.trim()
      ? { name: settings.bank_name, details: [settings.account_type, settings.account_number, settings.account_holder].filter((value): value is string => Boolean(value?.trim())) }
      : null,
  ].filter((method) => method !== null);
}

// Later booking phases must explicitly enter payment; service selection never reveals identifiers.
export function BookingPaymentSettings({ settings, stage }: { settings: PublicBookingSettings | null; stage: "services" | "date" | "details" | "payment" }) {
  if (stage !== "payment") return null;
  if (!settings) return <p role="status" className="text-sm text-muted-foreground">Configuración de pagos no disponible.</p>;
  const methods = configuredPaymentMethods(settings);
  return <section aria-label="Información de pago" className="border-t border-border pt-6">
    <h2 className="font-display text-3xl">Pago</h2>
    {methods.length ? <dl className="mt-5 space-y-5">{methods.map((method) => <div key={method.name}>
      <dt className="text-sm font-medium break-words">{method.name}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-muted-foreground">{method.details.join(" · ")}</dd>
    </div>)}</dl> : <p className="mt-4 text-sm text-muted-foreground">No hay métodos de pago configurados.</p>}
    {settings.payment_instructions?.trim() && <p className="mt-5 whitespace-pre-wrap break-words text-sm text-muted-foreground">{settings.payment_instructions}</p>}
  </section>;
}