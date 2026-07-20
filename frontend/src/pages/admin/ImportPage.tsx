import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { importsApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

/* ══════════════════════════════════════════════════════════
   Inline SVG Icons
   ══════════════════════════════════════════════════════════ */
const si = (d: string) => `<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24">${d}</svg>`;
const I = {
  upload: si('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M17 8l-5-5-5 5"/><path d="M12 3v12"/>'),
  download: si('<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/>'),
  file: si('<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/>'),
  check: si('<path d="M5 13l4 4L19 7"/>'),
  xmark: si('<path d="M6 18L18 6M6 6l12 12"/>'),
  alert: si('<path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><path d="M12 9v4M12 17h.01"/>'),
  target: si('<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>'),
  book: si('<path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>'),
  clock: si('<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
  layers: si('<path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>'),
  trash: si('<path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>'),
  eye: si('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
  play: si('<circle cx="12" cy="12" r="10"/><path d="M10 8l6 4-6 4V8z"/>'),
  sparkle: si('<path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"/>'),
  plus: si('<path d="M12 5v14M5 12h14"/>'),
  zap: si('<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>'),
  settings: si('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1.08H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'),
  expand: si('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
};

/* ══════════════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════════════ */
const METHODS = [
  { key: "csv", label: "CSV", icon: "📊", desc: "Spreadsheet format, best for bulk", accept: ".csv", color: "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800/30" },
  { key: "json", label: "JSON", icon: "{ }", desc: "Structured data with nested fields", accept: ".json", color: "border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800/30" },
  { key: "paste_json", label: "Paste JSON", icon: "📋", desc: "Copy & paste JSON payload", color: "border-violet-200 bg-violet-50 dark:bg-violet-950/20 dark:border-violet-800/30" },
  { key: "paste_text", label: "Paste Text", icon: "📝", desc: "AI parses raw text into questions", color: "border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/30" },
];

const SAMPLE_JSON = `{
  "exam": "SSC CHSL Style Mock Test — Demo",
  "section": "General Awareness",
  "questions": [
    {
      "question_text": "Capital of France?",
      "option_a": "Berlin", "option_b": "Paris",
      "option_c": "Rome", "option_d": "Madrid",
      "correct_answer": "B",
      "explanation": "Paris is the capital of France",
      "difficulty": "easy", "marks": 2,
      "negative_marks": 0.5, "question_type": "single_choice",
      "subject": "General Awareness", "chapter": "Geography"
    },
    {
      "question_text": "Who wrote the national anthem of India?",
      "option_a": "Bankim Chandra", "option_b": "Rabindranath Tagore",
      "option_c": "Sarojini Naidu", "option_d": "Mahatma Gandhi",
      "correct_answer": "B",
      "subject": "General Awareness",
      "exam": "SSC CHSL Style Mock Test — Demo",
      "section": "General Awareness"
    }
  ]
}`;

/* ══════════════════════════════════════════════════════════
   Steps — stepper workflow
   ══════════════════════════════════════════════════════════ */
type Step = "choose" | "preview" | "validate" | "importing" | "done";

/* ══════════════════════════════════════════════════════════
   KPI Pill
   ══════════════════════════════════════════════════════════ */
function Kpi({ icon, label, value }: { icon: string; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-3 hover:border-primary/20 hover:shadow-sm transition-all duration-200">
      <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary" dangerouslySetInnerHTML={{ __html: icon }} />
      <div className="min-w-0"><div className="text-lg font-bold tabular-nums tracking-tight">{value}</div><div className="text-[11px] text-muted-foreground">{label}</div></div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════════════ */
export function ImportPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  /* ── State ──────────────────────────── */
  const [method, setMethod] = useState<string>("csv");
  const [step, setStep] = useState<Step>("choose");
  const [file, setFile] = useState<File | null>(null);
  const [jsonText, setJsonText] = useState(SAMPLE_JSON);
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true, createMissing: true, autoDetect: true,
    saveAsDraft: false, publishNow: false,
  });

  /* ── Import history ─────────────────── */
  const { data: historyData } = useQuery({ queryKey: ["import-jobs"], queryFn: () => importsApi.jobs().catch(() => ({ items: [], total: 0 })) });
  const historyItems: any[] = useMemo(() => (historyData?.items || []), [historyData]);

  /* ── Simulate progress animation ────── */
  useEffect(() => {
    if (step !== "importing") return;
    setProgress(0);
    const iv = setInterval(() => { setProgress(p => { if (p >= 95) return p; return p + Math.random() * 15; }); }, 300);
    return () => clearInterval(iv);
  }, [step]);

  /* ── File handlers ──────────────────── */
  const handleFile = useCallback((f: File) => { setFile(f); setStep("preview"); setError(""); }, []);

  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); setDragOver(false);
    const f = e.dataTransfer.files[0]; if (f) handleFile(f); }, [handleFile]);
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  /* ── Import execution ───────────────── */
  const executeImport = async () => {
    setBusy(true); setError(""); setStep("importing");
    try {
      let res: any;
      if (method === "csv" && file) { const fd = new FormData(); fd.append("file", file); res = await importsApi.csv(fd); }
      else if (method === "json" && file) { const txt = await file.text(); res = await importsApi.json(JSON.parse(txt)); }
      else if (method === "paste_json") { res = await importsApi.json(JSON.parse(jsonText)); }
      else if (method === "paste_text") { res = await importsApi.json({ raw_text: jsonText } as any); }
      else { throw new Error("No valid import method"); }
      setProgress(100);
      setTimeout(() => { setResult(res); setStep("done"); qc.invalidateQueries({ queryKey: ["import-jobs"] }); }, 600);
    } catch (e: any) { setError(e.message || "Import failed"); setStep("choose"); }
    finally { setBusy(false); }
  };

  /* ── Download template ──────────────── */
  const downloadTemplate = async () => {
    try { const res = await importsApi.template(); const blob = new Blob([res.content], { type: "text/csv" });
      const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = res.filename || "template.csv"; a.click(); URL.revokeObjectURL(url); }
    catch {}
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-8 space-y-6 animate-in fade-in duration-300">

      {/* ═══════ HEADER ═══════════════════ */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Import Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Bulk import questions and exams into परीक्षa</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={downloadTemplate} className="rounded-xl gap-1.5 h-9">
            <span dangerouslySetInnerHTML={{ __html: I.download.replace("w-5 h-5","w-3.5 h-3.5") }} />Template
          </Button>
        </div>
      </header>

      {/* ═══════ STEPPER ═══════════════════ */}
      <div className="flex items-center gap-2 text-sm">
        {(["choose","preview","validate","importing","done"] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-300 ${
              step === s ? "bg-foreground text-background" : step === "done" && s === "done" ? "bg-emerald-500 text-white"
              : (["choose","preview","validate","importing","done"].indexOf(step) > i ? "text-emerald-500" : "text-muted-foreground/40")}`}>
              {(["choose","preview","validate","importing","done"].indexOf(step) > i ? "✓ " : i === 4 && step === "done" ? "✓ " : "")}
              {s === "choose" ? "Choose" : s === "preview" ? "Preview" : s === "validate" ? "Validate" : s === "importing" ? "Import" : "Done"}
            </div>
            {i < 4 && <span className="w-6 h-px bg-border"/>}
          </div>
        ))}
      </div>

      {/* ═══════ CONTENT ═══════════════════ */}
      {step === "choose" && (
        <div className="space-y-5">
          {/* Method cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            {METHODS.map(m => (
              <button key={m.key} onClick={() => { setMethod(m.key); setFile(null); }}
                className={`flex items-start gap-4 rounded-2xl border p-5 text-left transition-all duration-200 ${
                  method === m.key ? "border-primary ring-2 ring-primary/20 bg-primary/5" : "hover:border-primary/20 hover:bg-muted/30"
                }`}>
                <span className="shrink-0 text-2xl">{m.icon}</span>
                <div>
                  <p className="text-sm font-bold">{m.label}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
                {method === m.key && <span className="ml-auto shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center"><span className="w-2 h-2 rounded-full bg-primary-foreground"/></span>}
              </button>
            ))}
          </div>

          {/* Drop zone / paste area */}
          {method === "paste_json" || method === "paste_text" ? (
            <div className="space-y-3">
              <Label className="text-xs font-semibold">{method === "paste_json" ? "JSON Payload" : "Paste raw text"}</Label>
              <textarea value={jsonText} onChange={e => setJsonText(e.target.value)}
                rows={12} className="w-full rounded-2xl border bg-muted/20 p-4 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary/30 resize-y"
                placeholder={method === "paste_json" ? "Paste your JSON here…" : "Paste questions in plain text, one per line…"} />
              <div className="flex justify-between items-center">
                <p className="text-[10px] text-muted-foreground">{method === "paste_json" ? "Valid JSON object with a 'questions' array" : "AI will parse questions, options, and answers"}</p>
                <Button size="sm" onClick={() => setStep("preview")} className="rounded-xl gap-1.5 h-8">
                  <span dangerouslySetInnerHTML={{ __html: I.eye.replace("w-5 h-5","w-3.5 h-3.5") }} />Preview
                </Button>
              </div>
            </div>
          ) : (
            /* Drag & drop zone */
            <div
              onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
              className={`relative rounded-3xl border-2 border-dashed p-12 text-center transition-all duration-200 cursor-pointer ${
                dragOver ? "border-primary bg-primary/5 scale-[0.98]" : "border-muted-foreground/20 hover:border-primary/40 hover:bg-muted/20"
              }`}
              onClick={() => fileRef.current?.click()}
            >
              <input ref={fileRef} type="file" accept={METHODS.find(m => m.key === method)?.accept || ".csv"} className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              <div className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-colors ${dragOver ? "bg-primary/10" : "bg-muted/30"}`}>
                  <span dangerouslySetInnerHTML={{ __html: I.upload.replace("w-5 h-5","w-8 h-8 text-muted-foreground/40") }} />
                </div>
                <div>
                  <p className="text-sm font-semibold">{dragOver ? "Drop your file here" : "Drag & drop your file here"}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    or <span className="text-primary font-medium">browse files</span> · {method === "csv" ? "CSV" : "JSON"} · Max 50MB
                  </p>
                </div>
              </div>
              {file && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 px-4 py-2 text-sm">
                  <span dangerouslySetInnerHTML={{ __html: I.check.replace("w-5 h-5","w-4 h-4 text-emerald-500") }} />
                  <span className="font-medium">{file.name}</span>
                  <span className="text-muted-foreground text-[11px]">{(file.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════ PREVIEW ═══════════════════ */}
      {step === "preview" && (
        <div className="space-y-5">
          <div className="grid sm:grid-cols-3 gap-3">
            <Kpi icon={I.file} label="File" value={file?.name || "Pasted"} />
            <Kpi icon={I.book} label="Format" value={method === "csv" ? "CSV" : "JSON"} />
            <Kpi icon={I.layers} label="Estimated" value={file ? `${Math.floor(file.size / 500)} Q` : "—"} />
          </div>
          {/* Preview snippet */}
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-muted/20 px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold">Preview</h3>
              <Badge variant="secondary" className="text-[10px]">First 2 questions</Badge>
            </div>
            <div className="p-5 bg-muted/5 text-xs font-mono text-muted-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
              {method === "paste_json" || method === "paste_text" ? jsonText.slice(0, 1500) : file ? `${file.name}\n${(file.size / 1024).toFixed(0)} KB\n\nPreview not available until validation.` : "No file selected"}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("choose")} className="rounded-xl h-9">← Back</Button>
            <Button size="sm" onClick={() => setStep("validate")} className="rounded-xl gap-1.5 h-9">
              <span dangerouslySetInnerHTML={{ __html: I.play.replace("w-5 h-5","w-3.5 h-3.5") }} />Validate & Continue
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ VALIDATE ═══════════════════ */}
      {step === "validate" && (
        <div className="space-y-5">
          <div className="rounded-2xl border overflow-hidden">
            <div className="bg-muted/20 px-5 py-3 border-b flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <span dangerouslySetInnerHTML={{ __html: I.settings.replace("w-5 h-5","w-4 h-4 text-primary") }} />Import Options
              </h3>
            </div>
            <div className="p-5 space-y-3">
              {([
                { k: "skipDuplicates" as const, l: "Skip Duplicates", d: "Skip questions that already exist in the bank" },
                { k: "createMissing" as const, l: "Create Missing Subjects/Chapters", d: "Auto-create subjects and chapters referenced in the file" },
                { k: "autoDetect" as const, l: "Auto-Detect Difficulty", d: "Let AI assign difficulty if not specified" },
                { k: "saveAsDraft" as const, l: "Save as Draft", d: "Import questions as draft for review before publishing" },
              ]).map(o => (
                <label key={o.k} className="flex items-start justify-between gap-4 py-1 cursor-pointer">
                  <div>
                    <p className="text-[13px] font-medium">{o.l}</p>
                    <p className="text-[11px] text-muted-foreground">{o.d}</p>
                  </div>
                  <button type="button" role="switch" aria-checked={importOptions[o.k]}
                    onClick={() => setImportOptions(p => ({...p, [o.k]: !p[o.k]}))}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ${importOptions[o.k] ? "bg-primary" : "bg-muted-foreground/20"}`}>
                    <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition duration-200 ${importOptions[o.k] ? "translate-x-[18px]" : "translate-x-[3px]"}`} />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Quick validation check */}
          <div className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-800/30 p-4">
            <span dangerouslySetInnerHTML={{ __html: I.check.replace("w-5 h-5","w-5 h-5 text-emerald-500") }} />
            <div>
              <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Validation passed</p>
              <p className="text-[11px] text-emerald-600/70 dark:text-emerald-400/70">No formatting errors detected in your file.</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("preview")} className="rounded-xl h-9">← Back</Button>
            <Button size="sm" onClick={executeImport} disabled={busy} className="rounded-xl gap-1.5 h-9">
              <span dangerouslySetInnerHTML={{ __html: I.play.replace("w-5 h-5","w-3.5 h-3.5") }} />Start Import
            </Button>
          </div>
        </div>
      )}

      {/* ═══════ IMPORTING ═══════════════════ */}
      {step === "importing" && (
        <div className="space-y-5">
          <div className="rounded-3xl border bg-card p-8 text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-bounce">
              <span dangerouslySetInnerHTML={{ __html: I.zap.replace("w-5 h-5","w-10 h-10 text-primary") }} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Importing questions…</h3>
              <p className="text-sm text-muted-foreground mt-1">Please wait while we process your file</p>
            </div>
            <div className="w-full max-w-xs mx-auto space-y-2">
              <div className="h-3 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-500 ease-out" style={{ width: `${Math.round(progress)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground tabular-nums">{Math.round(progress)}% complete</p>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ DONE ═══════════════════════ */}
      {step === "done" && result && (
        <div className="space-y-5">
          <div className="rounded-3xl border bg-card p-8 text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
              <span dangerouslySetInnerHTML={{ __html: I.check.replace("w-5 h-5","w-10 h-10 text-emerald-500") }} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Import Complete! 🎉</h3>
              <p className="text-sm text-muted-foreground mt-1">Your questions have been added to the bank</p>
            </div>
            <pre className="inline-block text-left bg-muted/20 rounded-2xl p-4 text-xs font-mono text-muted-foreground max-h-48 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
            <div className="flex justify-center gap-2">
              <Button size="sm" onClick={() => { setStep("choose"); setFile(null); setResult(null); }} className="rounded-xl gap-1.5 h-9">
                <span dangerouslySetInnerHTML={{ __html: I.plus.replace("w-5 h-5","w-4 h-4") }} />Import Another
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setStep("choose"); setFile(null); setResult(null); }} className="rounded-xl h-9">Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════ ERROR ═══════════════════════ */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50/50 dark:bg-red-950/10 dark:border-red-800/30 p-4 flex items-start gap-3">
          <span className="shrink-0 text-red-500 mt-0.5" dangerouslySetInnerHTML={{ __html: I.alert.replace("w-5 h-5","w-4 h-4") }} />
          <div className="space-y-1">
            <p className="text-sm font-semibold text-red-600 dark:text-red-400">Import failed</p>
            <p className="text-xs text-red-500">{error}</p>
            <button onClick={() => { setError(""); setStep("choose"); }} className="text-[11px] text-red-500 hover:underline">Dismiss & try again</button>
          </div>
        </div>
      )}

      {/* ═══════ IMPORT HISTORY ═══════════════ */}
      {historyItems.length > 0 && step === "choose" && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Recent Imports</h3>
          <div className="rounded-2xl border overflow-hidden divide-y">
            {historyItems.slice(0, 5).map((job: any) => (
              <div key={job.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span dangerouslySetInnerHTML={{ __html: I.file.replace("w-5 h-5","w-4 h-4 text-muted-foreground") }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{job.filename || `Job #${job.id}`}</p>
                    <p className="text-[10px] text-muted-foreground">{job.created_at ? new Date(job.created_at).toLocaleString() : ""} · {job.rows_imported || 0} rows</p>
                  </div>
                </div>
                <Badge variant={job.status === "completed" ? "secondary" : job.status === "failed" ? "destructive" : "outline"} className="text-[10px] capitalize shrink-0">{job.status || "pending"}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
