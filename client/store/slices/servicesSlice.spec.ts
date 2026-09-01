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

vi.mock("@/lib/axios-retry", () => ({
  withRetry: (fn: () => Promise<unknown>) => fn(),
  getUserFriendlyErrorMessage: () => "error",
}));

import servicesReducer, { uploadAdminFile } from "./servicesSlice";

function makeStore() {
  return configureStore({ reducer: { services: servicesReducer } });
}

describe("servicesSlice upload wiring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("posts service images to /admin/uploads", async () => {
    axiosMock.post.mockResolvedValue({
      data: { success: true, data: { url: "https://blob.example/x.jpg" } },
    });
    const store = makeStore();
    const file = {
      name: "face.jpg",
      type: "image/jpeg",
    } as File;

    const readAsDataURL = vi.fn(function (this: FileReader) {
      setTimeout(() => {
        Object.defineProperty(this, "result", {
          value: "data:image/jpeg;base64,abc",
        });
        this.onload?.(new Event("load") as ProgressEvent<FileReader>);
      }, 0);
    });
    vi.stubGlobal(
      "FileReader",
      class {
        result: string | null = null;
        onload: ((ev: ProgressEvent<FileReader>) => void) | null = null;
        onerror: ((ev: ProgressEvent<FileReader>) => void) | null = null;
        readAsDataURL = readAsDataURL;
      },
    );

    const result = await store.dispatch(
      uploadAdminFile({ file, folder: "services" }),
    );

    expect(axiosMock.post).toHaveBeenCalledWith(
      "/admin/uploads",
      expect.objectContaining({
        filename: "face.jpg",
        content_type: "image/jpeg",
        folder: "services",
      }),
    );
    expect(result.type).toBe("services/uploadAdminFile/fulfilled");
  });
});
