import { signOutAction } from "@/lib/auth-actions";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PendingApprovalPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-4">
            <Clock className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Awaiting approval</h1>
          <p className="text-sm text-muted-foreground">
            Your account has been created and is pending approval by an
            administrator. You&apos;ll be able to sign in once approved.
          </p>
        </div>

        <form action={signOutAction}>
          <Button variant="outline" type="submit" className="w-full">
            Sign out
          </Button>
        </form>
      </div>
    </div>
  );
}
