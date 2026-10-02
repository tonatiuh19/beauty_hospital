import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

function isAdminRequest(url?: string): boolean {
  if (!url) return false;
  return url.includes("/admin/") || url.startsWith("admin/");
}

function isAdminAuthRequest(url?: string): boolean {
  if (!url) return false;
  return url.includes("/admin/auth/");
}

function isAdminRefreshRequest(url?: string): boolean {
  if (!url) return false;
  return url.includes("/admin/auth/refresh");
}

function isCheckInTokenRequest(url?: string): boolean {
  if (!url) return false;
  return url.includes("/check-in/generate-token");
}

function clearAdminSession() {
  localStorage.removeItem("adminAccessToken");
  localStorage.removeItem("adminRefreshToken");
  localStorage.removeItem("adminUser");
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/admin") &&
    !window.location.pathname.includes("/admin/login")
  ) {
    window.location.href = "/admin/login";
  }
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAdminAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem("adminRefreshToken");
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post("/api/admin/auth/refresh", {
      refreshToken,
    });
    if (data?.success && data.accessToken) {
      localStorage.setItem("adminAccessToken", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem("adminRefreshToken", data.refreshToken);
      }
      if (data.user) {
        localStorage.setItem("adminUser", JSON.stringify(data.user));
      }
      return data.accessToken as string;
    }
  } catch {
    return null;
  }
  return null;
}

axiosInstance.interceptors.request.use(
  (config) => {
    const url = config.url || "";
    const useAdminToken =
      isAdminRequest(url) || isCheckInTokenRequest(url);
    const token = useAdminToken
      ? localStorage.getItem("adminAccessToken")
      : localStorage.getItem("token") || localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retry?: boolean })
      | undefined;
    const url = original?.url || "";

    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      (isAdminRequest(url) || isCheckInTokenRequest(url)) &&
      !isAdminAuthRequest(url)
    ) {
      original._retry = true;
      if (!refreshInFlight) {
        refreshInFlight = refreshAdminAccessToken().finally(() => {
          refreshInFlight = null;
        });
      }
      const newToken = await refreshInFlight;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(original);
      }
      clearAdminSession();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && isAdminRefreshRequest(url)) {
      clearAdminSession();
    } else if (
      error.response?.status === 401 &&
      !isAdminAuthRequest(url) &&
      !isAdminRequest(url) &&
      !isCheckInTokenRequest(url)
    ) {
      localStorage.removeItem("token");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("patient-session-expired"));
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;

/** Normalize API/axios errors to a user-visible string (never render raw objects). */
export function formatApiError(
  err: unknown,
  fallback = "Something went wrong",
): string {
  if (err == null) return fallback;
  if (typeof err === "string") return err || fallback;

  if (typeof err === "object") {
    const o = err as Record<string, unknown>;
    if (typeof o.error === "string") return o.error;
    if (o.error && typeof o.error === "object") {
      const nested = o.error as Record<string, unknown>;
      if (typeof nested.message === "string") return nested.message;
    }
    if (typeof o.message === "string" && o.message.trim()) return o.message;
  }

  return fallback;
}

/** Extract a display message from an axios catch block. */
export function formatAxiosError(e: unknown, fallback: string): string {
  const ax = e as { response?: { data?: unknown }; message?: string };
  const data = ax?.response?.data;

  if (typeof data === "string" && data.trim()) {
    const firstLine = data.split("\n")[0]?.trim();
    if (firstLine && !firstLine.startsWith("FUNCTION_INVOCATION")) {
      return firstLine;
    }
  }

  if (data && typeof data === "object") {
    const msg = formatApiError(data, "");
    if (msg) return msg;
  }

  if (typeof ax?.message === "string" && ax.message !== "Network Error") {
    return ax.message;
  }

  return fallback;
}
