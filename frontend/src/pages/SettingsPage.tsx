import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  authApi,
  notificationsApi,
  platformApi,
  type NotificationPreferences,
} from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type StudentSection =
  | "account"
  | "security"
  | "exam_prefs"
  | "appearance"
  | "notifications"
  | "subscription"
  | "help";

type AdminSection =
  | "system"
  | "users"
  | "content"
  | "exam_config"
  | "integrations"
  | "monetization"
  | "notifications"
  | "flags"
  | "monitoring";

/**
 * Role-based settings workspace.
 * Student and Admin see completely different navigation and panels.
 * Backend still enforces admin-only notification admin APIs.
 */
export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";

  if (!user) {
    return <div className="text-sm text-slate-500">Sign in to manage settings.</div>;
  }

  return isAdmin ? <AdminSettingsShell /> : <StudentSettingsShell />;
}

/* ========================================================================== */
/* STUDENT                                                                     */
/* ========================================================================== */

function StudentSettingsShell() {
  const [section, setSection] = useState<StudentSection>("account");
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  const appName = usePlatformStore((s) => s.appName);
  const user = useAuthStore((s) => s.user);
  const isGuest = useAuthStore((s) => s.isGuest);

  const nav: { id: StudentSection; label: string; hide?: boolean }[] = [
    { id: "account", label: "Account" },
    { id: "security", label: "Security", hide: isGuest() },
    { id: "exam_prefs", label: "Exam preferences" },
    { id: "appearance", label: "Appearance" },
    {
      id: "notifications",
      label: "Notifications",
      hide: !(isEnabled("NOTIFICATIONS_ENABLED", true) || isEnabled("ENABLE_NOTIFICATIONS", true)),
    },
    {
      id: "subscription",
      label: "Subscription",
      hide: !isEnabled("ENABLE_SUBSCRIPTIONS", false),
    },
    { id: "help", label: "Help & legal" },
  ];

  return (
    <SettingsShell
      title="Settings"
      subtitle={`${appName()} · student workspace`}
      nav={nav.filter((n) => !n.hide).map((n) => ({ id: n.id, label: n.label }))}
      active={section}
      onChange={(id) => setSection(id as StudentSection)}
    >
      {section === "account" ? <StudentAccountPanel /> : null}
      {section === "security" ? <StudentSecurityPanel /> : null}
      {section === "exam_prefs" ? <StudentExamPrefsPanel /> : null}
      {section === "appearance" ? <StudentAppearancePanel /> : null}
      {section === "notifications" ? <NotificationPrefsPanel /> : null}
      {section === "subscription" ? <StudentSubscriptionPanel /> : null}
      {section === "help" ? <StudentHelpPanel /> : null}
      {user?.role === "guest" && section === "account" ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded px-3 py-2 mt-3">
          Guest session —{" "}
          <Link to="/login" className="underline font-medium">
            sign in
          </Link>{" "}
          to keep a permanent profile.
        </p>
      ) : null}
    </SettingsShell>
  );
}

function StudentAccountPanel() {
  return (
    <Panel title="Account">
      <p className="text-sm text-slate-600 mb-3">
        Manage your display name, contact details and photo from your profile page.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/profile">Open profile</Link>
        </Button>
      </div>
      <dl className="mt-4 text-sm space-y-1.5">
        <InfoRow label="Email" tip="Used for login & result alerts when enabled" />
        <InfoRow label="Phone" tip="Optional · OTP login when enabled by admin" />
        <InfoRow label="Photo" tip="Set avatar URL on profile" />
      </dl>
    </Panel>
  );
}

function StudentSecurityPanel() {
  return (
    <Panel title="Security">
      <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
        <li>Change password from Profile (show/hide available).</li>
        <li>Login alerts can be delivered in-app when notifications are on.</li>
        <li>Never share OTP or passwords. We will never ask for your password on chat.</li>
      </ul>
      <Button asChild size="sm" variant="outline" className="mt-4">
        <Link to="/profile">Password & profile</Link>
      </Button>
      <p className="text-[11px] text-slate-500 mt-3">
        Device session list and forced logout of other devices can be added when audit device
        tracking is enabled server-side.
      </p>
    </Panel>
  );
}

