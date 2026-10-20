"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, Bell, MapPin, CheckCircle2, ExternalLink } from "lucide-react";
import { ThemeToggle } from "../ui/theme-toggle";
import { RoleSwitcher } from "./role-switcher";
import { useAuth } from "@/lib/auth-context";
import { appStore } from "@/lib/store";
import { Badge } from "../ui/badge";

export function Header() {
  const { user } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [showNotifications, setShowNotifications] = React.useState(false);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const notifications = user
    ? storeState.notifications.filter((n) => n.user_id === user.id || n.user_id === "s0000000-0000-0000-0000-0000000000100")
    : storeState.notifications.slice(0, 5);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    if (user) {
      appStore.markAllNotificationsRead(user.id);
      appStore.markAllNotificationsRead("s0000000-0000-0000-0000-0000000000100");
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-navy-800 bg-white/90 dark:bg-navy-950/70 px-4 md:px-6 backdrop-blur-xl shadow-xs dark:shadow-none">
      {/* Left: Mobile Brand & Global Search */}
      <div className="flex items-center gap-3 md:gap-4 flex-1 max-w-lg">
        <Link href="/" className="md:hidden flex items-center gap-2">
          <div className="relative h-8 w-8 shrink-0 flex items-center justify-center rounded-xl bg-navy-950 border border-cyan-500/30 p-1 shadow-sm">
            <Image
              src="/logos/track-stack-mark.png"
              alt="Track Stack"
              width={24}
              height={24}
              className="object-contain"
            />
          </div>
        </Link>

        {/* Global Search Placeholder */}
        <div className="relative w-full max-w-md hidden sm:block">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-muted-foreground" />
          <input
            type="text"
            placeholder="Search clubs, activities, student IDs..."
            className="w-full h-9 rounded-xl border border-slate-300 dark:border-navy-800 bg-slate-100 dark:bg-navy-900/60 pl-9 pr-4 text-xs text-slate-900 dark:text-foreground placeholder:text-slate-400 dark:placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 transition-all"
            readOnly
            onClick={() => alert("Global quick search is active across all campuses.")}
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex h-4 items-center gap-1 rounded border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950 px-1 text-[10px] font-mono text-slate-500 dark:text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        {/* Campus indicator */}
        <div className="hidden lg:flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-100/80 dark:bg-navy-900/40 px-2.5 py-1 text-xs text-slate-600 dark:text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400" />
          <span>Delhi-NCR Campus</span>
        </div>
      </div>

      {/* Right Controls: Role Switcher, Notification, Theme, Profile */}
      <div className="flex items-center gap-2 md:gap-3">
        <RoleSwitcher />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-100 dark:bg-navy-900/60 text-slate-600 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-foreground transition-colors"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-cyan-500 text-[9px] font-bold text-navy-950 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-slate-200 dark:border-navy-800 bg-white/95 dark:bg-navy-900/95 p-4 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-navy-800 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">Notification Centre</span>
                  {unreadCount > 0 && (
                    <Badge variant="gradient" className="text-[9px] px-1.5 py-0">
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-medium"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No new notifications right now.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => appStore.markNotificationRead(n.id)}
                      className={`rounded-xl border p-3 text-xs transition-all cursor-pointer ${
                        n.read
                          ? "border-slate-100 dark:border-navy-850 bg-slate-50/50 dark:bg-navy-950/40 text-muted-foreground"
                          : "border-cyan-500/30 bg-cyan-500/5 text-foreground shadow-xs"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-xs leading-snug">{n.title}</p>
                        {!n.read && (
                          <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0 mt-1" />
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {n.message}
                      </p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-navy-850/50 text-[10px]">
                        <span className="font-mono text-muted-foreground">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {n.link_url && (
                          <Link
                            href={n.link_url}
                            onClick={() => setShowNotifications(false)}
                            className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold hover:underline"
                          >
                            Open <ExternalLink className="h-2.5 w-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <ThemeToggle />

        {/* User Mini Badge */}
        <Link
          href="/profile"
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 text-cyan-300 font-semibold text-xs shadow-sm hover:scale-105 transition-transform"
          title={`Signed in as ${user?.full_name}`}
        >
          {user?.full_name?.charAt(0) || "U"}
        </Link>
      </div>
    </header>
  );
}
