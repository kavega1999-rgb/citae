import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BookingPaymentSettings, configuredPaymentMethods, fetchPublicBookingSettings, type PublicBookingSettings } from "@/components/booking-business-settings";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({ supabase: { rpc: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });
// Synthetic test data only; never seeded or displayed by the application.
const settings: PublicBookingSettings = {
  business_name: "Test business", currency: "COP", deposit_percentage: 35,
  timezone: "America/Bogota", buffer_minutes: 15, hold_minutes: 60,
  nequi_number: "test-nequi", daviplata_number: null, bank_name: "Test bank",
  account_type: "Test type", account_number: "test-account", account_holder: "Test holder",
  payment_instructions: "Test instructions", requires_deposit: true, cancellation_policy: "",
};

describe("public business settings", () => {
  it("scopes configuration to the business link", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [settings], error: null } as never);
    await fetchPublicBookingSettings('consultorio');
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith('get_public_booking_settings', { p_business_slug: 'consultorio' });
  });
  it("consumes the existing public RPC and preserves returned values", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [settings], error: null } as never);
    expect(await fetchPublicBookingSettings()).toEqual(settings);
    expect(supabase.rpc).toHaveBeenCalledExactlyOnceWith("get_public_booking_settings");
  });
  it("returns missing configuration instead of invented defaults", async () => {
    vi.mocked(supabase.rpc).mockResolvedValue({ data: [], error: null } as never);
    expect(await fetchPublicBookingSettings()).toBeNull();
  });
  it("propagates RPC errors for the query error state", async () => {
    const error = new Error("Unavailable");
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error } as never);
    await expect(fetchPublicBookingSettings()).rejects.toThrow("Unavailable");
  });
  it("never renders payment information outside the payment stage", () => {
    for (const stage of ["services", "date", "details"] as const) {
      const result = render(<BookingPaymentSettings settings={settings} stage={stage} />);
      expect(result.container.childElementCount).toBe(0);
      result.unmount();
    }
  });
  it("renders real configured payment data only at payment", () => {
    const { container } = render(<BookingPaymentSettings settings={settings} stage="payment" />);
    expect(container.textContent).toContain(settings.nequi_number);
    expect(container.textContent).toContain(settings.account_number);
    expect(container.textContent).toContain(settings.payment_instructions);
    expect(configuredPaymentMethods(settings).map((m) => m.name)).toEqual(["Nequi", "Test bank"]);
  });
  it("does not invent incomplete or missing payment methods", () => {
    expect(configuredPaymentMethods({ ...settings, nequi_number: " ", bank_name: null })).toEqual([]);
  });
});