import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Stats = {
  total_file_questions: number;
  stats: {
    total: number;
    by_subject: Record<string, number>;
    by_chapter: Record<string, number>;
    by_topic: Record<string, number>;
    by_difficulty: Record<string, number>;
  };
};

export function FileBankPage() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const { data: statsData, isLoading } = useQuery({
    queryKey: ["file-bank-stats"],
    queryFn: () => api.get<Stats>("/exams/file-bank/stats"),
  });

  const stats = statsData?.stats;
  const total = statsData?.total_file_questions || 0;

  const createTest = async (test_type: string, filters: any = {}) => {
    setBusy(test_type + JSON.stringify(filters));
    setError("");
    setResult(null);
    try {
      const payload: any = {
        test_type,
        count: filters.count || 20,
        ...filters,
      };
      const res = await api.post<any>("/exams/import-from-files", payload);
      setResult(res);
      qc.invalidateQueries({ queryKey: ["exams"] });
    } catch (e: any) {
      setError(e.message || "Failed to create test");
    } finally {
      setBusy(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 text-sm">Loading file bank stats...</div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          File Bank - Real Test Creator 🧠
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Code ke sath jo txt file dali hai `questions_data/`, usse AI chapter wise / topic wise / full mock test banayega. Real SSC jaisa.
        </p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-2xl font-bold">{stats?.total || total}</div>
          <div className="text-[11px] text-muted-foreground">Total File Questions</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-lg font-bold">{Object.keys(stats?.by_chapter || {}).length}</div>
          <div className="text-[11px] text-muted-foreground">Chapters</div>
          <div className="text-[10px] truncate">{Object.keys(stats?.by_chapter || {}).join(", ")}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-lg font-bold">{Object.keys(stats?.by_topic || {}).length}</div>
          <div className="text-[11px] text-muted-foreground">Topics</div>
          <div className="text-[10px] truncate">{Object.keys(stats?.by_topic || {}).slice(0,3).join(", ")}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4">
          <div className="text-lg font-bold">{Object.keys(stats?.by_subject || {}).length}</div>
          <div className="text-[11px] text-muted-foreground">Subjects</div>
          <div className="text-[10px] truncate">{Object.keys(stats?.by_subject || {}).join(", ")}</div>
        </div>
      </div>

      {/* Chapter wise breakdown */}
      {stats?.by_chapter && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Chapter wise Questions</h3>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_chapter).map(([chap, count]) => (
              <div key={chap} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
                <span className="font-medium">{chap}</span>
                <Badge variant="secondary" className="text-[10px]">{count as any}</Badge>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => createTest("chapter_wise", { chapter: chap, count: 20 })} disabled={!!busy}>
                  Create 20Q Test
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topic wise */}
      {stats?.by_topic && (
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h3 className="text-sm font-semibold">Topic wise - Real SSC Pattern</h3>
          <p className="text-[11px] text-muted-foreground">Number Analogy, Word Analogy, SI Units jaise topics</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.by_topic).slice(0,12).map(([topic, count]) => (
              <div key={topic} className="flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs">
                <span className="font-medium truncate max-w-[120px]">{topic}</span>
                <Badge variant="secondary" className="text-[10px]">{count as any}</Badge>
                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px]" onClick={() => createTest("topic_wise", { topic, count: 15 })} disabled={!!busy}>
                  15Q
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick create buttons - Real test jaisa */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <h3 className="text-sm font-semibold">Quick Create - Real Test Jaisa</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Button onClick={() => createTest("chapter_wise", { chapter: "Analogy", count: 20, title: "Analogy Chapter Test - 20 Qs" })} disabled={!!busy} className="rounded-xl justify-start gap-2 h-auto py-3">
            <span className="text-lg">📚</span><div className="text-left"><div className="text-sm font-semibold">Analogy Chapter Test</div><div className="text-[11px] opacity-80">20 Qs - Chapter wise</div></div>
          </Button>
          <Button onClick={() => createTest("topic_wise", { topic: "Number Analogy", count: 15, title: "Number Analogy Topic Test" })} disabled={!!busy} variant="outline" className="rounded-xl justify-start gap-2 h-auto py-3">
            <span className="text-lg">🔢</span><div className="text-left"><div className="text-sm font-semibold">Number Analogy Topic Test</div><div className="text-[11px] opacity-80">15 Qs - Topic wise</div></div>
          </Button>
          <Button onClick={() => createTest("subject_wise", { subject: "Reasoning", count: 50, title: "Reasoning Subject Test - 50 Qs" })} disabled={!!busy} variant="outline" className="rounded-xl justify-start gap-2 h-auto py-3">
            <span className="text-lg">🧠</span><div className="text-left"><div className="text-sm font-semibold">Reasoning Subject Test</div><div className="text-[11px] opacity-80">50 Qs - Subject wise</div></div>
          </Button>
          <Button onClick={() => createTest("full_mock", { count: 100, title: "SSC Full Mock - 100 Qs" })} disabled={!!busy} className="rounded-xl justify-start gap-2 h-auto py-3 bg-violet-600 hover:bg-violet-700 text-white">
            <span className="text-lg">🎯</span><div className="text-left"><div className="text-sm font-semibold">Full Mock - 100 Qs</div><div className="text-[11px] opacity-80">Real SSC pattern</div></div>
          </Button>
        </div>
      </div>

      {busy && <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 text-sm">Creating {busy}... AI questions ko test me daal raha hai...</div>}
      {error && <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{error}</div>}
      {result && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
          <h3 className="font-bold text-emerald-700">✅ Test Ban Gaya! - {result.test_type}</h3>
          <p className="text-sm text-emerald-600">{result.message}</p>
          <div className="text-xs">Exam ID: {result.exam_id} · {result.questions_added} questions stored (pool)</div>
          <div className="flex flex-wrap gap-2 text-[11px]">
            {typeof result.answers_from_file === "number" && (
              <Badge variant="secondary" className="text-[10px]">📄 File answers: {result.answers_from_file}</Badge>
            )}
            {typeof result.answers_from_ai === "number" && result.answers_from_ai > 0 && (
              <Badge variant="secondary" className="text-[10px]">🧠 AI answers: {result.answers_from_ai}</Badge>
            )}
            {typeof result.skipped_no_answer === "number" && result.skipped_no_answer > 0 && (
              <Badge variant="secondary" className="text-[10px] bg-amber-100">⚠️ Skipped (no answer): {result.skipped_no_answer}</Badge>
            )}
            <Badge variant="secondary" className="text-[10px] bg-emerald-100">🔁 No-repeat ON</Badge>
          </div>
          <p className="text-[11px] text-emerald-700/80">
            Ek baar bana — sabhi users ko yahi milega. Har attempt me real-paper jitne hi questions aate hain, aur pehle sahi kiye questions dobara nahi aate.
          </p>
          <div className="flex gap-2">
            <a href={`/exams/${result.exam_id}`}><Button size="sm" className="rounded-xl">View Test</Button></a>
            <a href="/exams"><Button size="sm" variant="outline" className="rounded-xl">Go to Exams</Button></a>
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-muted/20 p-4 text-[11px] text-muted-foreground">
        <p><b>Kaise kaam karta hai?</b> Backend me `questions_data/` folder me jo txt file dali hai, AI usko padh ke subject/chapter/topic samajhta hai (Gemini/DeepSeek free se). Phir jab tu Chapter wise ya Topic wise button dabata hai, to us chapter/topic ke questions filter karke naya exam bana deta hai - real SSC jaisa.</p>
      </div>
    </div>
  );
}
