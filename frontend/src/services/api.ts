const apiBaseUrl = (import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:8000').replace(/\/$/, '');

export function apiUrl(path: string): string {
  return `${apiBaseUrl}${path}`;
}

export function websocketUrl(path: string): string {
  const url = new URL(apiBaseUrl);
  url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
  url.pathname = path;
  url.search = '';
  return url.toString();
}

export async function getJson<T>(path: string): Promise<T> {
  const token = localStorage.getItem('swepilot_token');
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(apiUrl(path), { headers });
  if (response.status === 401) {
    localStorage.removeItem('swepilot_token');
    localStorage.removeItem('swepilot_username');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const token = localStorage.getItem('swepilot_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (response.status === 401) {
    localStorage.removeItem('swepilot_token');
    localStorage.removeItem('swepilot_username');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}