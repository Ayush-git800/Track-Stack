"use client";

import * as React from "react";
import Link from "next/link";
import { appStore } from "@/lib/store";
import { useAuth } from "@/lib/auth-context";
import { UserProfile, UserRole } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Users,
  Search,
  ShieldCheck,
  UserCheck,
  GraduationCap,
  Award,
  User,
  Filter,
  X,
  FileText,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>("All");
  const [selectedYearFilter, setSelectedYearFilter] = React.useState<string>("All");
  const [pageSize, setPageSize] = React.useState<number>(25);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [editingUser, setEditingUser] = React.useState<UserProfile | null>(null);
  const [selectedNewRole, setSelectedNewRole] = React.useState<UserRole>("student");

  React.useEffect(() => {
    return appStore.subscribe(() => {
      setStoreState(appStore.getState());
    });
  }, []);

  if (role !== "admin") {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Only the System Administrator can view and manage user roles.
        </p>
      </div>
    );
  }

  // Combine seeded demo users and students
  const demoStaff: UserProfile[] = [
    {
      id: "u0000000-0000-0000-0000-000000000001",
      email: "admin@msot.edu",
      full_name: "Ayush Chauhan",
      role: "admin",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
      program: "Office of the Dean",
      student_id: "STAFF-ADM-01",
    },
    {
      id: "u0000000-0000-0000-0000-000000000002",
      email: "manager.delhi@msot.edu",
      full_name: "Sundaram Mishra",
      role: "campus_manager",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
      program: "Delhi Campus Operations",
      student_id: "STAFF-DEL-02",
    },
    {
      id: "u0000000-0000-0000-0000-000000000003",
      email: "advisor.kaizen@msot.edu",
      full_name: "Gaurav Kumar",
      role: "faculty_advisor",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
      club_id: "a1000000-0000-0000-0000-000000000002",
      club_name: "Kaizen Dev Club",
      program: "Department of Computer Science",
      student_id: "FAC-CS-03",
    },
    {
      id: "u0000000-0000-0000-0000-000000000004",
      email: "coordinator.kaizen@msot.edu",
      full_name: "Rishav Raj",
      role: "student_coordinator",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
      club_id: "a1000000-0000-0000-0000-000000000002",
      club_name: "Kaizen Dev Club",
      program: "B.Tech Computer Science & AI",
      year_of_study: 2,
      student_id: "MSOT2025CS042",
    },
  ];

  const allUsers: UserProfile[] = [...demoStaff, ...storeState.students];

  const countYear1 = storeState.students.filter((s) => s.year_of_study === 1).length;
  const countYear2 = storeState.students.filter((s) => s.year_of_study === 2).length + 1; // + Rishav Raj
  const countStaff = demoStaff.filter((s) => !s.year_of_study).length;

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.student_id && u.student_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.program && u.program.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === "All" || u.role === selectedRoleFilter;

    const matchesYear =
      selectedYearFilter === "All"
        ? true
        : selectedYearFilter === "Staff"
        ? !u.year_of_study
        : u.year_of_study === Number(selectedYearFilter);

    return matchesSearch && matchesRole && matchesYear;
  });

  const totalPages = pageSize === 0 ? 1 : Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers =
    pageSize === 0
      ? filteredUsers
      : filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleUpdateRole = () => {
    if (!editingUser) return;

    appStore.logAudit(
      "CHANGE_USER_ROLE",
      "user_roles",
      editingUser.id,
      {
        user_email: editingUser.email,
        from_role: editingUser.role,
        to_role: selectedNewRole,
      },
      user?.full_name
    );

    // Update student in state
    const studentIdx = storeState.students.findIndex((s) => s.id === editingUser.id);
    if (studentIdx !== -1) {
      storeState.students[studentIdx].role = selectedNewRole;
    }

    toast.success(`Updated role for ${editingUser.full_name} to ${selectedNewRole.toUpperCase()}`);
    setEditingUser(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400">
              Identity & Access Management
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              MSOT Cohorts: 1st & 2nd Year
            </Badge>
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            User Directory & Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Browse official student cohorts, manage roles, and review tamper-proof co-curricular transcripts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gradient" className="font-mono text-xs">
            Total Users: {allUsers.length}
          </Badge>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-3">
          <div className="text-[11px] text-muted-foreground uppercase font-mono">1st Year Batch</div>
          <div className="text-2xl font-bold text-cyan-400 mt-1">{countYear1}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Rolls 260405 – 260955</div>
        </div>
        <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-3">
          <div className="text-[11px] text-muted-foreground uppercase font-mono">2nd Year Cohort</div>
          <div className="text-2xl font-bold text-blue-400 mt-1">{countYear2}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Seniors & Coordinators</div>
        </div>
        <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-3">
          <div className="text-[11px] text-muted-foreground uppercase font-mono">Faculty & Staff</div>
          <div className="text-2xl font-bold text-purple-400 mt-1">{countStaff}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Deans & Advisors</div>
        </div>
        <div className="rounded-xl border border-navy-800 bg-navy-900/60 p-3">
          <div className="text-[11px] text-muted-foreground uppercase font-mono">3rd & 4th Year</div>
          <div className="text-2xl font-bold text-slate-500 mt-1">0</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">No upper batches (MSOT)</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll number (e.g. 260429), or email..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Year Filter */}
          <select
            value={selectedYearFilter}
            onChange={(e) => {
              setSelectedYearFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-xl border border-navy-800 bg-navy-900/80 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="All">All Cohorts</option>
            <option value="1">1st Year Batch (119)</option>
            <option value="2">2nd Year Cohort</option>
            <option value="Staff">Faculty & Staff</option>
          </select>

          {/* Role Filter */}
          <select
            value={selectedRoleFilter}
            onChange={(e) => {
              setSelectedRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 rounded-xl border border-navy-800 bg-navy-900/80 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="campus_manager">Campus Manager</option>
            <option value="faculty_advisor">Faculty Advisor</option>
            <option value="student_coordinator">Student Coordinator</option>
            <option value="student">Student</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="h-10 rounded-xl border border-navy-800 bg-navy-900/80 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={0}>Show All</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-navy-800 bg-navy-900/80 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Student Name</TableHead>
                <TableHead>Roll No / ID</TableHead>
                <TableHead>Cohort / Year</TableHead>
                <TableHead>Academic Program</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-xs text-muted-foreground">
                    No users matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((u) => (
                  <TableRow key={u.id} className="hover:bg-navy-850/60 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-cyan-950/70 border border-cyan-500/30 flex items-center justify-center font-bold text-xs text-cyan-300 shrink-0">
                          {u.full_name[0]}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-xs sm:text-sm">
                            {u.full_name}
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-cyan-400 font-bold">
                      {u.student_id || "N/A"}
                    </TableCell>

                    <TableCell>
                      {u.year_of_study ? (
                        <Badge
                          variant={u.year_of_study === 1 ? "gradient" : "outline"}
                          className="text-[10px] font-mono"
                        >
                          Year {u.year_of_study} {u.year_of_study === 1 ? "(1st Year)" : "(2nd Year)"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-purple-400 border-purple-500/30 font-mono">
                          Staff
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {u.program || "General"}
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={
                          u.role === "admin"
                            ? "gradient"
                            : u.role === "campus_manager"
                            ? "info"
                            : u.role === "faculty_advisor"
                            ? "warning"
                            : u.role === "student_coordinator"
                            ? "success"
                            : "outline"
                        }
                        className="text-[10px] uppercase font-mono"
                      >
                        {u.role.replace("_", " ")}
                      </Badge>
                    </TableCell>

                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {u.role === "student" || u.role === "student_coordinator" ? (
                          <Link
                            href={`/transcript?studentId=${u.student_id || u.id}`}
                            className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 rounded-lg hover:bg-cyan-500/10 transition-colors"
                            title="View official co-curricular transcript"
                          >
                            <FileText className="h-3 w-3" /> Transcript
                          </Link>
                        ) : null}

                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setEditingUser(u);
                            setSelectedNewRole(u.role);
                          }}
                          className="h-7 text-xs px-2.5"
                        >
                          Change Role
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Footer */}
        {pageSize > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-navy-800 bg-navy-950/50 text-xs text-muted-foreground">
            <div>
              Showing {(currentPage - 1) * pageSize + 1} to{" "}
              {Math.min(currentPage * pageSize, filteredUsers.length)} of{" "}
              {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
              </Button>
              <span className="font-mono text-white text-xs">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-7 px-2 text-xs"
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Role Change Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border border-navy-800 bg-navy-900 p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingUser(null)}
              className="absolute top-4 right-4 h-8 w-8 rounded-lg border border-navy-800 flex items-center justify-center text-muted-foreground hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>

            <h3 className="font-heading text-xl font-bold text-white mb-1">
              Modify User Role
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Promote or reassign permission levels for <strong>{editingUser.full_name}</strong>
              {editingUser.student_id ? ` (${editingUser.student_id})` : ""}
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">
                  Assign New Role
                </label>
                <select
                  value={selectedNewRole}
                  onChange={(e) => setSelectedNewRole(e.target.value as UserRole)}
                  className="w-full h-11 rounded-xl border border-navy-800 bg-navy-950/60 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
                >
                  <option value="student">Student (Standard Access)</option>
                  <option value="student_coordinator">Student Coordinator (Manage Own Club)</option>
                  <option value="faculty_advisor">Faculty Advisor (Approve Activities & Evaluate)</option>
                  <option value="campus_manager">Campus Manager (Campus Approvals & Dashboards)</option>
                  <option value="admin">System Administrator (Full Global Control)</option>
                </select>
              </div>

              <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3 text-[11px] text-cyan-300">
                ℹ Any modification to user permissions will be immediately written to the immutable audit log for compliance.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-800">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleUpdateRole}
                >
                  Save Role Change
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
