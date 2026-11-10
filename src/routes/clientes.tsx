import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";
export const Route = createFileRoute("/clientes")({ head: () => pageHead("Clientes", "El espacio de clientes de tu negocio en CITAE."), component: Clientes });
function Clientes() { return <AdminPage view="Clientes" />; }