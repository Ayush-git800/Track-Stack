"use client";

import * as React from "react";
import { UserProfile, UserRole } from "./types";
import seedData from "./seed-data.json";

interface AuthContextType {
  user: UserProfile | null;
  role: UserRole;
  isDemoMode: boolean;
  switchRole: (role: UserRole) => void;
  login: (email: string, password?: string) => Promise<boolean>;
  register: (details: Partial<UserProfile>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const DEMO_USERS: Record<UserRole, UserProfile> = {
  admin: {
    id: "u0000000-0000-0000-0000-000000000001",
    email: "admin@msot.edu",
    full_name: "Ayush Chauhan",
    role: "admin",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    campus_name: "Delhi-NCR Campus",
    program: "Office of the Dean",
    year_of_study: 4,
    student_id: "STAFF-ADM-01",
  },
  campus_manager: {
    id: "u0000000-0000-0000-0000-000000000002",
    email: "manager.delhi@msot.edu",
    full_name: "Sundaram Mishra",
    role: "campus_manager",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    campus_name: "Delhi-NCR Campus",
    program: "Delhi Campus Operations",
    year_of_study: 4,
    student_id: "STAFF-DEL-02",
  },
  faculty_advisor: {
    id: "u0000000-0000-0000-0000-000000000003",
    email: "advisor.kaizen@msot.edu",
    full_name: "Gaurav Kumar",
    role: "faculty_advisor",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    campus_name: "Delhi-NCR Campus",
    club_id: "a1000000-0000-0000-0000-000000000002",
    club_name: "Kaizen Dev Club",
    program: "Department of Computer Science",
    year_of_study: 4,
    student_id: "FAC-CS-03",
  },
  student_coordinator: {
    id: "u0000000-0000-0000-0000-000000000004",
    email: "coordinator.kaizen@msot.edu",
    full_name: "Rishav Raj",
    role: "student_coordinator",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    campus_name: "Delhi-NCR Campus",
    club_id: "a1000000-0000-0000-0000-000000000002",
    club_name: "Kaizen Dev Club",
    program: "B.Tech Computer Science & AI",
    year_of_study: 3,
    student_id: "MSOT2024CS042",
  },
  student: {
    id: "u0000000-0000-0000-0000-000000000005",
    email: "student.alex@msot.edu",
    full_name: "Chintu",
    role: "student",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    campus_name: "Delhi-NCR Campus",
    program: "B.Tech Software Engineering",
    year_of_study: 2,
    student_id: "MSOT2025SE019",
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

  React.useEffect(() => {
    // Check saved session in localStorage
    const savedUser = localStorage.getItem("trackstack_current_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        setUser(DEMO_USERS.admin);
      }
    } else {
      // Default to Admin or Alex in demo mode for instant evaluation
      setUser(DEMO_USERS.admin);
    }
    setIsLoading(false);
  }, []);

  const switchRole = (newRole: UserRole) => {
    const targetUser = DEMO_USERS[newRole] || DEMO_USERS.student;
    setUser(targetUser);
    localStorage.setItem("trackstack_current_user", JSON.stringify(targetUser));
  };

  const login = async (email: string): Promise<boolean> => {
    // Match against demo users or students
    const matched = Object.values(DEMO_USERS).find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    if (matched) {
      setUser(matched);
      localStorage.setItem("trackstack_current_user", JSON.stringify(matched));
      return true;
    }

    // New or standard student login
    const studentUser: UserProfile = {
      id: `u-${Date.now()}`,
      email,
      full_name: email.split("@")[0].replace(".", " ").toUpperCase(),
      role: email.includes("admin") ? "admin" : "student",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
      year_of_study: 1,
      program: "B.Tech Computer Science",
    };
    setUser(studentUser);
    localStorage.setItem("trackstack_current_user", JSON.stringify(studentUser));
    return true;
  };

  const register = async (details: Partial<UserProfile>): Promise<boolean> => {
    const newUser: UserProfile = {
      id: `u-${Date.now()}`,
      email: details.email || "new.student@msot.edu",
      full_name: details.full_name || "New Student",
      role: "student",
      campus_id: details.campus_id || "c1111111-1111-1111-1111-111111111111",
      campus_name: "Delhi-NCR Campus",
      student_id: details.student_id || `MSOT2026${Math.floor(100 + Math.random() * 900)}`,
      year_of_study: details.year_of_study || 1,
      program: details.program || "B.Tech Computer Science",
      phone: details.phone,
    };
    setUser(newUser);
    localStorage.setItem("trackstack_current_user", JSON.stringify(newUser));
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("trackstack_current_user");
  };

  const role: UserRole = user?.role || "student";

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isDemoMode,
        switchRole,
        login,
        register,
        logout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
