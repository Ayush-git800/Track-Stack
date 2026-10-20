"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Compass,
  CalendarDays,
  Sparkles,
  User,
  Settings,
} from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const { role } = useAuth();

  const primaryItems = [
    { title: "Home", href: "/dashboard", icon: LayoutDashboard },
    { title: "Clubs", href: "/clubs", icon: Compass },
    { title: "Calendar", href: "/calendar", icon: CalendarDays },
    role === "admin"
      ? { title: "Admin", href: "/admin/settings", icon: Settings }
      : { title: "Activities", href: "/activities", icon: Sparkles },
    { title: "Profile", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-navy-800 bg-navy-950/95 backdrop-blur-xl px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around">
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-3 rounded-xl transition-all duration-150",
                isActive ? "text-cyan-600 dark:text-cyan-400 font-semibold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-0.5", isActive && "scale-110")} />
              <span className="text-[10px] tracking-tight">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
