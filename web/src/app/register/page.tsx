'use client';

import { useState } from 'react';
import { register } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
  await register(name, email, password);
      router.push('/login'); // after signup, go to login
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-dvh grid place-items-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm space-y-3 rounded-2xl p-6 shadow-2xl"
      >
        <h1 className="text-xl font-semibold">Create an Account</h1>

        {error && (
          <p className="rounded bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <input
          className="w-full rounded-lg border p-2 text-black"
          type="text"
          placeholder="Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          className="w-full rounded-lg border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        <button
          className="w-full rounded-xl border btn-primary p-2 hover:opacity-80 disabled:opacity-50 cursor-pointer"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Register'}
        </button>

        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a className="underline" href="/login">
            Log in
          </a>
        </p>
      </form>
    </main>
  );
}
