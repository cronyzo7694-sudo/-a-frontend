import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { examsApi, questionsApi, type Exam } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDuration } from "@/lib/utils";

export function AdminExamsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-exams"],
    queryFn: () => examsApi.list("parent_id=null"),
  });

  const [open, setOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    instructions: "",
    exam_mode: "mock",
    duration_minutes: "30",
    default_marks: "2",
    default_negative_marks: "0.5",
    /** Overall paper timer always set via duration_minutes */
    section_timers: false,
    section_duration_minutes: "15",
    strict_sections: false,
  });
  const [sectionTitle, setSectionTitle] = useState("General");
  const [selectedQids, setSelectedQids] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [timerHelpOpen, setTimerHelpOpen] = useState(false);

  const { data: allQuestions } = useQuery({
    queryKey: ["questions-assign"],
    queryFn: () => questionsApi.list("per_page=100&include_answer=false"),
    enabled: assignOpen,
  });

  const { data: examDetail, refetch: refetchDetail } = useQuery({
    queryKey: ["exam-detail", activeExam?.id],
    queryFn: () => examsApi.get(activeExam!.id, true),
    enabled: !!activeExam && assignOpen,
  });

  const createMut = useMutation({
    mutationFn: async () => {
      const overallSec = Math.max(1, Number(form.duration_minutes) || 30) * 60;
      const sectionSec = form.section_timers
        ? Math.max(1, Number(form.section_duration_minutes) || 15) * 60
        : null;
      const res = await examsApi.create({
        title: form.title,
        description: form.description,
        instructions: form.instructions,
        exam_mode: form.exam_mode,
        duration_seconds: overallSec,
        default_marks: Number(form.default_marks),
        default_negative_marks: Number(form.default_negative_marks),
        strict_sections: form.strict_sections,
        status: "draft",
        // Rule engine pack — sectional timer + strict lock without hardcoding in player
        rules: {
          timing: {
            overall_seconds: overallSec,
            section_timers: form.section_timers,
            auto_submit_on_expiry: true,
            section_auto_submit_on_expiry: true,
          },
          sections: {
            strict_order: form.strict_sections,
            lock_on_complete: form.strict_sections,
            lock_on_timer_expiry: form.section_timers,
            allow_previous_section: !form.strict_sections,
            allow_next_section: true,
          },
        },
        sections: [
          {
            title: sectionTitle || "Section 1",
            order_index: 0,
            duration_seconds: sectionSec,
          },
        ],
      });
      return res.item;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
      setOpen(false);
      setForm({
        title: "",
        description: "",
        instructions: "",
        exam_mode: "mock",
        duration_minutes: "30",
        default_marks: "2",
        default_negative_marks: "0.5",
        section_timers: false,
        section_duration_minutes: "15",
        strict_sections: false,
      });
    },
    onError: (e: any) => setError(e.message || "Create failed"),
  });

  const publishMut = useMutation({
    mutationFn: (id: number) => examsApi.publish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-exams"] }),
  });
  const unpublishMut = useMutation({
    mutationFn: (id: number) => examsApi.unpublish(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-exams"] }),
  });
  const delMut = useMutation({
    mutationFn: (id: number) => examsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-exams"] }),
  });

  const assignMut = useMutation({
    mutationFn: async () => {
      if (!activeExam) throw new Error("No exam");
      const sectionId = examDetail?.sections?.[0]?.id;
      return examsApi.assignQuestions(activeExam.id, {
        question_ids: selectedQids,
        section_id: sectionId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
      refetchDetail();
      setSelectedQids([]);
    },
    onError: (e: any) => setError(e.message || "Assign failed"),
  });

  const removeEqMut = useMutation({
    mutationFn: (eqId: number) => examsApi.removeQuestion(activeExam!.id, eqId),
    onSuccess: () => refetchDetail(),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
<div>
        <h1 className="text-xl font-semibold tracking-tight">Manage exams</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Create papers, set timers, assign bank questions, publish
        </p>
      </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTimerHelpOpen(true)}>
            Timer help
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setError("");
              setOpen(true);
            }}
          >
            Create exam
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Exams</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {isLoading ? (
            <div>Loading…</div>
          ) : (
            (data?.items || []).map((exam) => (
              <div key={exam.id} className="border rounded-lg p-4 flex flex-wrap gap-3 justify-between">
                <div>
                  <div className="font-semibold">{exam.title}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge variant={exam.status === "published" ? "success" : "secondary"}>
                      {exam.status}
                    </Badge>
                    <Badge variant="outline">{exam.exam_mode}</Badge>
                    <Badge variant="outline">{exam.total_questions} Q</Badge>
                    <Badge variant="outline">{formatDuration(exam.duration_seconds)}</Badge>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setActiveExam(exam);
                      setSelectedQids([]);
                      setError("");
                      setAssignOpen(true);
                    }}
                  >
                    Assign Qs
                  </Button>
                  {exam.status === "published" ? (
                    <Button size="sm" variant="secondary" onClick={() => unpublishMut.mutate(exam.id)}>
                      Unpublish
                    </Button>
                  ) : (
                    <Button size="sm" variant="success" onClick={() => publishMut.mutate(exam.id)}>
                      Publish
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => confirm("Delete exam?") && delMut.mutate(exam.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create exam</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div>
              <Label>Instructions</Label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              />
            </div>
            <div>
              <Label>First section title</Label>
              <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Mode</Label>
                <Select
                  value={form.exam_mode}
                  onValueChange={(v) => setForm({ ...form, exam_mode: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["mock", "practice", "sectional", "pyq", "live"].map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Overall time (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })}
                />
                <p className="text-[11px] text-slate-500 mt-1">Full paper countdown for the student</p>
              </div>
              <div>
                <Label>Default marks / Q</Label>
                <Input
                  value={form.default_marks}
                  onChange={(e) => setForm({ ...form, default_marks: e.target.value })}
                />
              </div>
              <div>
                <Label>Default negative</Label>
                <Input
                  value={form.default_negative_marks}
                  onChange={(e) => setForm({ ...form, default_negative_marks: e.target.value })}
                />
              </div>
            </div>

            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Timer mode (admin sets · student only sees clock)
              </div>
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.section_timers}
                  onChange={(e) => setForm({ ...form, section_timers: e.target.checked })}
                />
                <span>
                  <span className="font-medium">Sectional timers</span>
                  <span className="block text-xs text-slate-500">
                    Each section gets its own countdown (SSC-style optional). First section minutes
                    below; add more sections later with their own duration.
                  </span>
                </span>
              </label>
              {form.section_timers ? (
                <div>
                  <Label>First section time (minutes)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.section_duration_minutes}
                    onChange={(e) =>
                      setForm({ ...form, section_duration_minutes: e.target.value })
                    }
                  />
                </div>
              ) : null}
              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={form.strict_sections}
                  onChange={(e) => setForm({ ...form, strict_sections: e.target.checked })}
                />
                <span>
                  <span className="font-medium">Strict section lock</span>
                  <span className="block text-xs text-slate-500">
                    Student cannot go back to a finished section (typical bank/SSC CBT).
                  </span>
                </span>
              </label>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={!form.title || createMut.isPending} onClick={() => createMut.mutate()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign questions — {activeExam?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold mb-2">
                Currently assigned ({examDetail?.total_questions ?? 0})
              </div>
              <div className="space-y-1 max-h-40 overflow-auto border rounded-md p-2">
                {(examDetail?.sections || []).flatMap((s) =>
                  (s.questions || []).map((eq) => (
                    <div key={eq.id} className="flex justify-between text-xs gap-2 py-1 border-b">
                      <span className="truncate">
                        #{eq.question_id} {eq.question?.question_text}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => removeEqMut.mutate(eq.id)}>
                        Remove
                      </Button>
                    </div>
                  )),
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-semibold mb-2">Pick questions to add</div>
              <div className="space-y-1 max-h-60 overflow-auto border rounded-md p-2">
                {(allQuestions?.items || []).map((q) => {
                  const checked = selectedQids.includes(q.id);
                  return (
                    <label
                      key={q.id}
                      className="flex items-start gap-2 text-sm py-1 border-b cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedQids((prev) =>
                            checked ? prev.filter((x) => x !== q.id) : [...prev, q.id],
                          )
                        }
                      />
                      <span className="min-w-0">
                        <Badge variant="outline" className="mr-1">
                          {q.question_type}
                        </Badge>
                        #{q.id} {q.question_text}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignOpen(false)}>
              Close
            </Button>
            <Button
              disabled={selectedQids.length === 0 || assignMut.isPending}
              onClick={() => assignMut.mutate()}
            >
              Assign {selectedQids.length || ""} selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={timerHelpOpen} onOpenChange={setTimerHelpOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>How timers work</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
            <div>
              <div className="font-semibold text-slate-900">1. Overall timer</div>
              <p>
                Admin sets <em>Overall time (minutes)</em> on the exam. That becomes one big countdown
                for the whole paper. Student sees it top-right while attempting. At 0:00 the attempt
                auto-submits (if rules allow).
              </p>
            </div>
            <div>
              <div className="font-semibold text-slate-900">2. Sectional timer</div>
              <p>
                Tick <em>Sectional timers</em> and set minutes per section. Each section then has its
                own clock. When a section&apos;s time ends, that section can lock and the next opens
                (config-driven). Used in many SSC/Banking multi-section papers.
              </p>
            </div>
            <div>
              <div className="font-semibold text-slate-900">3. Who controls what?</div>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  <strong>Admin</strong> — creates exam, sets overall + optional section minutes,
                  strict lock, marks, negative marking, assign questions, publish.
                </li>
                <li>
                  <strong>Student / guest</strong> — only sees running clocks; cannot change limits.
                </li>
              </ul>
            </div>
            <div>
              <div className="font-semibold text-slate-900">4. Both together?</div>
              <p>
                Yes. Overall is the hard stop for the paper. Section clocks are extra limits inside
                it. When overall hits zero, everything ends regardless of section time left.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setTimerHelpOpen(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
