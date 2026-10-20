"use client";

import * as React from "react";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { Club, ClubCategory } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { ClubLogo } from "@/components/ui/club-logo";
import { toast } from "sonner";
import {
  Plus,
  Edit2,
  CheckCircle,
  Archive,
  Layers,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  X,
} from "lucide-react";

export default function ClubManagePage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [editingClub, setEditingClub] = React.useState<Partial<Club> | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  const clubs = storeState.clubs;
  const isAuthorized = role === "admin" || role === "campus_manager";

  if (!isAuthorized) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Only Admins and Campus Managers can manage the club registry.
        </p>
      </div>
    );
  }

  const handleOpenAdd = () => {
    setEditingClub({
      name: "",
      code: "",
      description: "",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Technical",
      capacity: 50,
      status: role === "admin" ? "approved" : "pending",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "",
      accent_color: "#3B82F6",
      logo_url: "/logos/track-stack-mark.png",
      parent_club_id: null,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (club: Club) => {
    setEditingClub({ ...club });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClub?.name || !editingClub?.code) {
      toast.error("Please provide Club Name and Code");
      return;
    }

    if (editingClub.id) {
      appStore.updateClub(editingClub.id, editingClub, user || undefined);
      toast.success(`Updated club ${editingClub.name}`);
    } else {
      appStore.createClub(editingClub as Omit<Club, "id">, user || undefined);
      toast.success(`Created club ${editingClub.name}`);
    }

    setIsModalOpen(false);
    setEditingClub(null);
  };

  const handleApproveClub = (clubId: string, name: string) => {
    appStore.approveClub(clubId, user || undefined);
    toast.success(`Approved ${name} for Delhi-NCR Campus`);
  };

  const handleArchiveClub = (clubId: string, name: string) => {
    if (confirm(`Archive ${name}? Active members will be retained in history.`)) {
      appStore.updateClub(clubId, { status: "archived" }, user || undefined);
      toast.info(`Archived ${name}`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              Registry Administration
            </Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Club Registry & Approval
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Create, edit, approve, and archive student societies and clubs per campus.
          </p>
        </div>

        <Button variant="gradient" onClick={handleOpenAdd} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" /> Create New Club
        </Button>
      </div>

      {/* Registry Table */}
      <Card className="border-navy-800 bg-navy-900/80">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold">Registered Clubs & Societies</CardTitle>
          <CardDescription className="text-xs">
            Review status, capacities, meeting venue, and parent society hierarchies
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Club / Society</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Parent Society</TableHead>
                <TableHead>Meeting Day & Venue</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubs.map((c) => {
                const parent = clubs.find((p) => p.id === c.parent_club_id);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ClubLogo
                          name={c.name}
                          logoUrl={c.logo_url}
                          accentColor={c.accent_color}
                          size="sm"
                        />
                        <div>
                          <div className="font-semibold text-white">{c.name}</div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {c.code}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {c.category}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {parent ? parent.name : "None (Independent)"}
                    </TableCell>

                    <TableCell className="text-xs">
                      <div className="text-white">{c.meeting_day}</div>
                      <div className="text-[11px] text-muted-foreground truncate max-w-[160px]">
                        {c.meeting_venue}
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs">
                      {c.enrolled_count || 0} / {c.capacity}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          c.status === "approved"
                            ? "success"
                            : c.status === "pending"
                            ? "warning"
                            : "secondary"
                        }
                        className="text-[10px] capitalize"
                      >
                        {c.status}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right space-x-2">
                      {c.status === "pending" && role === "campus_manager" && (
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleApproveClub(c.id, c.name)}
                          className="h-8 text-xs"
                        >
                          Approve
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleOpenEdit(c)}
                        className="h-8 text-xs"
                      >
                        Edit
                      </Button>
                      {c.status !== "archived" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleArchiveClub(c.id, c.name)}
                          className="h-8 text-xs text-muted-foreground hover:text-red-400"
                        >
                          Archive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && editingClub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-xl font-bold text-white mb-1">
              {editingClub.id ? "Edit Club Details" : "Register New Club"}
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Configure parameters, meeting venue, capacity constraints, and parent society
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Club Name *
                  </label>
                  <Input
                    value={editingClub.name}
                    onChange={(e) => setEditingClub({ ...editingClub, name: e.target.value })}
                    placeholder="e.g. Kaizen Dev Club"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Club Code *
                  </label>
                  <Input
                    value={editingClub.code}
                    onChange={(e) => setEditingClub({ ...editingClub, code: e.target.value.toUpperCase() })}
                    placeholder="KAIZEN_DEV"
                    className="font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Description
                </label>
                <Textarea
                  value={editingClub.description}
                  onChange={(e) => setEditingClub({ ...editingClub, description: e.target.value })}
                  placeholder="Club focus, activities, and goals..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Category
                  </label>
                  <select
                    value={editingClub.category}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, category: e.target.value as ClubCategory })
                    }
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="Technical">Technical</option>
                    <option value="Cultural">Cultural</option>
                    <option value="Sports">Sports</option>
                    <option value="Entrepreneurship">Entrepreneurship</option>
                    <option value="Parent Society">Parent Society</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Parent Society
                  </label>
                  <select
                    value={editingClub.parent_club_id || ""}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, parent_club_id: e.target.value || null })
                    }
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="">None (Independent Society)</option>
                    <option value="a1000000-0000-0000-0000-000000000001">Kaizen Society</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Seat Capacity
                  </label>
                  <Input
                    type="number"
                    value={editingClub.capacity}
                    onChange={(e) =>
                      setEditingClub({ ...editingClub, capacity: Number(e.target.value) })
                    }
                    min={10}
                    max={500}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Meeting Day
                  </label>
                  <Input
                    value={editingClub.meeting_day}
                    onChange={(e) => setEditingClub({ ...editingClub, meeting_day: e.target.value })}
                    placeholder="Saturday"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Meeting Time
                  </label>
                  <Input
                    value={editingClub.meeting_time}
                    onChange={(e) => setEditingClub({ ...editingClub, meeting_time: e.target.value })}
                    placeholder="10:00 AM - 1:00 PM"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Meeting Venue
                  </label>
                  <Input
                    value={editingClub.meeting_venue}
                    onChange={(e) => setEditingClub({ ...editingClub, meeting_venue: e.target.value })}
                    placeholder="Lab 302, Innovation Block"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Brand Accent Color (Hex)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={editingClub.accent_color || "#3B82F6"}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, accent_color: e.target.value })
                      }
                      className="h-10 w-12 rounded-lg border border-navy-800 bg-transparent cursor-pointer"
                    />
                    <Input
                      value={editingClub.accent_color}
                      onChange={(e) =>
                        setEditingClub({ ...editingClub, accent_color: e.target.value })
                      }
                      className="font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">
                    Status
                  </label>
                  <select
                    value={editingClub.status}
                    onChange={(e) =>
                      setEditingClub({
                        ...editingClub,
                        status: e.target.value as Club["status"],
                      })
                    }
                    className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  >
                    <option value="pending">Pending Approval</option>
                    <option value="approved">Approved & Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient">
                  Save Club Configuration
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
