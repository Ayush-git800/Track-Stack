"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { appStore } from "@/lib/store";
import { CampusEvent, EventTeam, EventRegistration } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  Calendar,
  MapPin,
  Users,
  Sparkles,
  Search,
  Plus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Globe,
  Filter,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

export default function EventsDirectoryPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Modal states
  const [selectedEventForReg, setSelectedEventForReg] = React.useState<CampusEvent | null>(null);
  const [regMode, setRegMode] = React.useState<"individual" | "team">("individual");
  const [teamName, setTeamName] = React.useState("");
  const [invitedMembers, setInvitedMembers] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const events = storeState.events || [];
  const registrations = storeState.eventRegistrations || [];
  const teams = storeState.eventTeams || [];

  const categories = ["All", "Inter-Campus", "Sports", "Technical", "Academic", "Cultural"];

  const filteredEvents = events.filter((e) => {
    if (selectedCategory === "Inter-Campus" && !e.is_inter_campus) return false;
    if (selectedCategory !== "All" && selectedCategory !== "Inter-Campus" && e.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.code.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventForReg || !user) return;
    setIsSubmitting(true);

    try {
      if (regMode === "team") {
        if (!teamName.trim()) {
          toast.error("Please enter a team name.");
          setIsSubmitting(false);
          return;
        }

        const membersArray = invitedMembers
          .split(",")
          .map((m) => m.trim())
          .filter(Boolean);

        const res = appStore.createTeam(
          selectedEventForReg.id,
          teamName.trim(),
          user.id,
          membersArray
        );

        if (!res.success) {
          toast.error(res.message);
        } else {
          toast.success(res.message);
          setSelectedEventForReg(null);
          setTeamName("");
          setInvitedMembers("");
        }
      } else {
        const res = appStore.registerForEvent(
          selectedEventForReg.id,
          user.id,
          "individual"
        );

        if (!res.success) {
          toast.error(res.message);
        } else {
          toast.success(res.message);
          setSelectedEventForReg(null);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Heading */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="gradient" className="text-[10px] uppercase font-mono tracking-wider">
              Flagship Campus Championships
            </Badge>
            <span className="text-xs text-slate-500 dark:text-muted-foreground font-mono">
              Inter-Campus & Collegiate
            </span>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Flagship Events & Tournaments
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-muted-foreground mt-1">
            Participate in Gambade Olympiad, Hackathons, Conferences, and Cultural Showdowns.
          </p>
        </div>

        {/* Quick Duty Leave / Transcript shortcut */}
        <div className="flex items-center gap-2.5">
          <Link href="/duty-leave">
            <Button variant="secondary" size="sm" className="gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Duty Leave Requests
            </Button>
          </Link>
          <Link href="/transcript">
            <Button variant="gradient" size="sm" className="gap-1.5 shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              Co-Curricular Transcript
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search events by name, rules, or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                selectedCategory === cat
                  ? "bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-500/40 shadow-sm font-semibold"
                  : "bg-white dark:bg-navy-900/60 text-slate-600 dark:text-muted-foreground border border-slate-200 dark:border-navy-800 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredEvents.map((event) => {
          const userReg = user ? registrations.find((r) => r.event_id === event.id && r.user_id === user.id) : null;
          const eventTeamsList = teams.filter((t) => t.event_id === event.id);
          const confirmedCount = registrations.filter((r) => r.event_id === event.id && r.status === "confirmed").length;
          const isAtCapacity = confirmedCount >= event.capacity;

          return (
            <Card
              key={event.id}
              className="flex flex-col justify-between overflow-hidden border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900/80 shadow-sm dark:shadow-none hover:border-slate-300 dark:hover:border-navy-700 transition-all duration-200"
              gradientBorder={Boolean(userReg)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={event.is_inter_campus ? "gradient" : "outline"} className="text-[10px]">
                      {event.is_inter_campus ? "Inter-Campus Flagship" : event.campus_name || "Campus Level"}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {event.category}
                    </Badge>
                  </div>
                  <Badge
                    variant={
                      event.status === "live"
                        ? "success"
                        : event.status === "completed"
                        ? "secondary"
                        : "info"
                    }
                    className="capitalize text-[10px]"
                  >
                    {event.status}
                  </Badge>
                </div>

                <h3 className="font-heading text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-2 leading-tight">
                  {event.name}
                </h3>

                <p className="text-xs text-slate-600 dark:text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {event.description}
                </p>

                {/* Event Metadata Chips */}
                <div className="space-y-1.5 rounded-xl border border-slate-200 dark:border-navy-800 bg-slate-50 dark:bg-navy-950/60 p-3 text-xs text-slate-600 dark:text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>
                      {formatDate(event.start_date)} &bull; {event.schedule_details.substring(0, 48)}...
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span className="truncate">{event.venue}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                    <span>
                      Mode: <strong className="capitalize text-slate-800 dark:text-white">{event.mode}</strong> (
                      {event.min_team_size === event.max_team_size
                        ? `${event.min_team_size} members`
                        : `${event.min_team_size}-${event.max_team_size} members/team`}
                      )
                    </span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-muted-foreground">Registration Capacity</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-white">
                      {confirmedCount} / {event.capacity} spots
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-200 dark:bg-navy-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAtCapacity ? "bg-amber-500" : "bg-cyan-500"
                      }`}
                      style={{ width: `${Math.min(100, (confirmedCount / event.capacity) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* If user already registered */}
                {userReg && (
                  <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 p-2.5 text-xs text-emerald-800 dark:text-emerald-400 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="h-4 w-4" />
                      {userReg.team_name ? `Registered with Team: "${userReg.team_name}"` : "Registered as Individual"}
                    </span>
                    <Badge variant={userReg.status === "confirmed" ? "success" : "warning"} className="text-[10px]">
                      {userReg.status}
                    </Badge>
                  </div>
                )}
              </CardContent>

              {/* Card Footer Actions */}
              <CardFooter className="p-6 pt-0 border-t border-slate-200 dark:border-navy-800 flex items-center justify-between gap-3">
                <Link href={`/events/${event.id}`} className="text-xs font-medium text-cyan-600 dark:text-cyan-400 hover:underline">
                  View Rules & Teams ({eventTeamsList.length}) &rarr;
                </Link>

                <div className="flex items-center gap-2">
                  {!userReg && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        setSelectedEventForReg(event);
                        setRegMode(event.mode === "team" ? "team" : "individual");
                      }}
                      className="gap-1.5 shadow-sm"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Register Now
                    </Button>
                  )}

                  <Link href={`/events/${event.id}/results`}>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      Podium
                    </Button>
                  </Link>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Registration & Team Creation Modal */}
      {selectedEventForReg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedEventForReg(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-slate-200 dark:border-navy-800 flex items-center justify-center text-slate-500 dark:text-muted-foreground hover:text-slate-900 dark:hover:text-white"
            >
              &times;
            </button>

            <div className="mb-4">
              <Badge variant="outline" className="text-[10px] mb-1">
                {selectedEventForReg.category} &bull; {selectedEventForReg.code}
              </Badge>
              <h3 className="font-heading text-xl font-bold text-slate-900 dark:text-white">
                Register for {selectedEventForReg.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-muted-foreground mt-0.5">
                {selectedEventForReg.venue} &bull; {formatDate(selectedEventForReg.start_date)}
              </p>
            </div>

            {selectedEventForReg.is_inter_campus && (
              <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 p-3 text-xs text-cyan-800 dark:text-cyan-300">
                <strong>Inter-Campus Policy Notice:</strong> Registering for this event will automatically trigger an official <strong>Duty Leave Sanction Request</strong> routed to the Campus Manager.
              </div>
            )}

            <form onSubmit={handleRegisterSubmit} className="space-y-4 text-xs">
              {selectedEventForReg.mode === "both" && (
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1.5">
                    Registration Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setRegMode("individual")}
                      className={`py-2.5 rounded-xl border text-center font-medium transition-all ${
                        regMode === "individual"
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold"
                          : "border-slate-200 dark:border-navy-800 text-slate-600 dark:text-muted-foreground"
                      }`}
                    >
                      Individual Entry
                    </button>
                    <button
                      type="button"
                      onClick={() => setRegMode("team")}
                      className={`py-2.5 rounded-xl border text-center font-medium transition-all ${
                        regMode === "team"
                          ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 font-semibold"
                          : "border-slate-200 dark:border-navy-800 text-slate-600 dark:text-muted-foreground"
                      }`}
                    >
                      Create / Lead a Team
                    </button>
                  </div>
                </div>
              )}

              {regMode === "team" && (
                <>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Team Name *
                    </label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. Delhi Strikers, Neural Ninjas"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                      Invite Teammates (Student IDs or Emails, comma-separated)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. MSOT2024CS015, MSOT2024CS088"
                      value={invitedMembers}
                      onChange={(e) => setInvitedMembers(e.target.value)}
                    />
                    <p className="text-[10px] text-slate-500 dark:text-muted-foreground mt-1">
                      Invited students will be automatically registered with your team. Max team size: {selectedEventForReg.max_team_size} members.
                    </p>
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-navy-800 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedEventForReg(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="default" disabled={isSubmitting}>
                  {isSubmitting ? "Confirming..." : "Confirm Official Registration"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
