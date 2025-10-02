'use client';
import { useState } from 'react';
import { login } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { saveToken } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('Passw0rd!');
  const [error, setError] = useState<string|null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await login(email, password);
      saveToken(data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center bg-gray-50">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow">
        <h1 className="text-xl font-semibold">Sign in</h1>
        {error && <p className="rounded bg-red-50 p-2 text-sm text-red-700">{error}</p>}
        <input className="w-full rounded-lg border p-2" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input className="w-full rounded-lg border p-2" type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
  <button className="w-full rounded-xl border btn-primary p-2 hover:opacity-90">Log in</button>
        <p className="text-center text-sm text-gray-500">No account? <a className="underline" href="/register">Register</a></p>
      </form>
    </main>
  );
}
