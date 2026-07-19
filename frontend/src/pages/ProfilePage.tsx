import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi, ApiError } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/PasswordInput";
import { Badge } from "@/components/ui/badge";

export function ProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const guestFn = useAuthStore((s) => s.isGuest);
  const isGuestUser = guestFn();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(user?.full_name || "");
    setPhone(user?.phone || "");
  }, [user]);

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg("");
    setError("");
    if (password && password !== password2) {
      setError("Passwords do not match");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, string> = {
        full_name: fullName.trim(),
        phone: phone.trim(),
      };
      if (password) body.password = password;
      const res = await authApi.updateMe(body);
      setUser(res.user);
      setPassword("");
      setPassword2("");
      setMsg("Profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="text-sm text-slate-500">Not signed in.</div>;
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-slate-500 mt-0.5">Your account details on this platform</p>
      </div>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-semibold">Account</CardTitle>
          <Badge variant="secondary" className="uppercase text-[10px]">
            {user.is_guest || user.role === "guest" ? "guest" : user.role}
          </Badge>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-sm space-y-1 text-slate-600">
          <div className="flex justify-between border-b py-1.5">
            <span>User ID</span>
            <span className="font-mono text-slate-800">{user.id}</span>
          </div>
          <div className="flex justify-between border-b py-1.5">
            <span>Email</span>
            <span className="text-slate-800">{user.email || "—"}</span>
          </div>
          <div className="flex justify-between border-b py-1.5">
            <span>Sign-in method</span>
            <span className="text-slate-800">{user.auth_provider || "password"}</span>
          </div>
          {isGuestUser ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1.5 mt-2">
              Guest session — progress is tied to this browser. Sign in with Google/phone/email to keep
              a permanent account.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">Edit profile</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <form onSubmit={onSave} className="space-y-3.5">
            <div className="space-y-1.5">
              <Label className="text-xs">Display name</Label>
              <Input
                className="h-9"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                maxLength={150}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input
                className="h-9"
                placeholder="+9198xxxxxxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {!isGuestUser ? (
              <div className="border-t pt-3 space-y-3">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Change password (optional)
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">New password</Label>
                  <PasswordInput
                    className="h-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={6}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Confirm password</Label>
                  <PasswordInput
                    className="h-9"
                    value={password2}
                    onChange={(e) => setPassword2(e.target.value)}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            ) : null}

            {error ? <p className="text-xs text-red-600">{error}</p> : null}
            {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
