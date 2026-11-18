"use client";

import { useActionState, useState } from "react";
import { createClient } from "@/features/clients/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

type FormState = { error?: string } | undefined;

export function CreateClientDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState, formData) => createClient(prevState, formData),
    undefined,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>New Client</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New client</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <Field>
            <FieldLabel htmlFor="name">Client name</FieldLabel>
            <Input id="name" name="name" required maxLength={200} placeholder="e.g. Riley Home" />
          </Field>
          <Field>
            <FieldLabel htmlFor="contactName">Contact name</FieldLabel>
            <Input id="contactName" name="contactName" maxLength={200} />
          </Field>
          <Field>
            <FieldLabel htmlFor="contactEmail">Contact email</FieldLabel>
            <Input id="contactEmail" name="contactEmail" type="email" />
          </Field>
          <Field>
            <FieldLabel htmlFor="standingContentGuidelines">Standing content guidelines</FieldLabel>
            <Textarea
              id="standingContentGuidelines"
              name="standingContentGuidelines"
              rows={4}
              placeholder="Guidelines that apply to every campaign for this client"
            />
          </Field>

          {state?.error ? <FieldError errors={[{ message: state.error }]} /> : null}

          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create client"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
