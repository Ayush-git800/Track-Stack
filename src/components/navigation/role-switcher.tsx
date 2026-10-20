"use client";

import * as React from "react";
import { useAuth } from "@/lib/auth-context";
import { UserRole } from "@/lib/types";
import { ShieldCheck, UserCheck, GraduationCap, Award, User, ChevronDown } from "lucide-react";
import { Badge } from "../ui/badge";

const ROLE_CONFIG: Record<
  UserRole,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string; desc: string }
> = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
    color: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
    desc: "Full Control (Ayush Chauhan)",
  },
  campus_manager: {
    label: "Campus Manager",
    icon: UserCheck,
    color: "border-blue-500/40 text-blue-400 bg-blue-500/10",
    desc: "Delhi Campus (Sundaram Mishra)",
  },
  faculty_advisor: {
    label: "Faculty Advisor",
    icon: GraduationCap,
    color: "border-purple-500/40 text-purple-400 bg-purple-500/10",
    desc: "Kaizen Dev Advisor (Gaurav Kumar)",
  },
  student_coordinator: {
    label: "Coordinator",
    icon: Award,
    color: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
    desc: "Kaizen Dev Lead (Rishav Raj)",
  },
  student: {
    label: "Student",
    icon: User,
    color: "border-amber-500/40 text-amber-400 bg-amber-500/10",
    desc: "Chintu (2 Clubs)",
  },
};

export function RoleSwitcher() {
  const { role, switchRole, user } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);
  const current = ROLE_CONFIG[role];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-navy-800 bg-navy-900/90 px-3 py-1.5 text-xs text-muted-foreground hover:border-navy-700 hover:text-foreground transition-all shadow-sm"
        title="Quick Role Switcher for Evaluation"
      >
        <div className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="font-semibold text-foreground flex items-center gap-1.5">
          <Icon className="h-3.5 w-3.5 text-cyan-500 dark:text-cyan-400" />
          {current.label}
        </span>
        <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-navy-800 bg-navy-900/95 p-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95">
          <div className="px-3 py-2 border-b border-navy-800 mb-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Instant Demo Role Switcher
            </p>
            <p className="text-xs text-foreground truncate font-medium">
              Active: {user?.full_name}
            </p>
          </div>
          <div className="space-y-1">
            {(Object.keys(ROLE_CONFIG) as UserRole[]).map((r) => {
              const cfg = ROLE_CONFIG[r];
              const ItemIcon = cfg.icon;
              const isSelected = r === role;
              return (
                <button
                  key={r}
                  onClick={() => {
                    switchRole(r);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs transition-colors ${
                    isSelected
                      ? "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 font-semibold"
                      : "text-muted-foreground hover:bg-navy-850 hover:text-foreground"
                  }`}
                >
                  <ItemIcon className="h-4 w-4 shrink-0 text-cyan-600 dark:text-cyan-400" />
                  <div className="flex-1 truncate">
                    <div className="font-semibold text-foreground">{cfg.label}</div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {cfg.desc}
                    </div>
                  </div>
                  {isSelected && (
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
