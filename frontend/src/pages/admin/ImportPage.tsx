import { useState } from "react";
import { importsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

/**
 * Question bank import.
 *
 * Exam mapping (optional):
 *  - Per question: "exam": "Exam Title"  OR  "exam_id": 1
 *  - Whole batch:  root "exam": "Exam Title"  OR  "exam_id": 1
 *  - Section:      "section": "Section Title" (optional)
 *
 * Without exam fields the question only goes into the bank (reusable).
 */
const sampleJson = `{
  "exam": "SSC CHSL Style Mock Test — Demo",
  "section": "General Awareness",
  "questions": [
    {
      "question_text": "Capital of France?",
      "option_a": "Berlin",
      "option_b": "Paris",
      "option_c": "Rome",
      "option_d": "Madrid",
      "correct_answer": "B",
      "explanation": "Paris is the capital of France",
      "difficulty": "easy",
      "marks": 2,
      "negative_marks": 0.5,
      "question_type": "single_choice",
      "subject": "General Awareness",
      "chapter": "Geography",
      "tags": "gk,import"
    },
    {
      "question_text": "Who wrote the national anthem of India?",
      "option_a": "Bankim Chandra",
      "option_b": "Rabindranath Tagore",
      "option_c": "Sarojini Naidu",
      "option_d": "Mahatma Gandhi",
      "correct_answer": "B",
      "subject": "General Awareness",
      "exam": "SSC CHSL Style Mock Test — Demo",
      "section": "General Awareness"
    }
  ]
}`;

export function ImportPage() {
  const [jsonText, setJsonText] = useState(sampleJson);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const importJson = async () => {
    setBusy(true);
    setError("");
    setResult("");
    try {
      const payload = JSON.parse(jsonText);
      const res = await importsApi.json(payload);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setError(e.message || "Import failed");
    } finally {
      setBusy(false);
    }
  };

  const importCsv = async (file: File | null) => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await importsApi.csv(fd);
      setResult(JSON.stringify(res, null, 2));
    } catch (e: any) {
      setError(e.message || "CSV import failed");
    } finally {
      setBusy(false);
    }
  };

  const downloadTemplate = async () => {
    const res = await importsApi.template();
    const blob = new Blob([res.content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.filename || "template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Import questions</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Bulk load into the question bank. Optionally map rows to a specific exam.
        </p>
      </div>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">How exam mapping works</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 text-sm text-slate-600 space-y-2 leading-relaxed">
          <p>
            Questions always go into the <strong>bank</strong> first. They become part of an exam
            only when you set an exam field.
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <code className="text-xs bg-slate-100 px-1 rounded">exam</code> or{" "}
              <code className="text-xs bg-slate-100 px-1 rounded">exam_name</code> — exam{" "}
              <em>title</em> (e.g. demo mock name)
            </li>
            <li>
              <code className="text-xs bg-slate-100 px-1 rounded">exam_id</code> — numeric id if you
              know it
            </li>
            <li>
              Root-level <code className="text-xs bg-slate-100 px-1 rounded">"exam": "…"</code>{" "}
              applies to the whole batch
            </li>
            <li>
              Optional <code className="text-xs bg-slate-100 px-1 rounded">section</code> — section
              title inside that exam
            </li>
            <li>No exam field → bank only (reuse later in Exam builder)</li>
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
          <CardTitle className="text-sm font-semibold">CSV import</CardTitle>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            Download template
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <InputFile onFile={importCsv} disabled={busy} />
          <p className="text-xs text-slate-500 mt-2">
            CSV columns include <code>exam</code> and <code>section</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-none border-slate-200">
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">JSON import</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          <div>
            <Label className="text-xs text-slate-600">JSON payload</Label>
            <Textarea
              rows={16}
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="font-mono text-xs mt-1"
            />
          </div>
          <Button onClick={importJson} disabled={busy} size="sm">
            {busy ? "Importing…" : "Import JSON"}
          </Button>
        </CardContent>
      </Card>

      {error ? <pre className="text-sm text-red-600 whitespace-pre-wrap">{error}</pre> : null}
      {result ? (
        <Card className="shadow-none border-slate-200">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-semibold">Result</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <pre className="text-xs overflow-auto bg-slate-50 border rounded-md p-3">{result}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function InputFile({
  onFile,
  disabled,
}: {
  onFile: (f: File | null) => void;
  disabled?: boolean;
}) {
  return (
    <input
      type="file"
      accept=".csv,text/csv"
      disabled={disabled}
      onChange={(e) => onFile(e.target.files?.[0] || null)}
      className="block w-full text-sm"
    />
  );
}
