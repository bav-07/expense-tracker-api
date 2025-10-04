'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { createIncome, createExpense, listIncome, listExpenses, getSavings } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/ui/date-picker';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  LogOut,
  Calendar,
  AlertCircle,
  Plus,
  WalletMinimal
} from 'lucide-react';
import Image from 'next/image';

type Income = { _id: string; amount: number; source: string; date: string; notes?: string };
type Expense = { _id: string; amount: number; category: string; date: string; notes?: string };
type Summary = { totalIncome: number; totalExpenses: number; savings: number };

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthed, loading: authLoading, logout } = useAuth();
  
  // ---- client-side mounting state to prevent hydration mismatch ----
  const [mounted, setMounted] = useState(false);

  // ---- dates (default: current month) ----
  const today = useMemo(() => new Date(), []);
  const firstOfMonth = useMemo(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, []);

  const [start, setStart] = useState<Date>(firstOfMonth);
  const [end, setEnd] = useState<Date>(today);

  // ---- data state ----
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- form state ----
  const [incAmt, setIncAmt] = useState<string>('');
  const [incSrc, setIncSrc] = useState<string>('salary');
  const [incDate, setIncDate] = useState<Date>(today);
  const [incLoading, setIncLoading] = useState(false);

  const [expAmt, setExpAmt] = useState<string>('');
  const [expCat, setExpCat] = useState<string>('groceries');
  const [expDate, setExpDate] = useState<Date>(today);
  const [expLoading, setExpLoading] = useState(false);

  // ---- auth gate ----
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthed) {
      router.push('/login');
      return;
    }
  }, [isAuthed, authLoading, router]);

  // ---- data fetching ----
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const startISO = dateToISO(start);
      const endISO = dateToISO(end);
      
      const [incRes, expRes, savRes] = await Promise.all([
        listIncome(startISO, endISO),
        listExpenses(startISO, endISO),
        getSavings(startISO, endISO),
      ]);
      setIncomes(Array.isArray(incRes) ? incRes : []);
      setExpenses(Array.isArray(expRes) ? expRes : []);
      setSummary(savRes || null);
    } catch (err: any) {
      if (err.message === 'Invalid token') {
        router.push('/login');
        return;
      }
      setErrorMsg(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthed && !authLoading) {
      fetchData();
    }
  }, [start, end, isAuthed, authLoading]);

  // ---- add income ----
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incAmt || parseFloat(incAmt) <= 0) {
      setErrorMsg('Please enter a valid income amount');
      return;
    }
    
    setIncLoading(true);
    setErrorMsg(null);
    
    try {
      await createIncome({ 
        amount: parseFloat(incAmt), 
        source: incSrc, 
        date: dateToISO(incDate) 
      });
      setIncAmt('');
      setIncSrc('salary');
      setIncDate(today);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add income');
    } finally {
      setIncLoading(false);
    }
  };

  // ---- add expense ----
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expAmt || parseFloat(expAmt) <= 0) {
      setErrorMsg('Please enter a valid expense amount');
      return;
    }
    
    setExpLoading(true);
    setErrorMsg(null);
    
    try {
      await createExpense({ 
        amount: parseFloat(expAmt), 
        category: expCat, 
        date: dateToISO(expDate) 
      });
      setExpAmt('');
      setExpCat('groceries');
      setExpDate(today);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add expense');
    } finally {
      setExpLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Helper to convert Date to ISO string for API
  const dateToISO = (date: Date) => {
    return date.toISOString().slice(0, 10);
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthed) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Image src="/lucra.svg" alt="Lucra" width={32} height={32} />
              <span className="text-xl font-serif-heading font-bold">Lucra</span>
            </div>
            <Button variant="outline" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-8">
        {/* Date Range Selector with Summary */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Financial Overview
            </CardTitle>
            <CardDescription>
              Select date range and view your financial summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Date Range Inputs */}
              <div className="flex flex-col gap-4 items-end w-min">
                <div className="flex flex-row items-center gap-2 space-y-2">
                  <Label htmlFor="start-date" className="mb-0">From</Label>
                  <DatePicker
                    value={start}
                    onChange={(date) => date && setStart(date)}
                    placeholder="Select start date"
                    className="w-[200px]"
                  />
                </div>
                <div className="flex flex-row items-center gap-2 space-y-2">
                  <Label htmlFor="end-date" className="mb-0">To</Label>
                  <DatePicker
                    value={end}
                    onChange={(date) => date && setEnd(date)}
                    placeholder="Select end date"
                    className="w-[200px]"
                  />
                </div>
              </div>

              {/* Summary Stats */}
              <div className="flex-1 lg:flex lg:justify-end">
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:flex lg:flex-row gap-4 lg:gap-6 lg:w-min">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200 min-w-[175px]">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-800" />
                      <span className="text-sm font-medium text-green-800">Total Income</span>
                    </div>
                    <div className="text-xl font-semibold tracking-wide text-green-700">
                      {summary ? formatCurrency(summary.totalIncome) : '—'}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200 min-w-[175px]">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-800" />
                      <span className="text-sm font-medium text-red-800">Total Expenses</span>
                    </div>
                    <div className="text-xl font-semibold tracking-wide text-red-700">
                      {summary ? formatCurrency(summary.totalExpenses) : '—'}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 min-w-[175px]">
                    <div className="flex items-center gap-2 mb-2">
                      <Wallet className="h-4 w-4 text-blue-800" />
                      <span className="text-sm font-medium text-blue-800">Net Savings</span>
                    </div>
                    <div className={`text-xl font-semibold tracking-wide ${summary ? summary.savings >= 0 ? 'text-blue-700' : 'text-red-800' : ''}`}>
                      {summary ? formatCurrency(summary.savings) : '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4 relative" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Add Income and Expense Forms */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Add Income Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-700" />
                Add Income
              </CardTitle>
              <CardDescription>
                Record a new income entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddIncome} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="income-amount">Amount (£)</Label>
                    <Input
                      id="income-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={incAmt}
                      onChange={(e) => setIncAmt(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="income-date">Date</Label>
                    <DatePicker
                      value={incDate}
                      onChange={(date) => date && setIncDate(date)}
                      placeholder="Select date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-source">Source</Label>
                  <Select value={incSrc} onValueChange={setIncSrc}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salary">Salary</SelectItem>
                      <SelectItem value="freelance">Freelance</SelectItem>
                      <SelectItem value="investment">Investment</SelectItem>
                      <SelectItem value="bonus">Bonus</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={incLoading}>
                  {incLoading ? 'Adding...' : 'Add Income'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Add Expense Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-red-700" />
                Add Expense
              </CardTitle>
              <CardDescription>
                Record a new expense entry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddExpense} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expense-amount">Amount (£)</Label>
                    <Input
                      id="expense-amount"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={expAmt}
                      onChange={(e) => setExpAmt(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="expense-date">Date</Label>
                    <DatePicker
                      value={expDate}
                      onChange={(date) => date && setExpDate(date)}
                      placeholder="Select date"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-category">Category</Label>
                  <Select value={expCat} onValueChange={setExpCat}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="groceries">Groceries</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="entertainment">Entertainment</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="dining">Dining Out</SelectItem>
                      <SelectItem value="shopping">Shopping</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full" disabled={expLoading}>
                  {expLoading ? 'Adding...' : 'Add Expense'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Data Tables */}
        <Tabs defaultValue="income" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="income">Income ({incomes.length})</TabsTrigger>
            <TabsTrigger value="expenses">Expenses ({expenses.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="income">
            <Card>
              <CardHeader>
                <CardTitle>Income Records</CardTitle>
                <CardDescription>
                  Your income entries for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : incomes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No income records found for this period
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {incomes.map((inc) => (
                        <TableRow key={inc._id}>
                          <TableCell>{formatDate(inc.date)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{inc.source}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-green-600">
                            {formatCurrency(inc.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses">
            <Card>
              <CardHeader>
                <CardTitle>Expense Records</CardTitle>
                <CardDescription>
                  Your expense entries for the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading...</p>
                  </div>
                ) : expenses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No expense records found for this period
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((exp) => (
                        <TableRow key={exp._id}>
                          <TableCell>{formatDate(exp.date)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{exp.category}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-red-600">
                            {formatCurrency(exp.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}