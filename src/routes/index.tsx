import { createFileRoute } from "@tanstack/react-router";
import { AdminPage, pageHead } from "@/components/citae-shell";

export const Route = createFileRoute("/")({
  head: () => pageHead("Resumen", "CITAE: un espacio para organizar las citas, los clientes y la actividad de tu negocio."),
  component: Index,
});

function Index() { return <AdminPage />; }