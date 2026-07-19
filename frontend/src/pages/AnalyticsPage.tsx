import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "@/lib/api";
import { usePlatformStore } from "@/stores/platformStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function AnalyticsPage() {
  const isEnabled = usePlatformStore((s) => s.isEnabled);
  const analyticsOn = isEnabled("ENABLE_ANALYTICS", true);

  const { data, isLoading, error } = useQuery({
    queryKey: ["analytics-dashboard"],
    queryFn: () => analyticsApi.dashboard(),
    enabled: analyticsOn,
  });

  if (!analyticsOn) {
    return (
      <div className="rounded-md border border-slate-200 bg-white p-6 text-sm text-slate-600">
        Analytics is disabled for this deployment.
      </div>
    );
  }

  if (isLoading) return <div className="text-sm text-slate-500">Loading analytics…</div>;
  if (error) return <div className="text-sm text-red-600">Failed to load analytics</div>;

  const stats = data?.quick_stats || {};
  const isAdmin = data?.role === "admin";
  const coach = data?.ai_coach || data?.latest_analytics?.ai_coach;
  const weak = data?.weak_subjects || data?.latest_analytics?.weak_subjects || [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">Performance insights from completed attempts</p>
      </div>

      {coach?.summary ? (
        <Card className="shadow-none border-slate-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Latest coach note</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 text-sm text-slate-700 space-y-1">
            <p>{coach.summary}</p>
            {coach.next_best_action ? (
              <p className="text-slate-600">
                <span className="font-medium">Next: </span>
                {coach.next_best_action}
              </p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {Array.isArray(weak) && weak.length ? (
        <Card className="shadow-none border-slate-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Weak subjects</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5 text-sm">
            {weak.slice(0, 8).map((w: any, i: number) => (
              <div key={i} className="flex justify-between border-b border-slate-100 py-1.5 last:border-0">
                <span>{w.name}</span>
                <span className="tabular-nums text-red-600 font-medium">{w.accuracy}%</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(stats).map(([k, v]) => (
          <Card key={k}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wide text-muted-foreground">
                {k.replace(/_/g, " ")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{String(v)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!isAdmin && data?.score_trend ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Score trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2 h-40">
              {(data.score_trend as any[]).map((t) => (
                <div key={t.attempt_id} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <div className="text-[10px] font-medium">{t.percentage}%</div>
                  <div
                    className="w-full bg-blue-600 rounded-t"
                    style={{ height: `${Math.max(4, t.percentage)}%` }}
                    title={t.exam_title}
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isAdmin && data?.exam_stats ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Per-exam stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(data.exam_stats as any[]).map((e) => (
              <div key={e.exam_id} className="flex justify-between border-b py-2 text-sm">
                <span>{e.title}</span>
                <Badge variant="secondary">
                  {e.attempts} att · {e.avg_percentage}% avg
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
