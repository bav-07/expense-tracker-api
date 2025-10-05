export async function apiFetch(path: string, init: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(init.headers || {});
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  // Use environment variable for API URL, fallback to localhost for development
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  const url = `${apiUrl}${path.startsWith('/api') ? path : `/api${path}`}`;
  const res = await fetch(url, { ...init, headers });
  if (!res.ok) {
    let msg = `Request failed: ${res.status}`;
    try { 
      const errorResponse = await res.json(); 
      // Handle different error response formats from your backend
      if (errorResponse.error && Array.isArray(errorResponse.error)) {
        // Validation errors: { "error": ["\"endDate\" must be in ISO 8601 date format"] }
        msg = errorResponse.error.join(', ');
      } else if (errorResponse.message) {
        // Standard error format: { "message": "Some error" }
        msg = errorResponse.message;
      } else if (errorResponse.error && typeof errorResponse.error === 'string') {
        // Single error string: { "error": "Some error" }
        msg = errorResponse.error;
      }
    } catch (parseError) {
      // If JSON parsing fails, keep the basic error message
      console.warn('Failed to parse error response:', parseError);
    }
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
  apiFetch(`/api/income/period${start && end ? `?startDate=${start}&endDate=${end}` : '?startDate=2025-01-01&endDate=2025-12-31'}`);

export const createExpense = (p: { amount: number; category: string; date: string; notes?: string }) =>
  apiFetch('/api/expense', { method: 'POST', body: JSON.stringify(p) });

export const listExpenses = (start?: string, end?: string) =>
  apiFetch(`/api/expense/period${start && end ? `?startDate=${start}&endDate=${end}` : '?startDate=2025-01-01&endDate=2025-12-31'}`);

export const getSavings = (start: string, end: string) =>
  apiFetch(`/api/savings?startDate=${start}&endDate=${end}`);
