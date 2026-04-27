import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { FormDialog } from "@/components/FormDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { suppliersApi } from "@/api/suppliers";
import type { Supplier } from "@/types/shared";

const schema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function Suppliers() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Supplier | null>(null);

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: suppliersApi.getAll,
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

  const openEdit = (s: Supplier) => {
    reset({ code: s.code, name: s.name });
    setEditing(s);
  };

  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const createMutation = useMutation({
    mutationFn: suppliersApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create supplier"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      suppliersApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update supplier"),
  });

  const deleteMutation = useMutation({
    mutationFn: suppliersApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete supplier"),
  });

  const onSubmit = (data: FormData) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        <Button onClick={openCreate}>Add Supplier</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-36">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="py-8 text-center text-muted-foreground"
              >
                Loading…
              </TableCell>
            </TableRow>
          ) : suppliers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={3}
                className="py-8 text-center text-muted-foreground"
              >
                No suppliers found.
              </TableCell>
            </TableRow>
          ) : (
            suppliers.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono">{s.code}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEdit(s)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setDeleting(s)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <FormDialog
        open={creating || editing !== null}
        onOpenChange={(open) => { if (!open) closeDialog(); }}
        title={editing ? 'Edit Supplier' : 'Add Supplier'}
        onSubmit={handleSubmit(onSubmit)}
        onCancel={closeDialog}
        isPending={isPending}
      >
        <div className="space-y-1.5">
          <Label htmlFor="code">Code</Label>
          <Input id="code" {...register('code')} />
          {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
      </FormDialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => { if (!open) setDeleting(null); }}
        title="Delete Supplier"
        description={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
