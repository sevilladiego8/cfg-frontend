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
import { productsApi } from "@/api/products";
import type { Product } from "@/types/shared";

const schema = z.object({
  code: z.string().min(1, "Required"),
  name: z.string().min(1, "Required"),
});
type FormData = z.infer<typeof schema>;

export default function Products() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Product | null>(null);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.getAll,
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
  const openEdit = (p: Product) => {
    reset({ code: p.code, name: p.name });
    setEditing(p);
  };
  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const createMutation = useMutation({
    mutationFn: productsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create product"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update product"),
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      toast.success("Product deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete product"),
  });

  const onSubmit = (data: FormData) => {
    if (editing) updateMutation.mutate({ id: editing.id, data });
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products</h1>
        <Button onClick={openCreate}>Add Product</Button>
      </div>

      <DataTable
        data={products}
        isLoading={isLoading}
        emptyMessage="No products found."
        getRowKey={(p) => p.id}
        columns={[
          { header: "Code", accessor: "code", className: "font-mono" },
          { header: "Name", accessor: "name" },
          {
            header: "Actions",
            className: "w-36",
            cell: (p) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleting(p)}
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
        title={editing ? "Edit Product" : "Add Product"}
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
        title="Delete Product"
        description={`Are you sure you want to delete "${deleting?.name}"? This cannot be undone.`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
