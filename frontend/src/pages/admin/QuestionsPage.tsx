import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { chaptersApi, questionsApi, subjectsApi, type Question } from "@/lib/api";
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

const QTYPES = [
  "single_choice",
  "multiple_choice",
  "integer",
  "paragraph",
  "image",
  "math",
];

type FormState = {
  question_text: string;
  question_html: string;
  question_type: string;
  difficulty: string;
  subject_id: string;
  chapter_id: string;
  correct_answer: string;
  explanation: string;
  paragraph_text: string;
  image_url: string;
  marks: string;
  negative_marks: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
};

const emptyForm = (): FormState => ({
  question_text: "",
  question_html: "",
  question_type: "single_choice",
  difficulty: "medium",
  subject_id: "",
  chapter_id: "",
  correct_answer: "A",
  explanation: "",
  paragraph_text: "",
  image_url: "",
  marks: "2",
  negative_marks: "0.5",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
});

export function QuestionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const params = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("per_page", "15");
    p.set("include_answer", "true");
    p.set("active_only", "false");
    if (search) p.set("search", search);
    if (typeFilter !== "all") p.set("question_type", typeFilter);
    return p.toString();
  }, [page, search, typeFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["questions", params],
    queryFn: () => questionsApi.list(params),
  });
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list(),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState("");

  const { data: chapters } = useQuery({
    queryKey: ["chapters-for", form.subject_id],
    queryFn: () => chaptersApi.list(`subject_id=${form.subject_id}`),
    enabled: !!form.subject_id,
  });

  const buildPayload = () => {
    const options =
      form.question_type === "integer"
        ? []
        : [
            { option_key: "A", option_text: form.option_a },
            { option_key: "B", option_text: form.option_b },
            { option_key: "C", option_text: form.option_c },
            { option_key: "D", option_text: form.option_d },
          ].filter((o) => o.option_text.trim());

    let correct: string | string[] = form.correct_answer.trim();
    if (form.question_type === "multiple_choice") {
      correct = correct.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean);
    }

    return {
      question_text: form.question_text,
      question_html: form.question_html || null,
      question_type: form.question_type,
      difficulty: form.difficulty,
      subject_id: form.subject_id ? Number(form.subject_id) : null,
      chapter_id: form.chapter_id ? Number(form.chapter_id) : null,
      correct_answer: correct,
      explanation: form.explanation,
      paragraph_text: form.paragraph_text || null,
      image_url: form.image_url || null,
      marks: Number(form.marks) || 1,
      negative_marks: Number(form.negative_marks) || 0,
      options,
    };
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (editing) return questionsApi.update(editing.id, payload);
      return questionsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["questions"] });
      setOpen(false);
      setEditing(null);
      setForm(emptyForm());
    },
    onError: (e: any) => setError(e.message || "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => questionsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["questions"] }),
  });

  const openEdit = (q: Question) => {
    setEditing(q);
    const opts = Object.fromEntries((q.options || []).map((o) => [o.option_key, o.option_text]));
    setForm({
      question_text: q.question_text,
      question_html: q.question_html || "",
      question_type: q.question_type,
      difficulty: q.difficulty,
      subject_id: q.subject_id ? String(q.subject_id) : "",
      chapter_id: q.chapter_id ? String(q.chapter_id) : "",
      correct_answer: Array.isArray(q.correct_answer)
        ? q.correct_answer.join(",")
        : String(q.correct_answer ?? ""),
      explanation: q.explanation || "",
      paragraph_text: q.paragraph_text || "",
      image_url: q.image_url || "",
      marks: String(q.marks),
      negative_marks: String(q.negative_marks),
      option_a: opts.A || "",
      option_b: opts.B || "",
      option_c: opts.C || "",
      option_d: opts.D || "",
    });
    setError("");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Questions</h1>
          <p className="text-sm text-muted-foreground">Create and manage question bank</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm(emptyForm());
            setError("");
            setOpen(true);
          }}
        >
          Add Question
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Search…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={typeFilter}
          onValueChange={(v) => {
            setTypeFilter(v);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            {QTYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Question bank ({data?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading…</div>
          ) : (
            <div className="space-y-3">
              {(data?.items || []).map((q) => (
                <div key={q.id} className="border rounded-lg p-3 flex flex-wrap gap-3 justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2 mb-1">
                      <Badge variant="secondary">#{q.id}</Badge>
                      <Badge variant="outline">{q.question_type}</Badge>
                      <Badge variant="outline">{q.difficulty}</Badge>
                      <Badge variant="outline">
                        +{q.marks}/-{q.negative_marks}
                      </Badge>
                    </div>
                    <div className="text-sm font-medium line-clamp-2">{q.question_text}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {q.subject_name || "No subject"} · {q.chapter_name || "No chapter"} · Ans:{" "}
                      {Array.isArray(q.correct_answer)
                        ? q.correct_answer.join(",")
                        : q.correct_answer}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(q)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => confirm("Delete question?") && delMut.mutate(q.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">Page {page}</span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={(data?.items.length || 0) < 15}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit question" : "New question"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Question text</Label>
              <Textarea
                rows={3}
                value={form.question_text}
                onChange={(e) => setForm({ ...form, question_text: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Question HTML / MathJax (optional)</Label>
              <Textarea
                rows={2}
                value={form.question_html}
                onChange={(e) => setForm({ ...form, question_html: e.target.value })}
                placeholder={`e.g. If \\( x^2=4 \\), find x`}
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={form.question_type}
                onValueChange={(v) => setForm({ ...form, question_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QTYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) => setForm({ ...form, difficulty: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["easy", "medium", "hard"].map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject</Label>
              <Select
                value={form.subject_id || "none"}
                onValueChange={(v) =>
                  setForm({ ...form, subject_id: v === "none" ? "" : v, chapter_id: "" })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(subjects?.items || []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Chapter</Label>
              <Select
                value={form.chapter_id || "none"}
                onValueChange={(v) => setForm({ ...form, chapter_id: v === "none" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chapter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {(chapters?.items || []).map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {form.question_type !== "integer" ? (
              <>
                {(["a", "b", "c", "d"] as const).map((k) => (
                  <div key={k}>
                    <Label>Option {k.toUpperCase()}</Label>
                    <Input
                      value={form[`option_${k}`]}
                      onChange={(e) => setForm({ ...form, [`option_${k}`]: e.target.value })}
                    />
                  </div>
                ))}
              </>
            ) : null}
            <div>
              <Label>
                Correct answer{" "}
                {form.question_type === "multiple_choice" ? "(e.g. A,C)" : form.question_type === "integer" ? "(number)" : "(A/B/C/D)"}
              </Label>
              <Input
                value={form.correct_answer}
                onChange={(e) => setForm({ ...form, correct_answer: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Marks</Label>
                <Input value={form.marks} onChange={(e) => setForm({ ...form, marks: e.target.value })} />
              </div>
              <div>
                <Label>Negative</Label>
                <Input
                  value={form.negative_marks}
                  onChange={(e) => setForm({ ...form, negative_marks: e.target.value })}
                />
              </div>
            </div>
            {(form.question_type === "paragraph" || form.paragraph_text) && (
              <div className="sm:col-span-2">
                <Label>Paragraph / Passage</Label>
                <Textarea
                  value={form.paragraph_text}
                  onChange={(e) => setForm({ ...form, paragraph_text: e.target.value })}
                />
              </div>
            )}
            {(form.question_type === "image" || form.image_url) && (
              <div className="sm:col-span-2">
                <Label>Image URL</Label>
                <Input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                />
              </div>
            )}
            <div className="sm:col-span-2">
              <Label>Explanation</Label>
              <Textarea
                value={form.explanation}
                onChange={(e) => setForm({ ...form, explanation: e.target.value })}
              />
            </div>
            {error ? <p className="sm:col-span-2 text-sm text-red-600">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={!form.question_text || !form.correct_answer || saveMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
