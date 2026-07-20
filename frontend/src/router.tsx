import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import { useAuthStore } from "@/stores/authStore";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { ExamsPage } from "@/pages/ExamsPage";
import { ExamDetailPage } from "@/pages/ExamDetailPage";
import { ExamPlayerPage } from "@/pages/ExamPlayerPage";
import { ResultPage } from "@/pages/ResultPage";
import { AttemptsPage } from "@/pages/AttemptsPage";
import { AnalyticsPage } from "@/pages/AnalyticsPage";
import { SubjectsPage } from "@/pages/admin/SubjectsPage";
import { ChaptersPage } from "@/pages/admin/ChaptersPage";
import { QuestionsPage } from "@/pages/admin/QuestionsPage";
import { AdminExamsPage } from "@/pages/admin/AdminExamsPage";
import { ImportPage } from "@/pages/admin/ImportPage";
import { UsersPage } from "@/pages/admin/UsersPage";
import { FileBankPage } from "@/pages/admin/FileBankPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { SettingsPage } from "@/pages/SettingsPage";

function requireAuth() {
  const token = localStorage.getItem("access_token");
  if (!token) {
    throw redirect({ to: "/login" });
  }
}

function requireAdmin() {
  requireAuth();
  const user = useAuthStore.getState().user;
  if (user && user.role !== "admin") {
    throw redirect({ to: "/dashboard" });
  }
}

function requireGuest() {
  const token = localStorage.getItem("access_token");
  if (token) {
    throw redirect({ to: "/dashboard" });
  }
}

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  beforeLoad: () => requireGuest(),
  component: LoginPage,
});

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  beforeLoad: () => requireGuest(),
  component: RegisterPage,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      throw redirect({ to: "/login" });
    }
    const user = useAuthStore.getState().user;
    if (user?.role === "guest" || user?.is_guest) {
      throw redirect({ to: "/exams" });
    }
    throw redirect({ to: "/dashboard" });
  },
  component: () => null,
});

const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: () => requireAuth(),
  component: () => (
    <AppLayout>
      <Outlet />
    </AppLayout>
  ),
});

const dashboardRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/dashboard",
  component: DashboardPage,
});

const examsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/exams",
  component: ExamsPage,
});

const examDetailRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/exams/$examId",
  component: ExamDetailPage,
});

const attemptsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/attempts",
  component: AttemptsPage,
});

const analyticsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/analytics",
  component: AnalyticsPage,
});

const profileRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/profile",
  component: ProfilePage,
});

const settingsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/settings",
  component: SettingsPage,
});

const resultsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/results/$attemptId",
  component: ResultPage,
});

const playRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/play/$attemptId",
  beforeLoad: () => requireAuth(),
  component: ExamPlayerPage,
});

// Admin
const adminSubjectsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/subjects",
  beforeLoad: () => requireAdmin(),
  component: SubjectsPage,
});
const adminChaptersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/chapters",
  beforeLoad: () => requireAdmin(),
  component: ChaptersPage,
});
const adminQuestionsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/questions",
  beforeLoad: () => requireAdmin(),
  component: QuestionsPage,
});
const adminExamsRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/exams",
  beforeLoad: () => requireAdmin(),
  component: AdminExamsPage,
});
const adminImportRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/import",
  beforeLoad: () => requireAdmin(),
  component: ImportPage,
});
const fileBankRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/file-bank",
  beforeLoad: () => requireAdmin(),
  component: FileBankPage,
});
const adminUsersRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/admin/users",
  beforeLoad: () => requireAdmin(),
  component: UsersPage,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  playRoute,
  appRoute.addChildren([
    dashboardRoute,
    examsRoute,
    examDetailRoute,
    attemptsRoute,
    analyticsRoute,
    profileRoute,
    settingsRoute,
    resultsRoute,
    adminSubjectsRoute,
    adminChaptersRoute,
    adminQuestionsRoute,
    adminExamsRoute,
    adminImportRoute,
    fileBankRoute,
    adminUsersRoute,
  ]),
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
