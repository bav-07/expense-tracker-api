import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, PieChart, TrendingUp, Shield, WalletMinimal } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <img src="/lucra.svg" alt="Lucra" className="h-12 w-12" />
            <span className="text-xl font-serif-heading font-bold">Lucra</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="flex flex-col gap-3 lg:gap-0 lg:flex-row overflow-hidden max-w-6xl justify-self-center items-center">
          <div className="space-y-6 mx-auto">
            <h1 className="text-4xl md:text-6xl font-serif-heading font-semibold tracking-tight">
              Track your money with
              <span className="text-blue-500 block">simplicity</span>
            </h1>
            <p className="text-xl text-muted-foreground  mx-auto">
              Enter expenses, income, and view savings with our simple and clean expense tracking application.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-8">
              <Button size="lg" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  Start Tracking Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
          <Image src="/HeroImage.png" alt="Hero Image" className="aspect-square h-full" width={500} height={500} />
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-20 max-w-6xl justify-self-center">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Expense Tracking</CardTitle>
              <CardDescription>
                Easily categorize and monitor your daily expenses with intuitive tools
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle>Income Management</CardTitle>
              <CardDescription>
                Track multiple income sources and see your financial growth over time
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle>Savings Goals</CardTitle>
              <CardDescription>
                Set and achieve your savings goals with personalized insights and tracking
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-20">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-serif-heading">Ready to Start?</CardTitle>
              <CardDescription>
                Join thousands of users who have taken control of their finances
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button size="lg" asChild>
                <Link href="/register" className="flex items-center gap-2">
                  Create Your Account
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 mt-20 border-t">
        <div className="text-center text-muted-foreground text-xs">
          <p>&copy; 2025 Lucra. Built with Next.js and shadcn/ui.</p>
        </div>
      </footer>
    </div>
  );
}