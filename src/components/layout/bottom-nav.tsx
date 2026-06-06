"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MoreHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";

const primaryTabs = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
];

const morePaths = ["/projects", "/customers", "/suppliers", "/categories", "/reports", "/settings"];

export function BottomNav() {
  const pathname = usePathname();
  const isMoreActive = morePaths.some((p) => pathname.startsWith(p));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm h-16 px-2">
      {primaryTabs.map(({ href, label, icon: Icon }) => {
        const isActive =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-md text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </Link>
        );
      })}

      {/* More tab */}
      <Link
        href="/projects"
        className={cn(
          "flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-md text-xs font-medium transition-colors",
          isMoreActive ? "text-primary" : "text-muted-foreground"
        )}
      >
        <MoreHorizontal className="h-5 w-5" />
        <span>More</span>
      </Link>
    </nav>
  );
}
