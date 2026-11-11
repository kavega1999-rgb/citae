import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-start", () => ({ useServerFn: () => vi.fn() }));
vi.mock("@/features/business/business.functions", () => ({ createMyBusiness: {} }));
import { BusinessOnboarding } from "@/features/business/business-onboarding";

afterEach(() => cleanup());
const linkField = () => screen.getByLabelText("Nombre de tu enlace") as HTMLInputElement;

describe("business link generation", () => {
  it("fills the link automatically from the business name", () => {
    render(<BusinessOnboarding onCreated={async () => {}} />);
    fireEvent.change(screen.getByLabelText("Nombre del negocio"), { target: { value: "Consultoría & Bienestar" } });
    expect(linkField().value).toBe("consultoria-y-bienestar");
  });
  it("keeps a manually edited link instead of overwriting it", () => {
    render(<BusinessOnboarding onCreated={async () => {}} />);
    fireEvent.change(screen.getByLabelText("Nombre del negocio"), { target: { value: "Spa Luna" } });
    fireEvent.change(linkField(), { target: { value: "spa-luna-2" } });
    fireEvent.change(screen.getByLabelText("Nombre del negocio"), { target: { value: "Spa Luna Nueva" } });
    expect(linkField().value).toBe("spa-luna-2");
  });
  it("restores the generated link on request", () => {
    render(<BusinessOnboarding onCreated={async () => {}} />);
    fireEvent.change(screen.getByLabelText("Nombre del negocio"), { target: { value: "Spa Luna" } });
    fireEvent.change(linkField(), { target: { value: "spa-luna-2" } });
    fireEvent.click(screen.getByRole("button", { name: "Usar el nombre del negocio" }));
    expect(linkField().value).toBe("spa-luna");
  });
  it("blocks creation while the link is shorter than three characters", () => {
    render(<BusinessOnboarding onCreated={async () => {}} />);
    fireEvent.change(screen.getByLabelText("Nombre del negocio"), { target: { value: "Spa" } });
    expect(screen.getByRole("button", { name: "Crear mi negocio" })).toBeDisabled();
    expect(screen.getByText(/al menos 3 caracteres/)).toBeDefined();
  });
});
