import { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiError } from "@/lib/api";

export function RegisterPage() {
  const register = useAuthStore((s) => s.register);
  const loading = useAuthStore((s) => s.loading);
  const appName = usePlatformStore((s) => s.appName);
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await register(fullName, email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef0f3] p-4">
      <Card className="w-full max-w-[400px] shadow-sm border-slate-200">
        <CardHeader className="space-y-1">
          <CardTitle className="text-base font-semibold">Create account</CardTitle>
          <CardDescription className="text-xs">
            Join {appName()} with email (optional — guest needs no signup)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs">
                Full name
              </Label>
              <Input
                id="name"
                className="h-9"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                className="h-9"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs">
                Password
              </Label>
              <PasswordInput
                id="password"
                className="h-9"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                autoComplete="new-password"
                required
              />
            </div>
            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            <Button type="submit" className="w-full h-9" disabled={loading}>
              {loading ? "Creating…" : "Register"}
            </Button>
          </form>
          <div className="mt-4 text-center text-xs text-slate-500">
            Already have an account?{" "}
            <Link to="/login" className="text-[#2f6fed] hover:underline">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
