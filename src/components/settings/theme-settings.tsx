"use client";

import { useTheme } from "next-themes";
import { useOptimistic, useTransition } from "react";
import { saveAccentColorAction } from "@/app/(app)/settings/actions";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const ACCENT_PRESETS = [
  { name: "neutral", label: "Neutral", swatch: "bg-zinc-800 dark:bg-zinc-200" },
  { name: "rose", label: "Rose", swatch: "bg-rose-500" },
  { name: "violet", label: "Violet", swatch: "bg-violet-600" },
  { name: "blue", label: "Blue", swatch: "bg-blue-600" },
  { name: "green", label: "Green", swatch: "bg-green-600" },
  { name: "orange", label: "Orange", swatch: "bg-orange-500" },
] as const;

type AccentName = (typeof ACCENT_PRESETS)[number]["name"];

interface ThemeSettingsProps {
  initialAccent: string;
}

export function ThemeSettings({ initialAccent }: ThemeSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [, startTransition] = useTransition();
  const [optimisticAccent, setOptimisticAccent] = useOptimistic(
    (initialAccent || "neutral") as AccentName
  );

  function handleAccentChange(accent: AccentName) {
    startTransition(async () => {
      setOptimisticAccent(accent);
      // Update the html data-accent attribute immediately
      document.documentElement.setAttribute("data-accent", accent);
      await saveAccentColorAction(accent);
    });
  }

  return (
    <div className="max-w-lg space-y-8">
      {/* Light / Dark */}
      <section className="space-y-3">
        <div>
          <h3 className="font-medium text-sm">Appearance</h3>
          <p className="text-xs text-muted-foreground">
            Choose light or dark mode.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={theme === "light" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("light")}
            className="gap-2"
          >
            <Sun className="h-4 w-4" />
            Light
          </Button>
          <Button
            variant={theme === "dark" ? "default" : "outline"}
            size="sm"
            onClick={() => setTheme("dark")}
            className="gap-2"
          >
            <Moon className="h-4 w-4" />
            Dark
          </Button>
        </div>
      </section>

      {/* Accent color */}
      <section className="space-y-3">
        <div>
          <h3 className="font-medium text-sm">Accent color</h3>
          <p className="text-xs text-muted-foreground">
            Personalise buttons, active states, and focus rings.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {ACCENT_PRESETS.map(({ name, label, swatch }) => (
            <button
              key={name}
              onClick={() => handleAccentChange(name)}
              title={label}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md p-2 transition-all",
                "hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                optimisticAccent === name && "ring-2 ring-ring bg-muted"
              )}
            >
              <span className={cn("h-8 w-8 rounded-full block", swatch)} />
              <span className="text-xs text-muted-foreground">{label}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
