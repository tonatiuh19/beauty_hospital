import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

const { axiosMock } = vi.hoisted(() => ({
  axiosMock: {
    patch: vi.fn(),
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock("@/lib/axios", () => ({
  default: axiosMock,
  formatAxiosError: (_e: unknown, fallback: string) => fallback,
}));

import patientAppointmentsReducer, {
  cancelAppointment,
  downloadContract,
} from "./patientAppointmentsSlice";

function makeStore() {
  return configureStore({
    reducer: { patientAppointments: patientAppointmentsReducer },
  });
}

describe("patientAppointmentsSlice wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cancels via PATCH /patient/appointments/:id/cancel", async () => {
    axiosMock.patch.mockResolvedValue({ data: { success: true } });
    const store = makeStore();

    await store.dispatch(
      cancelAppointment({
        appointmentId: 42,
        patientId: 7,
        reason: "Cambio de planes",
      }),
    );

    expect(axiosMock.patch).toHaveBeenCalledWith(
      "/patient/appointments/42/cancel",
      { patient_id: 7, cancellation_reason: "Cambio de planes" },
    );
    expect(axiosMock.post).not.toHaveBeenCalled();
  });

  it("downloads contracts from the patient-scoped route", async () => {
    axiosMock.get.mockResolvedValue({ data: new Blob(["pdf"]) });
    const createObjectURL = vi.fn(() => "blob:mock");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    vi.stubGlobal("document", {
      createElement: () => ({
        href: "",
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn(),
      }),
      body: { appendChild: vi.fn() },
    });

    const store = makeStore();
    await store.dispatch(
      downloadContract({
        contractId: 9,
        appointmentId: 42,
        patientId: 7,
      }),
    );

    expect(axiosMock.get).toHaveBeenCalledWith(
      "/patient/contracts/9/download",
      expect.objectContaining({
        params: { patient_id: 7 },
        responseType: "blob",
      }),
    );
    expect(axiosMock.get.mock.calls[0][0]).not.toContain("/admin/");
  });
});
