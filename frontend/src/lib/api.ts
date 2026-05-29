export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

let refreshPromise: Promise<boolean> | null = null;

export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // Ensure we always send cookies (HttpOnly tokens)
  options.credentials = "include";

  let res = await fetch(url, options);

  if (res.status === 401) {
    // 1. Guard: avoid intercepting the actual refresh call itself to prevent infinite loop
    if (url.includes("/api/users/refresh")) {
      return res;
    }

    // 2. Create the refresh promise singleton if not already running
    if (!refreshPromise) {
      refreshPromise = (async () => {
        try {
          const refreshRes = await fetch(`${API_BASE_URL}/api/users/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
          });

          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            return refreshData.success === true;
          }
          return false;
        } catch (err) {
          console.error("Silent refresh network error:", err);
          return false;
        }
      })();
    }

    // 3. Wait for the shared refresh process to resolve
    const refreshSuccess = await refreshPromise;

    // 4. Deferred cleanup: clear the promise singleton in a macro-task.
    // This guarantees that all parallel micro-tasks finish awaiting before the singleton resets!
    if (refreshPromise) {
      setTimeout(() => {
        refreshPromise = null;
      }, 0);
    }

    if (refreshSuccess) {
      // Retry the original request with the new access token (delivered via HttpOnly cookie)
      res = await fetch(url, options);
    } else {
      // Refresh failed (both tokens expired): trigger clean global logout
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("auth-session-expired"));
      }
    }
  }

  return res;
}
