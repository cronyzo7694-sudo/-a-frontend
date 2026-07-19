import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { attemptsApi, examsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/utils";
import { useState } from "react";
import { useExamPlayerStore } from "@/stores/examPlayerStore";

function sectionTimerNote(exam: {
  duration_seconds: number;
  strict_sections?: boolean;
  sections?: Array<{ duration_seconds?: number | null; title: string }>;
  resolved_rules?: { timing?: { section_timers?: boolean; overall_seconds?: number } };
}) {
  const rules = (exam as any).resolved_rules;
  const sectionTimers = Boolean(rules?.timing?.section_timers);
  const hasSectionDurations = (exam.sections || []).some((s) => s.duration_seconds);
  if (sectionTimers || hasSectionDurations) {
    return "This paper uses sectional timing (per-section clocks) plus an overall limit.";
  }
  return "Single overall timer for the full paper.";
}

export function ExamDetailPage() {
  const params = useParams({ strict: false }) as { examId?: string };
  const id = Number(params.examId);
  const navigate = useNavigate();
  const loadFromPayload = useExamPlayerStore((s) => s.loadFromPayload);
  const reset = useExamPlayerStore((s) => s.reset);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsApi.get(id),
    enabled: Number.isFinite(id),
  });

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      reset();
      const payload = await attemptsApi.start(id);
      loadFromPayload(payload);
      navigate({ to: "/play/$attemptId", params: { attemptId: String(payload.attempt.id) } });
    } catch (e: any) {
      setError(e.message || "Failed to start exam");
    } finally {
      setStarting(false);
    }
  };

  if (isLoading || !exam) return <div>Loading…</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link to="/exams" className="text-sm text-blue-600 hover:underline">
          ← Back to exams
        </Link>
        <h1 className="text-2xl font-bold mt-2">{exam.title}</h1>
        <div className="flex flex-wrap gap-2 mt-2">
          <Badge>{exam.exam_mode}</Badge>
          <Badge variant="secondary">{exam.status}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overview</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <Row label="Overall duration" value={formatDuration(exam.duration_seconds)} />
          <Row label="Questions" value={String(exam.total_questions)} />
          <Row label="Total marks" value={String(exam.total_marks)} />
          <Row label="Negative marking" value={`${exam.default_negative_marks} / wrong`} />
          <Row label="Sections" value={String(exam.sections?.length || 0)} />
          <Row label="Strict sections" value={exam.strict_sections ? "Yes" : "No"} />
        </CardContent>
        <div className="px-6 pb-4 text-xs text-slate-500 border-t pt-3">
          {sectionTimerNote(exam as any)}
          {(exam.sections || []).some((s) => s.duration_seconds) ? (
            <ul className="mt-2 space-y-1 list-disc pl-4">
              {exam.sections.map((s) => (
                <li key={s.id}>
                  {s.title}:{" "}
                  {s.duration_seconds
                    ? formatDuration(s.duration_seconds)
                    : "uses overall only"}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </Card>

      {exam.description ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Description</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{exam.description}</CardContent>
        </Card>
      ) : null}

      {exam.instructions ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm whitespace-pre-wrap">{exam.instructions}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(exam.sections || []).map((s) => (
            <div key={s.id} className="flex justify-between text-sm border rounded-md p-3">
              <span className="font-medium">{s.title}</span>
              <span className="text-muted-foreground">{s.question_count ?? 0} questions</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {error ? <p className="text-red-600 text-sm">{error}</p> : null}

      <Button size="lg" className="w-full" onClick={start} disabled={starting || exam.total_questions < 1}>
        {starting ? "Starting…" : "Start Exam"}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
