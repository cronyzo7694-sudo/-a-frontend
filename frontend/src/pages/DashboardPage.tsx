import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { analyticsApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import { usePlatformStore } from "@/stores/platformStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatDuration } from "@/lib/utils";

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const appName = usePlatformStore((s) => s.appName);
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  const analyticsOn = isEnabled("ENABLE_ANALYTICS", true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => analyticsApi.dashboard(),
    enabled: analyticsOn,
  });

  if (analyticsOn && isLoading) {
    return <div className="text-sm text-slate-500">Loading dashboard…</div>;
  }
  if (analyticsOn && error) {
    return <div className="text-sm text-red-600">Failed to load dashboard</div>;
  }

  const stats = data?.quick_stats || {};
  const isAdmin = data?.role === "admin" || user?.role === "admin";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            {user?.full_name}
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            {isAdmin
              ? `${appName()} · operations overview`
              : `${appName()} · practice & mock overview`}
          </p>
        </div>
        <Button asChild size="sm">
          <Link to="/exams">Open exams</Link>
        </Button>
      </div>

      {!analyticsOn ? (
        <Card className="shadow-none border-slate-200">
          <CardContent className="py-6 text-sm text-slate-600">
            Analytics widgets are disabled. You can still browse and attempt exams.
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isAdmin ? (
          <>
            <StatCard title="Users" value={stats.users} />
            <StatCard title="Questions" value={stats.questions} />
            <StatCard title="Exams" value={stats.exams} />
            <StatCard title="Attempts" value={stats.attempts} />
          </>
        ) : (
          <>
            <StatCard title="Tests Taken" value={stats.total_tests} />
            <StatCard title="Avg Score" value={`${stats.average_percentage ?? 0}%`} />
            <StatCard title="Best Score" value={`${stats.best_percentage ?? 0}%`} />
            <StatCard title="Accuracy" value={`${stats.accuracy ?? 0}%`} />
          </>
        )}
      </div>

      {!isAdmin && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Score trend</CardTitle>
            </CardHeader>
            <CardContent>
              {(data?.score_trend || []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No attempts yet. Start a mock test!</p>
              ) : (
                <div className="space-y-2">
                  {(data.score_trend as any[]).map((t) => (
                    <div key={t.attempt_id} className="flex items-center justify-between text-sm border-b py-2">
                      <div className="truncate mr-2">{t.exam_title}</div>
                      <Badge variant={t.percentage >= 60 ? "success" : "warning"}>{t.percentage}%</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Study time</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total time spent</span>
                <span className="font-medium">{formatDuration(stats.total_time_seconds || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Questions faced</span>
                <span className="font-medium">{stats.total_questions_attempted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Correct / Wrong</span>
                <span className="font-medium">
                  {stats.total_correct || 0} / {stats.total_wrong || 0}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent attempts</CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.recent_attempts || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Exam</th>
                    <th className="py-2 pr-3">Score</th>
                    <th className="py-2 pr-3">%</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 pr-3">Submitted</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.recent_attempts as any[]).map((a) => (
                    <tr key={a.id} className="border-b last:border-0">
                      <td className="py-2 pr-3">{a.exam_title || a.exam_id}</td>
                      <td className="py-2 pr-3">
                        {a.score}/{a.max_score}
                      </td>
                      <td className="py-2 pr-3">{a.percentage}%</td>
                      <td className="py-2 pr-3">
                        <Badge variant="secondary">{a.status}</Badge>
                      </td>
                      <td className="py-2 pr-3">{formatDate(a.submitted_at)}</td>
                      <td className="py-2">
                        {a.status !== "in_progress" ? (
                          <Link
                            to="/results/$attemptId"
                            params={{ attemptId: String(a.id) }}
                            className="text-blue-600 hover:underline"
                          >
                            View
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {isAdmin && data?.exam_stats ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Exam performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(data.exam_stats as any[]).map((e) => (
                <div key={e.exam_id} className="flex justify-between text-sm border-b py-2">
                  <span>{e.title}</span>
                  <span className="text-muted-foreground">
                    {e.attempts} attempts · avg {e.avg_percentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value ?? 0}</div>
      </CardContent>
    </Card>
  );
}
