"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Chrome, TrendingUp, LineChart, Brain, Shield, Zap, Mail, Lock, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function SignIn() {
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to sign up");
        }

        // After successful signup, sign in
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Account created but sign in failed. Please try signing in.");
        } else {
          router.push("/");
        }
      } else {
        // Sign in
        const result = await signIn("credentials", {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid email or password");
        } else {
          router.push("/");
        }
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-12 flex-col justify-between text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}/>
        </div>
        
        {/* Gradient orbs */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-purple-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-10 w-48 h-48 bg-blue-400/30 rounded-full blur-3xl" />

        {/* Logo and Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="h-14 w-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Trading Journal</h1>
              <p className="text-sm text-blue-100 font-medium">with AI</p>
            </div>
          </div>
          
          <div className="space-y-6 max-w-md">
            <h2 className="text-5xl font-bold leading-tight">
              Master Your Trading Journey
            </h2>
            <p className="text-xl text-blue-100">
              Track every trade, analyze patterns, and grow your portfolio with intelligent analytics for NSE & BSE markets.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-5">
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <LineChart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Real-time Portfolio Tracking</h3>
              <p className="text-sm text-blue-100">Monitor your investments with live market data</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI Trading Insights</h3>
              <p className="text-sm text-blue-100">Get personalized recommendations and pattern analysis</p>
            </div>
          </div>
          
          <div className="flex items-start gap-4 bg-white/10 backdrop-blur-sm rounded-xl p-4">
            <div className="h-10 w-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Advanced Analytics</h3>
              <p className="text-sm text-blue-100">Win rate, profit factor, and detailed performance metrics</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center gap-2 text-sm text-blue-100">
          <Shield className="h-4 w-4" />
          <span>Secured with enterprise-grade encryption</span>
        </div>
      </div>

      {/* Right Side - Sign In/Up Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative">
        {/* Theme Toggle - Top Right */}
        <div className="absolute top-6 right-6">
          <ThemeToggle />
        </div>
        
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="h-14 w-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
                <TrendingUp className="h-8 w-8 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h1 className="text-2xl font-bold">Trading Journal</h1>
                <p className="text-sm text-muted-foreground font-medium">with AI</p>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">
              {isSignUp ? "Create Account" : "Welcome Back"}
            </h2>
            <p className="text-muted-foreground">
              {isSignUp 
                ? "Sign up to start tracking your trades" 
                : "Sign in to access your trading dashboard"}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
              <div className="h-5 w-5 rounded-full bg-destructive/20 flex items-center justify-center flex-shrink-0">!</div>
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 h-11"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-11"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10 h-11"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>
              {isSignUp && (
                <p className="text-xs text-muted-foreground">
                  Must be at least 6 characters
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-base"
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : (isSignUp ? "Create Account" : "Sign In")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-3 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Sign In */}
          <Button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 shadow-sm"
            variant="outline"
          >
            <Chrome className="mr-2 h-5 w-5" />
            Continue with Google
          </Button>

          {/* Toggle Sign Up / Sign In */}
          <div className="text-center text-sm">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
              }}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Don't have an account? Sign up"}
            </button>
          </div>

          {/* Features Grid - Mobile */}
          <div className="lg:hidden grid grid-cols-1 gap-3 pt-8">
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <LineChart className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm font-medium">Real-time Tracking</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm font-medium">AI Insights</span>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-sm font-medium">Advanced Analytics</span>
            </div>
          </div>

          {/* Terms */}
          <p className="text-center text-xs text-muted-foreground px-8">
            By continuing, you agree to our{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="#" className="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
