const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export interface ApiError {
  message: string;
  status: number;
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };

  // Attach access token if present
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hms_access_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== "undefined") {
    // Attempt token refresh
    const refreshToken = localStorage.getItem("hms_refresh_token");
    if (refreshToken && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
      try {
        const refreshResp = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResp.ok) {
          const tokenData = await refreshResp.json();
          localStorage.setItem("hms_access_token", tokenData.access_token);
          localStorage.setItem("hms_refresh_token", tokenData.refresh_token);

          // Retry original request with new token
          headers["Authorization"] = `Bearer ${tokenData.access_token}`;
          const retryResp = await fetch(url, { ...options, headers });
          if (!retryResp.ok) {
            const errData = await retryResp.json().catch(() => ({}));
            throw { message: errData.detail || "Request failed", status: retryResp.status };
          }
          return retryResp.json();
        } else {
          localStorage.removeItem("hms_access_token");
          localStorage.removeItem("hms_refresh_token");
          localStorage.removeItem("hms_user");
        }
      } catch (e) {
        localStorage.removeItem("hms_access_token");
        localStorage.removeItem("hms_refresh_token");
      }
    }
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message =
      typeof errorData.detail === "string"
        ? errorData.detail
        : Array.isArray(errorData.detail)
        ? errorData.detail.map((d: any) => d.msg).join(", ")
        : errorData.message || "An unexpected error occurred.";
    throw { message, status: response.status } as ApiError;
  }

  // Handle empty 204 or 201 responses
  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
}
