import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";
export const Route = createFileRoute("/servicios")({ head: () => pageHead("Servicios", "Servicios de tu negocio, organizados en CITAE."), component: Servicios });
function Servicios() { return <AdminPage view="Servicios" />; }