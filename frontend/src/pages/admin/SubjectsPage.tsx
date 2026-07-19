import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { subjectsApi, type Subject } from "@/lib/api";
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

const empty = { name: "", code: "", description: "", color: "#1e40af", icon: "book" };

export function SubjectsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: () => subjectsApi.list("active_only=false"),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");

  const saveMut = useMutation({
    mutationFn: async () => {
      if (editing) return subjectsApi.update(editing.id, form);
      return subjectsApi.create(form);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["subjects"] });
      setOpen(false);
      setEditing(null);
      setForm(empty);
    },
    onError: (e: any) => setError(e.message || "Save failed"),
  });

  const delMut = useMutation({
    mutationFn: (id: number) => subjectsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subjects"] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm(empty);
    setError("");
    setOpen(true);
  };
  const openEdit = (s: Subject) => {
    setEditing(s);
    setForm({
      name: s.name,
      code: s.code || "",
      description: s.description || "",
      color: s.color || "#1e40af",
      icon: s.icon || "book",
    });
    setError("");
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Subjects</h1>
          <p className="text-sm text-muted-foreground">Manage exam subjects</p>
        </div>
        <Button onClick={openCreate}>Add Subject</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading…</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Code</th>
                    <th className="py-2 pr-3">Chapters</th>
                    <th className="py-2 pr-3">Questions</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.items || []).map((s) => (
                    <tr key={s.id} className="border-b">
                      <td className="py-2 pr-3">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full mr-2"
                          style={{ background: s.color || "#1e40af" }}
                        />
                        {s.name}
                      </td>
                      <td className="py-2 pr-3">{s.code || "—"}</td>
                      <td className="py-2 pr-3">{s.chapter_count ?? 0}</td>
                      <td className="py-2 pr-3">{s.question_count ?? 0}</td>
                      <td className="py-2 space-x-2">
                        <Button size="sm" variant="outline" onClick={() => openEdit(s)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            if (confirm("Delete subject?")) delMut.mutate(s.id);
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit subject" : "New subject"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Color</Label>
                <Input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                />
              </div>
              <div>
                <Label>Icon</Label>
                <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => saveMut.mutate()} disabled={!form.name || saveMut.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
