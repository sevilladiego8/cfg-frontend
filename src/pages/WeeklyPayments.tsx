import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";

import { paymentsApi } from "@/api/payments";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function getCurrentISOWeek(): { year: number; week: number } {
  const now = new Date();
  const date = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  const day = date.getUTCDay() || 7; // ISO: Mon=1 ... Sun=7
  date.setUTCDate(date.getUTCDate() + 4 - day); // shift to Thursday of this week
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7
  );
  return { year: date.getUTCFullYear(), week };
}

const fmt = (val: string) =>
  parseFloat(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });

const YEARS = Array.from({ length: 8 }, (_, i) => 2020 + i); // 2020–2027
const WEEKS = Array.from({ length: 53 }, (_, i) => i + 1); // 1–53

export default function WeeklyPayments() {
  const current = getCurrentISOWeek();
  const [year, setYear] = useState(current.year);
  const [week, setWeek] = useState(current.week);
  const [searched, setSearched] = useState<{ year: number; week: number } | null>(null);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const { data, isFetching } = useQuery({
    queryKey: ["payments/weekly", searched],
    queryFn: () => paymentsApi.getWeekly(searched!.year, searched!.week),
    enabled: searched !== null,
  });

  const suppliers = data?.data ?? [];
  const grandTotal = suppliers.reduce((sum, s) => sum + parseFloat(s.total), 0);

  const toggleExpand = (id: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleSearch = () => {
    setExpanded(new Set());
    setSearched({ year, week });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Weekly Payments</h1>
      </div>

      {/* Controls */}
      <div className="mb-6 flex items-end gap-4">
        <div className="space-y-1.5">
          <Label>Year</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {YEARS.map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>ISO Week</Label>
          <Select value={String(week)} onValueChange={(v) => setWeek(Number(v))}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WEEKS.map((w) => (
                <SelectItem key={w} value={String(w)}>
                  Week {w}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSearch} disabled={isFetching}>
          {isFetching ? "Loading…" : "Search"}
        </Button>
      </div>

      {/* Empty state */}
      {searched && !isFetching && suppliers.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No payments found for week {searched.week} of {searched.year}.
        </p>
      )}

      {/* Results table */}
      {suppliers.length > 0 && (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8" />
                <TableHead>Supplier</TableHead>
                <TableHead>Code</TableHead>
                <TableHead className="text-right">Tickets</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((s) => (
                <Fragment key={s.supplier_id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleExpand(s.supplier_id)}
                  >
                    <TableCell className="select-none text-center text-muted-foreground">
                      {expanded.has(s.supplier_id) ? "▾" : "▸"}
                    </TableCell>
                    <TableCell className="font-medium">{s.supplier_name}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {s.supplier_code}
                    </TableCell>
                    <TableCell className="text-right">{s.ticket_count}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {fmt(s.total)}
                    </TableCell>
                  </TableRow>

                  {expanded.has(s.supplier_id) && (
                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                      <TableCell />
                      <TableCell colSpan={4} className="pb-3 pt-1">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="h-7 text-xs font-normal text-muted-foreground">
                                Ticket
                              </TableHead>
                              <TableHead className="h-7 text-xs font-normal text-muted-foreground">
                                Date
                              </TableHead>
                              <TableHead className="h-7 text-right text-xs font-normal text-muted-foreground">
                                Total
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {s.tickets.map((t) => (
                              <TableRow key={t.ticket_id}>
                                <TableCell className="py-1.5 font-mono text-xs">
                                  {t.ticket_code}
                                </TableCell>
                                <TableCell className="py-1.5 text-xs">
                                  {t.ticket_date}
                                </TableCell>
                                <TableCell className="py-1.5 text-right text-xs">
                                  {fmt(t.ticket_total)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4} className="text-right">
                  Grand Total
                </TableCell>
                <TableCell className="text-right">
                  {grandTotal.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 3,
                  })}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      )}
    </div>
  );
}
