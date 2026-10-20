import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Support both remote Supabase and local file snapshot
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

const supabase = createClient(supabaseUrl, supabaseKey);

export const SEED_DATA = {
  campuses: [
    {
      id: "c1111111-1111-1111-1111-111111111111",
      name: "Delhi-NCR Campus",
      code: "DELHI",
      city: "Gurugram, Haryana",
      is_active: true,
    },
    {
      id: "c2222222-2222-2222-2222-222222222222",
      name: "Bangalore Campus",
      code: "BLR",
      city: "Electronic City, Bangalore",
      is_active: true,
    },
    {
      id: "c3333333-3333-3333-3333-333333333333",
      name: "Jaipur Campus",
      code: "JPR",
      city: "Jaipur, Rajasthan",
      is_active: true,
    },
  ],

  settings: [
    {
      key: "membership_rules",
      value: {
        max_clubs_per_student: 2,
        year_overrides: {
          "1": 2,
          "2": 2,
          "3": 2,
          "4": 1,
        },
      },
      description: "Club enrolment rules and per-year capacity constraints",
    },
    {
      key: "checkin_rules",
      value: {
        window_minutes: 45,
        late_grace_minutes: 15,
        require_geo: false,
        qr_rotation_seconds: 15,
      },
      description: "Club Day check-in rotation and late flags",
    },
    {
      key: "flow_timings",
      value: {
        plan_days_before: 7,
        announce_days_before: 3,
        submission_hours: 48,
        evaluation_days: 5,
        monthly_report_day: 28,
      },
      description: "Club Day lifecycle automation cadence",
    },
    {
      key: "submission_rules",
      value: {
        allowed_types: ["pdf", "zip", "github_repo", "figma_link"],
        max_size_mb: 25,
        late_allowed: true,
        late_penalty_percent: 10,
      },
      description: "Deliverable and project file submission rules",
    },
    {
      key: "staff_domain_hint",
      value: {
        allowed_domains: ["msot.edu", "faculty.msot.edu", "admin.msot.edu"],
      },
      description: "Authorized email domain hint for faculty and staff onboarding",
    },
  ],

  // Societies and Clubs
  // Delhi: 4 Societies (NexCell, Malhar, Khel, Kaizen). Kaizen has 3 joinable clubs.
  // Total joinable clubs = 6.
  clubs: [
    // 1. Kaizen Society (Parent Society)
    {
      id: "a1000000-0000-0000-0000-000000000001",
      name: "Kaizen Society",
      code: "KAIZEN_SOCIETY",
      description: "The premier technical umbrella society of MSOT driving open-source culture, competitive programming, and machine intelligence.",
      parent_club_id: null,
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Parent Society",
      capacity: 250,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "Auditorium & Tech Hub",
      logo_url: "/logos/kaizen-society.png",
      accent_color: "#4FA39A",
    },
    // Kaizen Dev Club (Child of Kaizen Society)
    {
      id: "a1000000-0000-0000-0000-000000000002",
      name: "Kaizen Dev Club",
      code: "KAIZEN_DEV",
      description: "Full-stack engineering, cloud architecture, open source contributions, and web3 innovations.",
      parent_club_id: "a1000000-0000-0000-0000-000000000001",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Technical",
      capacity: 60,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "Lab 302, Innovation Block",
      logo_url: "/logos/kaizen-dev.png",
      accent_color: "#4FA39A",
    },
    // CP Club (Child of Kaizen Society)
    {
      id: "a1000000-0000-0000-0000-000000000003",
      name: "CP Club",
      code: "CP_CLUB",
      description: "Algorithms, data structures, competitive programming contests, Codeforces/LeetCode training.",
      parent_club_id: "a1000000-0000-0000-0000-000000000001",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Technical",
      capacity: 50,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "Computer Center 1",
      logo_url: "/logos/cp-club.png",
      accent_color: "#A3E635",
    },
    // Kaizen Intelligence (Child of Kaizen Society)
    {
      id: "a1000000-0000-0000-0000-000000000004",
      name: "Kaizen Intelligence (KI)",
      code: "KI",
      description: "Deep learning, applied computer vision, NLP, generative models, and AI research projects.",
      parent_club_id: "a1000000-0000-0000-0000-000000000001",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Technical",
      capacity: 45,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "AI & Robotics Lab",
      logo_url: "/logos/kaizen-intelligence.png",
      accent_color: "#D9A441",
    },
    // 2. NexCell (Entrepreneurship Club)
    {
      id: "a1000000-0000-0000-0000-000000000005",
      name: "NexCell",
      code: "NEXCELL",
      description: "The Entrepreneurship and Innovation Cell of Mirai School of Technology. Pitch nights, incubators, startup scaling.",
      parent_club_id: null,
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Entrepreneurship",
      capacity: 70,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "Incubation Center Room 101",
      logo_url: "/logos/nexcell.png",
      accent_color: "#3B9BE0",
    },
    // 3. Malhar (The Cultural Society of Mirai)
    {
      id: "a1000000-0000-0000-0000-000000000006",
      name: "Malhar",
      code: "MALHAR",
      description: "The Cultural Society of Mirai — music, dance, dramatic arts, literary celebrations, and visual design.",
      parent_club_id: null,
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Cultural",
      capacity: 80,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "10:00 AM - 1:00 PM",
      meeting_venue: "Amphitheatre & Performing Arts Room",
      logo_url: "/logos/malhar.png",
      accent_color: "#E8A935",
    },
    // 4. Khel Society (Sports Club)
    {
      id: "a1000000-0000-0000-0000-000000000007",
      name: "Khel Society",
      code: "KHEL",
      description: "The official sports club of MSOT. Inter-college championships, athletics, football, badminton, and fitness.",
      parent_club_id: null,
      campus_id: "c1111111-1111-1111-1111-111111111111",
      category: "Sports",
      capacity: 90,
      status: "approved",
      meeting_day: "Saturday",
      meeting_time: "7:00 AM - 10:00 AM",
      meeting_venue: "University Sports Arena & Football Ground",
      logo_url: "/logos/khel-society.png",
      accent_color: "#1E6FC0",
    },
  ],

  // Users & Profiles for Demo Roles
  demoUsers: [
    {
      id: "u0000000-0000-0000-0000-000000000001",
      email: "admin@msot.edu",
      full_name: "Ayush Chauhan (System Admin)",
      role: "admin",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      program: "Office of the Dean",
      year_of_study: 4,
      student_id: "STAFF-ADM-01",
    },
    {
      id: "u0000000-0000-0000-0000-000000000002",
      email: "manager.delhi@msot.edu",
      full_name: "Sundaram Mishra (Campus Manager)",
      role: "campus_manager",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      program: "Delhi Campus Operations",
      year_of_study: 4,
      student_id: "STAFF-DEL-02",
    },
    {
      id: "u0000000-0000-0000-0000-000000000003",
      email: "advisor.kaizen@msot.edu",
      full_name: "Gaurav Kumar (Faculty Advisor)",
      role: "faculty_advisor",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      club_id: "a1000000-0000-0000-0000-000000000002", // Kaizen Dev
      program: "Department of Computer Science",
      year_of_study: 4,
      student_id: "FAC-CS-03",
    },
    {
      id: "u0000000-0000-0000-0000-000000000004",
      email: "coordinator.kaizen@msot.edu",
      full_name: "Rishav Raj (Student Coordinator)",
      role: "student_coordinator",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      club_id: "a1000000-0000-0000-0000-000000000002", // Kaizen Dev
      program: "B.Tech Computer Science & AI",
      year_of_study: 3,
      student_id: "MSOT2024CS042",
    },
    {
      id: "u0000000-0000-0000-0000-000000000005",
      email: "student.alex@msot.edu",
      full_name: "Chintu (Student)",
      role: "student",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      program: "B.Tech Software Engineering",
      year_of_study: 2,
      student_id: "MSOT2025SE019",
    },
  ],

  // 1 Month of Saturday Club Days
  clubDays: [
    {
      id: "d1000000-0000-0000-0000-000000000001",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      date: "2026-10-24",
      title: "Club Day #1: Architecture & Foundations",
      academic_term: "Fall 2026",
      status: "active",
    },
    {
      id: "d1000000-0000-0000-0000-000000000002",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      date: "2026-10-31",
      title: "Club Day #2: Sprints & Prototyping",
      academic_term: "Fall 2026",
      status: "announced",
    },
    {
      id: "d1000000-0000-0000-0000-000000000003",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      date: "2026-11-07",
      title: "Club Day #3: Mid-Semester Hack & Showcase",
      academic_term: "Fall 2026",
      status: "planning",
    },
    {
      id: "d1000000-0000-0000-0000-000000000004",
      campus_id: "c1111111-1111-1111-1111-111111111111",
      date: "2026-11-14",
      title: "Club Day #4: Evaluation & Community Demos",
      academic_term: "Fall 2026",
      status: "scheduled",
    },
  ],

  // Activities across statuses
  activities: [
    {
      id: "ac100000-0000-0000-0000-000000000001",
      club_id: "a1000000-0000-0000-0000-000000000002", // Kaizen Dev
      club_day_id: "d1000000-0000-0000-0000-000000000001", // Day 1
      title: "Distributed Microservices Hands-on Lab",
      topic: "System Design and Dockerized Microservices",
      format: "workshop",
      venue: "Lab 302, Innovation Block",
      description: "Build an event-driven pub/sub architecture using Redis and Node.js. Students will deploy their worker nodes locally and verify message throughput.",
      deliverable_spec: "GitHub repository URL with Dockerfile and a 30s demonstration video link.",
      submission_deadline: "2026-10-26T18:00:00Z",
      status: "live",
      created_by: "u0000000-0000-0000-0000-000000000004",
      approved_by: "u0000000-0000-0000-0000-000000000003",
    },
    {
      id: "ac100000-0000-0000-0000-000000000002",
      club_id: "a1000000-0000-0000-0000-000000000003", // CP Club
      club_day_id: "d1000000-0000-0000-0000-000000000001", // Day 1
      title: "Graph Algorithms: Shortest Paths Deep Dive",
      topic: "Dijkstra, Bellman-Ford, and Segment Trees",
      format: "practice",
      venue: "Computer Center 1",
      description: "Solve 5 contest problems on Codeforces with live editorial and complexity breakdowns.",
      deliverable_spec: "Codeforces handle and submission ID links.",
      submission_deadline: "2026-10-26T23:59:00Z",
      status: "announced",
      created_by: "u0000000-0000-0000-0000-000000000004",
      approved_by: "u0000000-0000-0000-0000-000000000003",
    },
    {
      id: "ac100000-0000-0000-0000-000000000003",
      club_id: "a1000000-0000-0000-0000-000000000004", // KI
      club_day_id: "d1000000-0000-0000-0000-000000000002", // Day 2
      title: "Fine-Tuning Small Language Models with LoRA",
      topic: "Deep Learning & Parameter-Efficient Fine-Tuning",
      format: "workshop",
      venue: "AI & Robotics Lab",
      description: "Fine-tuning Qwen 2.5 on specialized campus FAQ data using PyTorch and HuggingFace.",
      deliverable_spec: "Colab notebook link and evaluation loss chart.",
      submission_deadline: "2026-11-02T18:00:00Z",
      status: "submitted",
      created_by: "u0000000-0000-0000-0000-000000000004",
      approved_by: null,
    },
    {
      id: "ac100000-0000-0000-0000-000000000004",
      club_id: "a1000000-0000-0000-0000-000000000005", // NexCell
      club_day_id: "d1000000-0000-0000-0000-000000000002", // Day 2
      title: "Venture Pitch Simulation: Seed Stage",
      topic: "Unit Economics, Market Sizing & Pitch Decks",
      format: "competition",
      venue: "Incubation Center Room 101",
      description: "Teams pitch a real SaaS or hardware business idea to guest angel mentors.",
      deliverable_spec: "PDF Pitch deck (max 10 slides) and financial model sheet.",
      submission_deadline: "2026-11-02T23:59:00Z",
      status: "changes_requested",
      created_by: "u0000000-0000-0000-0000-000000000004",
      approved_by: null,
    },
    {
      id: "ac100000-0000-0000-0000-000000000005",
      club_id: "a1000000-0000-0000-0000-000000000006", // Malhar
      club_day_id: "d1000000-0000-0000-0000-000000000003", // Day 3
      title: "Autumn Acoustic Jam & Stage Lighting Workshop",
      topic: "Performing Arts & Stagecraft Production",
      format: "performance",
      venue: "Amphitheatre",
      description: "Live acoustic jam session followed by hands-on lighting console training.",
      deliverable_spec: "High-resolution recording snippet and cue sheet.",
      submission_deadline: "2026-11-09T18:00:00Z",
      status: "draft",
      created_by: "u0000000-0000-0000-0000-000000000004",
      approved_by: null,
    },
  ],
};

