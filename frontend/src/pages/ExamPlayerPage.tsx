import { useEffect, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { attemptsApi, type PlayerPayload } from "@/lib/api";
import { useExamPlayerStore } from "@/stores/examPlayerStore";
import { QuestionRenderer } from "@/components/exam/QuestionRenderer";
import { QuestionPalette } from "@/components/exam/QuestionPalette";
import { ExamTimer } from "@/components/exam/ExamTimer";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function ExamPlayerPage() {
  const params = useParams({ strict: false }) as { attemptId?: string };
  const id = Number(params.attemptId);
  const navigate = useNavigate();

  const loaded = useExamPlayerStore((s) => s.loaded);
  const loadFromPayload = useExamPlayerStore((s) => s.loadFromPayload);
  const reset = useExamPlayerStore((s) => s.reset);
  const showInstructions = useExamPlayerStore((s) => s.showInstructions);
  const startTimer = useExamPlayerStore((s) => s.startTimer);
  const examTitle = useExamPlayerStore((s) => s.examTitle);
  const instructions = useExamPlayerStore((s) => s.instructions);
  const getCurrent = useExamPlayerStore((s) => s.getCurrent);
  const currentGlobalIndex = useExamPlayerStore((s) => s.currentGlobalIndex);
  const flatQuestions = useExamPlayerStore((s) => s.flatQuestions);
  const next = useExamPlayerStore((s) => s.next);
  const prev = useExamPlayerStore((s) => s.prev);
  const selectAnswer = useExamPlayerStore((s) => s.selectAnswer);
  const toggleMark = useExamPlayerStore((s) => s.toggleMark);
  const clearResponse = useExamPlayerStore((s) => s.clearResponse);
  const openSubmit = useExamPlayerStore((s) => s.openSubmit);
  const closeSubmit = useExamPlayerStore((s) => s.closeSubmit);
  const showSubmitConfirm = useExamPlayerStore((s) => s.showSubmitConfirm);
  const submit = useExamPlayerStore((s) => s.submit);
  const submitting = useExamPlayerStore((s) => s.submitting);
  const summary = useExamPlayerStore((s) => s.summary);
  const recordSecurity = useExamPlayerStore((s) => s.recordSecurity);
  const result = useExamPlayerStore((s) => s.result);
  const storeAttemptId = useExamPlayerStore((s) => s.attemptId);
  const detectTabSwitch = useExamPlayerStore((s) => s.detectTabSwitch);
  const allowMarkForReview = useExamPlayerStore((s) => s.allowMarkForReview);
  const allowClearResponse = useExamPlayerStore((s) => s.allowClearResponse);
  const requireFullscreen = useExamPlayerStore((s) => s.requireFullscreen);
  const calculatorAllowed = useExamPlayerStore((s) => s.calculatorAllowed);
  const roughSheetAllowed = useExamPlayerStore((s) => s.roughSheetAllowed);
  const maxTabSwitches = useExamPlayerStore((s) => s.maxTabSwitches);
  const tabSwitches = useExamPlayerStore((s) => s.tabSwitches);
  const freeQuestionNavigation = useExamPlayerStore((s) => s.freeQuestionNavigation);

  const [bootError, setBootError] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (loaded && storeAttemptId === id) {
        setBooting(false);
        return;
      }
      try {
        reset();
        const data = await attemptsApi.get(id);
        if (cancelled) return;
        if ((data as any).sections) {
          loadFromPayload(data as PlayerPayload);
        } else if ((data as any).status && (data as any).status !== "in_progress") {
          navigate({ to: "/results/$attemptId", params: { attemptId: String(id) } });
          return;
        }
      } catch (e: any) {
        if (!cancelled) setBootError(e.message || "Failed to load attempt");
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Security listeners — driven by exam rules configuration
  useEffect(() => {
    if (showInstructions || !loaded) return;

    const onVis = () => {
      if (!detectTabSwitch) return;
      if (document.hidden) {
        recordSecurity("TAB_CHANGE", "Tab hidden").then((forced) => {
          if (forced) navigate({ to: "/results/$attemptId", params: { attemptId: String(id) } });
        });
      }
    };
    const onBlur = () => {
      if (!detectTabSwitch) return;
      recordSecurity("WINDOW_BLUR", "Window blur");
    };
    const onContext = (e: MouseEvent) => e.preventDefault();
    const onCopy = (e: ClipboardEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onContext);
    document.addEventListener("copy", onCopy);

    if (requireFullscreen && document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    }

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onContext);
      document.removeEventListener("copy", onCopy);
    };
  }, [showInstructions, loaded, id, detectTabSwitch, requireFullscreen]);

  useEffect(() => {
    if (result) {
      navigate({ to: "/results/$attemptId", params: { attemptId: String(id) } });
    }
  }, [result, id, navigate]);

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 text-sm text-slate-600">
        Preparing exam session…
      </div>
    );
  }
  if (bootError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6">
        <div className="max-w-md w-full bg-white border rounded-lg p-5 text-sm">
          <div className="font-semibold text-slate-900 mb-1">Unable to open exam</div>
          <div className="text-red-600">{bootError}</div>
        </div>
      </div>
    );
  }
  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-600">
        Exam session unavailable.
      </div>
    );
  }

  if (showInstructions) {
    return (
      <div className="min-h-screen bg-[#e8eaed] flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm max-w-2xl w-full overflow-hidden">
          <div className="bg-[#1b1f24] text-white px-5 py-3 text-sm font-semibold">{examTitle}</div>
          <div className="p-5 space-y-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Instructions
            </div>
            <div className="text-sm whitespace-pre-wrap bg-slate-50 border rounded-md p-4 max-h-72 overflow-auto leading-relaxed text-slate-700">
              {instructions || "Read all questions carefully. The timer starts when you begin."}
            </div>
            <ul className="text-[13px] space-y-1.5 text-slate-600 list-disc pl-5">
              <li>Answers are saved automatically when selected.</li>
              {detectTabSwitch ? (
                <li>
                  Tab switches are monitored
                  {maxTabSwitches ? ` (limit ${maxTabSwitches})` : ""}.
                </li>
              ) : null}
              {requireFullscreen ? <li>Fullscreen mode is required for this exam.</li> : null}
              {calculatorAllowed ? <li>Calculator is allowed.</li> : null}
              {roughSheetAllowed ? <li>Rough work is allowed offline.</li> : null}
              <li>The session auto-submits when time expires (if configured).</li>
            </ul>
            <Button className="w-full h-10" onClick={() => startTimer()}>
              Begin exam
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const current = getCurrent();
  const stats = summary();

  return (
    <div className="h-screen flex flex-col bg-[#e8eaed] exam-player-active select-none">
      <header className="h-12 bg-[#1b1f24] text-white flex items-center justify-between px-3 gap-3 shrink-0 border-b border-black/30">
        <div className="min-w-0">
          <div className="font-medium truncate text-sm">{examTitle}</div>
          <div className="text-[11px] text-slate-400">
            Q {currentGlobalIndex + 1} / {flatQuestions.length}
            {detectTabSwitch && tabSwitches > 0 ? (
              <span className="ml-2 text-amber-400">· focus alerts {tabSwitches}</span>
            ) : null}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {calculatorAllowed ? (
            <span className="hidden sm:inline text-[11px] text-slate-400 border border-white/10 rounded px-2 py-1">
              Calc allowed
            </span>
          ) : null}
          <ExamTimer />
          <Button variant="destructive" size="sm" className="h-8" onClick={openSubmit}>
            Submit
          </Button>
        </div>
      </header>

      <div className="flex-1 flex min-h-0">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 overflow-auto p-3 md:p-5">
            <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-lg shadow-sm p-4 md:p-5">
              {current ? (
                <>
                  <div className="flex flex-wrap items-center gap-1.5 mb-4">
                    <Badge variant="secondary" className="font-mono">
                      Q{currentGlobalIndex + 1}
                    </Badge>
                    <Badge variant="outline">{current.question.question_type}</Badge>
                    <Badge variant="outline">+{current.marks}</Badge>
                    {current.negative_marks ? (
                      <Badge variant="destructive">−{current.negative_marks}</Badge>
                    ) : null}
                    {current.answer.is_marked_for_review ? (
                      <Badge className="bg-blue-600">Review</Badge>
                    ) : null}
                  </div>
                  <QuestionRenderer
                    question={current.question}
                    selected={current.answer.selected_answer}
                    onChange={(v) => selectAnswer(v)}
                  />
                </>
              ) : (
                <div className="text-sm text-slate-500">No question loaded.</div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 bg-white p-2.5 flex flex-wrap gap-2 justify-between shrink-0">
            <div className="flex flex-wrap gap-2">
              {allowClearResponse ? (
                <Button variant="outline" size="sm" onClick={() => clearResponse()}>
                  Clear
                </Button>
              ) : null}
              {allowMarkForReview ? (
                <Button variant="secondary" size="sm" onClick={() => toggleMark()}>
                  Mark for review
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={prev} disabled={currentGlobalIndex <= 0}>
                Previous
              </Button>
              <Button
                size="sm"
                onClick={next}
                disabled={currentGlobalIndex >= flatQuestions.length - 1}
              >
                {freeQuestionNavigation ? "Save & next" : "Next"}
              </Button>
            </div>
          </div>
        </div>

        <aside className="hidden md:flex w-64 border-l border-slate-200 bg-white flex-col shrink-0">
          <QuestionPalette />
        </aside>
      </div>

      <div className="md:hidden border-t bg-white p-2 overflow-x-auto flex gap-1">
        {flatQuestions.map((q, i) => (
          <button
            key={q.question_id}
            type="button"
            className={`palette-btn shrink-0 ${
              i === currentGlobalIndex ? "palette-current palette-answered" : "palette-not-visited"
            }`}
            onClick={() => useExamPlayerStore.getState().goTo(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <Dialog open={showSubmitConfirm} onOpenChange={(o) => (!o ? closeSubmit() : openSubmit())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit exam?</DialogTitle>
            <DialogDescription>
              This action finalises your attempt. Answers cannot be changed afterwards.
            </DialogDescription>
          </DialogHeader>
          <div className="text-sm space-y-1 tabular-nums">
            <div className="flex justify-between border-b py-1">
              <span className="text-muted-foreground">Total</span>
              <span>{stats.total}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span className="text-muted-foreground">Answered</span>
              <span>{stats.answered}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span className="text-muted-foreground">Not answered</span>
              <span>{stats.notAnswered}</span>
            </div>
            <div className="flex justify-between border-b py-1">
              <span className="text-muted-foreground">Marked for review</span>
              <span>{stats.marked}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-muted-foreground">Not visited</span>
              <span>{stats.notVisited}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeSubmit}>
              Continue
            </Button>
            <Button
              variant="destructive"
              disabled={submitting}
              onClick={async () => {
                try {
                  await submit(false);
                  navigate({ to: "/results/$attemptId", params: { attemptId: String(id) } });
                } catch {
                  /* store holds error */
                }
              }}
            >
              {submitting ? "Submitting…" : "Confirm submit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
