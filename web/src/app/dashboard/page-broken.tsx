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
import { Separator } from '@/components/ui/separator';
import { 
  PlusCircle, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  LogOut,
  Calendar,
  AlertCircle,
  Plus
} from 'lucide-react';

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
  const [incAmt, setIncAmt] = useState<string>('');
  const [incSrc, setIncSrc] = useState<string>('salary');
  const [incDate, setIncDate] = useState<string>(todayISO);
  const [incLoading, setIncLoading] = useState(false);

  const [expAmt, setExpAmt] = useState<string>('');
  const [expCat, setExpCat] = useState<string>('groceries');
  const [expDate, setExpDate] = useState<string>(todayISO);
  const [expLoading, setExpLoading] = useState(false);

  // ---- auth gate ----
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
      const [incRes, expRes, savRes] = await Promise.all([
        listIncome(start, end),
        listExpenses(start, end),
        getSavings(start, end),
      ]);
      setIncomes(incRes.data || []);
      setExpenses(expRes.data || []);
      setSummary(savRes.data || null);
    } catch (err: any) {
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
        date: incDate 
      });
      setIncAmt('');
      setIncSrc('salary');
      setIncDate(todayISO);
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
        date: expDate 
      });
      setExpAmt('');
      setExpCat('groceries');
      setExpDate(todayISO);
      await fetchData(); // Refresh data
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add expense');
    } finally {
      setExpLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading) {
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
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="text-xl font-serif-heading font-bold">ExpenseTracker</span>
            </div>
            <Button variant="outline" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Date Range Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
            <CardDescription>
              Select the date range for your financial overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="start-date">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.savings)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Income and Expense Forms */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Add Income Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-green-600" />
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
                    <Label htmlFor="income-amount">Amount ($)</Label>
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
                    <Input
                      id="income-date"
                      type="date"
                      value={incDate}
                      onChange={(e) => setIncDate(e.target.value)}
                      required
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
                <Plus className="h-5 w-5 text-red-600" />
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
                    <Label htmlFor="expense-amount">Amount ($)</Label>
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
                    <Input
                      id="expense-date"
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      required
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
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ---- form state ----
  const [incAmt, setIncAmt] = useState<string>('');
  const [incSrc, setIncSrc] = useState<string>('salary');
  const [incDate, setIncDate] = useState<string>(todayISO);

  const [expAmt, setExpAmt] = useState<string>('');
  const [expCat, setExpCat] = useState<string>('groceries');
  const [expDate, setExpDate] = useState<string>(todayISO);

  // ---- dialog state ----
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);

  // ---- auth gate ----
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
      const [incRes, expRes, savRes] = await Promise.all([
        listIncome(start, end),
        listExpenses(start, end),
        getSavings(start, end),
      ]);
      setIncomes(incRes.data || []);
      setExpenses(expRes.data || []);
      setSummary(savRes.data || null);
    } catch (err: any) {
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
  const handleAddIncome = async () => {
    if (!incAmt || parseFloat(incAmt) <= 0) return;
    try {
      await createIncome({ 
        amount: parseFloat(incAmt), 
        source: incSrc, 
        date: incDate 
      });
      setIncAmt('');
      setIncSrc('salary');
      setIncDate(todayISO);
      setIncomeDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  // ---- add expense ----
  const handleAddExpense = async () => {
    if (!expAmt || parseFloat(expAmt) <= 0) return;
    try {
      await createExpense({ 
        amount: parseFloat(expAmt), 
        category: expCat, 
        date: expDate 
      });
      setExpAmt('');
      setExpCat('groceries');
      setExpDate(todayISO);
      setExpenseDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (authLoading) {
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
            <div className="flex items-center space-x-2">
              <DollarSign className="h-8 w-8 text-primary" />
              <span className="text-xl font-serif-heading font-bold">ExpenseTracker</span>
            </div>
            <Button variant="outline" onClick={logout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Date Range Selector */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Date Range
            </CardTitle>
            <CardDescription>
              Select the date range for your financial overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="space-y-2">
                <Label htmlFor="start-date">From</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">To</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errorMsg && (
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMsg}</AlertDescription>
          </Alert>
        )}

        {/* Summary Cards */}
        {summary && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.totalIncome)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(summary.totalExpenses)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
                <Wallet className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${summary.savings >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.savings)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 mb-8">
          <Dialog open={incomeDialogOpen} onOpenChange={setIncomeDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Income</DialogTitle>
                <DialogDescription>
                  Record a new income entry to track your earnings.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="income-amount">Amount</Label>
                  <Input
                    id="income-amount"
                    type="number"
                    placeholder="0.00"
                    value={incAmt}
                    onChange={(e) => setIncAmt(e.target.value)}
                  />
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="income-date">Date</Label>
                  <Input
                    id="income-date"
                    type="date"
                    value={incDate}
                    onChange={(e) => setIncDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIncomeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddIncome}>Add Income</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
                <DialogDescription>
                  Record a new expense to track your spending.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-amount">Amount</Label>
                  <Input
                    id="expense-amount"
                    type="number"
                    placeholder="0.00"
                    value={expAmt}
                    onChange={(e) => setExpAmt(e.target.value)}
                  />
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
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input
                    id="expense-date"
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setExpenseDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>Add Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                {incomes.length === 0 ? (
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
                {expenses.length === 0 ? (
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