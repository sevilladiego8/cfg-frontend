import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { landsApi } from "@/api/lands";
import type { Land } from "@/types/shared";

const schema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function Lands() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Land | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Land | null>(null);

  const { data: lands = [], isLoading } = useQuery({
    queryKey: ["lands"],
    queryFn: landsApi.getAll,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const openCreate = () => {
    reset({ code: "", name: "" });
    setCreating(true);
  };
  const openEdit = (l: Land) => {
    reset({ code: l.code, name: l.name });
    setEditing(l);
  };
  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const createMutation = useMutation({
    mutationFn: landsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lands"] });
      toast.success("Land created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create land"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      landsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lands"] });
      toast.success("Land updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update land"),
  });

  const deleteMutation = useMutation({
    mutationFn: landsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lands"] });
      toast.success("Land deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete land"),
  });

  const onSubmit = (data: FormData) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Lands</h1>
        <Button onClick={openCreate}>Add Land</Button>
      </div>

      <DataTable
        data={lands}
        isLoading={isLoading}
        emptyMessage="No lands found."
        getRowKey={(l) => l.id}
        columns={[
          { header: "Code", accessor: "code", className: "font-mono" },
          { header: "Name", accessor: "name" },
          {
            header: "Actions",
            className: "w-36",
            cell: (l) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(l)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleting(l)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      <FormDialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        title={editing ? "Edit Land" : "Add Land"}
        onSubmit={handleSubmit(onSubmit)}
        onCancel={closeDialog}
        isPending={isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register("code")} />
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register("name")} />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete Land"
        description={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
