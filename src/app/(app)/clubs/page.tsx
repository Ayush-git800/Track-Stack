"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Club, ClubCategory } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClubLogo } from "@/components/ui/club-logo";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Users,
  MapPin,
  Clock,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
} from "lucide-react";

export default function ClubsPage() {
  const { user } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("All");
  const [selectedCampus, setSelectedCampus] = React.useState<string>("c1111111-1111-1111-1111-111111111111");

  // Join Modal state
  const [joinModalClub, setJoinModalClub] = React.useState<Club | null>(null);
  const [designation, setDesignation] = React.useState<"primary" | "secondary">("primary");
  const [joinNote, setJoinNote] = React.useState("");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const clubs = appStore.getClubs(selectedCampus);
  const studentMemberships = user ? appStore.getStudentMemberships(user.id) : [];
  const maxClubsAllowed = user ? appStore.getStudentAllowedClubs(user) : 2;
  const activeMembershipsCount = studentMemberships.filter(
    (m) => m.status === "approved" || m.status === "pending"
  ).length;

  const categories = ["All", "Technical", "Cultural", "Sports", "Entrepreneurship", "Parent Society"];

  const filteredClubs = clubs.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "All" || c.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinModalClub || !user) return;

    const result = appStore.requestJoinClub(
      joinModalClub.id,
      user,
      designation,
      joinNote
    );

    if (result.success) {
      toast.success(result.message);
      setJoinModalClub(null);
      setJoinNote("");
    } else {
      toast.error(result.message);
    }
  };

  const kaizenParent = clubs.find((c) => c.code === "KAIZEN_SOCIETY");

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Societies & Clubs Directory
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse Delhi-NCR student societies, sub-clubs, and join open enrolments.
          </p>
        </div>

        {/* Enrolment Status Pill */}
        {user && (
          <div className="flex items-center gap-2 rounded-xl border border-navy-800 bg-navy-900/80 px-3.5 py-2 shadow-sm">
            <Users className="h-4 w-4 text-cyan-400" />
            <div className="text-xs">
              <span className="text-muted-foreground">My Enrolments: </span>
              <strong className="text-white">
                {activeMembershipsCount} of {maxClubsAllowed} clubs used
              </strong>
            </div>
          </div>
        )}
      </div>

      {/* Kaizen Parent Society Special Banner */}
      {kaizenParent && selectedCategory === "All" && (
        <Card className="glass-card gradient-border-top border-teal-500/30 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <ClubLogo
                  name={kaizenParent.name}
                  logoUrl={kaizenParent.logo_url}
                  accentColor={kaizenParent.accent_color}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-heading text-xl font-bold text-white">
                      Kaizen Society & Its Sub-Clubs
                    </h3>
                    <Badge variant="outline" className="border-teal-400/40 text-teal-400">
                      Technical Club &bull; 3 Sub-Clubs
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
                    Kaizen Society is the flagship engineering club featuring three specialized sub-clubs: <strong>Dev Club</strong> (Kaizen Dev Club), <strong>CP Club</strong>, and <strong>KI</strong> (Kaizen Intelligence).
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span className="rounded-md border border-teal-500/20 bg-teal-500/10 px-2 py-0.5 text-teal-300">
                      Dev Club (Software)
                    </span>
                    <span className="rounded-md border border-lime-500/20 bg-lime-500/10 px-2 py-0.5 text-lime-300">
                      CP Club (Algorithms)
                    </span>
                    <span className="rounded-md border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-yellow-300">
                      KI (Kaizen Intelligence - AI)
                    </span>
                  </div>
                </div>
              </div>
              <Link href={`/clubs/society/${kaizenParent.id}`}>
                <Button variant="outline" size="sm" className="border-teal-500/40 text-teal-300 hover:bg-teal-500/10 gap-1.5 shrink-0">
                  <Layers className="h-4 w-4" /> View Kaizen Sub-Clubs &rarr;
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search clubs by name, code, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Campus Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCampus}
            onChange={(e) => setSelectedCampus(e.target.value)}
            className="h-11 rounded-xl border border-navy-800 bg-navy-900/80 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="c1111111-1111-1111-1111-111111111111">Delhi-NCR (Primary)</option>
            <option value="c2222222-2222-2222-2222-222222222222">Bangalore Campus</option>
            <option value="c3333333-3333-3333-3333-333333333333">Jaipur Campus</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === cat
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm"
                : "bg-navy-900/60 text-muted-foreground border border-navy-800 hover:text-white hover:border-navy-700"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Clubs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClubs.map((club) => {
          const userMembership = studentMemberships.find((m) => m.club_id === club.id);
          const isParent = club.category === "Parent Society";
          const enrolled = club.enrolled_count || 0;
          const isAtCapacity = enrolled >= club.capacity;

          return (
            <Card
              key={club.id}
              className="flex flex-col justify-between overflow-hidden border-navy-800 bg-navy-900/80 hover:border-navy-700 transition-all duration-200 group"
              gradientBorder={Boolean(userMembership)}
            >
              <CardContent className="p-5 flex-1">
                {/* Header: Logo, Name, Badge */}
                <div className="flex items-start gap-3.5 mb-3.5">
                  <ClubLogo
                    name={club.name}
                    logoUrl={club.logo_url}
                    accentColor={club.accent_color}
                    size="md"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-heading text-base font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {club.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-mono text-cyan-400 font-medium">
                        {club.code}
                      </span>
                      <span className="text-muted-foreground text-xs">&bull;</span>
                      <span className="text-[11px] text-muted-foreground">{club.category}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-4">
                  {club.description}
                </p>

                {/* Meeting Rules */}
                <div className="space-y-1.5 rounded-xl border border-navy-800 bg-navy-950/60 p-2.5 text-xs text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{club.meeting_day} &bull; {club.meeting_time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{club.meeting_venue}</span>
                  </div>
                </div>

                {/* Capacity Progress Bar */}
                <div className="space-y-1 mb-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Club Capacity</span>
                    <span className="font-mono font-medium text-white">
                      {enrolled} / {club.capacity} seats
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-navy-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAtCapacity ? "bg-amber-400" : "bg-cyan-400"
                      }`}
                      style={{ width: `${Math.min(100, (enrolled / club.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>

              {/* Card Footer Actions */}
              <div className="p-5 pt-0 border-t border-navy-800/60 flex items-center justify-between gap-2 mt-auto">
                <Link
                  href={isParent ? `/clubs/society/${club.id}` : `/clubs/${club.id}`}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  View Details &rarr;
                </Link>

                {/* Enrolment Button / Status */}
                {isParent ? (
                  <Badge variant="outline" className="border-teal-500/40 text-teal-400 text-xs">
                    Parent Society
                  </Badge>
                ) : userMembership ? (
                  <Badge
                    variant={
                      userMembership.status === "approved"
                        ? "success"
                        : userMembership.status === "waitlisted"
                        ? "warning"
                        : "secondary"
                    }
                    className="capitalize text-xs font-semibold px-2.5 py-1"
                  >
                    {userMembership.status === "approved" ? "Enrolled" : userMembership.status}
                    {userMembership.waitlist_position ? ` #${userMembership.waitlist_position}` : ""}
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant={isAtCapacity ? "secondary" : "gradient"}
                    onClick={() => setJoinModalClub(club)}
                    disabled={activeMembershipsCount >= maxClubsAllowed}
                    title={
                      activeMembershipsCount >= maxClubsAllowed
                        ? `Maximum limit of ${maxClubsAllowed} clubs reached`
                        : undefined
                    }
                  >
                    {isAtCapacity ? "Join Waitlist" : "Join Club"}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Join Club Modal Dialog */}
      {joinModalClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setJoinModalClub(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <ClubLogo
                name={joinModalClub.name}
                logoUrl={joinModalClub.logo_url}
                accentColor={joinModalClub.accent_color}
                size="md"
              />
              <div>
                <h3 className="font-heading text-lg font-bold text-white">
                  Join {joinModalClub.name}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  {joinModalClub.code} &bull; {joinModalClub.category}
                </p>
              </div>
            </div>

            {/* Limit Warning / Check */}
            {activeMembershipsCount >= maxClubsAllowed ? (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300 mb-4 flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <strong className="block font-semibold">2-Club Membership Limit Reached</strong>
                  Students are allowed a maximum of {maxClubsAllowed} active club enrolments. You must withdraw from one of your existing clubs before joining {joinModalClub.name}.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-xs text-cyan-300 mb-4 flex items-center justify-between">
                <span>Current Enrolments:</span>
                <strong>{activeMembershipsCount} of {maxClubsAllowed} clubs used</strong>
              </div>
            )}

            {/* Capacity check notice */}
            {(joinModalClub.enrolled_count || 0) >= joinModalClub.capacity && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 mb-4 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>
                  Notice: This club is currently at capacity ({joinModalClub.capacity}/{joinModalClub.capacity}). You will be automatically placed on the waitlist with automatic promotion when a seat opens.
                </span>
              </div>
            )}

            <form onSubmit={handleJoinSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Enrolment Designation
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                      designation === "primary"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-white font-medium"
                        : "border-navy-800 bg-navy-950/60 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="designation"
                      checked={designation === "primary"}
                      onChange={() => setDesignation("primary")}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-white">Primary Club</div>
                      <div className="text-[10px] text-muted-foreground">Primary focus & major activities</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center gap-2 rounded-xl border p-3 text-xs cursor-pointer transition-colors ${
                      designation === "secondary"
                        ? "border-cyan-500/40 bg-cyan-500/10 text-white font-medium"
                        : "border-navy-800 bg-navy-950/60 text-muted-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="designation"
                      checked={designation === "secondary"}
                      onChange={() => setDesignation("secondary")}
                      className="sr-only"
                    />
                    <div>
                      <div className="font-semibold text-white">Secondary Club</div>
                      <div className="text-[10px] text-muted-foreground">Secondary interest & events</div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Statement of Interest (Optional)
                </label>
                <Textarea
                  placeholder="Share your background, skills, or why you want to join this club..."
                  value={joinNote}
                  onChange={(e) => setJoinNote(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setJoinModalClub(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gradient"
                  disabled={activeMembershipsCount >= maxClubsAllowed}
                >
                  Confirm Request
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
