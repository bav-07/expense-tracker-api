'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import {
  createIncome,
  createExpense,
  listIncome,
  listExpenses,
  getSavings
} from '@/lib/api';

type Income = { _id: string; amount: number; source: string; date: string; notes?: string };
type Expense = { _id: string; amount: number; category: string; date: string; notes?: string };
type Summary = { totalIncome: number; totalExpenses: number; savings: number };

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthed, loading: authLoading, logout } = useAuth();

  // ---- dates (default: current month) ----
  const todayISO = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const firstOfMonthISO = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
  }, []);

  const [start, setStart] = useState<string>(firstOfMonthISO);
  const [end, setEnd] = useState<string>(todayISO);

  // ---- data state ----
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- form state ----
  const [incAmt, setIncAmt] = useState<string>('0');
  const [incSrc, setIncSrc] = useState<string>('salary');
  const [incDate, setIncDate] = useState<string>(todayISO);

  const [expAmt, setExpAmt] = useState<string>('0');
  const [expCat, setExpCat] = useState<string>('groceries');
  const [expDate, setExpDate] = useState<string>(todayISO);

  // ---- auth gate ----
  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) router.replace('/login');
  }, [authLoading, isAuthed, router]);

  // ---- data fetch ----
  const refresh = async () => {
    try {
      setErrorMsg(null);
      setLoading(true);
      const [i, e, s] = await Promise.all([
        listIncome(start, end),
        listExpenses(start, end),
        getSavings(start, end)
      ]);
      setIncomes(i);
      setExpenses(e);
      setSummary(s);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthed || authLoading) return;
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthed, authLoading, start, end]);

  // ---- handlers ----
  const onAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await createIncome({
        amount: Number(incAmt),
        source: incSrc.trim() || 'income',
        date: new Date(incDate).toISOString()
      });
      setIncAmt('0');
      await refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add income');
    }
  };

  const onAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setErrorMsg(null);
      await createExpense({
        amount: Number(expAmt),
        category: expCat.trim() || 'expense',
        date: new Date(expDate).toISOString()
      });
      setExpAmt('0');
      await refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to add expense');
    }
  };

  // ---- loading/auth fallback ----
  if (authLoading) {
    return (
      <main className="min-h-dvh grid place-items-center">
        <p className="text-sm text-gray-600">Loading…</p>
      </main>
    );
  }
  if (!isAuthed) return null; // redirect in effect above

  return (
    <main className="min-h-dvh bg-gray-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between p-6">
        <h1 className="text-2xl font-semibold tracking-tighter">Lucra</h1>
        <button
          onClick={logout}
          className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
        >
          Logout
        </button>
      </header>

      <section className="mx-auto max-w-5xl space-y-6 p-6">
        {/* Date range + summary */}
        <div className="rounded-2xl bg-white p-4 shadow">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div>
              <label className="block text-sm text-gray-600">Start</label>
              <input
                type="date"
                className="rounded-lg border p-2"
                value={start}
                onChange={e => setStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">End</label>
              <input
                type="date"
                className="rounded-lg border p-2"
                value={end}
                onChange={e => setEnd(e.target.value)}
              />
            </div>
            <button
              onClick={() => void refresh()}
              className="rounded-xl border btn-primary px-4 py-2 hover:opacity-90"
            >
              Refresh
            </button>

            <div className="md:ml-auto text-sm">
              {summary ? (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-gray-600">Total Income</div>
                    <div className="font-semibold">£{summary.totalIncome.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Total Expenses</div>
                    <div className="font-semibold">£{summary.totalExpenses.toFixed(2)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Savings</div>
                    <div className="font-semibold">£{summary.savings.toFixed(2)}</div>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500">{loading ? 'Loading…' : 'No data yet'}</div>
              )}
            </div>
          </div>

          {errorMsg && (
            <p className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">{errorMsg}</p>
          )}
        </div>

        {/* Forms + lists */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Add Income */}
          <form onSubmit={onAddIncome} className="rounded-2xl bg-white p-4 shadow">
            <h2 className="mb-3 font-medium">Add Income</h2>
            <input
              className="mb-2 w-full rounded-lg border p-2"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={incAmt}
              onChange={e => setIncAmt(e.target.value)}
              required
            />
            <input
              className="mb-2 w-full rounded-lg border p-2"
              placeholder="Source"
              value={incSrc}
              onChange={e => setIncSrc(e.target.value)}
              required
            />
            <input
              className="mb-3 w-full rounded-lg border p-2"
              type="date"
              value={incDate}
              onChange={e => setIncDate(e.target.value)}
              required
            />
            <button
              className="w-full rounded-xl border btn-primary p-2 hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              Save
            </button>
          </form>

          {/* Add Expense */}
          <form onSubmit={onAddExpense} className="rounded-2xl bg-white p-4 shadow">
            <h2 className="mb-3 font-medium">Add Expense</h2>
            <input
              className="mb-2 w-full rounded-lg border p-2"
              type="number"
              step="0.01"
              placeholder="Amount"
              value={expAmt}
              onChange={e => setExpAmt(e.target.value)}
              required
            />
            <input
              className="mb-2 w-full rounded-lg border p-2"
              placeholder="Category"
              value={expCat}
              onChange={e => setExpCat(e.target.value)}
              required
            />
            <input
              className="mb-3 w-full rounded-lg border p-2"
              type="date"
              value={expDate}
              onChange={e => setExpDate(e.target.value)}
              required
            />
            <button
              className="w-full rounded-xl border btn-primary p-2 hover:opacity-90 disabled:opacity-50"
              disabled={loading}
            >
              Save
            </button>
          </form>

          {/* Recent lists */}
          <div className="rounded-2xl bg-white p-4 shadow">
            <h2 className="mb-3 font-medium">Recent</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <h3 className="text-sm text-gray-600">Income</h3>
                {incomes.length === 0 ? (
                  <p className="text-sm text-gray-500">No income in range.</p>
                ) : (
                  <ul className="text-sm">
                    {incomes.map(i => (
                      <li key={i._id} className="flex justify-between border-b py-1">
                        <span title={new Date(i.date).toLocaleDateString()}>{i.source}</span>
                        <span>£{i.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <h3 className="text-sm text-gray-600">Expenses</h3>
                {expenses.length === 0 ? (
                  <p className="text-sm text-gray-500">No expenses in range.</p>
                ) : (
                  <ul className="text-sm">
                    {expenses.map(x => (
                      <li key={x._id} className="flex justify-between border-b py-1">
                        <span title={new Date(x.date).toLocaleDateString()}>{x.category}</span>
                        <span>£{x.amount.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex justify-end">
          <button
            onClick={() => void refresh()}
            className="rounded-xl border px-4 py-2 text-sm hover:bg-gray-100"
          >
            Reload Data
          </button>
        </div>
      </section>
    </main>
  );
}