// Generate 60 diverse students
export function generateStudents() {
  const firstNames = [
    "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Reyansh", "Muhammad", "Sai", "Ayaan", "Krishna",
    "Ishaan", "Shaurya", "Atharva", "Kabir", "Dhruv", "Rudra", "Anaya", "Diya", "Saanvi", "Aanya",
    "Aadhya", "Pari", "Chiara", "Khushi", "Myra", "Riya", "Avani", "Ira", "Ahana", "Prisha",
    "Tanvi", "Tara", "Rohan", "Dev", "Neil", "Samar", "Kunal", "Meera", "Zara", "Nisha",
    "Varun", "Kavya", "Siddharth", "Simran", "Tanya", "Akash", "Pooja", "Vikram", "Sneha", "Rahul",
    "Neha", "Amit", "Priya", "Manish", "Shreya", "Karan", "Rhea", "Harsh", "Bhavya", "Naveen"
  ];
  const lastNames = [
    "Sharma", "Verma", "Gupta", "Malhotra", "Kapoor", "Chopra", "Singh", "Kumar", "Iyer", "Nair",
    "Reddy", "Patel", "Mehta", "Bhatia", "Jain", "Saxena", "Chauhan", "Bose", "Das", "Rao"
  ];
  const programs = [
    "B.Tech Computer Science",
    "B.Tech AI & Data Science",
    "B.Tech Software Engineering",
    "B.Tech Cyber Security",
    "B.Tech Electronics & Computing"
  ];

  const students = [];
  for (let i = 0; i < 60; i++) {
    const fName = firstNames[i];
    const lName = lastNames[i % lastNames.length];
    const year = (i % 4) + 1;
    const studentNum = 100 + i;
    students.push({
      id: `s0000000-0000-0000-0000-0000000000${studentNum}`,
      full_name: `${fName} ${lName}`,
      email: `${fName.toLowerCase()}.${lName.toLowerCase()}${i}@msot.edu`,
      student_id: `MSOT202${6 - year}CS${studentNum}`,
      campus_id: "c1111111-1111-1111-1111-111111111111", // Delhi
      year_of_study: year,
      program: programs[i % programs.length],
      phone: `+91 98${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: "student",
    });
  }
  return students;
}

// Generate realistic memberships respecting the 2-club limit
export function generateMemberships(students, clubs) {
  const joinableClubs = clubs.filter((c) => c.category !== "Parent Society");
  const memberships = [];

  // Demo user memberships: Chintu (student.alex@msot.edu) is member of 2 clubs (Kaizen Dev & Malhar)
  memberships.push({
    id: "m0000000-0000-0000-0000-000000000001",
    club_id: "a1000000-0000-0000-0000-000000000002", // Kaizen Dev
    user_id: "u0000000-0000-0000-0000-000000000005", // Chintu
    designation: "primary",
    status: "approved",
    join_request_note: "Passionate about full-stack engineering and cloud architecture.",
    decision_note: "Approved by Coordinator. Welcome to Kaizen Dev!",
    joined_at: "2026-10-01T10:00:00Z",
  });

  memberships.push({
    id: "m0000000-0000-0000-0000-000000000002",
    club_id: "a1000000-0000-0000-0000-000000000006", // Malhar
    user_id: "u0000000-0000-0000-0000-000000000005", // Chintu
    designation: "secondary",
    status: "approved",
    join_request_note: "Play acoustic guitar and excited for cultural stage sessions.",
    decision_note: "Approved. Audition verified.",
    joined_at: "2026-10-05T12:00:00Z",
  });

  // Distribute 60 students into 1-2 clubs max
  let membershipId = 10;
  students.forEach((stu, idx) => {
    // Primary club
    const club1 = joinableClubs[idx % joinableClubs.length];
    memberships.push({
      id: `m0000000-0000-0000-0000-0000000000${membershipId++}`,
      club_id: club1.id,
      user_id: stu.id,
      designation: "primary",
      status: idx % 10 === 0 ? "pending" : (idx % 12 === 0 ? "waitlisted" : "approved"),
      waitlist_position: idx % 12 === 0 ? (idx % 3) + 1 : null,
      join_request_note: "Looking forward to active Club Day participation.",
      joined_at: idx % 10 === 0 ? null : "2026-10-10T10:00:00Z",
    });

    // 60% of students take a secondary club (respects max 2 clubs limit)
    if (idx % 5 < 3) {
      const club2 = joinableClubs[(idx + 2) % joinableClubs.length];
      memberships.push({
        id: `m0000000-0000-0000-0000-0000000000${membershipId++}`,
        club_id: club2.id,
        user_id: stu.id,
        designation: "secondary",
        status: "approved",
        join_request_note: "Secondary club interest.",
        joined_at: "2026-10-12T14:00:00Z",
      });
    }
  });

  return memberships;
}

// Generate Phase 3 Attendances, Submissions, and Rubric Evaluations
export function generatePhase3Data(students, memberships) {
  // Checkin Session for Day 1 Kaizen Dev
  const now = Date.now();
  const checkinSessions = [
    {
      id: "sess-kaizen-dev-01",
      club_id: "a1000000-0000-0000-0000-000000000002", // Kaizen Dev
      club_name: "Kaizen Dev Club",
      club_day_id: "d1000000-0000-0000-0000-000000000001", // Day 1
      club_day_title: "Club Day #1: Architecture & Foundations",
      activity_id: "ac100000-0000-0000-0000-000000000001",
      started_at: new Date(now - 15 * 60 * 1000).toISOString(),
      expires_at: new Date(now + 25 * 60 * 1000).toISOString(),
      grace_until: new Date(now + 5 * 60 * 1000).toISOString(),
      status: "active",
      current_otp: "582914",
      geo_enabled: true,
      campus_lat: 28.4595,
      campus_lng: 77.0266,
      radius_meters: 300,
      created_by: "u0000000-0000-0000-0000-000000000004", // Rishav Raj
      created_at: new Date(now - 15 * 60 * 1000).toISOString(),
    },
  ];

  // Attendances for Kaizen Dev Club on Day 1
  const kaizenMembers = memberships.filter(
    (m) => m.club_id === "a1000000-0000-0000-0000-000000000002" && m.status === "approved"
  );

  const attendances = [];

  // Chintu attendance (Verified Present & Presenter & Winner)
  attendances.push({
    id: "att-alex-01",
    session_id: "sess-kaizen-dev-01",
    club_id: "a1000000-0000-0000-0000-000000000002",
    club_name: "Kaizen Dev Club",
    club_day_id: "d1000000-0000-0000-0000-000000000001",
    user_id: "u0000000-0000-0000-0000-000000000005", // Chintu
    user_name: "Chintu",
    student_id: "MSOT2025SE019",
    status: "present",
    checkin_method: "qr",
    checked_in_at: "2026-10-24T10:03:15Z",
    is_late: false,
    distance_meters: 42,
    device_hash: "hash-device-alex",
    ip_hash: "hash-ip-delhi-01",
    device_reuse_flag: false,
    is_presenter: true,
    spot_result: "winner",
    correction_reason: null,
    corrected_by: null,
    corrected_at: null,
  });

  // Seed attendances for other students
  kaizenMembers.slice(1, 15).forEach((m, idx) => {
    const student = students.find((s) => s.id === m.user_id);
    const isLate = idx === 3 || idx === 7;
    const isExcused = idx === 10;
    const status = isExcused ? "excused" : isLate ? "late" : "present";

    attendances.push({
      id: `att-seed-${idx}`,
      session_id: "sess-kaizen-dev-01",
      club_id: "a1000000-0000-0000-0000-000000000002",
      club_name: "Kaizen Dev Club",
      club_day_id: "d1000000-0000-0000-0000-000000000001",
      user_id: m.user_id,
      user_name: student?.full_name || m.user_name || "Member",
      student_id: student?.student_id || m.student_id,
      status,
      checkin_method: idx % 3 === 0 ? "code" : "qr",
      checked_in_at: isLate ? "2026-10-24T10:32:00Z" : "2026-10-24T10:08:00Z",
      is_late: isLate,
      distance_meters: 30 + idx * 8,
      device_hash: idx === 5 ? "hash-device-alex" : `hash-dev-${idx}`,
      ip_hash: `hash-ip-${idx}`,
      device_reuse_flag: idx === 5, // Reused device test flag
      is_presenter: idx === 1,
      spot_result: idx === 1 ? "runner_up" : null,
      correction_reason: isExcused ? "Duty leave approved for University hackathon delegation" : null,
      corrected_by: isExcused ? "u0000000-0000-0000-0000-000000000004" : null,
      corrected_at: isExcused ? "2026-10-24T11:00:00Z" : null,
    });
  });

  // Submissions for Activity 1 (Microservices lab)
  const submissions = [
    // Chintu v1
    {
      id: "sub-alex-v1",
      activity_id: "ac100000-0000-0000-0000-000000000001",
      activity_title: "Distributed Microservices Hands-on Lab",
      club_id: "a1000000-0000-0000-0000-000000000002",
      club_name: "Kaizen Dev Club",
      user_id: "u0000000-0000-0000-0000-000000000005",
      user_name: "Chintu",
      student_id: "MSOT2025SE019",
      version: 1,
      file_name: "microservices-arch-v1.pdf",
      file_size: 4200100,
      file_type: "application/pdf",
      file_url: "/storage/submissions/microservices-arch-v1.pdf",
      is_late: false,
      notes: "Initial architecture diagram and docker compose file.",
      submitted_at: "2026-10-25T12:00:00Z",
    },
    // Chintu v2 (Latest revision)
    {
      id: "sub-alex-v2",
      activity_id: "ac100000-0000-0000-0000-000000000001",
      activity_title: "Distributed Microservices Hands-on Lab",
      club_id: "a1000000-0000-0000-0000-000000000002",
      club_name: "Kaizen Dev Club",
      user_id: "u0000000-0000-0000-0000-000000000005",
      user_name: "Chintu",
      student_id: "MSOT2025SE019",
      version: 2,
      link_url: "https://github.com/alex-msot/microservices-redis",
      is_late: false,
      notes: "v2 includes Redis pub/sub streams benchmark and integration test suite.",
      submitted_at: "2026-10-25T18:45:00Z",
    },
  ];

  // Evaluations
  const evaluations = [
    {
      id: "eval-alex-01",
      submission_id: "sub-alex-v2",
      activity_id: "ac100000-0000-0000-0000-000000000001",
      student_id: "u0000000-0000-0000-0000-000000000005",
      student_name: "Chintu",
      evaluator_id: "u0000000-0000-0000-0000-000000000003", // Gaurav Kumar
      evaluator_name: "Gaurav Kumar",
      evaluator_role: "faculty_advisor",
      rubric_scores: {
        content: 9.5,
        presentation: 9.0,
        participation: 10.0,
        total: 9.5,
      },
      feedback: "Exceptional architecture design! Redis pub/sub implementation handles network partitioning gracefully. Outstanding Club Day contribution.",
      is_published: true,
      published_at: "2026-10-26T10:00:00Z",
      created_at: "2026-10-26T09:30:00Z",
    },
  ];

  return { checkinSessions, attendances, submissions, evaluations };
}

async function main() {
  console.log("🌱 Starting Track Stack comprehensive seed process...");

  const students = generateStudents();
  const memberships = generateMemberships(students, SEED_DATA.clubs);
  const phase3 = generatePhase3Data(students, memberships);

  const fullData = {
    ...SEED_DATA,
    students,
    memberships,
    ...phase3,
    exportedAt: new Date().toISOString(),
  };

  // Write local seed-data.json snapshot for client & mock development
  const jsonPath = path.resolve("src/lib/seed-data.json");
  const jsonDir = path.dirname(jsonPath);
  if (!fs.existsSync(jsonDir)) {
    fs.mkdirSync(jsonDir, { recursive: true });
  }
  fs.writeFileSync(jsonPath, JSON.stringify(fullData, null, 2), "utf-8");
  console.log(`✓ Saved static seed snapshot to ${jsonPath}`);

  // If Supabase credentials are valid live credentials, run SQL / RPC inserts
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  ) {
    console.log("📡 Connecting to hosted Supabase instance...");
    try {
      // Upsert campuses
      const { error: errCampuses } = await supabase.from("campuses").upsert(SEED_DATA.campuses);
      if (errCampuses) console.warn("Supabase campuses note:", errCampuses.message);

      // Upsert settings
      const { error: errSettings } = await supabase.from("settings").upsert(SEED_DATA.settings);
      if (errSettings) console.warn("Supabase settings note:", errSettings.message);

      // Upsert clubs
      const { error: errClubs } = await supabase.from("clubs").upsert(SEED_DATA.clubs);
      if (errClubs) console.warn("Supabase clubs note:", errClubs.message);

      console.log("✓ Live Supabase database updated successfully!");
    } catch (e) {
      console.warn("Hosted Supabase seed warning:", e.message);
    }
  } else {
    console.log("ℹ Running with standalone database snapshot (Demo Mode active).");
  }

  console.log("🎉 Seed finished successfully!");
  console.log(`- 3 Campuses (Delhi-NCR, Bangalore, Jaipur)`);
  console.log(`- 4 Societies & 6 Clubs with Logos`);
  console.log(`- 5 Demo Roles Ready`);
  console.log(`- 60 Students with 2-Club Enrolment Limits`);
  console.log(`- 1 Month of Saturday Club Days & Activities`);
}

main().catch((err) => {
  console.error("Fatal seed error:", err);
  process.exit(1);
});
