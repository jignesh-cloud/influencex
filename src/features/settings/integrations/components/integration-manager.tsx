"use client";

import { useState, useTransition } from "react";
import { createAffiliateProgram, toggleAffiliateProgramActive } from "@/features/settings/integrations/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AffiliateProgramItem {
  id: string;
  network: string;
  programName: string;
  externalProgramId: string | null;
  active: boolean;
  hasCredential: boolean;
  client: { name: string };
}

function CreateProgramDialog({ clients, isAdmin }: { clients: { id: string; name: string }[]; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const [clientId, setClientId] = useState("");
  const [network, setNetwork] = useState("impact");
  const [programName, setProgramName] = useState("");
  const [externalProgramId, setExternalProgramId] = useState("");
  const [apiCredential, setApiCredential] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!isAdmin) return null;

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createAffiliateProgram({
        clientId,
        network: network as "impact" | "awin" | "avantlink",
        programName,
        externalProgramId,
        apiCredential,
      });
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setClientId("");
        setProgramName("");
        setExternalProgramId("");
        setApiCredential("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add Affiliate Program</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add affiliate program</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field data-invalid={!!error}>
            <FieldLabel>Client</FieldLabel>
            <Select value={clientId} onValueChange={(v) => setClientId(v ?? "")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>
          <Field>
            <FieldLabel>Network</FieldLabel>
            <Select value={network} onValueChange={(v) => v && setNetwork(v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="impact">Impact</SelectItem>
                <SelectItem value="awin">Awin</SelectItem>
                <SelectItem value="avantlink">AvantLink</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="programName">Program name</FieldLabel>
            <Input id="programName" value={programName} onChange={(e) => setProgramName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="externalProgramId">External program ID (optional)</FieldLabel>
            <Input id="externalProgramId" value={externalProgramId} onChange={(e) => setExternalProgramId(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel htmlFor="apiCredential">API credential (optional, encrypted at rest)</FieldLabel>
            <Input
              id="apiCredential"
              type="password"
              value={apiCredential}
              onChange={(e) => setApiCredential(e.target.value)}
            />
          </Field>
        </div>
        <DialogFooter>
          <Button disabled={!clientId || !programName || isPending} onClick={handleCreate}>
            {isPending ? "Adding…" : "Add program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProgramToggle({ program, isAdmin }: { program: AffiliateProgramItem; isAdmin: boolean }) {
  const [isPending, startTransition] = useTransition();

  if (!isAdmin) {
    return <Badge variant={program.active ? "default" : "secondary"}>{program.active ? "Active" : "Inactive"}</Badge>;
  }

  return (
    <Button
      size="xs"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          await toggleAffiliateProgramActive(program.id, !program.active);
        })
      }
    >
      {program.active ? "Deactivate" : "Activate"}
    </Button>
  );
}

export function IntegrationManager({
  modes,
  programs,
  clients,
  isAdmin,
}: {
  modes: { name: string; mode: string }[];
  programs: AffiliateProgramItem[];
  clients: { id: string; name: string }[];
  isAdmin: boolean;
}) {
  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-3 font-semibold text-neutral-900">Integration modes</h2>
        <p className="mb-3 text-sm text-neutral-500">
          Set via environment variables. A &ldquo;live&rdquo; mode still requires real credentials to actually work.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {modes.map((m) => (
            <div key={m.name} className="flex items-center justify-between rounded-md border border-neutral-200 px-3 py-2 text-sm">
              <span>{m.name}</span>
              <Badge variant={m.mode === "live" ? "default" : "secondary"}>{m.mode}</Badge>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">Affiliate programs</h2>
          <CreateProgramDialog clients={clients} isAdmin={isAdmin} />
        </div>
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Client</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Network</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Program</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Credential</th>
                <th className="px-3 py-2 text-left font-medium text-neutral-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {programs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-neutral-500">
                    No affiliate programs configured yet.
                  </td>
                </tr>
              ) : (
                programs.map((program) => (
                  <tr key={program.id} className="border-b border-neutral-100">
                    <td className="px-3 py-2">{program.client.name}</td>
                    <td className="px-3 py-2 capitalize">{program.network}</td>
                    <td className="px-3 py-2">{program.programName}</td>
                    <td className="px-3 py-2 text-neutral-500">{program.hasCredential ? "On file (encrypted)" : "—"}</td>
                    <td className="px-3 py-2">
                      <ProgramToggle program={program} isAdmin={isAdmin} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
