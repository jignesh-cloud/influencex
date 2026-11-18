"use client";

import { useState, useTransition } from "react";
import { createUser, updateUserRole } from "@/features/settings/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import type { UserRole } from "@/generated/prisma/enums";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}

function CreateUserDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("team_member");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCreate() {
    setError(null);
    startTransition(async () => {
      const result = await createUser({ name, email, role });
      if (result?.error) {
        setError(result.error);
      } else {
        setOpen(false);
        setName("");
        setEmail("");
        setRole("team_member");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button />}>Add User</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a Group 8A user</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Field>
            <FieldLabel htmlFor="userName">Name</FieldLabel>
            <Input id="userName" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="userEmail">Email</FieldLabel>
            <Input id="userEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            {error ? <FieldError errors={[{ message: error }]} /> : null}
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="team_member">Team member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <p className="text-xs text-neutral-500">
            This person can sign in with Google Workspace once this row exists — no separate invite email is sent.
          </p>
        </div>
        <DialogFooter>
          <Button disabled={!name || !email || isPending} onClick={handleCreate}>
            {isPending ? "Adding…" : "Add user"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RoleSelect({ user }: { user: UserItem }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div>
      <Select
        value={user.role}
        onValueChange={(v) =>
          v &&
          startTransition(async () => {
            setError(null);
            const result = await updateUserRole(user.id, v as UserRole);
            if (result?.error) setError(result.error);
          })
        }
      >
        <SelectTrigger size="sm" disabled={isPending} className="w-36">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="team_member">Team member</SelectItem>
          <SelectItem value="admin">Admin</SelectItem>
        </SelectContent>
      </Select>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
    </div>
  );
}

export function UserManagement({ users, isAdmin }: { users: UserItem[]; isAdmin: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-neutral-500">{users.length} user(s) with access.</p>
        {isAdmin ? <CreateUserDialog /> : null}
      </div>

      <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Name</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Email</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Role</th>
              <th className="px-3 py-2 text-left font-medium text-neutral-600">Added</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-neutral-100">
                <td className="px-3 py-2 font-medium text-neutral-900">{user.name}</td>
                <td className="px-3 py-2 text-neutral-600">{user.email}</td>
                <td className="px-3 py-2">
                  {isAdmin ? <RoleSelect user={user} /> : <Badge variant="secondary">{user.role}</Badge>}
                </td>
                <td className="px-3 py-2 text-neutral-500">{user.createdAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
