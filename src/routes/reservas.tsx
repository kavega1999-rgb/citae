import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";
export const Route = createFileRoute("/reservas")({ head: () => pageHead("Reservas", "Reservas y detalles de citas de tu negocio en CITAE."), component: Reservas });
function Reservas() { return <AdminPage view="Reservas" />; }