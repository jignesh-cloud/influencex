"use client";

import { useState, useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { refreshCreatorData } from "@/features/creators/actions";
import { Button } from "@/components/ui/button";

export function RefreshCreatorButton({ creatorId, hasProvider }: { creatorId: string; hasProvider: boolean }) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!hasProvider) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await refreshCreatorData(creatorId);
            setMessage(result.error ?? "Refreshed.");
          })
        }
      >
        <RefreshCw className="mr-1.5" size={14} />
        {isPending ? "Refreshing…" : "Refresh"}
      </Button>
      {message ? <span className="text-xs text-neutral-500">{message}</span> : null}
    </div>
  );
}
