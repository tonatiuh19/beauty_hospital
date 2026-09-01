import { beforeEach, describe, expect, it, vi } from "vitest";
import { configureStore } from "@reduxjs/toolkit";

const { axiosMock } = vi.hoisted(() => ({
  axiosMock: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/lib/axios", () => ({
  default: axiosMock,
  formatAxiosError: (_e: unknown, fallback: string) => fallback,
}));

import settingsReducer, {
  fetchAdminBusinessHours,
  saveAdminBusinessHours,
} from "./settingsSlice";

function makeStore() {
  return configureStore({
    reducer: { settings: settingsReducer },
  });
}

describe("settingsSlice business hours", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads admin business hours", async () => {
    axiosMock.get.mockResolvedValue({
      data: { success: true, data: [{ day_of_week: 1, is_open: 1 }] },
    });
    const store = makeStore();
    await store.dispatch(fetchAdminBusinessHours());
    expect(axiosMock.get).toHaveBeenCalledWith("/admin/settings/business-hours");
    expect(store.getState().settings.businessHours).toEqual([
      { day_of_week: 1, is_open: 1 },
    ]);
  });

  it("saves admin business hours as a hours array", async () => {
    axiosMock.post.mockResolvedValue({ data: { success: true } });
    const store = makeStore();
    const hours = [{ day_of_week: 1, is_open: true, open_time: "09:00" }];
    await store.dispatch(saveAdminBusinessHours(hours));
    expect(axiosMock.post).toHaveBeenCalledWith(
      "/admin/settings/business-hours",
      { hours },
    );
  });
});
