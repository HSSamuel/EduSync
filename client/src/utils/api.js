import {
  clearAccessToken,
  getAccessToken,
  getRefreshPromise,
  setAccessToken,
  setRefreshPromise,
} from "./auth";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function joinUrl(base, endpoint) {
  if (!endpoint) return base;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
}

export function extractErrorMessage(payload, fallback = "Request failed.") {
  if (!payload) return fallback;
  if (typeof payload === "string") return payload;
  if (typeof payload.error === "string") return payload.error;
  if (typeof payload.message === "string") return payload.message;
  return fallback;
}

export async function safeJson(response) {
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

export async function apiFetch(endpoint, options = {}, retry = true) {
  const token = getAccessToken();

  const headers = {
    ...(options.headers || {}),
  };

  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(joinUrl(API_BASE_URL, endpoint), {
    ...options,
    headers,
    credentials: "include",
  });

  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch(endpoint, options, false);
  }

  return res;
}

export async function apiJsonFetch(endpoint, options = {}, retry = true) {
  const response = await apiFetch(endpoint, options, retry);
  const data = await safeJson(response);

  return {
    ok: response.ok,
    status: response.status,
    data,
    response,
  };
}

export async function apiFetchOrThrow(endpoint, options = {}, fallbackMessage) {
  const { ok, data, response } = await apiJsonFetch(endpoint, options);

  if (!ok) {
    const error = new Error(
      extractErrorMessage(data, fallbackMessage || "Request failed."),
    );
    error.status = response.status;
    error.payload = data;
    throw error;
  }

  return data;
}

export async function refreshAccessToken() {
  const pendingRefresh = getRefreshPromise();
  if (pendingRefresh) {
    return pendingRefresh;
  }

  const refreshTask = (async () => {
    try {
      const res = await fetch(joinUrl(API_BASE_URL, "/auth/refresh"), {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        clearAccessToken();
        return false;
      }

      const data = await safeJson(res);
      if (data?.token) {
        setAccessToken(data.token);
        return true;
      }

      clearAccessToken();
      return false;
    } catch (err) {
      console.error("Refresh token failed:", err);
      clearAccessToken();
      return false;
    } finally {
      setRefreshPromise(null);
    }
  })();

  setRefreshPromise(refreshTask);
  return refreshTask;
}

export { clearAccessToken, getAccessToken, setAccessToken };
