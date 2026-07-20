import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  authApi, notificationsApi, platformApi,
  type NotificationPreferences,
} from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/* ══════════════════════════════════════════════════════════
   Inline SVG icons
   ══════════════════════════════════════════════════════════ */
const s = (d: string, c = "w-5 h-5") =>
  `<svg class="${c}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${d}</svg>`;
const I = {
  search:   s('<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'),
  user:     s('<path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/>'),
  book:     s('<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>'),
  bell:     s('<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>'),
  palette:  s('<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 011.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C22.965 6.012 17.461 2 12 2z"/>'),
  eye:      s('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  link:     s('<path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/>'),
  shield:   s('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'),
  help:     s('<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'),
  alert:    s('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
  check:    s('<path d="M5 13l4 4L19 7"/>'),
  clock:    s('<path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="10"/>'),
  zap:      s('<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'),
  target:   s('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  arrowR:   s('<path d="M9 18l6-6-6-6"/>'),
  globe:    s('<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>'),
  trash:    s('<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>'),
  sliders:  s('<path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3"/><path d="M1 14h6M9 8h6M17 16h6"/>'),
  sun:      s('<circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>'),
  moon:     s('<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>'),
  monitor:  s('<rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><path d="M8 21h8M12 17v4"/>'),
  save:     s('<path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><path d="M17 21v-8H7v8M7 3v5h8"/>'),
  undo:     s('<path d="M3 7v6h6"/><path d="M21 17a9 9 0 00-9-9 9 9 0 00-6 2.3L3 13"/>'),
  mail:     s('<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>'),
  phone:    s('<path d="M22 16.92v3a2 2 0 01-2.18 2A19.79 19.79 0 018.63 18.93 19.5 19.5 0 012.63 12.93 19.79 19.79 0 01-.56 4.26 2 2 0 011.72-2.26h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>'),
  telegram: s('<path d="M21.5 2.5L2.5 10l7 2.5-2.5 7 5-4.5 5.5 4-3-13z"/>'),
};

/* ══════════════════════════════════════════════════════════
   Toggle switch
   ══════════════════════════════════════════════════════════ */
function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
        checked ? "bg-primary" : "bg-muted-foreground/20"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   Section setting row with toggle
   ══════════════════════════════════════════════════════════ */
function ToggleRow({ icon, title, desc, checked, onChange, disabled }: {
  icon: string; title: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex items-start gap-3 min-w-0">
        <span className="mt-0.5 shrink-0 text-muted-foreground" dangerouslySetInnerHTML={{ __html: icon.replace("w-5 h-5","w-4 h-4") }} />
        <div className="min-w-0">
          <p className="text-sm font-medium">{title}</p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
      <Toggle checked={checked} onChange={onChange} disabled={disabled} />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Section header
   ══════════════════════════════════════════════════════════ */
function SectionH({ icon, title, desc }: { icon: string; title: string; desc?: string }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <span className="shrink-0 text-primary" dangerouslySetInnerHTML={{ __html: icon }} />
      <div>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {desc && <p className="text-[11px] text-muted-foreground">{desc}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Radio card
   ══════════════════════════════════════════════════════════ */
function RadioCard({ icon, label, desc, selected, onClick }: {
  icon: string; label: string; desc?: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all duration-200 ${
        selected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "hover:border-primary/20 hover:bg-muted/30"
      }`}
    >
      <span dangerouslySetInnerHTML={{ __html: icon.replace("w-5 h-5","w-5 h-5 text-primary") }} />
      <div>
        <p className="text-sm font-semibold">{label}</p>
        {desc && <p className="text-[10px] text-muted-foreground">{desc}</p>}
      </div>
      {selected && <span className="ml-auto shrink-0 w-4 h-4 rounded-full bg-primary flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-primary-foreground"/></span>}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   Nav item
   ══════════════════════════════════════════════════════════ */
function NavItem({ id, icon, label, desc, active, onClick }: {
  id: string; icon: string; label: string; desc?: string; active: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-150 ${
        active
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      }`}
    >
      <span className="shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="min-w-0 text-left">
        <p className="text-sm font-medium leading-tight">{label}</p>
        {desc && <p className="text-[10px] opacity-60 truncate">{desc}</p>}
      </div>
      {active && <span className="ml-auto w-0.5 h-6 rounded-full bg-primary" />}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
export function SettingsPage() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const isGuest = useAuthStore((s) => s.isGuest)();
  const isEnabled = usePlatformStore((s) => s.isEnabled);

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col items-center py-20 text-center space-y-4 animate-in fade-in">
          <span className="text-3xl">🔐</span>
          <h2 className="text-lg font-bold">Sign in to access settings</h2>
          <Link to="/login"><Button className="rounded-xl">Sign In</Button></Link>
        </div>
      </div>
    );
  }

  if (isAdmin) return <AdminSettingsShell />;
  return <StudentSettings />;
}

/* ══════════════════════════════════════════════════════════
   STUDENT SETTINGS
   ══════════════════════════════════════════════════════════ */

type Section = "general" | "study" | "notifications" | "appearance" | "accessibility" | "connected" | "privacy" | "danger";

const NAV: { id: Section; icon: string; label: string; desc: string }[] = [
  { id: "general", icon: I.user, label: "General", desc: "Name, language, timezone" },
  { id: "study", icon: I.book, label: "Study Preferences", desc: "Goals, reminders, AI" },
  { id: "notifications", icon: I.bell, label: "Notifications", desc: "Email, SMS, Telegram" },
  { id: "appearance", icon: I.palette, label: "Appearance", desc: "Theme, font, density" },
  { id: "accessibility", icon: I.eye, label: "Accessibility", desc: "Contrast, motion, text" },
  { id: "connected", icon: I.link, label: "Connected Accounts", desc: "Google, Telegram" },
  { id: "privacy", icon: I.shield, label: "Privacy & Data", desc: "Visibility, downloads" },
  { id: "danger", icon: I.alert, label: "Danger Zone", desc: "Delete, reset, deactivate" },
];

function StudentSettings() {
  const [section, setSection] = useState<Section>("general");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  /* ── Notification prefs ─────────────── */
  const { data: notifPrefs } = useQuery({
    queryKey: ["notification-prefs"],
    queryFn: () => notificationsApi.getPreferences(),
    enabled: section === "notifications",
  });

  /* ── Search filtering ───────────────── */
  const filteredNav = useMemo(() => {
    if (!search.trim()) return NAV;
    const q = search.toLowerCase();
    return NAV.filter(n => n.label.toLowerCase().includes(q) || n.desc.toLowerCase().includes(q));
  }, [search]);

  /* ── Admin guard ────────────────────── */
  const isGuest = useAuthStore((s) => s.isGuest)();

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-in fade-in duration-300">

      {/* Header + Search */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">Personalize your परीक्षa experience</p>
          </div>
        </div>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" dangerouslySetInnerHTML={{ __html: I.search.replace("w-5 h-5","w-4 h-4") }} />
          <input
            type="text"
            placeholder="Search settings…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-xl border bg-muted/30 pl-10 pr-4 py-2.5 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex rounded-md border bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground/60">⌘K</kbd>
        </div>
      </div>

      {/* Layout: Nav + Content */}
      <div className="flex gap-6">
        {/* Left Nav (desktop) */}
        <nav className="hidden lg:block w-56 shrink-0 space-y-1 sticky top-20 self-start">
          {filteredNav.map(n => (
            <NavItem key={n.id} id={n.id} icon={n.icon} label={n.label} desc={n.desc} active={section === n.id} onClick={() => setSection(n.id)} />
          ))}
        </nav>

        {/* Mobile nav selector */}
        <div className="lg:hidden w-full mb-4">
          <button onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="w-full flex items-center justify-between rounded-xl border px-4 py-2.5 text-sm font-medium">
            <span className="flex items-center gap-2">
              <span dangerouslySetInnerHTML={{ __html: NAV.find(n => n.id === section)?.icon || I.user }} />
              {NAV.find(n => n.id === section)?.label}
            </span>
            <svg className={`w-4 h-4 transition-transform ${mobileNavOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
          </button>
          {mobileNavOpen && (
            <div className="mt-2 border rounded-2xl p-2 space-y-1 animate-slide-down">
              {filteredNav.map(n => (
                <NavItem key={n.id} id={n.id} icon={n.icon} label={n.label} desc={n.desc} active={section === n.id} onClick={() => { setSection(n.id); setMobileNavOpen(false); }} />
              ))}
            </div>
          )}
        </div>

        {/* Content area */}
        <div className="flex-1 min-w-0">
          <Card className="border shadow-sm">
            <CardContent className="p-5 sm:p-6">
              {section === "general" && <GeneralPanel />}
              {section === "study" && <StudyPanel />}
              {section === "notifications" && <NotificationsPanel prefs={notifPrefs} />}
              {section === "appearance" && <AppearancePanel />}
              {section === "accessibility" && <AccessibilityPanel />}
              {section === "connected" && <ConnectedPanel />}
              {section === "privacy" && <PrivacyPanel />}
              {section === "danger" && <DangerPanel />}
            </CardContent>
          </Card>

          {/* Guest warning */}
          {isGuest && (
            <Card className="mt-4 border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800/20">
              <CardContent className="p-4 flex items-start gap-3">
                <span className="text-lg shrink-0">⚠️</span>
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Guest Session</p>
                  <p className="text-[11px] text-muted-foreground">Sign in to sync settings across devices.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   GENERAL PANEL
   ══════════════════════════════════════════════════════════ */
function GeneralPanel() {
  const user = useAuthStore((s) => s.user);
  const [lang, setLang] = useState(() => localStorage.getItem("pref_lang") || "en");
  const [tz, setTz] = useState(() => localStorage.getItem("pref_tz") || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("pref_lang", lang);
    localStorage.setItem("pref_tz", tz);
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionH icon={I.user} title="General" desc="Your account basics and regional preferences" />
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><span dangerouslySetInnerHTML={{ __html: I.user.replace("w-5 h-5","w-3 h-3") }} />Display Name</Label>
          <Input value={user?.full_name || ""} readOnly className="rounded-xl h-9 text-sm bg-muted/30 cursor-not-allowed" />
          <p className="text-[10px] text-muted-foreground">Change from your Profile page</p>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><span dangerouslySetInnerHTML={{ __html: I.mail.replace("w-5 h-5","w-3 h-3") }} />Email</Label>
          <Input value={user?.email || ""} readOnly className="rounded-xl h-9 text-sm bg-muted/30 cursor-not-allowed" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><span dangerouslySetInnerHTML={{ __html: I.globe.replace("w-5 h-5","w-3 h-3") }} />Language</Label>
          <select value={lang} onChange={e => setLang(e.target.value)} className="w-full rounded-xl border bg-card h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
            <option value="en">English</option><option value="hi">हिन्दी (Hindi)</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs flex items-center gap-1"><span dangerouslySetInnerHTML={{ __html: I.clock.replace("w-5 h-5","w-3 h-3") }} />Timezone</Label>
          <select value={tz} onChange={e => setTz(e.target.value)} className="w-full rounded-xl border bg-card h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 cursor-pointer">
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option><option value="UTC">UTC</option>
          </select>
        </div>
      </div>
      <Button size="sm" onClick={save} className="rounded-xl gap-1.5 h-8">{saved ? "✓ Saved" : "Save Preferences"}</Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   STUDY PREFERENCES
   ══════════════════════════════════════════════════════════ */
function StudyPanel() {
  const [goal, setGoal] = useState(() => Number(localStorage.getItem("daily_goal")) || 50);
  const [reminder, setReminder] = useState(() => localStorage.getItem("study_reminder") === "true");
  const [pomodoro, setPomodoro] = useState(() => localStorage.getItem("pomodoro") === "true");
  const [aiRecs, setAiRecs] = useState(() => localStorage.getItem("ai_recs") !== "false");
  const [saved, setSaved] = useState(false);

  const save = () => {
    localStorage.setItem("daily_goal", String(goal));
    localStorage.setItem("study_reminder", String(reminder));
    localStorage.setItem("pomodoro", String(pomodoro));
    localStorage.setItem("ai_recs", String(aiRecs));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      <SectionH icon={I.book} title="Study Preferences" desc="Customize how you learn" />
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><Label>Daily Question Goal</Label><span className="font-bold tabular-nums">{goal}</span></div>
          <input type="range" min="10" max="200" step="10" value={goal} onChange={e => setGoal(Number(e.target.value))}
            className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm" />
        </div>
        <ToggleRow icon={I.clock} title="Study Reminder" desc="Get reminded at your preferred study time" checked={reminder} onChange={setReminder} />
        <ToggleRow icon={I.zap} title="Pomodoro Timer" desc="25 min study, 5 min break intervals" checked={pomodoro} onChange={setPomodoro} />
        <ToggleRow icon={I.target} title="AI Recommendations" desc="Receive personalized practice suggestions" checked={aiRecs} onChange={setAiRecs} />
      </div>
      <Button size="sm" onClick={save} className="rounded-xl gap-1.5 h-8">{saved ? "✓ Saved" : "Save Preferences"}</Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   NOTIFICATIONS
   ══════════════════════════════════════════════════════════ */
function NotificationsPanel({ prefs }: { prefs?: NotificationPreferences }) {
  const qc = useQueryClient();
  const [channels, setChannels] = useState({
    in_app: prefs?.channels?.in_app ?? true,
    email: prefs?.channels?.email ?? false,
    sms: prefs?.channels?.sms ?? false,
    telegram: prefs?.channels?.telegram ?? false,
  });
  const [cats, setCats] = useState({
    exam_alerts: prefs?.categories?.exam_alerts ?? true,
    result_alerts: prefs?.categories?.result_alerts ?? true,
    reminders: prefs?.categories?.reminders ?? true,
    system: prefs?.categories?.system ?? true,
    security: prefs?.categories?.security ?? true,
    marketing: prefs?.categories?.marketing ?? false,
  });

  useEffect(() => { if (prefs) {
    setChannels({ in_app: prefs.channels?.in_app ?? true, email: prefs.channels?.email ?? false, sms: prefs.channels?.sms ?? false, telegram: prefs.channels?.telegram ?? false });
    setCats({ exam_alerts: prefs.categories?.exam_alerts ?? true, result_alerts: prefs.categories?.result_alerts ?? true, reminders: prefs.categories?.reminders ?? true, system: prefs.categories?.system ?? true, security: prefs.categories?.security ?? true, marketing: prefs.categories?.marketing ?? false });
  }}, [prefs]);

  const saveMut = useMutation({
    mutationFn: () => notificationsApi.updatePreferences({ channels, categories: cats } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-prefs"] }),
  });

  return (
    <div className="space-y-6">
      <SectionH icon={I.bell} title="Notifications" desc="Control how and when you're notified" />

      {/* Channels */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Channels</p>
        <ToggleRow icon={I.bell} title="In-App" desc="Notifications inside the platform" checked={channels.in_app} onChange={v => setChannels(c => ({...c, in_app: v}))} />
        <ToggleRow icon={I.mail} title="Email" desc="Receive updates via email" checked={channels.email} onChange={v => setChannels(c => ({...c, email: v}))} />
        <ToggleRow icon={I.phone} title="SMS" desc="Text message alerts" checked={channels.sms} onChange={v => setChannels(c => ({...c, sms: v}))} />
        <ToggleRow icon={I.telegram} title="Telegram" desc="Instant alerts via Telegram bot" checked={channels.telegram} onChange={v => setChannels(c => ({...c, telegram: v}))} />
      </div>

      {/* Categories */}
      <div className="space-y-1">
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Alert Types</p>
        <ToggleRow icon={I.book} title="Exam Updates" desc="New exams, schedule changes" checked={cats.exam_alerts} onChange={v => setCats(c => ({...c, exam_alerts: v}))} />
        <ToggleRow icon={I.check} title="Results" desc="When your test results are ready" checked={cats.result_alerts} onChange={v => setCats(c => ({...c, result_alerts: v}))} />
        <ToggleRow icon={I.clock} title="Reminders" desc="Daily study and exam reminders" checked={cats.reminders} onChange={v => setCats(c => ({...c, reminders: v}))} />
        <ToggleRow icon={I.shield} title="Security" desc="Login alerts and account changes" checked={cats.security} onChange={v => setCats(c => ({...c, security: v}))} />
        <ToggleRow icon={I.alert} title="Marketing" desc="Tips, offers, and feature updates" checked={cats.marketing} onChange={v => setCats(c => ({...c, marketing: v}))} />
      </div>

      <Button size="sm" onClick={() => saveMut.mutate()} disabled={saveMut.isPending} className="rounded-xl gap-1.5 h-8">
        {saveMut.isPending ? "Saving…" : saveMut.isSuccess ? "✓ Saved" : "Save Notifications"}
      </Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   APPEARANCE
   ══════════════════════════════════════════════════════════ */
function AppearancePanel() {
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "system");
  const [fontSize, setFontSize] = useState(() => Number(localStorage.getItem("font_size")) || 16);
  const [compact, setCompact] = useState(() => localStorage.getItem("compact_mode") === "true");
  const [animations, setAnimations] = useState(() => localStorage.getItem("reduce_animations") !== "true");

  const save = () => {
    localStorage.setItem("theme", theme);
    localStorage.setItem("font_size", String(fontSize));
    localStorage.setItem("compact_mode", String(compact));
    localStorage.setItem("reduce_animations", String(!animations));
    if (theme === "dark") document.documentElement.classList.add("dark");
    else if (theme === "light") document.documentElement.classList.remove("dark");
    else { /* system */ }
  };

  return (
    <div className="space-y-6">
      <SectionH icon={I.palette} title="Appearance" desc="Customize how परीक्षa looks" />

      {/* Theme */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold">Theme</Label>
        <div className="grid grid-cols-3 gap-3">
          <RadioCard icon={I.sun} label="Light" desc="Clean & bright" selected={theme === "light"} onClick={() => setTheme("light")} />
          <RadioCard icon={I.moon} label="Dark" desc="Easy on eyes" selected={theme === "dark"} onClick={() => setTheme("dark")} />
          <RadioCard icon={I.monitor} label="System" desc="Follows OS" selected={theme === "system"} onClick={() => setTheme("system")} />
        </div>

        {/* Theme preview */}
        <div className={`rounded-2xl border p-4 mt-3 transition-colors duration-300 ${theme === "dark" ? "bg-slate-900 text-slate-100 border-slate-700" : theme === "light" ? "bg-white text-slate-800" : "bg-background text-foreground"}`}>
          <div className="flex gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-red-400"/><div className="w-3 h-3 rounded-full bg-amber-400"/><div className="w-3 h-3 rounded-full bg-emerald-400"/>
          </div>
          <p className="text-xs font-medium">Live preview</p>
          <p className="text-[10px] opacity-60">This is how cards and text will appear.</p>
        </div>
      </div>

      {/* Font size */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs"><Label>Font Size</Label><span className="font-bold">{fontSize}px</span></div>
        <input type="range" min="12" max="22" step="1" value={fontSize} onChange={e => setFontSize(Number(e.target.value))}
          className="w-full h-2 rounded-full bg-muted appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-sm" />
      </div>

      <ToggleRow icon={I.sliders} title="Compact Mode" desc="Reduce spacing for denser layouts" checked={compact} onChange={setCompact} />
      <ToggleRow icon={I.zap} title="Animations" desc="Smooth transitions and micro-interactions" checked={animations} onChange={setAnimations} />

      <Button size="sm" onClick={save} className="rounded-xl gap-1.5 h-8">Apply Appearance</Button>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ACCESSIBILITY
   ══════════════════════════════════════════════════════════ */
function AccessibilityPanel() {
  const [highContrast, setHighContrast] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(true);

  return (
    <div className="space-y-6">
      <SectionH icon={I.eye} title="Accessibility" desc="Make परीक्षa work better for you" />
      <ToggleRow icon={I.eye} title="High Contrast" desc="Increase contrast for better readability" checked={highContrast} onChange={setHighContrast} />
      <ToggleRow icon={I.sliders} title="Reduced Motion" desc="Minimize animations and transitions" checked={reducedMotion} onChange={setReducedMotion} />
      <ToggleRow icon={I.monitor} title="Large Text" desc="Scale up all text across the platform" checked={largeText} onChange={setLargeText} />
      <ToggleRow icon={I.arrowR} title="Keyboard Navigation" desc="Full platform navigation via keyboard" checked={keyboardNav} onChange={setKeyboardNav} disabled />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   CONNECTED ACCOUNTS
   ══════════════════════════════════════════════════════════ */
function ConnectedPanel() {
  const user = useAuthStore((s) => s.user);
  const accounts = [
    { name: "Google", icon: "G", color: "bg-red-100 text-red-600 dark:bg-red-950/30 dark:text-red-400", connected: user?.auth_provider === "google" },
    { name: "Telegram", icon: "✈", color: "bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400", connected: false },
    { name: "GitHub", icon: "GH", color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300", connected: false },
  ];
  return (
    <div className="space-y-6">
      <SectionH icon={I.link} title="Connected Accounts" desc="Link your accounts for easy sign-in" />
      <div className="space-y-3">
        {accounts.map(a => (
          <div key={a.name} className="flex items-center justify-between rounded-2xl border p-4 hover:border-primary/20 transition-colors">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl ${a.color} flex items-center justify-center text-sm font-bold`}>{a.icon}</div>
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-[10px] text-muted-foreground">{a.connected ? "Connected" : "Not connected"}</p>
              </div>
            </div>
            <Badge variant={a.connected ? "secondary" : "outline"} className="text-[10px]">
              {a.connected ? "Connected" : "Connect"}
            </Badge>
          </div>
        ))}
      </div>
      <p className="text-[10px] text-muted-foreground">Connected accounts allow faster sign-in and improved security.</p>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   PRIVACY & DATA
   ══════════════════════════════════════════════════════════ */
function PrivacyPanel() {
  const [publicProfile, setPublicProfile] = useState(false);
  const [hideEmail, setHideEmail] = useState(true);
  const [analyticsShare, setAnalyticsShare] = useState(true);
  return (
    <div className="space-y-6">
      <SectionH icon={I.shield} title="Privacy & Data" desc="Control your data and visibility" />
      <ToggleRow icon={I.eye} title="Public Profile" desc="Allow others to find you by name" checked={publicProfile} onChange={setPublicProfile} />
      <ToggleRow icon={I.mail} title="Hide Email" desc="Keep your email private from other students" checked={hideEmail} onChange={setHideEmail} />
      <ToggleRow icon={I.target} title="Analytics Sharing" desc="Help us improve by sharing anonymized usage data" checked={analyticsShare} onChange={setAnalyticsShare} />
      <div className="pt-2 border-t space-y-2">
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 w-full justify-start">
          <span dangerouslySetInnerHTML={{ __html: I.save.replace("w-5 h-5","w-3.5 h-3.5") }} />Download My Data
        </Button>
        <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 w-full justify-start">
          <span dangerouslySetInnerHTML={{ __html: I.trash.replace("w-5 h-5","w-3.5 h-3.5") }} />Clear Search History
        </Button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   DANGER ZONE
   ══════════════════════════════════════════════════════════ */
function DangerPanel() {
  const [confirmDelete, setConfirmDelete] = useState("");
  const [showDelete, setShowDelete] = useState(false);
  return (
    <div className="space-y-6">
      <SectionH icon={I.alert} title="Danger Zone" desc="Irreversible account actions" />
      <div className="space-y-3">
        {/* Delete Account */}
        <div className="rounded-2xl border border-red-200 dark:border-red-800/30 bg-red-50/30 dark:bg-red-950/10 p-4 space-y-3">
          <div className="flex items-start gap-3">
            <span className="shrink-0 text-red-500 mt-0.5" dangerouslySetInnerHTML={{ __html: I.alert.replace("w-5 h-5","w-4 h-4") }} />
            <div>
              <p className="text-sm font-semibold text-red-600 dark:text-red-400">Delete Account</p>
              <p className="text-[11px] text-muted-foreground">Permanently delete your account and all associated data. This cannot be undone.</p>
            </div>
          </div>
          {!showDelete ? (
            <Button variant="destructive" size="sm" onClick={() => setShowDelete(true)} className="rounded-xl h-8">Delete Account</Button>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-red-500">Type "DELETE" to confirm:</p>
              <div className="flex gap-2">
                <Input value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} placeholder='Type "DELETE"' className="rounded-xl h-8 text-sm" />
                <Button variant="destructive" size="sm" disabled={confirmDelete !== "DELETE"} className="rounded-xl h-8 shrink-0">Confirm</Button>
                <Button variant="outline" size="sm" onClick={() => { setShowDelete(false); setConfirmDelete(""); }} className="rounded-xl h-8 shrink-0">Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Other danger actions */}
        <div className="space-y-2">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 w-full justify-start text-muted-foreground hover:text-red-500">
            <span dangerouslySetInnerHTML={{ __html: I.undo.replace("w-5 h-5","w-3.5 h-3.5") }} />Reset All Progress
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5 h-8 w-full justify-start text-muted-foreground hover:text-red-500">
            <span dangerouslySetInnerHTML={{ __html: I.trash.replace("w-5 h-5","w-3.5 h-3.5") }} />Delete All Bookmarks
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   ADMIN SETTINGS — preserved from existing, simplified
   ══════════════════════════════════════════════════════════ */
type AdminSection = "system" | "users" | "content" | "exam" | "integrations" | "monetization" | "notifications" | "flags" | "monitoring";

const ADMIN_NAV: { id: AdminSection; icon: string; label: string }[] = [
  { id: "system", icon: I.monitor, label: "System" },
  { id: "users", icon: I.user, label: "Users & Access" },
  { id: "content", icon: I.book, label: "Content" },
  { id: "exam", icon: I.sliders, label: "Exam Config" },
  { id: "integrations", icon: I.link, label: "Integrations" },
  { id: "monetization", icon: I.target, label: "Monetization" },
  { id: "notifications", icon: I.bell, label: "Notification Center" },
  { id: "flags", icon: I.zap, label: "Feature Flags" },
  { id: "monitoring", icon: I.eye, label: "Monitoring" },
];

function AdminSettingsShell() {
  const [section, setSection] = useState<AdminSection>("system");
  const isEnabled = usePlatformStore((s) => s.isEnabled);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 animate-in fade-in duration-300">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration & management</p>
      </div>
      <div className="flex gap-6">
        <nav className="hidden lg:block w-52 shrink-0 space-y-1 sticky top-20 self-start">
          {ADMIN_NAV.filter(n => {
            if (n.id === "notifications" && !(isEnabled("NOTIFICATIONS_ENABLED", true) || isEnabled("ENABLE_NOTIFICATIONS", true))) return false;
            return true;
          }).map(n => (
            <NavItem key={n.id} id={n.id} icon={n.icon} label={n.label} active={section === n.id} onClick={() => setSection(n.id)} />
          ))}
        </nav>
        <div className="flex-1 min-w-0">
          <Card className="border shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <AdminPanel section={section} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ section }: { section: AdminSection }) {
  const config = usePlatformStore((s) => s.config);
  const reload = usePlatformStore((s) => s.bootstrap);
  switch (section) {
    case "system":
      return (
        <div className="space-y-4">
          <SectionH icon={I.monitor} title="System" desc="Runtime environment & configuration" />
          <div className="rounded-2xl border p-4 bg-muted/20">
            <p className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(config, null, 2)}
            </p>
          </div>
          <Button size="sm" onClick={() => reload()} className="rounded-xl gap-1.5 h-8">Reload Client Config</Button>
        </div>
      );
    case "users":
      return <div className="space-y-4"><SectionH icon={I.user} title="Users & Access" desc="Manage accounts, roles, and permissions" /><Link to="/admin/users"><Button size="sm" className="rounded-xl gap-1.5 h-8">Open User Management →</Button></Link></div>;
    case "content":
      return <div className="space-y-4"><SectionH icon={I.book} title="Content" desc="Subjects, chapters, and question bank" /><div className="flex flex-wrap gap-2"><Link to="/admin/subjects"><Button variant="outline" size="sm" className="rounded-xl h-8">Subjects</Button></Link><Link to="/admin/chapters"><Button variant="outline" size="sm" className="rounded-xl h-8">Chapters</Button></Link><Link to="/admin/questions"><Button variant="outline" size="sm" className="rounded-xl h-8">Question Bank</Button></Link><Link to="/admin/import"><Button variant="outline" size="sm" className="rounded-xl h-8">Import</Button></Link></div></div>;
    case "exam":     return <div className="space-y-4"><SectionH icon={I.sliders} title="Exam Configuration" desc="Timer settings, marking, and proctoring defaults" /><Link to="/admin/exams"><Button size="sm" className="rounded-xl gap-1.5 h-8">Exam Builder →</Button></Link></div>;
    case "flags":    return <div className="space-y-4"><SectionH icon={I.zap} title="Feature Flags" desc="Toggle platform features on/off" /><p className="text-xs text-muted-foreground">Feature flags are managed via environment variables and exam_os.config.json on the backend.</p></div>;
    default:         return <p className="text-sm text-muted-foreground py-8 text-center">Select a section from the sidebar</p>;
  }
}
