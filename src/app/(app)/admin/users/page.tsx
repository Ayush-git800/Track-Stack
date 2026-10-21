"use client";

import * as React from "react";
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
} from "lucide-react";

export default function AdminUsersPage() {
  const { user, role } = useAuth();
  const [storeState, setStoreState] = React.useState(appStore.getState());
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = React.useState<string>("All");
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

  const filteredUsers = allUsers.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.student_id && u.student_id.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesRole =
      selectedRoleFilter === "All" || u.role === selectedRoleFilter;

    return matchesSearch && matchesRole;
  });

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
          </div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-white tracking-tight">
            User Directory & Roles
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Search registered students, coordinators, faculty advisors, and promote administrative roles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="gradient" className="font-mono text-xs">
            Total Users: {allUsers.length}
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, student ID, or university email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRoleFilter}
            onChange={(e) => setSelectedRoleFilter(e.target.value)}
            className="h-11 rounded-xl border border-navy-800 bg-navy-900/80 px-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <option value="All">All Roles</option>
            <option value="admin">Admin</option>
            <option value="campus_manager">Campus Manager</option>
            <option value="faculty_advisor">Faculty Advisor</option>
            <option value="student_coordinator">Student Coordinator</option>
            <option value="student">Student</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <Card className="border-navy-800 bg-navy-900/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User / Student</TableHead>
                <TableHead>Student ID / Staff ID</TableHead>
                <TableHead>Program / Dept</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Assigned Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.slice(0, 20).map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div>
                      <div className="font-semibold text-white">{u.full_name}</div>
                      <div className="text-[11px] font-mono text-muted-foreground">
                        {u.email}
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="font-mono text-xs text-cyan-400 font-semibold">
                    {u.student_id || "N/A"}
                  </TableCell>

                  <TableCell className="text-xs text-muted-foreground">
                    {u.program || "General"}
                  </TableCell>

                  <TableCell className="text-xs">
                    {u.year_of_study ? `Year ${u.year_of_study}` : "Staff"}
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
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setEditingUser(u);
                        setSelectedNewRole(u.role);
                      }}
                      className="h-8 text-xs"
                    >
                      Change Role
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
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
