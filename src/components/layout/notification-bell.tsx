"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markNotificationReadAction,
  markAllReadAction,
  type NotificationRow,
} from "@/app/(app)/notifications/actions";

interface NotificationBellProps {
  initialNotifications: NotificationRow[];
}

export function NotificationBell({ initialNotifications }: NotificationBellProps) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const count = notifications.length;

  function handleMarkRead(n: NotificationRow) {
    setNotifications((prev) => prev.filter((x) => x.id !== n.id));
    startTransition(async () => {
      await markNotificationReadAction(n.id);
      // Navigate to the item if applicable
      if (n.item) {
        router.push(`/inventory?item=${n.item.id}`);
      }
    });
  }

  function handleMarkAllRead() {
    setNotifications([]);
    startTransition(async () => {
      await markAllReadAction();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
          className="relative"
        >
          <Bell className="h-4 w-4" />
          {count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center leading-none">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          {count > 0 && (
            <button
              onClick={handleMarkAllRead}
              disabled={isPending}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-muted-foreground">
            No unread notifications
          </p>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              className="flex flex-col items-start gap-1 px-3 py-3 cursor-pointer"
              onClick={() => handleMarkRead(n)}
            >
              <span className="text-sm leading-snug">{n.message}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(n.createdAt).toLocaleString()}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
