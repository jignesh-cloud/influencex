"use client";

import { useState, useTransition } from "react";
import { createContentGuidelineTemplate } from "@/features/settings/content-guidelines/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateItem {
  id: string;
  name: string;
  clientId: string | null;
  client: { name: string } | null;
  rules: unknown;
}

function CreateTemplateDialog({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState("");
  const [rules, setRules] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createContentGuidelineTemplate({ name, clientId, rules });
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setName("");
        setClientId("");
        setRules("");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New Template</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New content guideline template</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field>
            <FieldLabel htmlFor="templateName">Name</FieldLabel>
            <Input id="templateName" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field>
            <FieldLabel>Client</FieldLabel>
            <Select value={clientId || "global"} onValueChange={(v) => setClientId(v === "global" ? "" : (v ?? ""))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">Group 8A global</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="rules">Rules</FieldLabel>
            <Textarea id="rules" rows={5} value={rules} onChange={(e) => setRules(e.target.value)} />
            <FieldDescription>One rule per line.</FieldDescription>
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>
        </div>
        <DialogFooter>
          <Button disabled={!name || !rules || isPending} onClick={handleCreate}>
            {isPending ? "Creating…" : "Create template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ContentGuidelineManager({
  templates,
  clients,
}: {
  templates: TemplateItem[];
  clients: { id: string; name: string }[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{templates.length} template(s) on file.</p>
        <CreateTemplateDialog clients={clients} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {templates.map((template) => {
          const rules = Array.isArray(template.rules) ? (template.rules as string[]) : [];
          return (
            <Card key={template.id} className="space-y-2 p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-neutral-900">{template.name}</p>
                <Badge variant="secondary">{template.client?.name ?? "Group 8A global"}</Badge>
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm text-neutral-600">
                {rules.map((rule, i) => (
                  <li key={i}>{rule}</li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
