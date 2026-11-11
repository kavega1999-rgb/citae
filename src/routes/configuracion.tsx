import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";
export const Route = createFileRoute("/configuracion")({ head: () => pageHead("Negocio", "Identidad e información de tu negocio en CITAE."), component: Configuracion });
function Configuracion() { return <AdminPage view="Configuración" />; }