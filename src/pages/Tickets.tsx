import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { landsApi } from "@/api/lands";
import { productsApi } from "@/api/products";
import { suppliersApi } from "@/api/suppliers";
import { ticketsApi } from "@/api/tickets";
import type { Ticket } from "@/types/shared";

const LIMIT = 20;

const itemSchema = z.object({
  product_id: z.number().int().positive("Select a product"),
  quantity: z.string().min(1, "Required"),
  unit_price: z.string().min(1, "Required"),
});

const schema = z.object({
  code: z.string().min(1, "Required"),
  supplier_id: z.number().int().positive("Select a supplier"),
  land_id: z.number().int().positive("Select a land"),
  ticket_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  items: z.array(itemSchema).min(1, "Add at least one item"),
});
type FormData = z.infer<typeof schema>;

const BLANK_ITEM = { product_id: 0, quantity: "", unit_price: "" };

export default function Tickets() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filterSupplier, setFilterSupplier] = useState<number | undefined>();
  const [filterLand, setFilterLand] = useState<number | undefined>();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Ticket | null>(null);
  const [deleting, setDeleting] = useState<Ticket | null>(null);

  // Paginated ticket list
  const { data, isLoading } = useQuery({
    queryKey: [
      "tickets",
      { page, supplier_id: filterSupplier, land_id: filterLand },
    ],
    queryFn: () =>
      ticketsApi.getAll({
        page,
        limit: LIMIT,
        supplier_id: filterSupplier,
        land_id: filterLand,
      }),
  });
  const tickets = data?.data ?? [];
  const totalPages = data ? Math.ceil(data.meta.total / LIMIT) : 1;

  // Lookup lists for selects
  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: suppliersApi.getAll,
  });
  const { data: lands = [] } = useQuery({
    queryKey: ["lands"],
    queryFn: landsApi.getAll,
  });
  const { data: products = [] } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.getAll,
  });

  // Full ticket detail (includes items) fetched only when editing
  const { data: ticketDetail } = useQuery({
    queryKey: ["tickets", editing?.id],
    queryFn: () => ticketsApi.getOne(editing!.id),
    enabled: editing !== null,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { items: [BLANK_ITEM] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  // Prefill form once the detail query resolves
  useEffect(() => {
    if (!ticketDetail) return;
    reset({
      code: ticketDetail.code,
      supplier_id: ticketDetail.supplier_id,
      land_id: ticketDetail.land_id,
      ticket_date: ticketDetail.ticket_date,
      items: (ticketDetail.items ?? []).map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    });
  }, [ticketDetail, reset]);

  const openCreate = () => {
    reset({
      code: "",
      supplier_id: 0,
      land_id: 0,
      ticket_date: "",
      items: [BLANK_ITEM],
    });
    setCreating(true);
  };
  const openEdit = (t: Ticket) => setEditing(t);
  const closeDialog = () => {
    setCreating(false);
    setEditing(null);
  };

  const withLineTotal = (data: FormData) => ({
    ...data,
    items: data.items.map((item) => ({
      ...item,
      line_total: (
        parseFloat(item.quantity) * parseFloat(item.unit_price)
      ).toFixed(3),
    })),
  });

  const invalidateTickets = () =>
    qc.invalidateQueries({ queryKey: ["tickets"] });

  const createMutation = useMutation({
    mutationFn: (data: FormData) => ticketsApi.create(withLineTotal(data)),
    onSuccess: () => {
      void invalidateTickets();
      toast.success("Ticket created");
      closeDialog();
    },
    onError: () => toast.error("Failed to create ticket"),
  });

  const updateMutation = useMutation({
    mutationFn: (data: FormData) =>
      ticketsApi.update(editing!.id, withLineTotal(data)),
    onSuccess: () => {
      void invalidateTickets();
      toast.success("Ticket updated");
      closeDialog();
    },
    onError: () => toast.error("Failed to update ticket"),
  });

  const deleteMutation = useMutation({
    mutationFn: ticketsApi.remove,
    onSuccess: () => {
      void invalidateTickets();
      toast.success("Ticket deleted");
      setDeleting(null);
    },
    onError: () => toast.error("Failed to delete ticket"),
  });

  const onSubmit = (data: FormData) => {
    if (editing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const dialogOpen = creating || editing !== null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tickets</h1>
        <Button onClick={openCreate}>Add Ticket</Button>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-3">
        <Select
          value={filterSupplier ? String(filterSupplier) : null}
          onValueChange={(v) => {
            setFilterSupplier(v ? Number(v) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={filterLand ? String(filterLand) : null}
          onValueChange={(v) => {
            setFilterLand(v ? Number(v) : undefined);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All lands" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All lands</SelectItem>
            {lands.map((l) => (
              <SelectItem key={l.id} value={String(l.id)}>
                {l.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <DataTable
        data={tickets}
        isLoading={isLoading}
        emptyMessage="No tickets found."
        getRowKey={(t) => t.id}
        columns={[
          { header: "Code", accessor: "code", className: "font-mono" },
          { header: "Supplier", cell: (t) => t.supplier?.name ?? "—" },
          { header: "Land", cell: (t) => t.land?.name ?? "—" },
          { header: "Date", accessor: "ticket_date" },
          {
            header: "Actions",
            className: "w-36",
            cell: (t) => (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleting(t)}
                >
                  Delete
                </Button>
              </div>
            ),
          },
        ]}
      />

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground">
          Page {page} of {totalPages} ({data?.meta.total ?? 0} total)
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </Button>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Ticket" : "Add Ticket"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Code + Date */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Code</Label>
                <Input id="code" {...register("code")} />
                {errors.code && (
                  <p className="text-sm text-destructive">
                    {errors.code.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ticket_date">Date</Label>
                <Input
                  id="ticket_date"
                  type="date"
                  {...register("ticket_date")}
                />
                {errors.ticket_date && (
                  <p className="text-sm text-destructive">
                    {errors.ticket_date.message}
                  </p>
                )}
              </div>
            </div>

            {/* Supplier + Land */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Controller
                  control={control}
                  name="supplier_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : null}
                      onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select supplier" />
                      </SelectTrigger>
                      <SelectContent>
                        {suppliers.map((s) => (
                          <SelectItem key={s.id} value={String(s.id)}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.supplier_id && (
                  <p className="text-sm text-destructive">
                    {errors.supplier_id.message}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Land</Label>
                <Controller
                  control={control}
                  name="land_id"
                  render={({ field }) => (
                    <Select
                      value={field.value ? String(field.value) : null}
                      onValueChange={(v) => field.onChange(v ? Number(v) : 0)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select land" />
                      </SelectTrigger>
                      <SelectContent>
                        {lands.map((l) => (
                          <SelectItem key={l.id} value={String(l.id)}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.land_id && (
                  <p className="text-sm text-destructive">
                    {errors.land_id.message}
                  </p>
                )}
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Items</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => append(BLANK_ITEM)}
                >
                  + Add item
                </Button>
              </div>
              {errors.items && !Array.isArray(errors.items) && (
                <p className="mb-2 text-sm text-destructive">
                  {errors.items.message}
                </p>
              )}
              <div className="space-y-2">
                {fields.map((field, index) => {
                  const itemErrs = Array.isArray(errors.items)
                    ? errors.items[index]
                    : undefined;
                  return (
                    <div key={field.id} className="flex items-start gap-2">
                      {/* Product select */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <Controller
                          control={control}
                          name={`items.${index}.product_id`}
                          render={({ field: f }) => (
                            <Select
                              value={f.value ? String(f.value) : null}
                              onValueChange={(v) =>
                                f.onChange(v ? Number(v) : 0)
                              }
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Product" />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map((p) => (
                                  <SelectItem key={p.id} value={String(p.id)}>
                                    {p.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {itemErrs?.product_id && (
                          <p className="text-xs text-destructive">
                            {itemErrs.product_id.message}
                          </p>
                        )}
                      </div>
                      {/* Quantity */}
                      <div className="w-24 space-y-1">
                        <Input
                          placeholder="Qty"
                          {...register(`items.${index}.quantity`)}
                        />
                        {itemErrs?.quantity && (
                          <p className="text-xs text-destructive">
                            {itemErrs.quantity.message}
                          </p>
                        )}
                      </div>
                      {/* Unit price */}
                      <div className="w-28 space-y-1">
                        <Input
                          placeholder="Unit price"
                          {...register(`items.${index}.unit_price`)}
                        />
                        {itemErrs?.unit_price && (
                          <p className="text-xs text-destructive">
                            {itemErrs.unit_price.message}
                          </p>
                        )}
                      </div>
                      {/* Remove */}
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="mt-0.5 text-destructive hover:text-destructive"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        ✕
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => {
          if (!open) setDeleting(null);
        }}
        title="Delete Ticket"
        description={`Are you sure you want to delete ticket "${deleting?.code}"? This cannot be undone.`}
        onConfirm={() => deleting && deleteMutation.mutate(deleting.id)}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}