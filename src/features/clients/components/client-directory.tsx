"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface ClientListItem {
  id: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  campaignCount: number;
  activeCampaignCount: number;
  pendingReviewCount: number;
}

export function ClientDirectory({ clients }: { clients: ClientListItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (client) =>
        client.name.toLowerCase().includes(q) || client.contactName?.toLowerCase().includes(q),
    );
  }, [clients, query]);

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search clients…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="max-w-sm"
      />

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-neutral-500">
          {clients.length === 0 ? "No clients yet." : "No clients match your search."}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((client) => (
            <Link key={client.id} href={`/clients/${client.id}`}>
              <Card className="h-full gap-2 p-5 transition-shadow hover:shadow-md">
                <p className="font-semibold text-neutral-900">{client.name}</p>
                {client.contactName ? (
                  <p className="text-sm text-neutral-500">{client.contactName}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {client.activeCampaignCount} active campaign
                    {client.activeCampaignCount === 1 ? "" : "s"}
                  </Badge>
                  {client.pendingReviewCount > 0 ? (
                    <Badge className="bg-brand text-brand-foreground">
                      {client.pendingReviewCount} pending review
                    </Badge>
                  ) : null}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
