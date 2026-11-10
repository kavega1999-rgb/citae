import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";
export const Route = createFileRoute("/calendario")({ head: () => pageHead("Calendario", "El calendario de citas de tu negocio en CITAE."), component: Calendario });
function Calendario() { return <AdminPage view="Calendario" />; }