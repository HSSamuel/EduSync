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

export function extractResponseData(payload, fallback = null) {
  if (!payload || typeof payload !== "object") return fallback;
  if (Object.prototype.hasOwnProperty.call(payload, "data"))
    return payload.data;
  return payload;
}

export function extractResponseMeta(payload, fallback = null) {
  if (!payload || typeof payload !== "object") return fallback;
  return payload.meta ?? fallback;
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
    // When an actual API call fails, we do NOT want it to be silent.
    const refreshed = await refreshAccessToken(false);
    if (refreshed) return apiFetch(endpoint, options, false);
  } else if (res.status === 401 && !retry) {
    window.dispatchEvent(new Event("auth_expired"));
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

// Added the `silent` parameter defaulting to false
export async function refreshAccessToken(silent = false) {
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
        // Only dispatch the event if we are not in silent mode
        if (!silent) window.dispatchEvent(new Event("auth_expired"));
        return false;
      }

      const data = await safeJson(res);
      const token = data?.data?.token ?? data?.token;
      if (token) {
        setAccessToken(token);
        return true;
      }

      clearAccessToken();
      if (!silent) window.dispatchEvent(new Event("auth_expired"));
      return false;
    } catch (err) {
      console.error("Refresh token failed:", err);
      clearAccessToken();
      if (!silent) window.dispatchEvent(new Event("auth_expired"));
      return false;
    } finally {
      setRefreshPromise(null);
    }
  })();

  setRefreshPromise(refreshTask);
  return refreshTask;
}

export { clearAccessToken, getAccessToken, setAccessToken };
