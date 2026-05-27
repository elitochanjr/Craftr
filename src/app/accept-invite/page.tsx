"use client";

import { useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { acceptInviteAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";

function AcceptInviteForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Invalid or missing invitation token.
        </AlertDescription>
      </Alert>
    );
  }

  function handleSubmit() {
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    startTransition(async () => {
      const res = await acceptInviteAction(token, name, password);
      if (res?.error) setError(res.error);
      // On success, signIn redirects — no further handling needed
    });
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className="space-y-4"
    >
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="ai-name">Your name</Label>
        <Input
          id="ai-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Jane Smith"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-password">Password</Label>
        <Input
          id="ai-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ai-confirm">Confirm password</Label>
        <Input
          id="ai-confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Setting up account…" : "Create account & sign in"}
      </Button>
    </form>
  );
}

export default function AcceptInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-1">
          <p className="text-3xl">✂️</p>
          <h1 className="text-2xl font-semibold tracking-tight">
            Join Craftr
          </h1>
          <p className="text-sm text-muted-foreground">
            Set your password to activate your account.
          </p>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-8">
              <CheckCircle className="h-5 w-5 animate-pulse text-muted-foreground" />
            </div>
          }
        >
          <AcceptInviteForm />
        </Suspense>
      </div>
    </div>
  );
}
