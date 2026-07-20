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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewFilter, setViewFilter] = useState<"all" | "mock" | "pyq">("all");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [expandedGroups, setExpandedGroups] = useState(false);
  const [expandedDescription, setExpandedDescription] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsApi.get(id),
    enabled: Number.isFinite(id),
  });

  const childTests = exam?.children || [];

  const extractSubject = (title: string): string => {
    const knownSubjects = [
      "Quantitative",
      "Reasoning",
      "English",
      "General Awareness",
      "History",
      "Geography",
      "Polity",
      "Science",
      "Mathematics",
      "Physics",
      "Chemistry",
      "Biology",
      "Economy",
      "Current Affairs",
      "Hindi",
    ];
    const normalized = title.toLowerCase();
    for (const subject of knownSubjects) {
      if (normalized.includes(subject.toLowerCase())) {
        return subject;
      }
    }
    const match = title.match(/^(.*?)\s+(Full Mock|Mini Mock|Subject|Chapter|PYQ|Advanced)/i);
    return match?.[1] ? match[1].trim() : "Other";
  };

  const getCategory = (title: string): string => {
    if (/chapter/i.test(title)) return "Chapter Test";
    if (/advanced/i.test(title)) return "Advanced Subject Test";
    if (/subject/i.test(title) || /general intelligence|quantitative aptitude|english|reasoning/i.test(title)) {
      return "Subject Test";
    }
    if (/pyq/i.test(title)) return "PYQ";
    if (/mock/i.test(title)) return "Mock Test";
    return "Other";
  };

  const subjectChips = Array.from(
    new Set(["All", ...childTests.map((child) => extractSubject(child.title))]),
  );

  const filteredChildren = childTests.filter((child) => {
    const title = child.title.toLowerCase();
    if (viewFilter === "mock" && !/mock/i.test(title)) return false;
    if (viewFilter === "pyq" && !/pyq/i.test(title)) return false;
    if (searchQuery && !title.includes(searchQuery.toLowerCase())) return false;
    if (subjectFilter !== "All" && extractSubject(child.title) !== subjectFilter) return false;
    return true;
  });

  const categoryOrder = [
    "All",
    "Mock Test",
    "PYQ",
    "Chapter Test",
    "Subject Test",
    "Advanced Subject Test",
    "Other",
  ];

  const groupedChildren = categoryOrder
    .map((category) => ({
      category,
      items:
        category === "All"
          ? filteredChildren
          : filteredChildren.filter((child) => getCategory(child.title) === category),
    }))
    .filter((group) => group.items.length > 0 || group.category === "All");

  const visibleGroups = expandedGroups ? groupedChildren : groupedChildren.slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

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
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="text"
            placeholder="Search tests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-2/3 px-4 py-2 border rounded-lg"
          />
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleShare}>
              {copied ? "Copied!" : "Share"}
            </Button>
            <Button
              size="sm"
              variant={viewFilter === "all" ? "secondary" : "outline"}
              onClick={() => setViewFilter("all")}
            >
              All
            </Button>
            <Button
              size="sm"
              variant={viewFilter === "mock" ? "secondary" : "outline"}
              onClick={() => setViewFilter("mock")}
            >
              Mock
            </Button>
            <Button
              size="sm"
              variant={viewFilter === "pyq" ? "secondary" : "outline"}
              onClick={() => setViewFilter("pyq")}
            >
              PYQ
            </Button>
          </div>
        </div>

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
          <CardContent className="text-sm whitespace-pre-wrap">
            <div className={expandedDescription ? "" : "line-clamp-4"}>{exam.instructions}</div>
            <Button
              size="sm"
              variant="ghost"
              className="mt-3"
              onClick={() => setExpandedDescription((prev) => !prev)}
            >
              {expandedDescription ? "Show less" : "Show more"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-x-auto">
        <div className="flex gap-2 py-2 min-w-max">
          {subjectChips.map((subject) => (
            <button
              key={subject}
              type="button"
              onClick={() => setSubjectFilter(subject)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                subjectFilter === subject
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-300 bg-white text-slate-700"
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {visibleGroups.map((group) => (
        <Card key={group.category}>
          <CardHeader>
            <CardTitle className="text-base">{group.category}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {group.items.length > 0 ? (
              group.items.map((child) => (
                <div
                  key={child.id}
                  className={`rounded-md border p-4 ${
                    child.total_questions === 0
                      ? "border-slate-300 bg-slate-100 text-slate-500 opacity-80"
                      : "border-slate-200 bg-white"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-semibold">{child.title}</div>
                      <div className="text-sm text-muted-foreground">{child.exam_mode}</div>
                    </div>
                    <Button asChild size="sm" variant="outline" disabled={child.total_questions === 0}>
                      <Link to="/exams/$examId" params={{ examId: String(child.id) }}>
                        View
                      </Link>
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-sm mt-3">
                    <div>
                      <div className="text-muted-foreground text-xs">Duration</div>
                      <div className="font-medium">{formatDuration(child.duration_seconds)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Questions</div>
                      <div className="font-medium">{child.total_questions}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Total marks</div>
                      <div className="font-medium">{child.total_marks}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-md border border-slate-300 bg-slate-100 p-4 text-slate-500">
                No tests available in this category.
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {groupedChildren.length > 3 ? (
        <div className="flex justify-center">
          <Button size="sm" variant="outline" onClick={() => setExpandedGroups((prev) => !prev)}>
            {expandedGroups ? "Show less" : "Show more"}
          </Button>
        </div>
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
