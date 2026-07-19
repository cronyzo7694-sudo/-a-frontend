import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { chaptersApi, subjectsApi, type Chapter } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

export function ChaptersPage() {
  const qc = useQueryClient();
  const { data: subjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list("active_only=false"),
  });
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["chapters", filterSubject],
    queryFn: () =>
      chaptersApi.list(
        filterSubject === "all" ? "active_only=false" : `active_only=false&subject_id=${filterSubject}`,
      ),
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Chapter | null>(null);
  const [form, setForm] = useState({ name: "", description: "", subject_id: "" });
  const [error, setError] = useState("");

  const saveMut = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description,
        subject_id: Number(form.subject_id),
      };
      if (editing) return chaptersApi.update(editing.id, payload);
      return chaptersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["chapters"] });
      setOpen(false);
    },
    onError: (e: any) => setError(e.message || "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => chaptersApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["chapters"] }),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Chapters</h1>
          <p className="text-sm text-muted-foreground">Organize topics under subjects</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({
              name: "",
              description: "",
              subject_id: subjects?.items?.[0] ? String(subjects.items[0].id) : "",
            });
            setError("");
            setOpen(true);
          }}
        >
          Add Chapter
        </Button>
      </div>

      <div className="max-w-xs">
        <Select value={filterSubject} onValueChange={setFilterSubject}>
          <SelectTrigger>
            <SelectValue placeholder="Filter subject" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All subjects</SelectItem>
            {(subjects?.items || []).map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Chapters</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading…</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Subject</th>
                  <th className="py-2 pr-3">Questions</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(data?.items || []).map((c) => (
                  <tr key={c.id} className="border-b">
                    <td className="py-2 pr-3">{c.name}</td>
                    <td className="py-2 pr-3">{c.subject_name}</td>
                    <td className="py-2 pr-3">{c.question_count ?? 0}</td>
                    <td className="py-2 space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(c);
                          setForm({
                            name: c.name,
                            description: c.description || "",
                            subject_id: String(c.subject_id),
                          });
                          setOpen(true);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => confirm("Delete?") && delMut.mutate(c.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit chapter" : "New chapter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Subject</Label>
              <Select
                value={form.subject_id}
                onValueChange={(v) => setForm({ ...form, subject_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {(subjects?.items || []).map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMut.mutate()}
              disabled={!form.name || !form.subject_id || saveMut.isPending}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
