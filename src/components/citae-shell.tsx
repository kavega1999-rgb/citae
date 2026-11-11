import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowUpRight, CalendarDays, CalendarCheck2, CreditCard, LayoutDashboard, Menu, Settings2, Sparkles, Users, X, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminContent } from "@/features/admin/admin-content";

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

export function Wordmark() { return <span className="font-display text-[26px] font-semibold leading-none">CITAE<span className="text-gold">.</span></span>; }

export function AdminPage({ view = "Resumen" }: { view?: AdminView }) {
  const [open, setOpen] = useState(false);
  return <div className="min-h-screen bg-background font-sans">
    {open && <div className="fixed inset-0 z-30 bg-foreground/20 lg:hidden" onClick={() => setOpen(false)} />}
    <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-border bg-sidebar px-5 py-7 transition-transform lg:translate-x-0 ${open ? "translate-x-0" : "-translate-x-full"}`}>
      <div className="flex items-center justify-between"><Link to="/" aria-label="CITAE, resumen"><Wordmark /></Link><Button variant="ghost" size="icon" aria-label="Cerrar menú" className="lg:hidden" onClick={() => setOpen(false)}><X /></Button></div>
      <p className="mt-2 text-[11px] text-muted-foreground">Tu tiempo, mejor organizado.</p>
      <div className="mb-6 mt-8 flex items-center gap-3 border-y border-border py-4"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary"><Store size={17} strokeWidth={1.5} /></span><div><p className="text-sm font-medium">Tu negocio</p><p className="mt-0.5 text-[11px] text-muted-foreground">Espacio de administración</p></div></div>
      <p className="mb-3 text-[10px] uppercase text-muted-foreground">Organización</p>
      <nav className="space-y-1">{navigation.map(({ label, to, icon: Icon }) => <Button key={to} asChild variant="ghost" className={`h-12 w-full justify-start px-3 font-medium ${view === label ? "bg-accent text-primary" : "text-muted-foreground"}`}><Link to={to} onClick={() => setOpen(false)} aria-current={view === label ? "page" : undefined}><Icon strokeWidth={1.5} /><span>{label}</span>{view === label && <span className="ml-auto size-1.5 rounded-full bg-primary" />}</Link></Button>)}</nav>
      <div className="mt-auto pt-12"><Button asChild variant="outline" className="h-11 w-full justify-between bg-card font-normal shadow-none"><Link to="/configuracion">Mi enlace de reservas<ArrowUpRight /></Link></Button><div className="mt-6 flex items-center gap-2 text-[11px] text-muted-foreground"><span className="size-1.5 rounded-full bg-gold" />CITAE · Espacio de trabajo</div></div>
    </aside>
    <div className="lg:pl-64">
      <header className="grid h-[72px] grid-cols-[minmax(0,1fr)_auto] items-center border-b border-border bg-card px-5 md:px-10"><div className="flex items-center gap-3"><Button variant="ghost" size="icon" aria-label="Abrir menú" className="lg:hidden" onClick={() => setOpen(true)}><Menu /></Button><span className="text-sm text-muted-foreground">Mi espacio<span className="mx-3 text-border">/</span><span className="text-foreground">{view}</span></span></div></header>
      <main className="mx-auto max-w-[1280px] px-5 pb-10 pt-7 md:px-10 md:pt-9">
        <div className="mb-8 grid min-w-0 gap-5 border-b border-border pb-7 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"><div className="min-w-0"><p className="mb-2 text-[11px] uppercase text-muted-foreground">Tu espacio, en orden</p><h1 className="font-display text-3xl leading-tight">{view === "Resumen" ? "Resumen" : view}</h1><p className="mt-2 text-sm text-muted-foreground">{view === "Resumen" ? "Una mirada a la actividad de tu negocio." : `La información de ${view.toLowerCase()} de tu negocio.`}</p></div><Button asChild variant="outline" className="min-h-11 self-start bg-card font-medium shadow-none"><Link to="/configuracion">Enlace para clientes<ArrowUpRight /></Link></Button></div>
        <div className="admin-content"><AdminContent view={view} /></div>
        <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5 text-[11px] text-muted-foreground"><span>CITAE · Tu tiempo, mejor organizado.</span><span>Un espacio para cada cita.</span></footer>
      </main>
    </div>
  </div>;
}