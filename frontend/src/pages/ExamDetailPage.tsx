import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { attemptsApi, examsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatDuration } from "@/lib/utils";
import { useState, useMemo } from "react";
import { useExamPlayerStore } from "@/stores/examPlayerStore";

/* ───────────────────────────────────────────
   Helpers
   ─────────────────────────────────────────── */

function sectionTimerNote(exam: any) {
  const rules = exam?.resolved_rules;
  const sectionTimers = Boolean(rules?.timing?.section_timers);
  const hasSectionDurations = (exam?.sections || []).some(
    (s: any) => s.duration_seconds
  );
  if (sectionTimers || hasSectionDurations) {
    return "This paper uses sectional timing (per-section clocks) plus an overall limit.";
  }
  return "Single overall timer for the full paper.";
}

/** Categorize a child test by its title */
function categorize(title: string): string {
  if (/^Full Mock\s+\d+$/i.test(title)) return "full-mock";
  if (/^Mini Mock\s+\d+$/i.test(title)) return "mini-mock";
  // Chapter tests have "Subject — Chapter" format
  if (title.includes(" — ")) return "chapter";
  // Subject tests are just the subject name
  return "subject";
}

/** Extract subject from title */
function extractSubject(title: string): string {
  const idx = title.indexOf(" — ");
  return idx > -1 ? title.substring(0, idx) : title;
}

/* ───────────────────────────────────────────
   Component
   ─────────────────────────────────────────── */

