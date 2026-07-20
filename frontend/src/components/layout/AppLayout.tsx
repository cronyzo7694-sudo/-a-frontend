import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ClipboardList, FileQuestion, BarChart3,
  LogOut, Menu, X, GraduationCap, Layers, Library,
  UserRound, Settings, Upload, Users, ChevronDown,
  ChevronLeft, ChevronRight, Search, Sun, Moon, Bell,
  BookOpen, Home, Sparkles, Trophy, Target, Zap,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

/* ═══════════════════════════════════════════════════════════
   Sidebar context — shared collapse state
   ═══════════════════════════════════════════════════════════ */

type SidebarCtx = { collapsed: boolean; toggle: () => void };
const SidebarContext = createContext<SidebarCtx>({ collapsed: false, toggle: () => {} });
export const useSidebar = () => useContext(SidebarContext);

/* ═══════════════════════════════════════════════════════════
   Navigation definition
   ═══════════════════════════════════════════════════════════ */

type NavGroup = {
  label: string;
  items: NavItem[];
};

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
  flag?: string;
  badge?: string;
  external?: boolean;
};

const navigation: NavGroup[] = [
  {
    label: "Workspace",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/exams", label: "Exams", icon: BookOpen },
      { to: "/attempts", label: "Attempts", icon: ClipboardList },
    ],
  },
  {
    label: "Insights",
    items: [
      { to: "/analytics", label: "Analytics", icon: BarChart3, flag: "ENABLE_ANALYTICS" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/profile", label: "Profile", icon: UserRound },
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  },
  {
    label: "Administration",
    items: [
      { to: "/admin/subjects", label: "Subjects", icon: Layers, adminOnly: true },
      { to: "/admin/chapters", label: "Chapters", icon: Library, adminOnly: true },
      { to: "/admin/questions", label: "Question Bank", icon: FileQuestion, adminOnly: true, flag: "ENABLE_QUESTION_BANK" },
      { to: "/admin/exams", label: "Exam Builder", icon: GraduationCap, adminOnly: true },
      { to: "/admin/import", label: "Import", icon: Upload, adminOnly: true, flag: "ENABLE_IMPORT" },
      { to: "/admin/file-bank", label: "File Bank", icon: Layers, adminOnly: true, badge: "AI" },
      { to: "/admin/users", label: "Users", icon: Users, adminOnly: true, flag: "ENABLE_ADMIN_PANEL" },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════
   Inline SVG for logo / decorative icons
   ═══════════════════════════════════════════════════════════ */

function LogoIcon({ className, size = "8" }: { className?: string; size?: string }) {
  return (
    <img
      src="/favicon.svg"
      alt="परीक्षa"
      className={cn("rounded bg-white", className || `h-${size} w-${size}`)}
    />
  );
}

/* ═══════════════════════════════════════════════════════════
   AppLayout — master shell
   ═══════════════════════════════════════════════════════════ */

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const appName = usePlatformStore((s) => s.appName);
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  const maintenanceMessage = usePlatformStore((s) => s.maintenanceMessage);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const isGuest = Boolean(user?.is_guest || user?.role === "guest");
  const isAdmin = user?.role === "admin";
  const maint = maintenanceMessage();

  /* ── Theme toggle ──────────────────────── */
  const toggleTheme = useCallback(() => {
    setDark((d) => {
      const next = !d;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("theme", next ? "dark" : "light");
      return next;
    });
  }, []);

  /* ── Keyboard: Ctrl+K for search ───────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        const el = document.querySelector<HTMLInputElement>('[data-global-search]');
        el?.focus();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  /* ── Close mobile sidebar on navigate ──── */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* ── Filter nav items ──────────────────── */
  const filteredNav = navigation
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (item.adminOnly && !isAdmin) return false;
        if (item.flag && !isEnabled(item.flag, true)) return false;
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const name = appName();

  return (
    <SidebarContext.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      <div className="flex h-screen overflow-hidden bg-background">
        {/* ── Mobile overlay ───────────────── */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        {/* ═══ SIDEBAR ════════════════════════ */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex flex-col bg-card border-r transition-all duration-300 ease-in-out",
            "lg:relative lg:z-auto",
            collapsed ? "w-[72px]" : "w-[272px]",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          {/* Logo */}
          <div className={cn("flex items-center h-16 px-4 border-b shrink-0", collapsed && "justify-center")}>
            <Link to="/dashboard" className="flex items-center gap-3 no-underline hover:opacity-80 transition-opacity">
              <LogoIcon className="w-8 h-8 shrink-0" />
              {!collapsed && <span className="text-lg font-bold tracking-tight text-foreground">{name}</span>}
            </Link>
          </div>

          {/* Nav — scrollable */}
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin">
            {filteredNav.map((group) => (
              <div key={group.label} className="space-y-1">
                {!collapsed && (
                  <h4 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                    {group.label}
                  </h4>
                )}
                {group.items.map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 group relative",
                        collapsed && "justify-center px-2",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                      )}
                    >
                      <Icon className={cn("w-5 h-5 shrink-0", active && "text-primary")} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <span className={cn(
                          "absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-primary",
                          collapsed && "right-0.5"
                        )} />
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* Bottom profile — fixed */}
          <div className={cn("border-t p-3 shrink-0", collapsed && "p-2")}>
            <div className={cn(
              "flex items-center gap-3 rounded-xl p-2.5 hover:bg-muted/50 transition-colors cursor-pointer",
              collapsed && "flex-col gap-1.5 justify-center p-2"
            )}>
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                {(user?.full_name?.[0] || user?.email?.[0] || "S").toUpperCase()}
              </div>
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold truncate">{user?.full_name || "Student"}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{user?.email || ""}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={cn(
                      "inline-block w-1.5 h-1.5 rounded-full",
                      isGuest ? "bg-amber-400" : "bg-emerald-400"
                    )} />
                    <span className="text-[9px] text-muted-foreground capitalize">
                      {isGuest ? "Guest" : (user?.role || "Student")}
                    </span>
                  </div>
                </div>
              )}
              {!collapsed && (
                <button
                  onClick={onLogout}
                  className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
            {collapsed && (
              <button
                onClick={onLogout}
                className="mt-1 w-full flex justify-center p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Collapse toggle (desktop) */}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex absolute -right-3 top-[68px] w-6 h-6 rounded-full border bg-card items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors shadow-sm"
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
          </button>
        </aside>

        {/* ═══ MAIN CONTENT AREA ════════════════ */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* ── Header ────────────────────────── */}
          <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-xl border-b flex items-center gap-3 px-4 sm:px-6 shrink-0">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden shrink-0 p-2 -ml-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb / page title */}
            <Breadcrumb />

            {/* Spacer */}
            <div className="flex-1" />

            {/* Global search */}
            <div className="hidden sm:flex items-center gap-1.5 rounded-xl border bg-muted/30 px-3 py-2 text-sm text-muted-foreground hover:border-primary/30 hover:bg-muted/50 transition-colors cursor-pointer w-64">
              <Search className="w-4 h-4 shrink-0" />
              <input
                data-global-search
                type="text"
                placeholder="Search…"
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground/50"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) navigate({ to: "/exams", search: { search: val } });
                  }
                }}
              />
              <kbd className="hidden lg:inline-flex items-center rounded-md border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
                ⌘K
              </kbd>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              {/* Notifications */}
              <NotificationBell />

              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Toggle theme"
              >
                {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Mobile profile quick-access */}
              <button
                onClick={() => navigate({ to: "/profile" })}
                className="lg:hidden p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Profile"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {(user?.full_name?.[0] || "S").toUpperCase()}
                </div>
              </button>
            </div>
          </header>

          {/* ── Maintenance banner ────────────── */}
          {maint && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200 dark:border-amber-800/30 px-4 py-2 text-center text-xs font-medium text-amber-700 dark:text-amber-400">
              {maint}
            </div>
          )}

          {/* ── Page content ──────────────────── */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            {children}
          </main>

          {/* ── Mobile bottom nav ─────────────── */}
          <nav className="lg:hidden sticky bottom-0 z-30 bg-background/90 backdrop-blur-xl border-t flex items-center justify-around py-1.5 px-2 safe-area-bottom">
            {filteredNav.flatMap((g) => g.items).slice(0, 5).map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl text-[10px] font-medium transition-colors",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="truncate max-w-[60px] text-center">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </SidebarContext.Provider>
  );
}

/* ═══════════════════════════════════════════════════════════
   Breadcrumb — auto-generated from route
   ═══════════════════════════════════════════════════════════ */

function Breadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const segments = useMemo(() => {
    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, i) => {
      const label = part
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/Admin/, "")
        .trim();
      return { label: label || "Home", path: "/" + parts.slice(0, i + 1).join("/") };
    });
  }, [pathname]);

  if (segments.length === 0) return null;

  return (
    <div className="hidden sm:flex items-center gap-1 text-sm">
      {segments.map((seg, i) => (
        <span key={seg.path} className="flex items-center gap-1">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />}
          {i === segments.length - 1 ? (
            <span className="font-semibold text-foreground">{seg.label}</span>
          ) : (
            <Link to={seg.path} className="text-muted-foreground hover:text-foreground transition-colors">
              {seg.label}
            </Link>
          )}
        </span>
      ))}
    </div>
  );
}
