import { createFileRoute } from '@tanstack/react-router';
import { Booking } from '@/features/booking/booking-page';
import { pageHead } from '@/components/citae-shell';

export const Route = createFileRoute('/agenda/$slug')({
  head: ({ params }) => pageHead(`Reserva · ${params.slug}`, 'Consulta los servicios, profesionales y horarios de este negocio y reserva tu cita con CITAE.'),
  component: BusinessBooking,
});
function BusinessBooking() {
  const { slug } = Route.useParams();
  return <Booking key={slug} slug={slug} />;
}
