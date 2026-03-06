const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Join base URL and endpoint safely (avoid double slashes)
 */
function joinUrl(base, endpoint) {
  if (!endpoint) return base;
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const e = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return `${b}${e}`;
}

/**
 * Centralized API client:
 * - Adds JWT automatically
 * - Sends cookies (refresh token cookie)
 * - Auto-refreshes access token on 401 and retries once
 */
export async function apiFetch(endpoint, options = {}, retry = true) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
  };

  // Only set JSON content-type if body is not FormData
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(joinUrl(API_BASE_URL, endpoint), {
    ...options,
    headers,
    credentials: "include",
  });

  // If token expired → try refresh once
  if (res.status === 401 && retry) {
    const refreshed = await refreshAccessToken();
    if (refreshed) return apiFetch(endpoint, options, false);
  }

  return res;
}

/**
 * Refresh access token using refresh cookie
 */
async function refreshAccessToken() {
  try {
    const res = await fetch(joinUrl(API_BASE_URL, "/auth/refresh"), {
      method: "POST",
      credentials: "include",
    });

    if (!res.ok) return false;

    const data = await res.json();
    if (data?.token) {
      localStorage.setItem("token", data.token);
      return true;
    }

    return false;
  } catch (err) {
    console.error("Refresh token failed:", err);
    return false;
  }
}
