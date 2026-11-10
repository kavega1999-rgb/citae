import { describe, expect, it } from "vitest";
import { formatDuration, summarize } from "@/routes/agendar";

const svc = (price: number, duration_minutes: number) => ({ id: String(price), name: "x", description: "", display_order: 0, price, duration_minutes });

describe("booking totals", () => {
  it("sums price and duration of selected services", () => {
    expect(summarize([svc(45000, 45), svc(30000, 30)])).toEqual({ price: 75000, duration: 75 });
  });
  it("formats duration in hours and minutes", () => {
    expect(formatDuration(75)).toBe("1 h 15 min");
  });
});
