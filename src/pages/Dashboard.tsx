import { useQuery } from "@tanstack/react-query";

import { landsApi } from "@/api/lands";
import { productsApi } from "@/api/products";
import { suppliersApi } from "@/api/suppliers";
import { ticketsApi } from "@/api/tickets";

interface StatCardProps {
  label: string;
  value: number | undefined;
  isLoading: boolean;
}

function StatCard({ label, value, isLoading }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-4xl font-bold tracking-tight">
        {isLoading ? (
          <span className="inline-block h-9 w-16 animate-pulse rounded bg-muted" />
        ) : (
          (value ?? 0)
        )}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data: suppliers, isLoading: loadingSuppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: suppliersApi.getAll,
  });

  const { data: lands, isLoading: loadingLands } = useQuery({
    queryKey: ["lands"],
    queryFn: landsApi.getAll,
  });

  const { data: products, isLoading: loadingProducts } = useQuery({
    queryKey: ["products"],
    queryFn: productsApi.getAll,
  });

  const { data: ticketsPage, isLoading: loadingTickets } = useQuery({
    queryKey: ["tickets", { page: 1 }],
    queryFn: () => ticketsApi.getAll({ page: 1, limit: 1 }),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Suppliers"
          value={suppliers?.length}
          isLoading={loadingSuppliers}
        />
        <StatCard
          label="Lands"
          value={lands?.length}
          isLoading={loadingLands}
        />
        <StatCard
          label="Products"
          value={products?.length}
          isLoading={loadingProducts}
        />
        <StatCard
          label="Tickets"
          value={ticketsPage?.meta.total}
          isLoading={loadingTickets}
        />
      </div>
    </div>
  );
}
