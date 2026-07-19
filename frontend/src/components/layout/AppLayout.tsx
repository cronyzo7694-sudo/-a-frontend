import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  FileQuestion,
  LayoutDashboard,
  LogOut,
  Menu,
  Upload,
  Users,
  X,
  GraduationCap,
  Layers,
  BarChart3,
  Library,
  UserRound,
  Settings,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/NotificationBell";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  /** Feature flag gate — when false, item hidden */
  flag?: string;
};

const navItems: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { to: "/exams", label: "Exams", icon: <ClipboardList className="h-4 w-4" /> },
  { to: "/attempts", label: "Attempts", icon: <GraduationCap className="h-4 w-4" /> },
  {
    to: "/analytics",
    label: "Analytics",
    icon: <BarChart3 className="h-4 w-4" />,
    flag: "ENABLE_ANALYTICS",
  },
  { to: "/profile", label: "Profile", icon: <UserRound className="h-4 w-4" /> },
  { to: "/settings", label: "Settings", icon: <Settings className="h-4 w-4" /> },
  {
    to: "/admin/subjects",
    label: "Subjects",
    icon: <BookOpen className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    to: "/admin/chapters",
    label: "Chapters",
    icon: <Layers className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    to: "/admin/questions",
    label: "Question bank",
    icon: <FileQuestion className="h-4 w-4" />,
    adminOnly: true,
    flag: "ENABLE_QUESTION_BANK",
  },
  {
    to: "/admin/exams",
    label: "Exam builder",
    icon: <ClipboardList className="h-4 w-4" />,
    adminOnly: true,
  },
  {
    to: "/admin/import",
    label: "Import",
    icon: <Upload className="h-4 w-4" />,
    adminOnly: true,
    flag: "ENABLE_IMPORT",
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: <Users className="h-4 w-4" />,
    adminOnly: true,
    flag: "ENABLE_ADMIN_PANEL",
  },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const appName = usePlatformStore((s) => s.appName);
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  const maintenanceMessage = usePlatformStore((s) => s.maintenanceMessage);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const isGuest = Boolean(user?.is_guest || user?.role === "guest");

  const items = navItems.filter((i) => {
    if (i.adminOnly && user?.role !== "admin") return false;
    if (i.flag && !isEnabled(i.flag, true)) return false;
    return true;
  });

  const onLogout = () => {
    logout();
    navigate({ to: "/login" });
  };

  const name = appName();
  const maint = maintenanceMessage();

  return (
    <div className="min-h-screen flex bg-[#f4f5f7] text-slate-900">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[220px] bg-[#1b1f24] text-slate-200 transform transition-transform lg:translate-x-0 lg:static border-r border-black/20",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between h-12 px-3 border-b border-white/10">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm font-semibold tracking-tight text-white">
            <img src="/favicon.svg" alt="परीक्षa" className="h-7 w-7 rounded bg-white" />
            <span className="truncate max-w-[140px]">{name}</span>
          </Link>
          <button type="button" className="lg:hidden p-1 text-slate-400 hover:text-white" onClick={() => setOpen(false)} aria-label="Close menu">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="p-2 space-y-0.5 overflow-y-auto" style={{ maxHeight: "calc(100vh - 9rem)" }}>
          <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Workspace
          </div>
          {items
            .filter((i) => !i.adminOnly)
            .map((item) => {
              const active = pathname === item.to || pathname.startsWith(item.to + "/");
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-[#2f6fed] text-white"
                      : "text-slate-300 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            })}

          {user?.role === "admin" ? (
            <>
              <div className="px-2 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Administration
              </div>
              {items
                .filter((i) => i.adminOnly)
                .map((item) => {
                  const active = pathname === item.to || pathname.startsWith(item.to + "/");
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-2.5 rounded px-2.5 py-1.5 text-[13px] transition-colors",
                        active
                          ? "bg-[#2f6fed] text-white"
                          : "text-slate-300 hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  );
                })}
            </>
          ) : null}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-white/10 bg-[#161a1e]">
          <div className="text-xs mb-2 min-w-0">
            <div className="font-medium text-slate-100 truncate">
              {user?.full_name || (isGuest ? "Guest" : "User")}
            </div>
            <div className="text-slate-500 truncate">
              {isGuest ? "Browsing without account" : user?.email || "—"}
            </div>
            <div className="mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide bg-white/10 text-slate-300">
              {isGuest ? "guest" : user?.role}
            </div>
          </div>
          {isGuest ? (
            <Button
              variant="secondary"
              size="sm"
              className="w-full h-8 text-xs bg-[#2f6fed] hover:bg-[#2a63d6] text-white border-0 mb-1.5"
              onClick={() => navigate({ to: "/login" })}
            >
              Sign in to save progress
            </Button>
          ) : null}
          <Button
            variant="secondary"
            size="sm"
            className="w-full h-8 text-xs bg-white/10 hover:bg-white/15 text-white border-0"
            onClick={onLogout}
          >
            <LogOut className="h-3.5 w-3.5 mr-1.5" /> {isGuest ? "End session" : "Sign out"}
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        {maint ? (
          <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs px-4 py-2">
            {maint}
          </div>
        ) : null}
        <header className="h-12 border-b border-slate-200/80 bg-white flex items-center px-3 gap-3 sticky top-0 z-30">
          <button type="button" className="lg:hidden p-1.5 rounded hover:bg-slate-100" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="h-4 w-4" />
          </button>
          <div className="text-sm text-slate-600 truncate flex items-center gap-2 flex-1 min-w-0">
            <Library className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="font-medium text-slate-800">{name}</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 hidden sm:inline">
              {user?.role === "admin" ? "Control plane" : "Exam operations"}
            </span>
          </div>
          <NotificationBell />
        </header>
        <main className="flex-1 p-3 md:p-5 overflow-auto">{children}</main>
      </div>

      {open ? (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={() => setOpen(false)} />
      ) : null}
    </div>
  );
}
