"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Compass,
  CalendarDays,
  Sparkles,
  Settings,
  ShieldAlert,
  LogOut,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Layers,
  FileCheck2,
  QrCode,
  Trophy,
  Award,
  Bot,
} from "lucide-react";
import { Badge } from "../ui/badge";

export function Sidebar() {
  const pathname = usePathname();
  const { user, role, logout } = useAuth();
  const [collapsed, setCollapsed] = React.useState(false);

  const mainNavItems = [
    {
      title: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator", "student"],
    },
    {
      title: "Clubs & Societies",
      href: "/clubs",
      icon: Compass,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator", "student"],
    },
    {
      title: "Club Day Calendar",
      href: "/calendar",
      icon: CalendarDays,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator", "student"],
    },
    {
      title: "Campus Events",
      href: "/events",
      icon: Trophy,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator", "student"],
    },
    {
      title: "QR Check-In",
      href: "/checkin",
      icon: QrCode,
      roles: ["student", "student_coordinator", "admin"],
    },
    {
      title: "Activity Planning",
      href: "/activities",
      icon: Sparkles,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator"],
    },
    {
      title: "Duty Leave",
      href: "/duty-leave",
      icon: FileCheck2,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator", "student"],
    },
    {
      title: "Co-Curricular Transcript",
      href: "/transcript",
      icon: Award,
      roles: ["admin", "campus_manager", "faculty_advisor", "student_coordinator", "student"],
    },
  ];

  const adminNavItems = [
    {
      title: "Club Management",
      href: "/clubs/manage",
      icon: Layers,
      roles: ["admin", "campus_manager"],
    },
    {
      title: "Users & Roles",
      href: "/admin/users",
      icon: Users,
      roles: ["admin"],
    },
    {
      title: "System Settings",
      href: "/admin/settings",
      icon: Settings,
      roles: ["admin"],
    },
    {
      title: "Audit Log",
      href: "/admin/audit",
      icon: ShieldAlert,
      roles: ["admin"],
    },
    {
      title: "Lumi Assistant",
      href: "/admin/lumi",
      icon: Bot,
      roles: ["admin"],
    },
  ];

  const visibleMainNav = mainNavItems.filter((item) => item.roles.includes(role));
  const visibleAdminNav = adminNavItems.filter((item) => item.roles.includes(role));

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-full min-h-0 shrink-0 border-r border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-950/80 backdrop-blur-xl transition-all duration-300 relative z-30 shadow-xs dark:shadow-none select-none",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* 1. Top Header / Branding (Fixed Height, Shrink-0) */}
      <div className="flex h-16 shrink-0 items-center justify-between px-4 border-b border-slate-200 dark:border-navy-800">
        {!collapsed ? (
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-navy-950 border border-cyan-500/30 p-1 shadow-xs group-hover:border-cyan-400 transition-colors">
              <Image
                src="/logos/track-stack-mark.png"
                alt="Track Stack"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-heading text-base font-bold tracking-tight text-slate-900 dark:text-white">
                TRACK <span className="gradient-text">STACK</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-muted-foreground uppercase tracking-widest font-mono">
                MSOT Campus OS
              </span>
            </div>
          </Link>
        ) : (
          <Link href="/" className="mx-auto block">
            <div className="relative h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-navy-950 border border-cyan-500/30 p-1 shadow-xs hover:border-cyan-400 transition-colors">
              <Image
                src="/logos/track-stack-mark.png"
                alt="Track Stack"
                width={28}
                height={28}
                className="object-contain"
              />
            </div>
          </Link>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-navy-800 bg-slate-100 dark:bg-navy-900 text-slate-600 dark:text-muted-foreground hover:bg-slate-200 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-foreground transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </button>
      </div>

      {/* 2. Navigation Links (Independently Scrollable with Custom Scrollbar) */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-4 custom-scrollbar">
        {/* Main Section */}
        <div className="space-y-0.5">
          {!collapsed && (
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Navigation
            </div>
          )}
          {visibleMainNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-xs font-semibold"
                    : "text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-foreground"
                )}
                title={collapsed ? item.title : undefined}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    isActive
                      ? "text-cyan-700 dark:text-cyan-400"
                      : "text-slate-500 dark:text-muted-foreground group-hover:text-slate-900 dark:group-hover:text-foreground"
                  )}
                />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </div>

        {/* Administration Section (If Available for Role) */}
        {visibleAdminNav.length > 0 && (
          <div className="space-y-0.5 pt-1 border-t border-slate-200/60 dark:border-navy-800/60">
            {!collapsed && (
              <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Administration
              </div>
            )}
            {visibleAdminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs md:text-sm font-medium transition-all duration-150 group",
                    isActive
                      ? "bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-xs font-semibold"
                      : "text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-foreground"
                  )}
                  title={collapsed ? item.title : undefined}
                >
                  <Icon
                    className={cn(
                      "h-4.5 w-4.5 shrink-0 transition-colors",
                      isActive
                        ? "text-cyan-700 dark:text-cyan-400"
                        : "text-slate-500 dark:text-muted-foreground group-hover:text-slate-900 dark:group-hover:text-foreground"
                    )}
                  />
                  {!collapsed && <span className="truncate">{item.title}</span>}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. User Info & Footer (Pinned at Bottom, Never Clipped) */}
      <div className="shrink-0 p-3 border-t border-slate-200 dark:border-navy-800 bg-slate-50/70 dark:bg-navy-950/70">
        {!collapsed ? (
          <div className="rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/60 p-2.5 mb-2 shadow-xs">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[130px]">
                {user?.full_name || "User"}
              </span>
              <Badge variant="gradient" className="text-[10px] px-1.5 py-0 capitalize">
                {role.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-muted-foreground truncate font-mono">
              {user?.email}
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-1.5">
          <Link
            href="/profile"
            className={cn(
              "flex flex-1 items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs text-slate-600 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-navy-850 hover:text-slate-900 dark:hover:text-foreground transition-colors",
              collapsed && "justify-center px-0"
            )}
            title="Profile"
          >
            <GraduationCap className="h-4 w-4 shrink-0" />
            {!collapsed && <span>My Profile</span>}
          </Link>

          <button
            onClick={logout}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 text-slate-600 dark:text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-500/30 transition-colors"
            title="Logout"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
