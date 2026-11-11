import { createFileRoute } from '@tanstack/react-router';
import { Booking } from './agendar';
import { pageHead } from '@/components/citae-shell';

export const Route = createFileRoute('/agendar_/$slug')({
  head: ({ params }) => pageHead(`Reserva · ${params.slug}`, 'Consulta los servicios y horarios de este negocio y reserva tu cita con CITAE.'),
  component: BusinessBooking,
});
function BusinessBooking() {
  const { slug } = Route.useParams();
  return <Booking key={slug} slug={slug} />;
}