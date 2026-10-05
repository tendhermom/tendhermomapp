import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { nextDebitDate } from "./paystack";

describe("next recurring debit date", () => {
  it("shows Paystack's next_payment_date exactly (12 Oct stays 12 Oct)", () => {
    const d = nextDebitDate({ next_payment_at: "2026-10-12T00:00:00.000Z", expires_at: "2026-10-14T00:00:00.000Z" });
    expect(d?.toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });

  it("removes the 2-day grace buffer when only the access expiry is known", () => {
    const d = nextDebitDate({ next_payment_at: null, expires_at: "2026-10-14T00:00:00.000Z" });
    expect(d?.toISOString()).toBe("2026-10-12T00:00:00.000Z");
  });
});
