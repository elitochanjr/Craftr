"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background sticky top-0 z-40">
      <h1 className="font-semibold text-base">{title}</h1>
      <div className="flex items-center gap-2">
        {/* Notification bell — wired up in the Notifications slice */}
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
