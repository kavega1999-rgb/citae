import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowDownLeft, ArrowUpRight, CalendarDays, CalendarCheck2, ChevronLeft, ChevronRight, CreditCard, LayoutDashboard, Menu, Settings2, Sparkles, Users, X, Clock3, CircleHelp, Store, ListFilter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { es } from "date-fns/locale";

const navigation = [
  { label: "Resumen", to: "/", icon: LayoutDashboard },
  { label: "Reservas", to: "/reservas", icon: CalendarCheck2 },
  { label: "Calendario", to: "/calendario", icon: CalendarDays },
  { label: "Clientes", to: "/clientes", icon: Users },
  { label: "Servicios", to: "/servicios", icon: Sparkles },
  { label: "Pagos", to: "/pagos", icon: CreditCard },
  { label: "Configuración", to: "/configuracion", icon: Settings2 },
] as const;

export type AdminView = "Resumen" | "Reservas" | "Calendario" | "Clientes" | "Servicios" | "Pagos" | "Configuración";

export function pageHead(title: string, description: string) {
  return { meta: [{ title: `${title} · CITAE` }, { name: "description", content: description }, { property: "og:title", content: `${title} · CITAE` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] };
}

export function Wordmark() { return <span className="font-display text-[32px] leading-none">CITAE<span className="text-gold">.</span></span>; }

function EmptyState({ icon: Icon = CalendarDays, title, detail }: { icon?: typeof CalendarDays; title: string; detail: string }) {
  return <div className="flex min-h-60 flex-col items-center justify-center px-5 py-12 text-center"><span className="mb-5 flex size-12 items-center justify-center rounded-full bg-secondary text-primary"><Icon size={21} strokeWidth={1.4} /></span><h3 className="text-base font-medium">{title}</h3><p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{detail}</p></div>;
}

export function AdminPage({ view = "Resumen" }: { view?: AdminView }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState("Hoy");
  const [date, setDate] = useState<Date>();
  const item = navigation.find((entry) => entry.label === view);
  return <div className="min-h-screen bg-background font-sans">
    {open && <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-border bg-card px-6 py-9 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between"><Link to="/" aria-label="CITAE, resumen"><Wordmark /></Link><Button variant="ghost" size="icon" aria-label="Cerrar menú" className="lg:hidden" onClick={() => setOpen(false)}><X /></Button></div>
      <p className="mt-2 text-[11px] text-muted-foreground">Tu tiempo, mejor organizado.</p>
      <div className="mb-8 mt-10 flex items-center gap-3 border-y border-border py-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary"><Store size={17} strokeWidth={1.5} /></span><div><p className="text-sm font-medium">Tu negocio</p><p className="mt-0.5 text-[11px] text-muted-foreground">Espacio de administración</p></div></div>
      <p className="mb-3 text-[10px] uppercase text-muted-foreground">Organización</p>
      <nav className="space-y-1">{navigation.map(({ label, to, icon: Icon }) => <Button key={to} asChild variant="ghost" className={`h-11 w-full justify-start px-3 font-normal ${view === label ? "bg-secondary text-foreground" : "text-muted-foreground"}`}><Link to={to} onClick={() => setOpen(false)} aria-current={view === label ? "page" : undefined}><Icon strokeWidth={1.5} /><span>{label}</span>{view === label && <span className="ml-auto size-1.5 rounded-full bg-primary" />}</Link></Button>)}</nav>
      <div className="mt-auto pt-12"><Button asChild variant="outline" className="h-11 w-full justify-between bg-card font-normal shadow-none"><Link to="/agendar">Página de reservas<ArrowUpRight /></Link></Button><div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-gold" />CITAE · Espacio de trabajo</div></div>
    </aside>
    <div className="lg:pl-60">
      <header className="flex h-[76px] items-center justify-between border-b border-border bg-card px-5 md:px-10"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" aria-label="Abrir menú" className="lg:hidden" onClick={() => setOpen(true)}><Menu /></Button><span className="text-sm text-muted-foreground">Mi espacio<span className="mx-3 text-border">/</span><span className="text-foreground">{view}</span></span></div><Button variant="ghost" size="icon" aria-label="Información del espacio" title="Espacio de administración CITAE" disabled><CircleHelp size={18} /></Button></header>
      <main className="mx-auto max-w-[1440px] px-5 pb-10 pt-8 md:px-10 md:pt-11">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[11px] uppercase text-muted-foreground">Tu espacio, en orden</p><h1 className="font-display text-[40px] leading-tight md:text-[46px]">{view === "Resumen" ? "Un nuevo día, todo en calma." : view}</h1><p className="mt-2 text-sm text-muted-foreground">{view === "Resumen" ? "Una mirada a la actividad de tu negocio." : `La información de ${view.toLowerCase()} de tu negocio.`}</p></div><Button asChild variant="outline" className="h-10 bg-card font-normal shadow-none"><Link to="/agendar">Ver página de reservas<ArrowUpRight /></Link></Button></div>
        {view === "Resumen" ? <>
          <section className="welcome-band relative mb-8 flex min-h-36 items-center justify-between overflow-hidden border-y border-secondary px-6 py-7 md:px-8"><div><div className="mb-3 flex items-center gap-2 text-xs"><span className="h-px w-6 bg-gold" />HECHO PARA TU TIEMPO</div><h2 className="font-display text-3xl md:text-[34px]">Menos pendientes. Más presente.</h2><p className="mt-2 text-sm text-muted-foreground">Cada cita, cada detalle, en su lugar.</p></div><CalendarCheck2 className="mr-4 hidden size-20 shrink-0 text-primary/35 sm:block" strokeWidth={0.65} /></section>
          <div className="mb-5 flex items-center justify-between"><h2 className="text-sm font-medium">Actividad del negocio</h2><div className="flex rounded-md border border-border bg-card p-1">{["Hoy", "Semana", "Mes"].map((label) => <Button key={label} variant="ghost" size="sm" aria-pressed={period === label} onClick={() => setPeriod(label)} className={`h-7 px-3 font-normal ${period === label ? "bg-secondary" : "text-muted-foreground"}`}>{label}</Button>)}</div></div>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Reservas", icon: CalendarCheck2 }, { label: "Clientes", icon: Users }, { label: "Ingresos", icon: CreditCard }, { label: "Por confirmar", icon: Clock3 }].map(({ label, icon: Icon }) => <article key={label} className="rounded-md border border-border bg-card p-5"><div className="flex items-center justify-between text-sm"><span>{label}</span><Icon size={18} strokeWidth={1.4} className="text-muted-foreground" /></div><p className="my-3 font-display text-4xl">—</p><p className="text-xs text-muted-foreground">Información no disponible</p></article>)}</section>
          <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.65fr)_minmax(280px,1fr)]"><section><div className="flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl">Próximas citas</h2><Button asChild variant="link" className="h-auto p-0 text-xs font-normal"><Link to="/reservas">Ver reservas<ArrowUpRight /></Link></Button></div><EmptyState title="Tus próximas citas, aquí" detail="La información de las reservas aún no está disponible en esta vista." /><div className="flex items-center gap-2 border-t border-border py-4 text-xs text-muted-foreground"><Clock3 size={14} />Cada espacio cuenta.</div></section><section><div className="flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl">Tu calendario</h2><CalendarDays size={17} strokeWidth={1.4} /></div><Calendar mode="single" selected={date} onSelect={setDate} locale={es} className="mx-auto mt-5 bg-transparent [--cell-size:2.3rem]" /><p className="mt-2 text-center text-xs text-muted-foreground">{date ? date.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric" }) : "Disponibilidad no disponible"}</p></section></div>
        </> : view === "Calendario" ? <section className="border-y border-border py-5"><Calendar mode="single" selected={date} onSelect={setDate} locale={es} className="mx-auto bg-transparent [--cell-size:2.75rem]" /><EmptyState title="Agenda no disponible" detail="No se han cargado reservas ni horarios en esta vista." /></section> : view === "Configuración" ? <section className="border-t border-border"><h2 className="mt-6 font-display text-2xl">Identidad del negocio</h2><div className="mt-5 divide-y divide-border">{["Nombre del negocio", "Logotipo", "Colores del negocio", "Información de contacto"].map(label => <div key={label} className="flex flex-wrap items-center justify-between gap-3 py-5 text-sm"><span>{label}</span><span className="text-muted-foreground">No disponible</span></div>)}</div></section> : <section><div className="flex items-center justify-between border-b border-border pb-4"><h2 className="font-display text-2xl">{view === "Reservas" ? "Todas las reservas" : view}</h2><Button variant="outline" size="sm" disabled className="shadow-none"><ListFilter />Filtros</Button></div><EmptyState icon={item?.icon} title={`${view}: información no disponible`} detail="No se han cargado datos del negocio en esta vista." /></section>}
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground"><span>CITAE · Tu tiempo, mejor organizado.</span><span>Un espacio para cada cita.</span></footer>
      </main>
    </div>
  </div>;
}