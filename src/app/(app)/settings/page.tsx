import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { ThemeSettings } from "@/components/settings/theme-settings";
import Link from "next/link";
import { Users, ChevronRight } from "lucide-react";

export default async function SettingsPage() {
  const session = await requireAuth();
  const accent = session.user.accentColor ?? "neutral";
  const isAdmin = session.user.role === "ADMIN";

  return (
    <>
      <Header title="Settings" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-10">
          {/* Appearance */}
          <div>
            <h2 className="text-xl font-semibold tracking-tight mb-1">
              Appearance
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Customize how Craftr looks for you.
            </p>
            <ThemeSettings initialAccent={accent} />
          </div>

          {/* Admin: User management */}
          {isAdmin && (
            <div>
              <h2 className="text-xl font-semibold tracking-tight mb-1">
                Administration
              </h2>
              <p className="text-sm text-muted-foreground mb-4">
                Manage team members and access.
              </p>
              <Link
                href="/settings/users"
                className="flex items-center justify-between px-4 py-3.5 rounded-lg border border-border hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">User Management</p>
                    <p className="text-xs text-muted-foreground">
                      Invite users, manage roles, deactivate accounts
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
