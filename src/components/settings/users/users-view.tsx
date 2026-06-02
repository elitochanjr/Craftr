"use client";

import { useState, useTransition } from "react";
import type { User, Invitation, Role } from "@/generated/prisma/client";
import {
  inviteUserAction,
  updateUserRoleAction,
  deactivateUserAction,
  reactivateUserAction,
  revokeInvitationAction,
} from "@/app/(app)/settings/users/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { UserPlus, Ban, CheckCircle, Trash2, Mail } from "lucide-react";

interface UsersViewProps {
  users: User[];
  pendingInvitations: Invitation[];
  currentUserId: string;
}

export function UsersView({
  users,
  pendingInvitations,
  currentUserId,
}: UsersViewProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("STAFF");
  const [inviteSuccess, setInviteSuccess] = useState(false);

  function handleInvite() {
    setError(null);
    startTransition(async () => {
      const res = await inviteUserAction(inviteEmail, inviteRole);
      if (res.error) {
        setError(res.error);
      } else {
        setInviteSuccess(true);
        setInviteEmail("");
      }
    });
  }

  function handleRoleChange(userId: string, role: Role) {
    startTransition(async () => {
      await updateUserRoleAction(userId, role);
    });
  }

  function handleDeactivate(userId: string) {
    startTransition(async () => {
      const res = await deactivateUserAction(userId);
      if (res.error) setError(res.error);
    });
  }

  function handleReactivate(userId: string) {
    startTransition(async () => {
      await reactivateUserAction(userId);
    });
  }

  function handleRevokeInvite(id: string) {
    startTransition(async () => {
      await revokeInvitationAction(id);
    });
  }

  return (
    <div className="space-y-8">
      {/* Error banner */}
      {error && (
        <div className="rounded-md bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Users table */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-medium">Team members</h3>
            <p className="text-xs text-muted-foreground">
              {users.length} user{users.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setInviteOpen(true);
              setInviteSuccess(false);
              setError(null);
            }}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Invite user
          </Button>
        </div>

        <div className="rounded-lg border border-border divide-y divide-border">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex items-center justify-between px-4 py-3 gap-3"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">
                    {u.name ?? u.email}
                  </p>
                  {u.status === "INACTIVE" && (
                    <Badge variant="secondary" className="text-xs shrink-0">
                      Deactivated
                    </Badge>
                  )}
                  {u.id === currentUserId && (
                    <Badge variant="outline" className="text-xs shrink-0">
                      You
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {u.email}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Select
                  value={u.role}
                  onValueChange={(v) => handleRoleChange(u.id, v as Role)}
                  disabled={u.id === currentUserId}
                >
                  <SelectTrigger className="h-7 text-xs w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="STAFF">Staff</SelectItem>
                  </SelectContent>
                </Select>

                {u.id !== currentUserId && (
                  <>
                    {u.status === "ACTIVE" ? (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        onClick={() => handleDeactivate(u.id)}
                        title="Deactivate"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground"
                        onClick={() => handleReactivate(u.id)}
                        title="Reactivate"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pending invitations */}
      {pendingInvitations.length > 0 && (
        <section>
          <h3 className="font-medium mb-4">Pending invitations</h3>
          <div className="rounded-lg border border-border divide-y divide-border">
            {pendingInvitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between px-4 py-3 gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <p className="text-sm truncate">{inv.email}</p>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {inv.role}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground ml-5.5">
                    Expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleRevokeInvite(inv.id)}
                  title="Revoke invitation"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Invite dialog */}
      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open);
          if (!open) setInviteSuccess(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite user</DialogTitle>
          </DialogHeader>

          {inviteSuccess ? (
            <>
              <div className="flex flex-col items-center py-4 text-center gap-2">
                <CheckCircle className="h-8 w-8 text-primary" />
                <p className="font-medium text-sm">Invitation sent!</p>
                <p className="text-xs text-muted-foreground">
                  They&apos;ll receive an email with a link to set their
                  password.
                  <br />
                  (If Resend isn&apos;t configured, check the server log for the
                  link.)
                </p>
              </div>
              <DialogFooter>
                <Button onClick={() => setInviteOpen(false)} className="w-full">
                  Done
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              {error && (
                <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="inv-email">Email address</Label>
                  <Input
                    id="inv-email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="newuser@example.com"
                    autoFocus
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select
                    value={inviteRole}
                    onValueChange={(v) => setInviteRole(v as Role)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" />}>
                  Cancel
                </DialogClose>
                <Button
                  onClick={handleInvite}
                  disabled={!inviteEmail.trim()}
                >
                  Send invitation
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
