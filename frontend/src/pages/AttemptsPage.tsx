import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { attemptsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

export function AttemptsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["attempts"],
    queryFn: () => attemptsApi.list(),
  });

  if (isLoading) return <div>Loading attempts…</div>;
  if (error) return <div className="text-red-600">Failed to load attempts</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attempts</h1>
        <p className="text-sm text-muted-foreground">History of exams you have taken</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All attempts ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {(data?.items || []).length === 0 ? (
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
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.items.map((a) => (
                    <tr key={a.id} className="border-b">
                      <td className="py-2 pr-3">{a.exam_title || a.exam_id}</td>
                      <td className="py-2 pr-3">
                        {a.score}/{a.max_score}
                      </td>
                      <td className="py-2 pr-3">{a.percentage}%</td>
                      <td className="py-2 pr-3">
                        <Badge variant="secondary">{a.status}</Badge>
                      </td>
                      <td className="py-2 pr-3">{formatDate(a.submitted_at || a.started_at)}</td>
                      <td className="py-2">
                        {a.status === "in_progress" ? (
                          <Link
                            to="/play/$attemptId"
                            params={{ attemptId: String(a.id) }}
                            className="text-blue-600 hover:underline"
                          >
                            Resume
                          </Link>
                        ) : (
                          <Link
                            to="/results/$attemptId"
                            params={{ attemptId: String(a.id) }}
                            className="text-blue-600 hover:underline"
                          >
                            Result
                          </Link>
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
    </div>
  );
}
