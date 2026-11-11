import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { WhatsAppConfirmationButton } from '@/features/admin/whatsapp-confirmation-button';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const props = {
  appointment: { id: 'booking-1', status: 'confirmed', start_at: '2026-11-11T19:30:00Z', duration_minutes: 75, total_amount: 100000, clients: { full_name: 'Ana', phone: '3001234567' }, appointment_services: [{ service_name: 'Manicura' }] },
  payments: [{ appointment_id: 'booking-1', status: 'approved', amount: 30000 }],
  settings: { business_name: 'Negocio de prueba', timezone: 'America/Bogota', cancellation_policy: null },
};

describe('personalized WhatsApp confirmation', () => {
  it('opens WhatsApp with the edited message and the original recipient', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    render(<WhatsAppConfirmationButton {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar confirmación por WhatsApp' }));
    const editor = screen.getByRole('textbox', { name: 'Mensaje' });
    expect((editor as HTMLTextAreaElement).value).toContain('Manicura');
    fireEvent.change(editor, { target: { value: 'Hola Ana, ¡te esperamos! 💕\nTu cita está confirmada.' } });
    fireEvent.click(screen.getByRole('button', { name: 'Abrir WhatsApp' }));
    const target = new URL(String(open.mock.calls[0]?.[0]));
    expect(target.pathname).toBe('/573001234567');
    expect(target.searchParams.get('text')).toBe('Hola Ana, ¡te esperamos! 💕\nTu cita está confirmada.');
    expect(open).toHaveBeenCalledWith(target.toString(), '_blank', 'noopener,noreferrer');
  });
  it('restores real reservation information and prevents sending an empty message', () => {
    render(<WhatsAppConfirmationButton {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Enviar confirmación por WhatsApp' }));
    const editor = screen.getByRole('textbox', { name: 'Mensaje' });
    const original = (editor as HTMLTextAreaElement).value;
    fireEvent.change(editor, { target: { value: '  ' } });
    expect(screen.getByRole('button', { name: 'Abrir WhatsApp' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurar mensaje' }));
    expect(editor).toHaveValue(original);
    expect(screen.getByRole('button', { name: 'Abrir WhatsApp' })).toBeEnabled();
  });
});