function StudentExamPrefsPanel() {
  const [lang, setLang] = useState(() => localStorage.getItem("exam_pref_lang") || "en");
  const [theme, setTheme] = useState(() => localStorage.getItem("exam_pref_theme") || "system");
  const [font, setFont] = useState(() => localStorage.getItem("exam_pref_font") || "md");
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("exam_pref_lang", lang);
    localStorage.setItem("exam_pref_theme", theme);
    localStorage.setItem("exam_pref_font", font);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <Panel title="Exam preferences">
      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <Field label="Preferred language">
          <select
            className="h-9 w-full border rounded-md px-2 text-sm"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
          >
            <option value="en">English</option>
            <option value="hi">Hindi</option>
          </select>
        </Field>
        <Field label="Theme">
          <select
            className="h-9 w-full border rounded-md px-2 text-sm"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </Field>
        <Field label="Reading size">
          <select
            className="h-9 w-full border rounded-md px-2 text-sm"
            value={font}
            onChange={(e) => setFont(e.target.value)}
          >
            <option value="sm">Compact</option>
            <option value="md">Default</option>
            <option value="lg">Large</option>
          </select>
        </Field>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        Preferences are stored on this device. Exam-level language still follows paper configuration.
      </p>
      <Button size="sm" className="mt-3" onClick={save}>
        {saved ? "Saved" : "Save preferences"}
      </Button>
    </Panel>
  );
}

function StudentAppearancePanel() {
  return (
    <Panel title="Appearance & accessibility">
      <ul className="text-sm text-slate-600 space-y-2 list-disc pl-5">
        <li>Use Exam preferences for theme and reading size.</li>
        <li>Player supports keyboard navigation where free navigation is allowed.</li>
        <li>High-contrast browser settings are respected for form controls.</li>
      </ul>
    </Panel>
  );
}

function StudentSubscriptionPanel() {
  const { data } = useQuery({
    queryKey: ["entitlements"],
    queryFn: () => platformApi.entitlements(),
  });
  return (
    <Panel title="Subscription">
      <dl className="text-sm space-y-1.5">
        <Row label="Plan" value={String(data?.plan_code || "free")} />
        <Row label="Status" value={String(data?.status || "—")} />
        <Row label="Premium" value={data?.is_premium ? "Yes" : "No"} />
      </dl>
      <p className="text-xs text-slate-500 mt-3">
        Plans and payments are controlled by server configuration. Contact support for upgrades when
        billing is enabled.
      </p>
    </Panel>
  );
}

