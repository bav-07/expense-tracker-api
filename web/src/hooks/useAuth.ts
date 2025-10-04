'use client';
import { useEffect, useState } from 'react';

export function useAuth() {
  // read once, synchronously on first client render
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== 'undefined' ? localStorage.getItem('token') : null
  );
  const [loading, setLoading] = useState<boolean>(typeof window === 'undefined');

  // for safety during hydration (SSR to CSR)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('token'));
      setLoading(false);
    }
  }, []);

  const saveToken = (t: string) => {
    localStorage.setItem('token', t);
    setToken(t);
  };
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  return { token, saveToken, logout, isAuthed: !!token, loading };
}
