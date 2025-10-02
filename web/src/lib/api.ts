export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const url = path.startsWith('/api') ? path : `/api${path}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { const j = await res.json(); msg = j.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

// Endpoints
export const login = (email: string, password: string) =>
  apiFetch('/api/users/login', { method: 'POST', body: JSON.stringify({ email, password }) });

export const register = (name: string, email: string, password: string) =>
  apiFetch('/api/users/register', { method: 'POST', body: JSON.stringify({ name, email, password }) });

export const createIncome = (p: { amount: number; source: string; date: string; notes?: string }) =>
  apiFetch('/api/income', { method: 'POST', body: JSON.stringify(p) });

export const listIncome = (start?: string, end?: string) =>
  apiFetch(`/api/income/period${start ? `?startDate=${start}&endDate=${end}` : ''}`);

export const createExpense = (p: { amount: number; category: string; date: string; notes?: string }) =>
  apiFetch('/api/expense', { method: 'POST', body: JSON.stringify(p) });

export const listExpenses = (start?: string, end?: string) =>
  apiFetch(`/api/expense/period${start ? `?startDate=${start}&endDate=${end}` : ''}`);

export const getSavings = (start: string, end: string) =>
  apiFetch(`/api/savings?startDate=${start}&endDate=${end}`);
