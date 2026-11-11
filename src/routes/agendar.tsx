import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ArrowLeft, CalendarDays, Check, ChevronRight, Clock3, RotateCw, Store, X } from "lucide-react";
import { Wordmark, pageHead } from "@/components/citae-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchPublicBookingSettings } from "@/components/booking-business-settings";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

import { BookingSteps, BookingResult, type CreatedBooking } from "@/features/booking/booking-steps";
import { formatBookingDate } from "@/features/booking/booking-utils";

export type PublicService = Database["public"]["Functions"]["get_public_services"]["Returns"][number];

export const Route = createFileRoute("/agendar")({ head: () => pageHead("Reserva tu cita", "Tu próxima cita, en un solo lugar. Experiencia de reservas CITAE."), component: Booking });

const copFormatter = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
export const formatCOP = (value: number) => copFormatter.format(value);
export function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}
export function summarize(services: PublicService[]) {
  return services.reduce((acc, s) => ({ price: acc.price + Number(s.price), duration: acc.duration + s.duration_minutes }), { price: 0, duration: 0 });
}

async function fetchPublicServices(): Promise<PublicService[]> {
  const { data, error } = await supabase.rpc("get_public_services");
  if (error) throw error;
  return [...(data ?? [])].sort((a, b) => a.display_order - b.display_order);
}