export function ExamDetailPage() {
  const params = useParams({ strict: false }) as { examId?: string };
  const id = Number(params.examId);
  const navigate = useNavigate();
  const loadFromPayload = useExamPlayerStore((s) => s.loadFromPayload);
  const reset = useExamPlayerStore((s) => s.reset);

  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "chapter" | "subject" | "full-mock" | "mini-mock">("all");
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [showMoreOverview, setShowMoreOverview] = useState(false);
  const [showMoreDesc, setShowMoreDesc] = useState(false);
  const [showMoreItems, setShowMoreItems] = useState(8); // show 8 items initially

  const { data: exam, isLoading } = useQuery({
    queryKey: ["exam", id],
    queryFn: () => examsApi.get(id),
    enabled: Number.isFinite(id),
  });

  const start = async (childId?: number) => {
    setStarting(true);
    setError("");
    try {
      reset();
      const targetId = childId ?? id;
      const payload = await attemptsApi.start(targetId);
      loadFromPayload(payload);
      navigate({
        to: "/play/$attemptId",
        params: { attemptId: String(payload.attempt.id) },
      });
    } catch (e: any) {
      setError(e.message || "Failed to start exam");
    } finally {
      setStarting(false);
    }
  };

  // ── computed ────────────────────────────
  const children = (exam?.children || []) as any[];

  // Unique subjects from children
  const subjects = useMemo(() => {
    const set = new Set<string>();
    children.forEach((c) => {
      const s = extractSubject(c.title);
      if (s) set.add(s);
    });
    return Array.from(set);
  }, [children]);

  // Filtered children
  const filtered = useMemo(() => {
    let items = children;

    // Tab filter
    if (activeTab !== "all") {
      items = items.filter((c) => categorize(c.title) === activeTab);
    }

    // Subject filter
    if (activeSubject) {
      items = items.filter((c) => extractSubject(c.title) === activeSubject);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          (c.description || "").toLowerCase().includes(q)
      );
    }

    return items;
  }, [children, activeTab, activeSubject, search]);

  const displayed = filtered.slice(0, showMoreItems);
  const hasMore = filtered.length > showMoreItems;

  // Counts per tab
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: children.length };
    children.forEach((c) => {
      const cat = categorize(c.title);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [children]);

  // ── render ──────────────────────────────
  if (isLoading || !exam)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground text-lg">
          Loading…
        </div>
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Top Bar: Back + Search + Share ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/exams"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
        >
          ← Back to Exams
        </Link>
        <div className="flex-1" />
        <div className="relative w-full sm:w-64">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <Input
            placeholder="Search tests…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowMoreItems(8);
            }}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
          }}
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share
        </Button>
      </div>

      {/* ── Title ── */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">{exam.title}</h1>
        <div className="flex gap-2 mt-2">
          <Badge variant="secondary">{exam.exam_mode}</Badge>
          <Badge variant="outline">{exam.status}</Badge>
        </div>
      </div>

      {/* ── Overview & Instructions ── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Overview & Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{sectionTimerNote(exam as any)}</p>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">
                {exam.total_questions || children.length}
              </div>
              <div className="text-xs">Total Tests</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">
                {(exam.sections || []).length}
              </div>
              <div className="text-xs">Sections</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">
                {tabCounts["full-mock"] || 0}
              </div>
              <div className="text-xs">Full Mocks</div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <div className="text-lg font-semibold text-foreground">
                {subjects.length}
              </div>
              <div className="text-xs">Subjects</div>
            </div>
          </div>

          {/* Instructions with expand */}
          {exam.instructions && (
            <div>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-primary"
                onClick={() => setShowMoreOverview(!showMoreOverview)}
              >
                {showMoreOverview ? "Show Less ▲" : "Show More ▼"}
              </Button>
              {showMoreOverview && (
                <div className="mt-2 whitespace-pre-wrap bg-muted/30 rounded-lg p-3 text-xs leading-relaxed">
                  {exam.instructions}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Mock Test / PYQ Filter Tabs ── */}
      <div className="flex gap-2">
        <Button
          variant={activeTab === "full-mock" || activeTab === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setActiveTab(activeTab === "full-mock" ? "all" : "full-mock")}
        >
          Mock Tests ({tabCounts["full-mock"] || 0})
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled
          className="opacity-50"
        >
          PYQ (Coming Soon)
        </Button>
      </div>

      {/* ── Horizontal Subject Scroll ── */}
      {subjects.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          <Button
            variant={!activeSubject ? "default" : "outline"}
            size="sm"
            className="whitespace-nowrap shrink-0"
            onClick={() => setActiveSubject(null)}
          >
            All Subjects
          </Button>
          {subjects.map((s) => (
            <Button
              key={s}
              variant={activeSubject === s ? "default" : "outline"}
              size="sm"
              className="whitespace-nowrap shrink-0"
              onClick={() =>
                setActiveSubject(activeSubject === s ? null : s)
              }
            >
              {s}
            </Button>
          ))}
        </div>
      )}

      {/* ── Main Tabs: All | Chapter Test | Subject Test | Advanced ── */}
      <div className="flex gap-1 border-b pb-0">
        {[
          { key: "all", label: "All" },
          { key: "chapter", label: "Chapter Test" },
          { key: "subject", label: "Subject Test" },
          { key: "full-mock", label: "Full Mock" },
          { key: "mini-mock", label: "Mini Mock" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              setShowMoreItems(8);
            }}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === tab.key
                ? "bg-background border border-b-background text-foreground -mb-[1px]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-muted-foreground">
              ({tabCounts[tab.key === "all" ? "all" : tab.key] || 0})
            </span>
          </button>
        ))}
      </div>

      {/* ── Test Cards Grid ── */}
      {displayed.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <svg
            className="w-12 h-12 mx-auto mb-3 opacity-30"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>No tests found matching your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayed.map((child: any) => {
            const cat = categorize(child.title);
            const icon =
              cat === "full-mock"
                ? "📝"
                : cat === "mini-mock"
                ? "⚡"
                : cat === "chapter"
                ? "📖"
                : "📘";

            return (
              <Card
                key={child.id}
                className="group hover:shadow-md transition-shadow cursor-pointer border hover:border-primary/30"
                onClick={() => start(child.id)}
              >
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm truncate">
                        {icon} {child.title}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                        {child.description || ""}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 text-[10px]">
                      {child.status}
                    </Badge>
                  </div>
                  <div className="flex gap-3 text-xs text-muted-foreground pt-1 border-t">
                    {child.duration_seconds > 0 && (
                      <span>⏱ {formatDuration(child.duration_seconds)}</span>
                    )}
                    {child.total_questions > 0 && (
                      <span>📋 {child.total_questions} Q</span>
                    )}
                    {child.total_marks > 0 && (
                      <span>⭐ {child.total_marks} M</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Show More / Show Less ── */}
      {hasMore && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            onClick={() => setShowMoreItems((p) => p + 8)}
          >
            Show More ({filtered.length - displayed.length} remaining)
          </Button>
        </div>
      )}
      {!hasMore && filtered.length > 8 && (
        <div className="text-center pt-2">
          <Button
            variant="outline"
            onClick={() => setShowMoreItems(8)}
          >
            Show Less
          </Button>
        </div>
      )}

      {/* ── Description with Show More/Less ── */}
      {exam.description && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Description</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p
              className={`text-sm text-muted-foreground whitespace-pre-wrap ${
                !showMoreDesc ? "line-clamp-3" : ""
              }`}
            >
              {exam.description}
            </p>
            {exam.description.length > 150 && (
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto text-primary"
                onClick={() => setShowMoreDesc(!showMoreDesc)}
              >
                {showMoreDesc ? "Show Less ▲" : "Show More ▼"}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Error toast ── */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground px-4 py-2 rounded-lg shadow-lg text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
