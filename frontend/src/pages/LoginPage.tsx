import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { authApi, ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type AuthMethods = {
  guest: boolean;
  email_password: boolean;
  google: boolean;
  google_client_id: string;
  phone_otp: boolean;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, cfg: Record<string, unknown>) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function loadGoogleScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Google script failed")));
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Google script failed"));
    document.head.appendChild(s);
  });
}

export function LoginPage() {
  const login = useAuthStore((s) => s.login);
  const continueAsGuest = useAuthStore((s) => s.continueAsGuest);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);
  const sendPhoneOtp = useAuthStore((s) => s.sendPhoneOtp);
  const verifyPhoneOtp = useAuthStore((s) => s.verifyPhoneOtp);
  const loading = useAuthStore((s) => s.loading);
  const appName = usePlatformStore((s) => s.appName);
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  const navigate = useNavigate();

  const [methods, setMethods] = useState<AuthMethods | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const m = await authApi.methods();
        if (!cancelled) setMethods(m);
      } catch {
        // Fallback from platform flags
        if (!cancelled) {
          setMethods({
            guest: isEnabled("ENABLE_GUEST_ACCESS", true),
            email_password: isEnabled("ENABLE_EMAIL_PASSWORD_LOGIN", true),
            google: false,
            google_client_id: "",
            phone_otp: isEnabled("ENABLE_PHONE_OTP", false),
          });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isEnabled]);

  useEffect(() => {
    if (!methods?.google || !methods.google_client_id || !googleBtnRef.current) return;
    let cancelled = false;
    (async () => {
      try {
        await loadGoogleScript();
        if (cancelled || !window.google || !googleBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: methods.google_client_id,
          callback: async (resp: { credential?: string }) => {
            if (!resp?.credential) return;
            setError("");
            setBusy(true);
            try {
              await loginWithGoogle(resp.credential);
              navigate({ to: "/dashboard" });
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Google sign-in failed");
            } finally {
              setBusy(false);
            }
          },
        });
        googleBtnRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: "outline",
          size: "large",
          width: 352,
          text: "continue_with",
          shape: "rectangular",
        });
      } catch {
        /* Google script blocked — button simply won't show */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [methods, loginWithGoogle, navigate]);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Login failed");
    }
  };

  const onGuest = async () => {
    setError("");
    setBusy(true);
    try {
      await continueAsGuest();
      navigate({ to: "/exams" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not start guest session");
    } finally {
      setBusy(false);
    }
  };

  const onSendOtp = async () => {
    setError("");
    setBusy(true);
    try {
      const res = await sendPhoneOtp(phone);
      setOtpSent(true);
      setDevOtp(res.dev_otp || "");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send OTP");
    } finally {
      setBusy(false);
    }
  };

  const onVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      await verifyPhoneOtp(phone, otp);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid OTP");
    }
  };

  const name = appName();
  const locked = loading || busy;
  const showGuest = methods?.guest !== false;
  const showEmail = methods?.email_password !== false;
  const showGoogle = Boolean(methods?.google && methods.google_client_id);
  const showPhone = Boolean(methods?.phone_otp);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#eef0f3] p-4">
      <Card className="w-full max-w-[400px] shadow-sm border-slate-200">
        <CardHeader className="space-y-3 pb-2">
          <div className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="परीक्षa" className="h-7 w-7 rounded bg-white" />
            <div>
              <CardTitle className="text-base font-semibold tracking-tight">{name}</CardTitle>
              <CardDescription className="text-xs">
                Start a test without sharing personal details
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {showGuest ? (
            <div className="space-y-2">
              <Button type="button" className="w-full h-10" disabled={locked} onClick={onGuest}>
                {busy && !loading ? "Starting…" : "Continue as guest"}
              </Button>
              <p className="text-[11px] text-center text-slate-500 leading-snug">
                No email, phone, or password. Take published exams immediately.
              </p>
            </div>
          ) : null}

          {(showGoogle || showPhone || showEmail) && showGuest ? (
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
                <span className="bg-white px-2 text-slate-400">or continue with</span>
              </div>
            </div>
          ) : null}

          {showGoogle ? (
            <div className="flex justify-center min-h-[40px]" ref={googleBtnRef} />
          ) : null}

          {showPhone ? (
            <form onSubmit={otpSent ? onVerifyOtp : (e) => { e.preventDefault(); void onSendOtp(); }} className="space-y-2.5 border border-slate-200 rounded-md p-3">
              <div className="text-xs font-medium text-slate-700">Phone OTP</div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-xs text-slate-600">
                  Mobile number
                </Label>
                <Input
                  id="phone"
                  className="h-9"
                  placeholder="+919876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={otpSent}
                />
              </div>
              {otpSent ? (
                <div className="space-y-1.5">
                  <Label htmlFor="otp" className="text-xs text-slate-600">
                    OTP
                  </Label>
                  <Input
                    id="otp"
                    className="h-9"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    placeholder="6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                  {devOtp ? (
                    <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                      Dev OTP: <span className="font-mono font-semibold">{devOtp}</span>
                    </p>
                  ) : null}
                </div>
              ) : null}
              <Button type="submit" variant="outline" className="w-full h-9" disabled={locked}>
                {otpSent ? (loading ? "Verifying…" : "Verify & continue") : busy ? "Sending…" : "Send OTP"}
              </Button>
              {otpSent ? (
                <button
                  type="button"
                  className="text-[11px] text-[#2f6fed] hover:underline w-full"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setDevOtp("");
                  }}
                >
                  Change number
                </button>
              ) : null}
            </form>
          ) : null}

          {showEmail ? (
            <form onSubmit={onEmailSubmit} className="space-y-3">
              {(showGuest || showGoogle || showPhone) ? (
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
                  Email & password
                </div>
              ) : null}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs font-medium text-slate-600">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="h-9"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-medium text-slate-600">
                  Password
                </Label>
                <PasswordInput
                  id="password"
                  className="h-9"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="outline" className="w-full h-9" disabled={locked}>
                {loading ? "Signing in…" : "Sign in with email"}
              </Button>
            </form>
          ) : null}

          {error ? <p className="text-xs text-red-600">{error}</p> : null}

          {showEmail ? (
            <div className="text-center text-xs text-slate-500">
              Need an account?{" "}
              <Link to="/register" className="text-[#2f6fed] hover:underline">
                Register
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