function Booking() {
  const { data: services = [], isLoading, isError, refetch, isFetching } = useQuery({ queryKey: ["public-services"], queryFn: fetchPublicServices });
  const settingsQuery = useQuery({ queryKey: ["public-booking-settings"], queryFn: fetchPublicBookingSettings });
  const settings = settingsQuery.data;
  const [stage, setStage] = useState<"services"|"date"|"details"|"payment">("services");
  const [time, setTime] = useState("");
  const [created, setCreated] = useState<CreatedBooking|null>(null);
  useEffect(() => { try { const raw=sessionStorage.getItem("citae-reservation"); if(raw){ const v=JSON.parse(raw); if(v.appointment_id && /^[a-f0-9]{64}$/.test(v.access_token)){setCreated(v);setStage("payment");} } } catch {} }, []);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const toggle = (id: string) => setSelectedIds((prev) => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  const selected = useMemo(() => services.filter((s) => selectedIds.has(s.id)), [services, selectedIds]);
  const totals = summarize(selected);

  return <div className="min-h-screen bg-background font-sans">
    <header className="border-b border-border bg-card"><div className="mx-auto flex h-20 max-w-6xl items-center justify-between px-6"><Link to="/" aria-label="CITAE, inicio"><Wordmark /></Link><Button asChild variant="ghost" className="text-muted-foreground"><Link to="/"><ArrowLeft />Mi espacio</Link></Button></div></header>
    <main className="mx-auto max-w-5xl px-5 py-10 md:px-6 md:py-16">
      <p className="mb-3 text-xs uppercase text-muted-foreground">Reservas con CITAE</p>
      <h1 className="font-display text-4xl md:text-5xl">Un momento para ti.</h1>
      <div className="mb-10 mt-7 flex items-start gap-3" aria-busy={settingsQuery.isLoading}>
        <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-border bg-card"><Store size={20} strokeWidth={1.3} /></span>
        <div className="min-w-0 flex-1">
          {settingsQuery.isLoading ? <div role="status" aria-label="Cargando información del negocio" className="space-y-2"><Skeleton className="h-5 w-48 max-w-full" /><Skeleton className="h-4 w-36 max-w-full" /></div>
          : settingsQuery.isError ? <div role="alert"><p className="text-sm font-medium">No pudimos cargar la información del negocio</p><Button variant="outline" size="sm" className="mt-2 shadow-none" onClick={() => settingsQuery.refetch()} disabled={settingsQuery.isFetching}><RotateCw className={settingsQuery.isFetching ? "animate-spin" : ""} />Reintentar información</Button></div>
          : settings ? <><p className="break-words text-sm font-medium">{settings.business_name}</p><p className="mt-1 text-xs text-muted-foreground">Anticipo: {settings.deposit_percentage}% · Moneda: {settings.currency}</p></>
          : <p role="status" className="text-sm text-muted-foreground">Información del negocio no disponible</p>}
        </div>
      </div>
      <ol className="grid grid-cols-2 gap-5 border-y border-border py-6 sm:grid-cols-4">{["Servicio", "Fecha y hora", "Tus datos", "Pago y confirmación"].map((label, index) => <li key={label} className={`flex items-center gap-3 text-sm ${index === ["services","date","details","payment"].indexOf(stage) ? "text-foreground" : "text-muted-foreground"}`}><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${index === ["services","date","details","payment"].indexOf(stage) ? "bg-secondary text-foreground" : "border border-border"}`}>{index + 1}</span>{label}</li>)}</ol>
      <div className={`mt-10 grid gap-10 ${created ? "" : "md:grid-cols-[1fr_300px]"}`}>
        <section aria-busy={isLoading}>
          {stage === "services" ? <>
          <h2 className="font-display text-3xl">Elige tus servicios</h2>
          <p className="mt-2 text-sm text-muted-foreground">Puedes seleccionar uno o varios.</p>
          <label className="mt-5 block text-xs text-muted-foreground">Recuperar reserva guardada<Input className="mt-2 max-w-sm" type="file" accept="application/json" onChange={async e=>{const file=e.target.files?.[0];if(!file)return;try{const v=JSON.parse(await file.text());if(typeof v.appointment_id!=="string"||!/^[a-f0-9]{64}$/.test(v.access_token))throw new Error();const {error}=await supabase.rpc("get_public_appointment",{p_appointment_id:v.appointment_id,p_token:v.access_token});if(error)throw error;setCreated(v);setStage("payment");try{sessionStorage.setItem("citae-reservation",JSON.stringify(v));}catch{}}catch{window.alert("No pudimos recuperar esta reserva. Revisa el archivo de acceso.");}}} /></label>
          <div className="mt-6">
            {isLoading ? <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-24 w-full rounded-md bg-secondary/60" />)}</div>
            : isError ? <div role="alert" className="flex min-h-56 flex-col items-center justify-center rounded-md border border-border bg-card px-6 text-center"><AlertCircle size={28} strokeWidth={1.2} className="mb-4 text-primary" /><p className="font-medium">No pudimos cargar los servicios</p><p className="mt-2 max-w-xs text-sm text-muted-foreground">Revisa tu conexión e inténtalo de nuevo.</p><Button variant="outline" className="mt-5 shadow-none" onClick={() => refetch()} disabled={isFetching}><RotateCw className={isFetching ? "animate-spin" : ""} />Reintentar</Button></div>
            : services.length === 0 ? <div className="flex min-h-56 flex-col items-center justify-center text-center"><CalendarDays size={30} strokeWidth={1} className="mb-5 text-primary" /><p className="font-medium">Aún no hay servicios disponibles</p><p className="mt-2 max-w-xs text-sm text-muted-foreground">El catálogo de este negocio todavía no tiene servicios publicados.</p></div>
            : <ul className="space-y-3">{services.map((s) => { const active = selectedIds.has(s.id); return <li key={s.id}><button type="button" aria-pressed={active} onClick={() => { toggle(s.id); setTime(""); setStage("services"); }} className={`flex w-full items-start gap-4 rounded-md border p-5 text-left transition-colors ${active ? "border-gold bg-secondary/50" : "border-border bg-card hover:border-primary"}`}><span className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border ${active ? "border-gold bg-gold text-card" : "border-border"}`}>{active && <Check size={12} />}</span><span className="min-w-0 flex-1"><span className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-display text-xl">{s.name}</span><span className="text-sm font-medium">{formatCOP(Number(s.price))}</span></span>{s.description && <span className="mt-1 block text-sm text-muted-foreground">{s.description}</span>}<span className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground"><Clock3 size={13} />{formatDuration(s.duration_minutes)}</span></span></button></li>; })}</ul>}
          </div>
          </> : created ? <BookingResult created={created} settings={settings ?? null} onNew={()=>{sessionStorage.removeItem("citae-reservation");setCreated(null);setSelectedIds(new Set());setTime("");setStage("services");}} /> : <BookingSteps stage={stage} ids={selected.map(s=>s.id)} settings={settings ?? null} onTime={setTime} onBack={()=>setStage(stage === "details" ? "date" : "services")} onCreated={v=>{setCreated(v);setStage("payment");try{sessionStorage.setItem("citae-reservation",JSON.stringify(v));}catch{}}} />}
        </section>
        {!created && <aside className="self-start border-t border-gold pt-5 md:sticky md:top-6">
          <h2 className="font-display text-2xl">Tu cita</h2>
          {selected.length > 0 ? <ul className="mt-5 space-y-3 text-sm">{selected.map((s) => <li key={s.id} className="flex items-start justify-between gap-3"><span><span className="block">{s.name}</span><span className="text-xs text-muted-foreground">{formatDuration(s.duration_minutes)} · {formatCOP(Number(s.price))}</span></span><button type="button" aria-label={`Quitar ${s.name}`} onClick={() => { toggle(s.id); setTime(""); setStage("services"); }} className="text-muted-foreground hover:text-foreground"><X size={15} /></button></li>)}</ul> : <p className="mt-5 text-sm text-muted-foreground">Aún no has elegido servicios.</p>}
          <dl className="mt-6 space-y-4 border-t border-border pt-5 text-sm"><div className="flex justify-between"><dt className="text-muted-foreground">Duración</dt><dd>{selected.length ? formatDuration(totals.duration) : "—"}</dd></div><div className="flex justify-between"><dt className="text-muted-foreground">Fecha y hora</dt><dd className="max-w-40 text-right">{time ? formatBookingDate(time,settings?.timezone ?? "America/Bogota") : "—"}</dd></div><div className="flex justify-between font-medium"><dt>Total</dt><dd>{selected.length ? formatCOP(totals.price) : "—"}</dd></div></dl>
          {(stage === "services" || stage === "date") && <Button disabled={selected.length === 0 || (stage === "date" && !time) || !settings} onClick={()=>setStage(stage === "services" ? "date" : "details")} className="mt-7 h-11 w-full shadow-none">Continuar<ChevronRight /></Button>}
        </aside>}
      </div>
      
    </main>
    <footer className="mx-auto max-w-5xl border-t border-border px-6 py-6 text-xs text-muted-foreground">CITAE · Tu tiempo, mejor organizado.</footer>
  </div>;
}
