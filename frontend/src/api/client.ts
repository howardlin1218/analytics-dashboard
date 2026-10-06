// Auto-detect API base: uses http://<hostname>:3006 when running in local development mode,
// or empty string in production builds to ensure same-origin relative URLs (/api/...).
const isDev = typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.DEV;
const isDevPort = isDev && typeof window !== 'undefined' && window.location.port && window.location.port !== '3006';
export const API_BASE = isDevPort ? `http://${window.location.hostname}:3006` : '';

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
  
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  let signal = options.signal;
  if (signal) {
    try {
      new Request('http://localhost', { signal });
    } catch {
      // In cross-realm test environments (e.g. Node 24+ with JSDOM and MSW),
      // foreign AbortSignals fail native fetch brand validation.
      signal = undefined;
    }
  }

  const res = await fetch(url, {
    ...options,
    signal,
    headers,
    credentials: 'include',
  });

  if (res.status === 401) {
    const error = new Error('Unauthorized');
    (error as any).status = 401;
    throw error;
  }

  if (res.status === 403) {
    const error = new Error('Forbidden: Access Denied');
    (error as any).status = 403;
    throw error;
  }

  if (!res.ok) {
    let errorMsg = `HTTP Error ${res.status}: ${res.statusText}`;
    try {
      const errData = await res.json();
      if (errData && errData.error) errorMsg = errData.error;
    } catch {}
    const error = new Error(errorMsg);
    (error as any).status = res.status;
    throw error;
  }

  // Check if response is JSON
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as T;
  }

  return (await res.text()) as unknown as T;
}
