import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { examsApi } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";

export function ExamsPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["exams", search],
    queryFn: () =>
      examsApi.list(
        `parent_id=null${search ? `&search=${encodeURIComponent(search)}` : ""}`
      ),
  });

  if (isLoading) return <div>Loading exams…</div>;
  if (error) return <div className="text-red-600">Failed to load exams</div>;

  const items = data?.items || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exams</h1>
        <p className="text-sm text-muted-foreground">Choose a test and start when ready</p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Search exams... (e.g. SSC, IBPS, Railway)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        />
      </div>
      {items.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No published exams available.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((exam) => (
            <Card key={exam.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-lg leading-snug">{exam.title}</CardTitle>
                  <Badge variant="secondary">{exam.exam_mode}</Badge>
                </div>
                <CardDescription className="line-clamp-2">
                  {exam.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="mt-auto space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground text-xs">Duration</div>
                    <div className="font-medium">{formatDuration(exam.duration_seconds)}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Questions</div>
                    <div className="font-medium">{exam.total_questions}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Total marks</div>
                    <div className="font-medium">{exam.total_marks}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Sections</div>
                    <div className="font-medium">{exam.sections?.length || 0}</div>
                  </div>
                </div>
                <Button asChild className="w-full">
                  <Link to="/exams/$examId" params={{ examId: String(exam.id) }}>
                    View & Start
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
