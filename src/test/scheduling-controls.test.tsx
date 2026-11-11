import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ save: vi.fn(), remove: vi.fn(), load: vi.fn(), move: vi.fn() }));
vi.mock('@tanstack/react-start', () => ({ useServerFn: (fn: unknown) => fn }));
vi.mock('@/features/admin/admin.functions', () => ({ saveAdmin: mocks.save, deleteAdmin: mocks.remove }));
vi.mock('@/features/admin/scheduling.functions', () => ({ loadRescheduleSlots: mocks.load, moveAppointment: mocks.move }));
import { ClosuresSection, RescheduleButton } from '@/features/admin/scheduling-controls';
const pro = '11111111-1111-4111-8111-111111111111';
const appointment = { id:'22222222-2222-4222-8222-222222222222', professional_id:pro, status:'confirmed', start_at:'2030-01-01T15:00:00Z', clients:{full_name:'Cliente'}, appointment_services:[], duration_minutes:30, total_amount:50000 };
const data = { blocks:[], professionals:[{id:pro,full_name:'Profesional',is_active:true}] };
function mount(ui: React.ReactNode) { return render(<QueryClientProvider client={new QueryClient({ defaultOptions:{queries:{retry:false}} })}>{ui}</QueryClientProvider>); }
afterEach(() => { cleanup(); vi.clearAllMocks(); });
describe('schedule actions', () => {
  it('saves a professional closure for an inclusive day in business timezone', async () => {
    mount(<ClosuresSection data={data as never} timezone="America/Bogota"/>);
    fireEvent.click(screen.getByRole('button',{name:'Añadir cierre'}));
    fireEvent.change(screen.getByLabelText('Aplicar a'),{target:{value:pro}});
    fireEvent.click(screen.getByLabelText('Días completos'));
    fireEvent.change(screen.getByLabelText('Desde'),{target:{value:'2030-01-01'}});
    fireEvent.change(screen.getByLabelText('Hasta (incluido)'),{target:{value:'2030-01-01'}});
    fireEvent.click(screen.getByRole('button',{name:'Guardar cierre'}));
    await waitFor(() => expect(mocks.save).toHaveBeenCalledWith({data:{table:'blocked_slots',values:{start_at:'2030-01-01T05:00:00.000Z',end_at:'2030-01-02T05:00:00.000Z',professional_id:pro,reason:null}}}));
  });
  it('moves a confirmed appointment only to a returned available slot', async () => {
    mocks.load.mockResolvedValue([{slot_start:'2030-01-01T16:00:00Z'}]); mocks.move.mockResolvedValue(true);
    mount(<RescheduleButton appointment={appointment as never} professionals={data.professionals as never} timezone="America/Bogota"/>);
    fireEvent.click(screen.getByRole('button',{name:'Mover cita'}));
    expect(screen.getByRole('button',{name:'Confirmar cambio'})).toBeDisabled();
    fireEvent.click(await screen.findByRole('button',{name:/11:00/}));
    fireEvent.click(screen.getByRole('button',{name:'Confirmar cambio'}));
    await waitFor(() => expect(mocks.move).toHaveBeenCalledWith({data:{appointment_id:appointment.id,start_at:'2030-01-01T16:00:00Z',professional_id:pro}}));
  });
  it('does not offer moving a completed appointment', () => {
    mount(<RescheduleButton appointment={{...appointment,status:'completed'} as never} professionals={data.professionals as never} timezone="America/Bogota"/>);
    expect(screen.queryByRole('button',{name:'Mover cita'})).toBeNull();
  });
});