function StudentHelpPanel() {
  const appName = usePlatformStore((s) => s.appName);
  return (
    <Panel title="Help & legal">
      <div className="text-sm space-y-2 text-slate-600">
        <p>
          <strong className="text-slate-800">{appName()}</strong> practice environment.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Help — use your institution contact or platform support email.</li>
          <li>Report a bug — include exam name, time, and screenshot if possible.</li>
          <li>Terms & privacy — provided by your deployment operator.</li>
        </ul>
        <div className="flex flex-wrap gap-2 pt-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/exams">Browse exams</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/attempts">My attempts</Link>
          </Button>
        </div>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* ADMIN                                                                       */
/* ========================================================================== */

function AdminSettingsShell() {
  const [section, setSection] = useState<AdminSection>("system");
  const appName = usePlatformStore((s) => s.appName);
  const isEnabled = usePlatformStore((s) => s.isEnabled);

  const nav: { id: AdminSection; label: string; hide?: boolean }[] = [
    { id: "system", label: "System" },
    { id: "users", label: "Users & access" },
    { id: "content", label: "Content" },
    { id: "exam_config", label: "Exam configuration" },
    { id: "integrations", label: "Integrations" },
    { id: "monetization", label: "Monetization" },
    {
      id: "notifications",
      label: "Notification center",
      hide: !(isEnabled("NOTIFICATIONS_ENABLED", true) || isEnabled("ENABLE_NOTIFICATIONS", true)),
    },
    { id: "flags", label: "Feature flags" },
    { id: "monitoring", label: "Monitoring" },
  ];

  return (
    <SettingsShell
      title="Administration"
      subtitle={`${appName()} · control plane`}
      nav={nav.filter((n) => !n.hide).map((n) => ({ id: n.id, label: n.label }))}
      active={section}
      onChange={(id) => setSection(id as AdminSection)}
    >
      {section === "system" ? <AdminSystemPanel /> : null}
      {section === "users" ? <AdminUsersPanel /> : null}
      {section === "content" ? <AdminContentPanel /> : null}
      {section === "exam_config" ? <AdminExamConfigPanel /> : null}
      {section === "integrations" ? <AdminIntegrationsPanel /> : null}
      {section === "monetization" ? <AdminMonetizationPanel /> : null}
      {section === "notifications" ? <AdminNotificationCenter /> : null}
      {section === "flags" ? <AdminFlagsPanel /> : null}
      {section === "monitoring" ? <AdminMonitoringPanel /> : null}
    </SettingsShell>
  );
}

function AdminSystemPanel() {
  const config = usePlatformStore((s) => s.config);
  const reload = usePlatformStore((s) => s.bootstrap);
  const { data: adminCfg } = useQuery({
    queryKey: ["admin-platform-config"],
    queryFn: () => platformApi.config(),
  });

  return (
    <Panel title="System configuration">
      <dl className="text-sm space-y-1.5 mb-4">
        <Row label="App" value={String(adminCfg?.app?.name || config?.app?.name || "—")} />
        <Row label="Version" value={String(adminCfg?.app?.version || "—")} />
        <Row label="Environment" value={String(adminCfg?.app?.environment || "—")} />
        <Row
          label="Maintenance"
          value={adminCfg?.maintenance?.enabled || config?.maintenance?.enabled ? "ON" : "Off"}
        />
        <Row label="Timezone" value={String(adminCfg?.app?.timezone || "—")} />
      </dl>
      <p className="text-xs text-slate-500 mb-3">
        Runtime values come from environment variables and <code>exam_os.config.json</code>. Use
        server env to toggle maintenance, secrets, and providers — never commit secrets.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="outline" onClick={() => void reload()}>
          Reload client config
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link to="/admin/users">User management</Link>
        </Button>
      </div>
    </Panel>
  );
}

function AdminUsersPanel() {
  return (
    <Panel title="Users, roles & permissions">
      <p className="text-sm text-slate-600 mb-3">
        Manage accounts, activate/deactivate users, and assign admin vs student roles. Permissions for
        exams, import, analytics are enforced on the API via the Permission Engine.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link to="/admin/users">Open users</Link>
        </Button>
      </div>
    </Panel>
  );
}

function AdminContentPanel() {
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  return (
    <Panel title="Content operations">
      <div className="grid gap-2 sm:grid-cols-2 text-sm">
        <AdminLink to="/admin/subjects" label="Subjects" />
        <AdminLink to="/admin/chapters" label="Chapters" />
        <AdminLink to="/admin/questions" label="Question bank" />
        {isEnabled("ENABLE_IMPORT", true) ? (
          <AdminLink to="/admin/import" label="Import engine" />
        ) : (
          <Disabled label="Import (flag off)" />
        )}
        <AdminLink to="/admin/exams" label="Exam builder" />
      </div>
    </Panel>
  );
}

function AdminExamConfigPanel() {
  return (
    <Panel title="Exam & timer configuration">
      <div className="text-sm text-slate-600 space-y-2 leading-relaxed">
        <p>
          <strong className="text-slate-800">Overall timer</strong> — set on each exam as duration
          (minutes). One countdown for the whole paper; auto-submit on expiry when rules allow.
        </p>
        <p>
          <strong className="text-slate-800">Sectional timer</strong> — enable in Create exam →
          Sectional timers, set minutes per section. Optional strict lock prevents returning to a
          finished section (SSC-style).
        </p>
        <p>
          Rules live in <code className="text-xs bg-slate-100 px-1 rounded">exam.rules_json</code>{" "}
          merged by the Rule Engine — not hardcoded in the player.
        </p>
      </div>
      <Button asChild size="sm" className="mt-3">
        <Link to="/admin/exams">Exam builder & timer help</Link>
      </Button>
    </Panel>
  );
}

function AdminIntegrationsPanel() {
  const { data: methods } = useQuery({
    queryKey: ["auth-methods-admin"],
    queryFn: () => authApi.methods(),
  });
  const { data: notifStatus } = useQuery({
    queryKey: ["notif-status"],
    queryFn: () => notificationsApi.adminStatus(),
  });

  return (
    <Panel title="Integrations">
      <div className="text-sm space-y-3">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500 mb-1.5">Auth</div>
          <div className="flex flex-wrap gap-1.5">
            <Flag on={!!methods?.guest} label="Guest" />
            <Flag on={!!methods?.email_password} label="Email" />
            <Flag on={!!methods?.google} label="Google" />
            <Flag on={!!methods?.phone_otp} label="Phone OTP" />
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500 mb-1.5">
            Notification providers
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries((notifStatus?.providers as Record<string, boolean>) || {}).map(
              ([k, v]) => (
                <Flag key={k} on={!!v} label={k} />
              ),
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Credentials: TELEGRAM_BOT_TOKEN, SMTP_*, DISCORD_WEBHOOK, SMS_API_KEY, etc. — env only.
          </p>
        </div>
      </div>
    </Panel>
  );
}

function AdminMonetizationPanel() {
  const { data } = useQuery({
    queryKey: ["monetization"],
    queryFn: () => platformApi.monetization(),
  });
  return (
    <Panel title="Payments, ads & plans">
      <dl className="text-sm space-y-1.5">
        <Row label="Mode" value={String(data?.mode || "free")} />
        <Row label="Subscriptions" value={data?.subscriptions_enabled ? "On" : "Off"} />
        <Row label="Payments" value={data?.payments_enabled ? "On" : "Off"} />
        <Row label="Ads" value={data?.ads_enabled ? "On" : "Off"} />
        <Row label="Provider" value={String(data?.payment_provider || "none")} />
      </dl>
      <p className="text-xs text-slate-500 mt-3">
        Toggle via MONETIZATION_MODE, ENABLE_SUBSCRIPTIONS, ENABLE_PAYMENTS, ENABLE_ADS and provider
        keys in environment.
      </p>
    </Panel>
  );
}

function AdminFlagsPanel() {
  const features = usePlatformStore((s) => s.features);
  const entries = useMemo(
    () => Object.entries(features || {}).sort(([a], [b]) => a.localeCompare(b)),
    [features],
  );
  return (
    <Panel title="Feature flags">
      <div className="max-h-80 overflow-auto border rounded-md divide-y text-sm">
        {entries.map(([k, v]) => (
          <div key={k} className="flex justify-between px-3 py-1.5">
            <span className="font-mono text-xs text-slate-700">{k}</span>
            <Badge variant={v ? "success" : "outline"}>{v ? "on" : "off"}</Badge>
          </div>
        ))}
        {!entries.length ? (
          <div className="px-3 py-4 text-slate-500 text-xs">No flags loaded.</div>
        ) : null}
      </div>
    </Panel>
  );
}

function AdminMonitoringPanel() {
  return (
    <Panel title="Monitoring & audit">
      <ul className="text-sm text-slate-600 list-disc pl-5 space-y-1.5">
        <li>API health: GET /api/health</li>
        <li>Notification queue: process from Notification center</li>
        <li>Import jobs: Admin → Import</li>
        <li>Structured request IDs on every API response (X-Request-ID)</li>
      </ul>
      <Button asChild size="sm" variant="outline" className="mt-3">
        <Link to="/analytics">Analytics dashboard</Link>
      </Button>
    </Panel>
  );
}

function AdminNotificationCenter() {
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [role, setRole] = useState("student");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const { data: status } = useQuery({
    queryKey: ["notif-admin-status"],
    queryFn: () => notificationsApi.adminStatus(),
  });
  const { data: history } = useQuery({
    queryKey: ["notif-admin-history"],
    queryFn: () => notificationsApi.adminHistory("per_page=20"),
  });
  const { data: templates } = useQuery({
    queryKey: ["notif-templates"],
    queryFn: () => notificationsApi.adminTemplates(),
  });

  const broadcastMut = useMutation({
    mutationFn: () =>
      notificationsApi.adminBroadcast({
        title,
        body,
        role: role || undefined,
        channels: ["in_app", "email"],
        category: "admin_broadcast",
      }),
    onSuccess: (res) => {
      setMsg(`Queued for ${res.recipients} recipient(s)`);
      setErr("");
      setTitle("");
      setBody("");
      qc.invalidateQueries({ queryKey: ["notif-admin-history"] });
    },
    onError: (e: any) => {
      setErr(e.message || "Broadcast failed");
      setMsg("");
    },
  });

  const processMut = useMutation({
    mutationFn: () => notificationsApi.adminProcessQueue(),
    onSuccess: (res) => {
      setMsg(`Processed ${res.processed} delivery job(s)`);
      qc.invalidateQueries({ queryKey: ["notif-admin-history"] });
    },
  });

  return (
    <div className="space-y-4">
      <Panel title="Provider status">
        <div className="flex flex-wrap gap-1.5 mb-2">
          <Flag on={!!status?.enabled} label="engine" />
          {Object.entries((status?.providers as Record<string, boolean>) || {}).map(([k, v]) => (
            <Flag key={k} on={!!v} label={k} />
          ))}
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={processMut.isPending}
          onClick={() => processMut.mutate()}
        >
          Process queue now
        </Button>
      </Panel>

      <Panel title="Broadcast">
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input className="h-9 mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">Message</Label>
            <Textarea
              className="mt-1 text-sm"
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-xs">Target role</Label>
            <select
              className="h-9 w-full border rounded-md px-2 text-sm mt-1"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="student">Students</option>
              <option value="guest">Guests</option>
              <option value="admin">Admins</option>
              <option value="">All active (students default in API)</option>
            </select>
          </div>
          {err ? <p className="text-xs text-red-600">{err}</p> : null}
          {msg ? <p className="text-xs text-emerald-700">{msg}</p> : null}
          <Button
            size="sm"
            disabled={!title.trim() || !body.trim() || broadcastMut.isPending}
            onClick={() => broadcastMut.mutate()}
          >
            {broadcastMut.isPending ? "Sending…" : "Send broadcast"}
          </Button>
        </div>
      </Panel>

      <Panel title="Templates">
        <div className="max-h-48 overflow-auto text-xs space-y-1">
          {(templates?.items || []).map((t: any) => (
            <div key={t.id} className="border-b py-1.5">
              <span className="font-mono font-medium">{t.code}</span>
              <span className="text-slate-400"> · {t.channel}</span>
              <div className="text-slate-500 truncate">{t.body_template}</div>
            </div>
          ))}
          {!templates?.items?.length ? (
            <p className="text-slate-500">Defaults seed on first API use.</p>
          ) : null}
        </div>
      </Panel>

      <Panel title="Recent notifications">
        <div className="max-h-56 overflow-auto text-xs divide-y">
          {(history?.items || []).map((n) => (
            <div key={n.id} className="py-2">
              <div className="flex justify-between gap-2">
                <span className="font-medium text-slate-800 truncate">{n.title}</span>
                <Badge variant="outline">{n.status}</Badge>
              </div>
              <div className="text-slate-500 truncate">{n.body}</div>
              <div className="text-slate-400 mt-0.5">
                #{n.id} · {n.category} · user {n.user_id ?? "—"}
              </div>
            </div>
          ))}
          {!history?.items?.length ? (
            <p className="py-3 text-slate-500">No history yet.</p>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}

/* ========================================================================== */
/* Shared notification prefs (student)                                         */
/* ========================================================================== */

function NotificationPrefsPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["notif-prefs"],
    queryFn: () => notificationsApi.getPreferences(),
  });
  const [local, setLocal] = useState<NotificationPreferences | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      notificationsApi.updatePreferences({
        channels: local!.channels,
        categories: local!.categories,
        telegram_chat_id: local!.telegram_chat_id,
      }),
    onSuccess: (res) => {
      setLocal(res.item);
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["notif-prefs"] });
      setTimeout(() => setSaved(false), 1500);
    },
  });

  if (isLoading || !local) {
    return (
      <Panel title="Notification preferences">
        <p className="text-sm text-slate-500">Loading…</p>
      </Panel>
    );
  }

  const toggleChannel = (key: keyof NotificationPreferences["channels"]) => {
    setLocal({
      ...local,
      channels: { ...local.channels, [key]: !local.channels[key] },
    });
  };
  const toggleCat = (key: keyof NotificationPreferences["categories"]) => {
    if (key === "security") return; // locked on
    setLocal({
      ...local,
      categories: { ...local.categories, [key]: !local.categories[key] },
    });
  };

  return (
    <Panel title="Notification preferences">
      <div className="space-y-4 text-sm">
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Channels</div>
          <div className="space-y-1.5">
            {(
              [
                ["in_app", "In-app"],
                ["email", "Email"],
                ["push", "Push"],
                ["telegram", "Telegram"],
                ["whatsapp", "WhatsApp"],
                ["sms", "SMS"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between py-1 cursor-pointer">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={!!local.channels[k]}
                  onChange={() => toggleChannel(k)}
                />
              </label>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold uppercase text-slate-500 mb-2">Categories</div>
          <div className="space-y-1.5">
            {(
              [
                ["exam_alerts", "Exam alerts"],
                ["result_alerts", "Result alerts"],
                ["reminders", "Reminders"],
                ["system", "System"],
                ["security", "Security (always on)"],
                ["marketing", "Marketing"],
              ] as const
            ).map(([k, label]) => (
              <label key={k} className="flex items-center justify-between py-1 cursor-pointer">
                <span className={k === "security" ? "text-slate-500" : ""}>{label}</span>
                <input
                  type="checkbox"
                  checked={!!local.categories[k]}
                  disabled={k === "security"}
                  onChange={() => toggleCat(k)}
                />
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label className="text-xs">Telegram chat ID (optional)</Label>
          <Input
            className="h-9 mt-1"
            value={local.telegram_chat_id || ""}
            onChange={(e) => setLocal({ ...local, telegram_chat_id: e.target.value })}
            placeholder="123456789"
          />
        </div>
        <Button size="sm" disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saved ? "Saved" : saveMut.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </Panel>
  );
}

/* ========================================================================== */
/* Shell primitives                                                            */
/* ========================================================================== */

function SettingsShell({
  title,
  subtitle,
  nav,
  active,
  onChange,
  children,
}: {
  title: string;
  subtitle: string;
  nav: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>
      </div>
      <div className="flex flex-col md:flex-row gap-4 md:gap-6">
        <nav className="md:w-52 shrink-0 border border-slate-200 rounded-md bg-white overflow-hidden">
          {nav.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={cn(
                "w-full text-left px-3 py-2 text-[13px] border-b border-slate-100 last:border-0",
                active === item.id
                  ? "bg-slate-900 text-white font-medium"
                  : "text-slate-700 hover:bg-slate-50",
              )}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="shadow-none border-slate-200">
      <CardHeader className="py-3 px-4 border-b border-slate-100">
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 py-4">{children}</CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-slate-100 py-1.5 last:border-0 text-sm">
      <span className="text-slate-500">{label}</span>
      <span className="font-medium text-slate-800">{value}</span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs text-slate-600">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function InfoRow({ label, tip }: { label: string; tip: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-slate-100 py-1.5">
      <span className="font-medium text-slate-800">{label}</span>
      <span className="text-xs text-slate-500 text-right">{tip}</span>
    </div>
  );
}

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <Badge variant={on ? "success" : "outline"} className="text-[11px]">
      {label}: {on ? "on" : "off"}
    </Badge>
  );
}

function AdminLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="block border border-slate-200 rounded-md px-3 py-2.5 hover:bg-slate-50 text-slate-800 font-medium"
    >
      {label}
    </Link>
  );
}

function Disabled({ label }: { label: string }) {
  return (
    <div className="border border-dashed border-slate-200 rounded-md px-3 py-2.5 text-slate-400 text-sm">
      {label}
    </div>
  );
}
