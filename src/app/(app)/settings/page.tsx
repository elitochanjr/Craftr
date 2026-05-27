import { requireAuth } from "@/lib/auth-helpers";
import { Header } from "@/components/layout/header";
import { ThemeSettings } from "@/components/settings/theme-settings";

export default async function SettingsPage() {
  const session = await requireAuth();
  const accent = session.user.accentColor ?? "neutral";

  return (
    <>
      <Header title="Settings" />
      <div className="p-6">
        <div className="max-w-2xl mx-auto space-y-10">
          <div>
            <h2 className="text-xl font-semibold tracking-tight mb-1">
              Appearance
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Customize how Craftr looks for you.
            </p>
            <ThemeSettings initialAccent={accent} />
          </div>
        </div>
      </div>
    </>
  );
}
