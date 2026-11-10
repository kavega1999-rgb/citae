import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";
export const Route = createFileRoute("/pagos")({ head: () => pageHead("Pagos", "El espacio de pagos de las reservas de tu negocio en CITAE."), component: Pagos });
function Pagos() { return <AdminPage view="Pagos" />; }