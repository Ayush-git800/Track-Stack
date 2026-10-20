import initialSeed from "./seed-data.json" with { type: "json" };
import type {
  Campus,
  Club,
  ClubDay,
  ClubMember,
  Activity,
  ActivityComment,
  SystemSettings,
  AuditLogEntry,
  UserProfile,
  UserRole,
  CheckinSession,
  Attendance,
  Submission,
  Evaluation,
  RubricScores,
  CampusEvent,
  EventTeam,
  EventRegistration,
  Certificate,
  CertificateType,
  DutyLeave,
  CoCurricularTranscript,
  MonthlyReport,
  Announcement,
  InAppNotification,
  SentNotificationLog,
  CronRunLog,
  NeedsAttentionItem,
} from "./types.ts";
import {
  generateOneTimeCode,
  generateCheckinToken,
  verifyCheckinToken,
  calculateGeoDistance,
  hashString,
  buildCanonicalCertificateData,
  signCertificateData,
  verifyCertificateSignature,
} from "./crypto.mjs";

interface AppState {
  campuses: Campus[];
  clubs: Club[];
  clubDays: ClubDay[];
  activities: Activity[];
  memberships: ClubMember[];
  students: UserProfile[];
  settings: SystemSettings;
  auditLogs: AuditLogEntry[];
  checkinSessions: CheckinSession[];
  attendances: Attendance[];
  submissions: Submission[];
  evaluations: Evaluation[];
  events: CampusEvent[];
  eventTeams: EventTeam[];
  eventRegistrations: EventRegistration[];
  certificates: Certificate[];
  dutyLeaves: DutyLeave[];
  monthlyReports: MonthlyReport[];
  announcements: Announcement[];
  notifications: InAppNotification[];
  sentNotifications: SentNotificationLog[];
  cronLogs: CronRunLog[];
}

const STORAGE_KEY = "track_stack_state_v2";

function loadInitialState(): AppState {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.events && parsed.certificates) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved state:", e);
      }
    }
  }

  // Fallback to static seed
  const s = initialSeed;
  const settingsObj: any = {};
  s.settings.forEach((item: any) => {
    settingsObj[item.key] = item.value;
  });

  return {
    campuses: s.campuses as Campus[],
    clubs: s.clubs as Club[],
    clubDays: s.clubDays as ClubDay[],
    activities: s.activities as Activity[],
    memberships: s.memberships as ClubMember[],
    students: s.students as unknown as UserProfile[],
    settings: settingsObj as SystemSettings,
    checkinSessions: ((s as any).checkinSessions || []) as CheckinSession[],
    attendances: ((s as any).attendances || []) as Attendance[],
    submissions: ((s as any).submissions || []) as Submission[],
    evaluations: ((s as any).evaluations || []) as Evaluation[],
    events: ((s as any).events || []) as CampusEvent[],
    eventTeams: ((s as any).eventTeams || []) as EventTeam[],
    eventRegistrations: ((s as any).eventRegistrations || []) as EventRegistration[],
    certificates: ((s as any).certificates || []) as Certificate[],
    dutyLeaves: ((s as any).dutyLeaves || []) as DutyLeave[],
    monthlyReports: ((s as any).monthlyReports || []) as MonthlyReport[],
    announcements: ((s as any).announcements || [
      {
        id: "ann-1",
        club_id: "c1111111-1111-1111-1111-111111111101",
        club_name: "Kaizen Dev Club",
        title: "🚀 Welcome to Term 1: Distributed Systems & Autonomous Agents Labs",
        content: "All members must bring laptops with Docker and Node.js v20+ configured. Project deliverable deadline will be enforced 48h following each session.",
        author_id: "usr-advisor-1",
        author_name: "Gaurav Kumar",
        author_role: "faculty_advisor",
        is_pinned: true,
        target_audience: "all_members",
        created_at: new Date().toISOString(),
      },
      {
        id: "ann-2",
        club_id: "c1111111-1111-1111-1111-111111111104",
        club_name: "NexCell",
        title: "💼 Venture Pitch Deck Template Released",
        content: "Please download the pitch deck guidelines from the Resources tab before this Saturday's Club Day workshop.",
        author_id: "usr-coordinator-2",
        author_name: "Vivaan Verma",
        author_role: "student_coordinator",
        is_pinned: true,
        target_audience: "all_members",
        created_at: new Date().toISOString(),
      }
    ]) as Announcement[],
    notifications: ((s as any).notifications || [
      {
        id: "notif-1",
        user_id: "s0000000-0000-0000-0000-0000000000100",
        title: "Upcoming Club Day #1",
        message: "Saturday 10:00 AM. Check-in window opens 15 mins prior. Ensure your phone camera is ready.",
        type: "reminder",
        link_url: "/checkin",
        read: false,
        created_at: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: "notif-2",
        user_id: "s0000000-0000-0000-0000-0000000000100",
        title: "Deliverable Evaluated",
        message: "Your submission for Kaizen Dev Club Day #1 has been scored 9.5/10 by Gaurav Kumar.",
        type: "grade",
        link_url: "/transcript",
        read: false,
        created_at: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        id: "notif-3",
        user_id: "s0000000-0000-0000-0000-0000000000100",
        title: "Duty Leave Application Approved",
        message: "Your duty leave for Gambade 2026 has been approved by Campus Manager Rajesh Kumar.",
        type: "duty_leave",
        link_url: "/duty-leave",
        read: false,
        created_at: new Date(Date.now() - 14400000).toISOString(),
      }
    ]) as InAppNotification[],
    sentNotifications: ((s as any).sentNotifications || []) as SentNotificationLog[],
    cronLogs: ((s as any).cronLogs || []) as CronRunLog[],
    auditLogs: [
      {
        id: "log-1",
        action: "SYSTEM_INITIALIZE",
        entity_type: "system",
        details: { message: "Track Stack database seeded with Phase 1-4 full platform capabilities" },
        created_at: new Date().toISOString(),
      },
    ],
  };
}

class Store {
  private state: AppState = loadInitialState();
  private listeners: Set<() => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.state = loadInitialState();
    }
  }

  private persist() {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): AppState {
    return this.state;
  }

  public resetToSeed() {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
    this.state = loadInitialState();
    this.notify();
  }

  // --- Audit Log ---
  public logAudit(action: string, entity_type: string, entity_id?: string, details: Record<string, unknown> = {}, user_name?: string) {
    const entry: AuditLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action,
      entity_type,
      entity_id,
      details,
      user_name: user_name || "System Admin",
      created_at: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(entry);
    this.persist();
  }

  // --- Clubs ---
  public getClubs(campusId?: string): Club[] {
    let list = this.state.clubs;
    if (campusId) {
      list = list.filter((c) => c.campus_id === campusId);
    }
    // Annotate enrolled count
    return list.map((club) => {
      const enrolled = this.state.memberships.filter(
        (m) => m.club_id === club.id && m.status === "approved"
      ).length;
      return { ...club, enrolled_count: enrolled };
    });
  }

  public getClubById(id: string): Club | undefined {
    const club = this.state.clubs.find((c) => c.id === id);
    if (!club) return undefined;
    const enrolled = this.state.memberships.filter(
      (m) => m.club_id === club.id && m.status === "approved"
    ).length;
    return { ...club, enrolled_count: enrolled };
  }

  public getSubClubs(parentClubId: string): Club[] {
    return this.getClubs().filter((c) => c.parent_club_id === parentClubId);
  }

  public createClub(club: Omit<Club, "id">, userProfile?: UserProfile) {
    const newClub: Club = {
      ...club,
      id: `c-custom-${Date.now()}`,
    };
    this.state.clubs.push(newClub);
    this.logAudit("CREATE_CLUB", "club", newClub.id, { name: newClub.name, campus_id: newClub.campus_id }, userProfile?.full_name);
    this.persist();
    return newClub;
  }

  public updateClub(id: string, updates: Partial<Club>, userProfile?: UserProfile) {
    const idx = this.state.clubs.findIndex((c) => c.id === id);
    if (idx !== -1) {
      this.state.clubs[idx] = { ...this.state.clubs[idx], ...updates };
      this.logAudit("UPDATE_CLUB", "club", id, updates as Record<string, unknown>, userProfile?.full_name);
      this.persist();
      return this.state.clubs[idx];
    }
    return null;
  }

  public approveClub(id: string, userProfile?: UserProfile) {
    return this.updateClub(id, { status: "approved" }, userProfile);
  }

  // --- Enrolment & 2-Club Rule Enforcement ---
  public getStudentMemberships(userId: string): ClubMember[] {
    return this.state.memberships
      .filter((m) => m.user_id === userId)
      .map((m) => {
        const club = this.state.clubs.find((c) => c.id === m.club_id);
        return {
          ...m,
          club_name: club?.name || "Unknown Club",
          club_logo: club?.logo_url,
        };
      });
  }

  public getClubMembers(clubId: string): ClubMember[] {
    return this.state.memberships
      .filter((m) => m.club_id === clubId)
      .map((m) => {
        const student = this.state.students.find((s) => s.id === m.user_id);
        return {
          ...m,
          user_name: student?.full_name || m.user_name || "Student Member",
          user_email: student?.email || m.user_email,
          student_id: student?.student_id || m.student_id,
          year_of_study: student?.year_of_study || m.year_of_study,
        };
      });
  }

  public requestJoinClub(
    clubId: string,
    user: UserProfile,
    designation: "primary" | "secondary" = "primary",
    note: string = ""
  ): { success: boolean; message: string; member?: ClubMember } {
    const club = this.getClubById(clubId);
    if (!club) {
      return { success: false, message: "Club not found." };
    }
    if (club.category === "Parent Society") {
      return {
        success: false,
        message: "Parent societies cannot be joined directly. Please join one of its affiliated clubs.",
      };
    }

    // Check existing membership
    const existing = this.state.memberships.find(
      (m) => m.club_id === clubId && m.user_id === user.id
    );
    if (existing && existing.status !== "withdrawn" && existing.status !== "rejected") {
      return {
        success: false,
        message: `You already have a ${existing.status} enrolment in ${club.name}.`,
      };
    }

    // Check Max Clubs Rule (Default 2, or per-year override from settings)
    const maxLimit = this.getStudentAllowedClubs(user);
    const activeCount = this.state.memberships.filter(
      (m) => m.user_id === user.id && (m.status === "approved" || m.status === "pending")
    ).length;

    if (activeCount >= maxLimit) {
      return {
        success: false,
        message: `Membership limit reached: Students in Year ${user.year_of_study || 1} are allowed a maximum of ${maxLimit} clubs. You currently hold ${activeCount} active/pending memberships.`,
      };
    }

    // Check Club Capacity for Waitlist
    const approvedCount = this.state.memberships.filter(
      (m) => m.club_id === clubId && m.status === "approved"
    ).length;

    const isFull = approvedCount >= club.capacity;
    let initialStatus: ClubMember["status"] = "pending";
    let waitlistPos: number | null = null;

    if (isFull) {
      const waitlisted = this.state.memberships.filter(
        (m) => m.club_id === clubId && m.status === "waitlisted"
      );
      waitlistPos = waitlisted.length + 1;
      initialStatus = "waitlisted";
    }

    const newMember: ClubMember = {
      id: `m-${Date.now()}`,
      club_id: clubId,
      club_name: club.name,
      user_id: user.id,
      user_name: user.full_name,
      user_email: user.email,
      student_id: user.student_id,
      year_of_study: user.year_of_study,
      designation,
      status: initialStatus,
      waitlist_position: waitlistPos,
      join_request_note: note,
      joined_at: null,
      created_at: new Date().toISOString(),
    };

    if (existing) {
      const idx = this.state.memberships.findIndex((m) => m.id === existing.id);
      this.state.memberships[idx] = newMember;
    } else {
      this.state.memberships.push(newMember);
    }

    this.logAudit("ENROLMENT_REQUEST", "club_members", newMember.id, {
      club_id: clubId,
      status: initialStatus,
      waitlist_position: waitlistPos,
    }, user.full_name);

    this.persist();

    if (initialStatus === "waitlisted") {
      return {
        success: true,
        message: `${club.name} is currently at capacity (${club.capacity}/${club.capacity}). You have been placed at waitlist position #${waitlistPos}.`,
        member: newMember,
      };
    }

    return {
      success: true,
      message: `Join request submitted for ${club.name}. Pending coordinator approval.`,
      member: newMember,
    };
  }

  public updateMembershipStatus(
    membershipId: string,
    status: ClubMember["status"],
    decisionNote?: string,
    reviewerName?: string
  ) {
    const idx = this.state.memberships.findIndex((m) => m.id === membershipId);
    if (idx === -1) return null;

    const old = this.state.memberships[idx];
    const updated: ClubMember = {
      ...old,
      status,
      decision_note: decisionNote || old.decision_note,
      joined_at: status === "approved" ? new Date().toISOString() : old.joined_at,
    };

    this.state.memberships[idx] = updated;

    // If a member departed/withdrew or was rejected from an approved seat, promote waitlisted
    if (old.status === "approved" && (status === "withdrawn" || status === "rejected")) {
      this.promoteNextWaitlisted(old.club_id);
    }

    this.logAudit("MEMBERSHIP_STATUS_CHANGE", "club_members", membershipId, {
      from: old.status,
      to: status,
      decision_note: decisionNote,
    }, reviewerName);

    this.persist();
    return updated;
  }

  private promoteNextWaitlisted(clubId: string) {
    const waitlisted = this.state.memberships
      .filter((m) => m.club_id === clubId && m.status === "waitlisted")
      .sort((a, b) => (a.waitlist_position || 999) - (b.waitlist_position || 999));

    if (waitlisted.length > 0) {
      const candidate = waitlisted[0];
      const idx = this.state.memberships.findIndex((m) => m.id === candidate.id);
      if (idx !== -1) {
        this.state.memberships[idx] = {
          ...this.state.memberships[idx],
          status: "pending",
          waitlist_position: null,
          decision_note: "Auto-promoted from waitlist as a seat became available.",
        };
        // Re-index remaining waitlisted
        waitlisted.slice(1).forEach((w, pos) => {
          const wIdx = this.state.memberships.findIndex((m) => m.id === w.id);
          if (wIdx !== -1) {
            this.state.memberships[wIdx].waitlist_position = pos + 1;
          }
        });
      }
    }
  }

  public getStudentAllowedClubs(user?: UserProfile): number {
    const rules = this.state.settings.membership_rules;
    if (!rules) return 2;
    if (user?.year_of_study && rules.year_overrides) {
      const yearStr = String(user.year_of_study);
      if (rules.year_overrides[yearStr] !== undefined) {
        return rules.year_overrides[yearStr];
      }
    }
    return rules.max_clubs_per_student ?? 2;
  }

  // --- Settings ---
  public updateSettings(partialSettings: Partial<SystemSettings>, adminUser?: UserProfile) {
    this.state.settings = {
      ...this.state.settings,
      ...partialSettings,
    };
    this.logAudit("UPDATE_SETTINGS", "settings", "global", partialSettings as Record<string, unknown>, adminUser?.full_name);
    this.persist();
    return this.state.settings;
  }

  // --- Club Days Calendar ---
  public getClubDays(campusId?: string): ClubDay[] {
    let days = this.state.clubDays;
    if (campusId) {
      days = days.filter((d) => d.campus_id === campusId);
    }
    return days.map((day) => {
      const count = this.state.activities.filter((a) => a.club_day_id === day.id).length;
      return { ...day, activity_count: count };
    });
  }

  public addClubDay(day: Omit<ClubDay, "id">, adminUser?: UserProfile) {
    const newDay: ClubDay = {
      ...day,
      id: `day-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    this.state.clubDays.push(newDay);
    this.logAudit("ADD_CLUB_DAY", "club_days", newDay.id, { date: newDay.date, title: newDay.title }, adminUser?.full_name);
    this.persist();
    return newDay;
  }

  public importClubDays(days: Omit<ClubDay, "id">[], adminUser?: UserProfile) {
    const added: ClubDay[] = [];
    days.forEach((d) => {
      const created = this.addClubDay(d, adminUser);
      added.push(created);
    });
    return added;
  }

  // --- Activities ---
  public getActivities(filter?: { clubId?: string; clubDayId?: string; status?: string }): Activity[] {
    let list = this.state.activities;
    if (filter?.clubId) {
      list = list.filter((a) => a.club_id === filter.clubId);
    }
    if (filter?.clubDayId) {
      list = list.filter((a) => a.club_day_id === filter.clubDayId);
    }
    if (filter?.status) {
      list = list.filter((a) => a.status === filter.status);
    }
    return list.map((act) => {
      const club = this.state.clubs.find((c) => c.id === act.club_id);
      const day = this.state.clubDays.find((d) => d.id === act.club_day_id);
      return {
        ...act,
        club_name: club?.name,
        club_logo: club?.logo_url,
        club_accent: club?.accent_color,
        club_day_date: day?.date,
        club_day_title: day?.title,
      };
    });
  }

  public getActivityById(id: string): Activity | undefined {
    const act = this.state.activities.find((a) => a.id === id);
    if (!act) return undefined;
    const club = this.state.clubs.find((c) => c.id === act.club_id);
    const day = this.state.clubDays.find((d) => d.id === act.club_day_id);
    return {
      ...act,
      club_name: club?.name,
      club_logo: club?.logo_url,
      club_accent: club?.accent_color,
      club_day_date: day?.date,
      club_day_title: day?.title,
    };
  }

  public createActivity(activity: Omit<Activity, "id">, coordinatorUser?: UserProfile) {
    const newAct: Activity = {
      ...activity,
      id: `act-${Date.now()}`,
      status: "draft",
      created_at: new Date().toISOString(),
      comments: [],
    };
    this.state.activities.push(newAct);
    this.logAudit("CREATE_ACTIVITY", "activities", newAct.id, {
      title: newAct.title,
      club_id: newAct.club_id,
      club_day_id: newAct.club_day_id,
    }, coordinatorUser?.full_name);
    this.persist();
    return newAct;
  }

  public updateActivityStatus(
    activityId: string,
    status: Activity["status"],
    commentText?: string,
    user?: UserProfile
  ) {
    const idx = this.state.activities.findIndex((a) => a.id === activityId);
    if (idx === -1) return null;

    const act = this.state.activities[idx];
    const comments = act.comments ? [...act.comments] : [];

    if (commentText && user) {
      comments.push({
        id: `com-${Date.now()}`,
        activity_id: activityId,
        user_id: user.id,
        user_name: user.full_name,
        user_role: user.role,
        content: commentText,
        type: status === "approved" ? "approval" : status === "changes_requested" ? "change_request" : "comment",
        created_at: new Date().toISOString(),
      });
    }

    const updated: Activity = {
      ...act,
      status,
      approved_by: status === "approved" ? user?.id : act.approved_by,
      comments,
    };

    this.state.activities[idx] = updated;
    this.logAudit("UPDATE_ACTIVITY_STATUS", "activities", activityId, {
      from: act.status,
      to: status,
      comment: commentText,
    }, user?.full_name);

    this.persist();
    return updated;
  }

  // ==========================================================================
  // PHASE 3: CHECK-IN SESSIONS & ATTENDANCE
  // ==========================================================================

  public startCheckinSession(
    clubId: string,
    clubDayId: string,
    activityId?: string,
    durationMinutes: number = 30,
    geoEnabled: boolean = false,
    user?: UserProfile
  ): CheckinSession {
    const club = this.getClubById(clubId);
    const day = this.state.clubDays.find((d) => d.id === clubDayId);
    const now = Date.now();
    const graceMinutes = this.state.settings.checkin_rules.late_grace_minutes || 15;

    const expiresAt = new Date(now + durationMinutes * 60 * 1000).toISOString();
    const graceUntil = new Date(now + graceMinutes * 60 * 1000).toISOString();
    const otp = generateOneTimeCode();
    const sessionId = `chk-sess-${Date.now()}`;

    const { token } = generateCheckinToken(sessionId, clubId, clubDayId, otp, 25);

    const session: CheckinSession = {
      id: sessionId,
      club_id: clubId,
      club_name: club?.name,
      club_day_id: clubDayId,
      club_day_title: day?.title,
      activity_id: activityId,
      started_at: new Date(now).toISOString(),
      expires_at: expiresAt,
      grace_until: graceUntil,
      status: "active",
      current_otp: otp,
      current_token: token,
      geo_enabled: geoEnabled,
      campus_lat: 28.4595, // Delhi-NCR
      campus_lng: 77.0266,
      radius_meters: 300,
      created_by: user?.id,
      created_at: new Date(now).toISOString(),
      checked_in_count: 0,
    };

    // Close any previous active session for this club and day
    this.state.checkinSessions.forEach((s) => {
      if (s.club_id === clubId && s.club_day_id === clubDayId && s.status === "active") {
        s.status = "closed";
      }
    });

    this.state.checkinSessions.unshift(session);

    // If activity is linked, mark it as 'live'
    if (activityId) {
      const actIdx = this.state.activities.findIndex((a) => a.id === activityId);
      if (actIdx !== -1) {
        this.state.activities[actIdx].status = "live";
      }
    }

    this.logAudit("START_CHECKIN_SESSION", "checkin_sessions", session.id, {
      club_id: clubId,
      club_day_id: clubDayId,
      durationMinutes,
      geoEnabled,
    }, user?.full_name);

    this.persist();
    return session;
  }

  public getCheckinSession(sessionId: string): CheckinSession | undefined {
    const s = this.state.checkinSessions.find((sess) => sess.id === sessionId);
    if (!s) return undefined;

    const count = this.state.attendances.filter(
      (a) => a.club_id === s.club_id && a.club_day_id === s.club_day_id && (a.status === "present" || a.status === "late")
    ).length;

    return { ...s, checked_in_count: count };
  }

  public getActiveSession(clubId: string, clubDayId: string): CheckinSession | undefined {
    const s = this.state.checkinSessions.find(
      (sess) => sess.club_id === clubId && sess.club_day_id === clubDayId && sess.status === "active"
    );
    if (!s) return undefined;

    const count = this.state.attendances.filter(
      (a) => a.club_id === s.club_id && a.club_day_id === s.club_day_id && (a.status === "present" || a.status === "late")
    ).length;

    return { ...s, checked_in_count: count };
  }

  public refreshSessionTokenAndOtp(sessionId: string): { token: string; otp: string } | null {
    const s = this.state.checkinSessions.find((sess) => sess.id === sessionId);
    if (!s || s.status !== "active") return null;

    const newOtp = generateOneTimeCode();
    const { token } = generateCheckinToken(s.id, s.club_id, s.club_day_id, newOtp, 25);

    s.current_otp = newOtp;
    s.current_token = token;
    this.persist();

    return { token, otp: newOtp };
  }

  public closeCheckinSession(sessionId: string, user?: UserProfile) {
    const s = this.state.checkinSessions.find((sess) => sess.id === sessionId);
    if (!s) return null;

    s.status = "closed";

    if (s.activity_id) {
      const actIdx = this.state.activities.findIndex((a) => a.id === s.activity_id);
      if (actIdx !== -1 && this.state.activities[actIdx].status === "live") {
        this.state.activities[actIdx].status = "closed";
      }
    }

    this.logAudit("CLOSE_CHECKIN_SESSION", "checkin_sessions", sessionId, {
      closed_by: user?.full_name,
    }, user?.full_name);

    this.persist();
    return s;
  }

  public studentCheckin(params: {
    token?: string;
    code?: string;
    clubId: string;
    clubDayId: string;
    student: UserProfile;
    userLocation?: { lat: number; lng: number };
    deviceFingerprint?: string;
    ip?: string;
  }): {
    success: boolean;
    message: string;
    attendance?: Attendance;
    flags?: { late: boolean; geoDistance?: number; deviceReuse: boolean };
  } {
    const { token, code, clubId, clubDayId, student, userLocation, deviceFingerprint, ip } = params;

    // 1. Session & Token Validation
    const session = this.getActiveSession(clubId, clubDayId);
    if (!session || session.status !== "active") {
      return { success: false, message: "No active check-in window for this Club Day." };
    }

    const now = Date.now();
    if (now > new Date(session.expires_at).getTime()) {
      session.status = "expired";
      this.persist();
      return { success: false, message: "Check-in window has expired." };
    }

    let checkinMethod: Attendance["checkin_method"] = "qr";

    if (token) {
      const verifyRes = verifyCheckinToken(token);
      if (!verifyRes.valid) {
        return { success: false, message: verifyRes.error || "Invalid QR token." };
      }
      if (verifyRes.payload?.clubId !== clubId || verifyRes.payload?.clubDayId !== clubDayId) {
        return { success: false, message: "QR code belongs to a different session or club." };
      }
      checkinMethod = "qr";
    } else if (code) {
      if (code.trim() !== session.current_otp) {
        return { success: false, message: "Invalid 6-digit one-time code. Codes rotate every 25 seconds." };
      }
      checkinMethod = "code";
    } else {
      return { success: false, message: "Please scan the rotating QR or provide the 6-digit code." };
    }

    // 2. Enrolment Membership Check
    const membership = this.state.memberships.find(
      (m) => m.user_id === student.id && m.club_id === clubId && m.status === "approved"
    );
    if (!membership) {
      return {
        success: false,
        message: "You are not an approved member of this club. Attendance is only permitted for enrolled members.",
      };
    }

    // 3. Idempotent / Duplicate Check
    const existing = this.state.attendances.find(
      (a) => a.user_id === student.id && a.club_id === clubId && a.club_day_id === clubDayId
    );
    if (existing) {
      return {
        success: false,
        message: `Already checked in at ${new Date(existing.checked_in_at).toLocaleTimeString()}. Idempotency guaranteed.`,
      };
    }

    // 4. Late Grace Period Calculation
    const isLate = now > new Date(session.grace_until).getTime();
    const finalStatus: Attendance["status"] = isLate ? "late" : "present";

    // 5. Optional Geo-Fencing
    let distanceMeters: number | null = null;
    if (session.geo_enabled && userLocation) {
      distanceMeters = calculateGeoDistance(
        userLocation.lat,
        userLocation.lng,
        session.campus_lat,
        session.campus_lng
      );
      if (distanceMeters > session.radius_meters) {
        return {
          success: false,
          message: `Location verification failed: You are ${distanceMeters}m away from campus (radius: ${session.radius_meters}m). Check-in rejected.`,
          flags: { late: isLate, geoDistance: distanceMeters, deviceReuse: false },
        };
      }
    }

    // 6. Device Reuse Anti-Proxy Flag
    const deviceHash = deviceFingerprint ? hashString(deviceFingerprint) : "dev-hash-default";
    const ipHash = ip ? hashString(ip) : "ip-hash-default";

    const reusedDevice = this.state.attendances.some(
      (a) =>
        a.club_id === clubId &&
        a.club_day_id === clubDayId &&
        a.device_hash === deviceHash &&
        a.user_id !== student.id
    );

    const attendance: Attendance = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      session_id: session.id,
      club_id: clubId,
      club_name: session.club_name,
      club_day_id: clubDayId,
      user_id: student.id,
      user_name: student.full_name,
      student_id: student.student_id,
      status: finalStatus,
      checkin_method: checkinMethod,
      checked_in_at: new Date(now).toISOString(),
      is_late: isLate,
      distance_meters: distanceMeters,
      device_hash: deviceHash,
      ip_hash: ipHash,
      device_reuse_flag: reusedDevice,
      is_presenter: false,
      spot_result: null,
      correction_reason: null,
      corrected_by: null,
      corrected_at: null,
    };

    this.state.attendances.push(attendance);

    this.logAudit("STUDENT_CHECKIN", "attendances", attendance.id, {
      student_id: student.student_id,
      status: finalStatus,
      is_late: isLate,
      distance_meters: distanceMeters,
      device_reuse_flag: reusedDevice,
      method: checkinMethod,
    }, student.full_name);

    this.persist();

    return {
      success: true,
      message: isLate
        ? "Checked in successfully (Flagged as LATE past grace period)."
        : "Check-in verified successfully! Record confirmed.",
      attendance,
      flags: { late: isLate, geoDistance: distanceMeters || undefined, deviceReuse: reusedDevice },
    };
  }

  public correctAttendance(params: {
    attendanceId?: string;
    clubId: string;
    clubDayId: string;
    studentId: string;
    newStatus: Attendance["status"];
    reason: string;
    correctedByUser: UserProfile;
    isPresenter?: boolean;
    spotResult?: Attendance["spot_result"];
  }): { success: boolean; message: string; attendance?: Attendance } {
    const { attendanceId, clubId, clubDayId, studentId, newStatus, reason, correctedByUser, isPresenter, spotResult } = params;

    if (!reason || !reason.trim()) {
      return { success: false, message: "A mandatory correction reason is required for all attendance adjustments." };
    }

    let att = this.state.attendances.find((a) => a.id === attendanceId);

    if (!att) {
      // Find by student & club day
      att = this.state.attendances.find(
        (a) => a.user_id === studentId && a.club_id === clubId && a.club_day_id === clubDayId
      );
    }

    const student = this.state.students.find((s) => s.id === studentId);
    const club = this.getClubById(clubId);

    if (!att) {
      // Create new manual attendance record
      att = {
        id: `att-corr-${Date.now()}`,
        club_id: clubId,
        club_name: club?.name,
        club_day_id: clubDayId,
        user_id: studentId,
        user_name: student?.full_name || "Student",
        student_id: student?.student_id,
        status: newStatus,
        checkin_method: "manual_coordinator",
        checked_in_at: new Date().toISOString(),
        is_late: newStatus === "late",
        device_reuse_flag: false,
        is_presenter: Boolean(isPresenter),
        spot_result: spotResult || null,
        correction_reason: reason,
        corrected_by: correctedByUser.id,
        corrected_at: new Date().toISOString(),
      };
      this.state.attendances.push(att);
    } else {
      const beforeStatus = att.status;
      att.status = newStatus;
      att.is_late = newStatus === "late";
      att.correction_reason = reason;
      att.corrected_by = correctedByUser.id;
      att.corrected_at = new Date().toISOString();
      if (isPresenter !== undefined) att.is_presenter = isPresenter;
      if (spotResult !== undefined) att.spot_result = spotResult;

      this.logAudit("ATTENDANCE_CORRECTION", "attendances", att.id, {
        student_name: att.user_name,
        before_status: beforeStatus,
        after_status: newStatus,
        reason,
        corrected_by: correctedByUser.full_name,
      }, correctedByUser.full_name);
    }

    this.persist();
    return { success: true, message: `Attendance updated to ${newStatus.toUpperCase()} with audit record.`, attendance: att };
  }

  public getAttendances(filter?: {
    clubId?: string;
    clubDayId?: string;
    userId?: string;
    sessionId?: string;
  }): Attendance[] {
    let list = this.state.attendances;
    if (filter?.clubId) list = list.filter((a) => a.club_id === filter.clubId);
    if (filter?.clubDayId) list = list.filter((a) => a.club_day_id === filter.clubDayId);
    if (filter?.userId) list = list.filter((a) => a.user_id === filter.userId);
    if (filter?.sessionId) list = list.filter((a) => a.session_id === filter.sessionId);
    return list;
  }

  // ==========================================================================
  // PHASE 3: SUBMISSIONS (With Version History)
  // ==========================================================================

  public submitDeliverable(params: {
    activityId: string;
    student: UserProfile;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
    fileUrl?: string;
    linkUrl?: string;
    notes?: string;
  }): { success: boolean; message: string; submission?: Submission } {
    const { activityId, student, fileName, fileSize, fileType, fileUrl, linkUrl, notes } = params;
    const act = this.getActivityById(activityId);
    if (!act) return { success: false, message: "Activity not found." };

    // Validate size limit from settings (default 20-25 MB)
    const maxSizeMb = this.state.settings.submission_rules.max_size_mb || 25;
    if (fileSize && fileSize > maxSizeMb * 1024 * 1024) {
      return { success: false, message: `File size exceeds allowed limit of ${maxSizeMb} MB.` };
    }

    // Check deadline
    const now = Date.now();
    const isLate = act.submission_deadline ? now > new Date(act.submission_deadline).getTime() : false;

    // Previous version check
    const existing = this.state.submissions
      .filter((s) => s.activity_id === activityId && s.user_id === student.id)
      .sort((a, b) => b.version - a.version);

    const version = existing.length > 0 ? existing[0].version + 1 : 1;

    const sub: Submission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      activity_id: activityId,
      activity_title: act.title,
      club_id: act.club_id,
      club_name: act.club_name,
      user_id: student.id,
      user_name: student.full_name,
      student_id: student.student_id,
      version,
      file_name: fileName,
      file_size: fileSize,
      file_type: fileType,
      file_url: fileUrl,
      link_url: linkUrl,
      is_late: isLate,
      notes,
      submitted_at: new Date(now).toISOString(),
    };

    this.state.submissions.unshift(sub);

    this.logAudit("SUBMIT_DELIVERABLE", "submissions", sub.id, {
      activity_id: activityId,
      version,
      is_late: isLate,
      file_name: fileName,
    }, student.full_name);

    this.persist();

    return {
      success: true,
      message: isLate
        ? `Submission v${version} uploaded (FLAGGED LATE past deadline).`
        : `Submission v${version} uploaded successfully!`,
      submission: sub,
    };
  }

  public getSubmissions(activityId?: string, userId?: string): Submission[] {
    let list = this.state.submissions;
    if (activityId) list = list.filter((s) => s.activity_id === activityId);
    if (userId) list = list.filter((s) => s.user_id === userId);

    return list.map((sub) => {
      const evalObj = this.state.evaluations.find((e) => e.submission_id === sub.id);
      return { ...sub, evaluation: evalObj };
    });
  }

  // ==========================================================================
  // PHASE 3: EVALUATION & RUBRIC SCORING (Hidden until published)
  // ==========================================================================

  public evaluateSubmission(params: {
    submissionId: string;
    evaluator: UserProfile;
    rubricScores: RubricScores;
    feedback?: string;
    isPublished?: boolean;
  }): Evaluation {
    const { submissionId, evaluator, rubricScores, feedback, isPublished = false } = params;
    const sub = this.state.submissions.find((s) => s.id === submissionId);
    const existingIdx = this.state.evaluations.findIndex((e) => e.submission_id === submissionId);

    const total = parseFloat(
      ((rubricScores.content + rubricScores.presentation + rubricScores.participation) / 3).toFixed(1)
    );

    const finalRubric: RubricScores = {
      ...rubricScores,
      total,
    };

    const evalRecord: Evaluation = {
      id: existingIdx !== -1 ? this.state.evaluations[existingIdx].id : `eval-${Date.now()}`,
      submission_id: submissionId,
      activity_id: sub?.activity_id || "",
      student_id: sub?.user_id || "",
      student_name: sub?.user_name,
      evaluator_id: evaluator.id,
      evaluator_name: evaluator.full_name,
      evaluator_role: evaluator.role,
      rubric_scores: finalRubric,
      feedback,
      is_published: isPublished,
      published_at: isPublished ? new Date().toISOString() : null,
      created_at: new Date().toISOString(),
    };

    if (existingIdx !== -1) {
      this.state.evaluations[existingIdx] = evalRecord;
    } else {
      this.state.evaluations.push(evalRecord);
    }

    this.logAudit("EVALUATE_SUBMISSION", "evaluations", evalRecord.id, {
      submission_id: submissionId,
      total_score: total,
      is_published: isPublished,
    }, evaluator.full_name);

    this.persist();
    return evalRecord;
  }

  public publishActivityEvaluations(activityId: string, user?: UserProfile) {
    let count = 0;
    this.state.evaluations.forEach((e) => {
      if (e.activity_id === activityId && !e.is_published) {
        e.is_published = true;
        e.published_at = new Date().toISOString();
        count++;
      }
    });

    const actIdx = this.state.activities.findIndex((a) => a.id === activityId);
    if (actIdx !== -1) {
      this.state.activities[actIdx].status = "evaluated";
    }

    this.logAudit("PUBLISH_EVALUATIONS", "evaluations", activityId, {
      published_count: count,
    }, user?.full_name);

    this.persist();
    return count;
  }

  public getEvaluations(activityId?: string): Evaluation[] {
    let list = this.state.evaluations;
    if (activityId) list = list.filter((e) => e.activity_id === activityId);
    return list;
  }

  // ============================================================================
  // PHASE 4: EVENTS & TEAM MANAGEMENT
  // ============================================================================

  public getEvents(): CampusEvent[] {
    return this.state.events;
  }

  public getEventById(id: string): CampusEvent | undefined {
    return this.state.events.find((e) => e.id === id);
  }

  public createEvent(
    data: Omit<CampusEvent, "id" | "created_at" | "enrolled_count">,
    creator?: UserProfile
  ): CampusEvent {
    const newEvent: CampusEvent = {
      ...data,
      id: `e-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      enrolled_count: 0,
      created_by: creator?.id,
      created_at: new Date().toISOString(),
    };

    this.state.events.push(newEvent);

    this.logAudit("CREATE_EVENT", "events", newEvent.id, {
      name: newEvent.name,
      code: newEvent.code,
      mode: newEvent.mode,
      capacity: newEvent.capacity,
      is_inter_campus: newEvent.is_inter_campus,
    }, creator?.full_name);

    this.persist();
    return newEvent;
  }

  public getEventTeams(eventId?: string): EventTeam[] {
    let list = this.state.eventTeams;
    if (eventId) {
      list = list.filter((t) => t.event_id === eventId);
    }
    return list.map((t) => ({
      ...t,
      members: this.state.eventRegistrations.filter((r) => r.team_id === t.id),
      members_count: this.state.eventRegistrations.filter((r) => r.team_id === t.id && r.status === "confirmed").length,
    }));
  }

  public getEventRegistrations(eventId?: string): EventRegistration[] {
    let list = this.state.eventRegistrations;
    if (eventId) {
      list = list.filter((r) => r.event_id === eventId);
    }
    return list;
  }

  public registerForEvent(
    eventId: string,
    userId: string,
    mode: "individual" | "team",
    teamId?: string,
    role: "leader" | "member" | "individual" = "individual"
  ): { success: boolean; message: string; registration?: EventRegistration } {
    const event = this.getEventById(eventId);
    if (!event) return { success: false, message: "Event not found" };

    const student = this.state.students.find((s) => s.id === userId);
    if (!student) return { success: false, message: "Student profile not found" };

    // 1. UNIQUE CONSTRAINT CHECK: A student cannot register twice for the same event
    const existingReg = this.state.eventRegistrations.find(
      (r) => r.event_id === eventId && r.user_id === userId && r.status !== "declined" && r.status !== "cancelled"
    );
    if (existingReg) {
      return {
        success: false,
        message: `Student ${student.full_name} is already registered for this event (Registration ID: ${existingReg.id}). Duplicate registrations are strictly prevented.`,
      };
    }

    // 2. CAPACITY & WAITLIST CHECK
    const confirmedCount = this.state.eventRegistrations.filter(
      (r) => r.event_id === eventId && r.status === "confirmed"
    ).length;
    const isWaitlisted = confirmedCount >= event.capacity;

    let assignedTeamName: string | null = null;
    if (teamId) {
      const team = this.state.eventTeams.find((t) => t.id === teamId);
      if (team) assignedTeamName = team.name;
    }

    const newReg: EventRegistration = {
      id: `reg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      event_name: event.name,
      user_id: userId,
      user_name: student.full_name,
      user_email: student.email,
      student_id: student.student_id || "MSOT-TEMP",
      campus_name: student.campus_name || "Delhi-NCR Campus",
      team_id: teamId || null,
      team_name: assignedTeamName,
      role,
      status: isWaitlisted ? "waitlisted" : "confirmed",
      checked_in: false,
      registered_at: new Date().toISOString(),
    };

    this.state.eventRegistrations.push(newReg);

    // Update event enrolled count
    event.enrolled_count = (event.enrolled_count || 0) + 1;

    // 3. AUTO-TRIGGER DUTY LEAVE IF INTER-CAMPUS EVENT
    if (event.is_inter_campus && !isWaitlisted) {
      const existingDl = this.state.dutyLeaves.find(
        (dl) => dl.event_id === eventId && dl.user_id === userId
      );
      if (!existingDl) {
        const newDl: DutyLeave = {
          id: `dl-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          user_id: userId,
          user_name: student.full_name,
          student_id: student.student_id || "MSOT-TEMP",
          campus_name: student.campus_name || "Delhi-NCR Campus",
          event_id: eventId,
          event_name: event.name,
          event_registration_id: newReg.id,
          dates: `${event.start_date.substring(0, 10)} to ${event.end_date.substring(0, 10)}`,
          reason: `Representing campus in inter-campus flagship event: ${event.name}`,
          status: "pending",
          letter_pdf_url: `/api/duty-leave/dl-pending/download`,
          created_at: new Date().toISOString(),
        };
        this.state.dutyLeaves.push(newDl);
      }
    }

    this.logAudit("REGISTER_EVENT", "event_registrations", newReg.id, {
      event_id: eventId,
      event_name: event.name,
      team_id: teamId || null,
      status: newReg.status,
    }, student.full_name);

    this.persist();
    return {
      success: true,
      message: isWaitlisted
        ? "Event capacity reached. You have been placed on the verified waitlist."
        : "Successfully registered for event! " + (event.is_inter_campus ? "Duty Leave request automatically routed to Campus Manager." : ""),
      registration: newReg,
    };
  }

  public createTeam(
    eventId: string,
    teamName: string,
    leaderId: string,
    invitedStudentIdsOrUids: string[] = []
  ): { success: boolean; message: string; team?: EventTeam } {
    const event = this.getEventById(eventId);
    if (!event) return { success: false, message: "Event not found" };

    if (event.mode === "individual") {
      return { success: false, message: "This event only supports individual registrations." };
    }

    // Check team name uniqueness for this event
    const existingTeam = this.state.eventTeams.find(
      (t) => t.event_id === eventId && t.name.toLowerCase() === teamName.trim().toLowerCase()
    );
    if (existingTeam) {
      return { success: false, message: `Team name "${teamName}" is already registered for this event.` };
    }

    const leader = this.state.students.find((s) => s.id === leaderId);
    if (!leader) return { success: false, message: "Leader student profile not found" };

    // Check if leader already registered
    const leaderReg = this.state.eventRegistrations.find(
      (r) => r.event_id === eventId && r.user_id === leaderId && r.status !== "declined" && r.status !== "cancelled"
    );
    if (leaderReg) {
      return { success: false, message: "You are already registered or in a team for this event." };
    }

    const newTeam: EventTeam = {
      id: `t-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      event_id: eventId,
      event_name: event.name,
      name: teamName.trim(),
      leader_id: leaderId,
      leader_name: leader.full_name,
      leader_student_id: leader.student_id,
      status: "registered",
      created_at: new Date().toISOString(),
    };

    this.state.eventTeams.push(newTeam);

    // Register leader
    this.registerForEvent(eventId, leaderId, "team", newTeam.id, "leader");

    // Add invited members
    invitedStudentIdsOrUids.forEach((input) => {
      const trimmed = input.trim();
      if (!trimmed) return;
      const matched = this.state.students.find(
        (s) => s.id === trimmed || s.student_id?.toLowerCase() === trimmed.toLowerCase() || s.email.toLowerCase() === trimmed.toLowerCase()
      );
      if (matched && matched.id !== leaderId) {
        // Invite member
        const isAlreadyInTeam = this.state.eventRegistrations.some(
          (r) => r.event_id === eventId && r.user_id === matched.id
        );
        if (!isAlreadyInTeam) {
          this.registerForEvent(eventId, matched.id, "team", newTeam.id, "member");
        }
      }
    });

    this.logAudit("CREATE_TEAM", "event_teams", newTeam.id, {
      event_id: eventId,
      team_name: newTeam.name,
      leader_name: leader.full_name,
    }, leader.full_name);

    this.persist();
    return { success: true, message: `Team "${teamName}" created successfully!`, team: newTeam };
  }

  public checkinEventParticipant(
    eventId: string,
    userId: string,
    method: "qr" | "code" = "qr"
  ): { success: boolean; message: string; registration?: EventRegistration } {
    const reg = this.state.eventRegistrations.find(
      (r) => r.event_id === eventId && r.user_id === userId
    );

    if (!reg) {
      return { success: false, message: "Student is not registered for this event." };
    }

    if (reg.checked_in) {
      return { success: true, message: "Already checked in!", registration: reg };
    }

    reg.checked_in = true;
    reg.checkin_time = new Date().toISOString();

    this.logAudit("EVENT_CHECKIN", "event_registrations", reg.id, {
      event_id: eventId,
      user_id: userId,
      method,
    }, reg.user_name);

    this.persist();
    return { success: true, message: "Check-in verified successfully!", registration: reg };
  }

  public recordEventResults(
    eventId: string,
    results: { userId: string; position?: "1st" | "2nd" | "3rd" | "finalist" | "participant"; score?: number }[],
    staffUser?: UserProfile
  ): { success: boolean; issuedCertificatesCount: number } {
    const event = this.getEventById(eventId);
    if (!event) return { success: false, issuedCertificatesCount: 0 };

    let issuedCount = 0;

    results.forEach((res) => {
      const reg = this.state.eventRegistrations.find(
        (r) => r.event_id === eventId && r.user_id === res.userId
      );
      if (reg) {
        reg.position = res.position || "participant";
        if (res.score !== undefined) reg.score = res.score;

        // Auto issue certificate
        const certType: CertificateType =
          res.position === "1st" || res.position === "2nd" || res.position === "3rd"
            ? "winner"
            : res.position === "finalist"
            ? "achievement"
            : "participation";

        const title =
          certType === "winner"
            ? `${res.position} Place Winner - ${event.name}`
            : certType === "achievement"
            ? `Finalist Award - ${event.name}`
            : `Certificate of Participation - ${event.name}`;

        const certDesc =
          certType === "winner"
            ? `Awarded ${res.position} place for exemplary performance in ${event.name}.`
            : `Verified participation in ${event.name}.`;

        const existingCert = this.state.certificates.find(
          (c) => c.event_id === eventId && c.user_id === res.userId
        );

        if (!existingCert) {
          this.issueCertificate({
            user_id: res.userId,
            user_name: reg.user_name || "Student",
            student_id: reg.student_id || "MSOT-TEMP",
            campus_name: reg.campus_name || "Delhi-NCR Campus",
            type: certType,
            title,
            description: certDesc,
            event_id: eventId,
            event_name: event.name,
            signatory_name: "Ayush Chauhan",
            signatory_title: "Campus Director & System Administrator",
          }, staffUser);
          issuedCount++;
        }
      }
    });

    event.status = "completed";

    this.logAudit("RECORD_EVENT_RESULTS", "events", eventId, {
      results_count: results.length,
      certificates_issued: issuedCount,
    }, staffUser?.full_name);

    this.persist();
    return { success: true, issuedCertificatesCount: issuedCount };
  }

  // ============================================================================
  // CERTIFICATES & HMAC CRYPTOGRAPHIC VERIFICATION
  // ============================================================================

  public getCertificates(): Certificate[] {
    return this.state.certificates;
  }

  public getCertificateById(id: string): Certificate | undefined {
    return this.state.certificates.find(
      (c) => c.id.toLowerCase() === id.trim().toLowerCase()
    );
  }

  public getCertificatesForUser(userId: string): Certificate[] {
    return this.state.certificates.filter((c) => c.user_id === userId);
  }

  public issueCertificate(
    data: {
      user_id: string;
      user_name: string;
      student_id: string;
      campus_name?: string;
      type: CertificateType;
      title: string;
      description: string;
      event_id?: string | null;
      event_name?: string | null;
      activity_id?: string | null;
      activity_title?: string | null;
      club_id?: string | null;
      club_name?: string | null;
      signatory_name?: string;
      signatory_title?: string;
    },
    issuer?: UserProfile
  ): Certificate {
    const nextIdx = this.state.certificates.length + 1;
    const certId = `MSOT-CERT-2026-${String(nextIdx).padStart(4, "0")}`;
    const issueDate = new Date().toISOString().substring(0, 10);
    const sigName = data.signatory_name || "Ayush Chauhan";
    const sigTitle = data.signatory_title || "Campus Director & System Administrator";

    const canonicalObj = {
      id: certId,
      user_id: data.user_id,
      event_id: data.event_id || null,
      activity_id: data.activity_id || null,
      club_id: data.club_id || null,
      type: data.type,
      issue_date: issueDate,
      signatory_name: sigName,
    };

    const canonicalData = buildCanonicalCertificateData(canonicalObj);
    const signature = signCertificateData(canonicalData);

    const newCert: Certificate = {
      id: certId,
      user_id: data.user_id,
      user_name: data.user_name,
      student_id: data.student_id,
      campus_name: data.campus_name || "Delhi-NCR Campus",
      type: data.type,
      title: data.title,
      description: data.description,
      event_id: data.event_id || null,
      event_name: data.event_name || null,
      activity_id: data.activity_id || null,
      activity_title: data.activity_title || null,
      club_id: data.club_id || null,
      club_name: data.club_name || null,
      issue_date: issueDate,
      signatory_name: sigName,
      signatory_title: sigTitle,
      canonical_data: canonicalData,
      signature: signature,
      pdf_url: `/api/certificates/${certId}/download`,
      status: "valid",
      issued_by: issuer?.id || "system",
      created_at: new Date().toISOString(),
    };

    this.state.certificates.push(newCert);

    this.logAudit("ISSUE_CERTIFICATE", "certificates", newCert.id, {
      user_id: data.user_id,
      type: data.type,
      title: data.title,
      signature_preview: signature.substring(0, 16) + "...",
    }, issuer?.full_name);

    this.persist();
    return newCert;
  }

  public bulkIssueCertificates(
    items: Parameters<Store["issueCertificate"]>[0][],
    issuer?: UserProfile
  ): Certificate[] {
    const results: Certificate[] = [];
    for (const item of items) {
      results.push(this.issueCertificate(item, issuer));
    }
    return results;
  }

  public revokeCertificate(
    certificateId: string,
    reason: string,
    admin?: UserProfile
  ): { success: boolean; message: string; certificate?: Certificate } {
    const cert = this.getCertificateById(certificateId);
    if (!cert) return { success: false, message: "Certificate not found" };

    cert.status = "revoked";
    cert.revocation_reason = reason;
    cert.revoked_at = new Date().toISOString();

    this.logAudit("REVOKE_CERTIFICATE", "certificates", certificateId, {
      reason,
      revoked_by: admin?.full_name,
    }, admin?.full_name);

    this.persist();
    return { success: true, message: `Certificate ${certificateId} has been revoked.`, certificate: cert };
  }

  public verifyCertificateById(id: string): {
    valid: boolean;
    status: "VALID" | "REVOKED" | "INVALID_TAMPERED" | "NOT_FOUND";
    certificate?: Certificate;
    message: string;
  } {
    const cert = this.getCertificateById(id);
    if (!cert) {
      return { valid: false, status: "NOT_FOUND", message: `No certificate registered with ID #${id}` };
    }

    if (cert.status === "revoked") {
      return {
        valid: false,
        status: "REVOKED",
        certificate: cert,
        message: `This certificate was REVOKED on ${cert.revoked_at?.substring(0, 10)}. Reason: ${cert.revocation_reason || "Administrative policy update"}`,
      };
    }

    // Cryptographic HMAC check
    const isValidSignature = verifyCertificateSignature(cert.canonical_data, cert.signature);
    if (!isValidSignature) {
      return {
        valid: false,
        status: "INVALID_TAMPERED",
        certificate: cert,
        message: "CRITICAL INTEGRITY FAILURE: Cryptographic HMAC signature does not match canonical certificate data. Document has been tampered with or modified.",
      };
    }

    return {
      valid: true,
      status: "VALID",
      certificate: cert,
      message: "GENUINE & AUTHENTIC: Certificate verified against MSOT cryptographic ledger.",
    };
  }

  // ============================================================================
  // DUTY LEAVE REQUESTS
  // ============================================================================

  public getDutyLeaves(): DutyLeave[] {
    return this.state.dutyLeaves;
  }

  public getDutyLeavesForUser(userId: string): DutyLeave[] {
    return this.state.dutyLeaves.filter((dl) => dl.user_id === userId);
  }

  public approveDutyLeave(
    leaveId: string,
    approver: UserProfile,
    comments?: string,
    approve: boolean = true
  ): { success: boolean; message: string; leave?: DutyLeave } {
    const leave = this.state.dutyLeaves.find((dl) => dl.id === leaveId);
    if (!leave) return { success: false, message: "Duty leave request not found" };

    leave.status = approve ? "approved" : "rejected";
    leave.approver_id = approver.id;
    leave.approver_name = approver.full_name;
    leave.approver_comments = comments || (approve ? "Sanctioned for institutional representation." : "Declined due to academic scheduling conflict.");
    leave.updated_at = new Date().toISOString();
    leave.letter_pdf_url = `/api/duty-leave/${leave.id}/download`;

    this.logAudit("DUTY_LEAVE_DECISION", "duty_leaves", leaveId, {
      decision: leave.status,
      comments: leave.approver_comments,
    }, approver.full_name);

    this.persist();
    return {
      success: true,
      message: approve ? "Duty Leave approved and official letter generated!" : "Duty Leave rejected.",
      leave,
    };
  }

  // ============================================================================
  // CO-CURRICULAR TRANSCRIPT GENERATION
  // ============================================================================

  public getStudentTranscriptData(userIdOrStudentId: string): CoCurricularTranscript | null {
    const student = this.state.students.find(
      (s) => s.id === userIdOrStudentId || s.student_id?.toLowerCase() === userIdOrStudentId.toLowerCase()
    );
    if (!student) return null;

    // 1. Enrolled clubs & attendance percentage
    const memberships = this.state.memberships.filter(
      (m) => m.user_id === student.id && m.status === "approved"
    );
    const clubsData = memberships.map((m) => {
      const club = this.state.clubs.find((c) => c.id === m.club_id);
      const studentAttendances = this.state.attendances.filter(
        (a) => a.user_id === student.id && a.club_id === m.club_id && a.status === "present"
      );
      const totalClubDays = this.state.clubDays.length || 4;
      const count = studentAttendances.length;
      const pct = Math.min(100, Math.round((count / totalClubDays) * 100));

      return {
        club_id: m.club_id,
        club_name: m.club_name || club?.name || "Club",
        category: club?.category || "Technical",
        designation: m.designation,
        joined_at: m.joined_at || "2026-09-01",
        attendance_count: count,
        attendance_pct: pct,
      };
    });

    // 2. Submissions & faculty evaluations
    const userSubmissions = this.state.submissions.filter((s) => s.user_id === student.id);
    const submissionsData = userSubmissions.map((s) => {
      const evalRec = this.state.evaluations.find((e) => e.submission_id === s.id);
      return {
        activity_title: s.activity_title || "Club Day Deliverable",
        club_name: s.club_name || "Club",
        submitted_at: s.submitted_at,
        score: evalRec ? evalRec.rubric_scores.total : null,
        feedback: evalRec?.feedback,
      };
    });

    // 3. Events
    const userRegs = this.state.eventRegistrations.filter((r) => r.user_id === student.id);
    const eventsData = userRegs.map((r) => {
      const event = this.getEventById(r.event_id);
      return {
        event_name: r.event_name || event?.name || "Event",
        role: r.role === "leader" ? "Team Leader" : r.role === "member" ? "Team Member" : "Individual Participant",
        team_name: r.team_name,
        position: r.position ? `${r.position} Place` : "Participant",
        dates: event ? `${event.start_date.substring(0, 10)} to ${event.end_date.substring(0, 10)}` : "Nov 2026",
      };
    });

    // 4. Certificates
    const userCerts = this.getCertificatesForUser(student.id).filter((c) => c.status === "valid");
    const certsData = userCerts.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      issue_date: c.issue_date,
    }));

    const scoresOnly = submissionsData.filter((s) => s.score !== null).map((s) => s.score as number);
    const avgScore = scoresOnly.length ? Math.round((scoresOnly.reduce((a, b) => a + b, 0) / scoresOnly.length) * 10) / 10 : 0;

    const canonicalTranscript = `${student.student_id}|${student.full_name}|${clubsData.length}|${certsData.length}`;
    const ledgerSig = signCertificateData(canonicalTranscript);

    return {
      student_id: student.student_id || "MSOT-TEMP",
      student_name: student.full_name,
      student_uid: student.id,
      email: student.email,
      program: student.program || "B.Tech Computer Science & AI",
      year_of_study: student.year_of_study || 2,
      campus_name: student.campus_name || "Delhi-NCR Campus",
      generated_at: new Date().toISOString(),
      clubs: clubsData,
      submissions: submissionsData,
      events: eventsData,
      certificates: certsData,
      summary: {
        total_clubs: clubsData.length,
        total_attendances: clubsData.reduce((acc, c) => acc + c.attendance_count, 0),
        total_events: eventsData.length,
        total_certificates: certsData.length,
        average_submission_score: avgScore,
      },
      verification_url: `http://localhost:3000/api/transcript/${student.student_id || student.id}`,
      signature: ledgerSig,
    };
  }

  // ============================================================================
  // PHASE 5: MONTHLY REPORTS, ANNOUNCEMENTS, AUTOMATIONS & NOTIFICATIONS
  // ============================================================================

  public generateMonthlyReport(
    clubId: string,
    month: string = "October 2026",
    actor?: UserProfile
  ): MonthlyReport {
    const club = this.getClubById(clubId);
    const clubName = club?.name || "Club";
    const campusId = club?.campus_id || "c1111111-1111-1111-1111-111111111111";
    const campus = this.state.campuses.find((c) => c.id === campusId);
    const campusName = campus?.name || "Delhi-NCR Campus";

    // 1. RAW ATTENDANCE DATA (Strict equality to raw attendances)
    const rawAttendances = this.state.attendances.filter(
      (a) => a.club_id === clubId && a.status === "present"
    );
    const rawMembers = this.state.memberships.filter(
      (m) => m.club_id === clubId && m.status === "approved"
    );
    const totalClubDays = this.state.clubDays.length || 4;
    const totalAttendances = rawAttendances.length;
    const totalMembers = rawMembers.length;
    const possibleAttendances = totalMembers * totalClubDays;
    const attendanceRate = possibleAttendances > 0
      ? Math.round((totalAttendances / possibleAttendances) * 100 * 10) / 10
      : 0.0;

    // 2. RAW SUBMISSIONS DATA (Strict equality to raw submissions)
    const rawSubmissions = this.state.submissions.filter((s) => s.club_id === clubId);
    const rawSubmissionsCount = rawSubmissions.length;

    // 3. RAW EVALUATIONS & AVERAGE RUBRIC SCORES
    const subIds = new Set(rawSubmissions.map((s) => s.id));
    const rawEvaluations = this.state.evaluations.filter((e) => subIds.has(e.submission_id));
    const evaluatedCount = rawEvaluations.length;
    const avgScore = evaluatedCount > 0
      ? Math.round((rawEvaluations.reduce((acc, e) => acc + e.rubric_scores.total, 0) / evaluatedCount) * 10) / 10
      : 0.0;

    // Highlights
    const highlights: string[] = [
      `Conducted ${totalClubDays} scheduled Saturday sessions with ${totalAttendances} verified member attendances.`,
      `Achieved ${attendanceRate}% overall attendance compliance across ${totalMembers} enrolled members.`,
      `Received ${rawSubmissionsCount} verified deliverables with an average faculty evaluation score of ${avgScore}/10.`,
    ];

    const reportId = `rep-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newReport: MonthlyReport = {
      id: reportId,
      club_id: clubId,
      club_name: clubName,
      campus_id: campusId,
      campus_name: campusName,
      month,
      period_start: "2026-10-01T00:00:00Z",
      period_end: "2026-10-31T23:59:59Z",
      total_members: totalMembers,
      total_club_days: totalClubDays,
      total_attendances: totalAttendances,
      attendance_rate: attendanceRate,
      submissions_count: rawSubmissionsCount,
      evaluated_count: evaluatedCount,
      average_score: avgScore,
      highlights,
      status: "generated",
      generated_at: new Date().toISOString(),
      pdf_url: `/api/reports/${reportId}/pdf`,
      csv_url: `/api/reports/${reportId}/csv`,
    };

    // Replace if exists for same club and month
    const existingIdx = this.state.monthlyReports.findIndex(
      (r) => r.club_id === clubId && r.month === month
    );
    if (existingIdx !== -1) {
      newReport.id = this.state.monthlyReports[existingIdx].id;
      this.state.monthlyReports[existingIdx] = newReport;
    } else {
      this.state.monthlyReports.push(newReport);
    }

    this.logAudit("GENERATE_MONTHLY_REPORT", "monthly_reports", newReport.id, {
      club_id: clubId,
      club_name: clubName,
      month,
      attendance_rate: attendanceRate,
      total_attendances: totalAttendances,
      submissions_count: rawSubmissionsCount,
      average_score: avgScore,
    }, actor?.full_name || "Automated Cron Scheduler");

    this.persist();
    return newReport;
  }

  public getMonthlyReports(campusId?: string, clubId?: string): MonthlyReport[] {
    let list = this.state.monthlyReports;
    if (campusId) list = list.filter((r) => r.campus_id === campusId);
    if (clubId) list = list.filter((r) => r.club_id === clubId);
    return list;
  }

  public getMonthlyReportById(id: string): MonthlyReport | undefined {
    return this.state.monthlyReports.find((r) => r.id === id);
  }

  // --- ANNOUNCEMENTS ---

  public createAnnouncement(
    data: Omit<Announcement, "id" | "created_at">,
    author?: UserProfile
  ): Announcement {
    const newAnnouncement: Announcement = {
      ...data,
      id: `ann-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      created_at: new Date().toISOString(),
    };

    this.state.announcements.unshift(newAnnouncement);

    // Auto-create in-app notifications for all club members
    const members = this.state.memberships.filter(
      (m) => m.club_id === data.club_id && m.status === "approved"
    );
    members.forEach((m) => {
      this.createInAppNotification({
        user_id: m.user_id,
        title: `Announcement: ${data.club_name}`,
        message: data.title,
        type: "announcement",
        link_url: `/clubs/${data.club_id}`,
      });
    });

    this.logAudit("CREATE_ANNOUNCEMENT", "announcements", newAnnouncement.id, {
      club_id: data.club_id,
      title: data.title,
      is_pinned: data.is_pinned,
    }, author?.full_name);

    this.persist();
    return newAnnouncement;
  }

  public getAnnouncements(clubId?: string): Announcement[] {
    let list = this.state.announcements;
    if (clubId) list = list.filter((a) => a.club_id === clubId);
    return list;
  }

  public getPinnedAnnouncements(campusId?: string, clubIds?: string[]): Announcement[] {
    return this.state.announcements.filter((a) => {
      if (!a.is_pinned) return false;
      if (clubIds && clubIds.length > 0 && !clubIds.includes(a.club_id)) return false;
      if (campusId && a.campus_id && a.campus_id !== campusId) return false;
      return true;
    });
  }

  // --- IN-APP NOTIFICATIONS ---

  public createInAppNotification(
    data: Omit<InAppNotification, "id" | "created_at" | "read">
  ): InAppNotification {
    const notif: InAppNotification = {
      ...data,
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      created_at: new Date().toISOString(),
    };

    this.state.notifications.unshift(notif);
    this.persist();
    return notif;
  }

  public getUserNotifications(userId: string): InAppNotification[] {
    return this.state.notifications.filter((n) => n.user_id === userId);
  }

  public markNotificationRead(id: string): void {
    const n = this.state.notifications.find((notif) => notif.id === id);
    if (n) {
      n.read = true;
      this.persist();
    }
  }

  public markAllNotificationsRead(userId: string): void {
    this.state.notifications.forEach((n) => {
      if (n.user_id === userId) n.read = true;
    });
    this.persist();
  }

  // --- SENT NOTIFICATION LOGS ---

  public logSentNotification(
    log: Omit<SentNotificationLog, "id" | "sent_at">
  ): SentNotificationLog {
    const entry: SentNotificationLog = {
      ...log,
      id: `snt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sent_at: new Date().toISOString(),
    };

    this.state.sentNotifications.unshift(entry);
    this.persist();
    return entry;
  }

  public getSentNotificationLogs(): SentNotificationLog[] {
    return this.state.sentNotifications;
  }

  // --- CRON AUTOMATIONS & IDEMPOTENCY ---

  public recordCronRun(log: Omit<CronRunLog, "id" | "executed_at">): CronRunLog {
    const entry: CronRunLog = {
      ...log,
      id: `cron-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      executed_at: new Date().toISOString(),
    };

    this.state.cronLogs.unshift(entry);
    this.persist();
    return entry;
  }

  public getCronRunLogs(): CronRunLog[] {
    return this.state.cronLogs;
  }

  public isCronIdempotent(idempotencyKey: string): boolean {
    return this.state.cronLogs.some((c) => c.idempotency_key === idempotencyKey && c.status === "success");
  }

  // --- DASHBOARDS & NEEDS ATTENTION AGGREGATOR ---

  public getNeedsAttentionItems(campusId?: string): NeedsAttentionItem[] {
    const items: NeedsAttentionItem[] = [];

    // 1. Inactive Clubs (No activities in X days, X from settings or default 14)
    const inactiveDaysThreshold = (this.state.settings as any)?.flow_timings?.inactive_club_threshold_days || 14;
    const now = Date.now();
    const thresholdMs = inactiveDaysThreshold * 24 * 60 * 60 * 1000;

    this.state.clubs.forEach((club) => {
      if (club.category === "Parent Society") return;
      if (campusId && club.campus_id && club.campus_id !== campusId) return;

      const clubActivities = this.state.activities.filter((a) => a.club_id === club.id);
      let lastActivityTime = 0;
      clubActivities.forEach((a) => {
        if (a.created_at) {
          const t = new Date(a.created_at).getTime();
          if (t > lastActivityTime) lastActivityTime = t;
        }
      });

      const daysStale = lastActivityTime === 0
        ? 30
        : Math.floor((now - lastActivityTime) / (24 * 60 * 60 * 1000));

      if (daysStale >= inactiveDaysThreshold) {
        items.push({
          id: `na-club-${club.id}`,
          type: "inactive_club",
          title: `Inactive Club: ${club.name}`,
          subtitle: `No activity planned or logged in ${daysStale} days (Threshold: ${inactiveDaysThreshold} days).`,
          severity: daysStale > 25 ? "critical" : "warning",
          entity_id: club.id,
          action_label: "Review Club",
          action_url: `/clubs/${club.id}`,
          days_stale: daysStale,
        });
      }
    });

    // 2. Zero-Participation Students (Enrolled but 0 attendances & 0 submissions)
    this.state.students.forEach((student) => {
      if (student.role !== "student") return;
      if (campusId && student.campus_id && student.campus_id !== campusId) return;

      const enrollments = this.state.memberships.filter(
        (m) => m.user_id === student.id && m.status === "approved"
      );
      if (enrollments.length === 0) return;

      const attendances = this.state.attendances.filter(
        (a) => a.user_id === student.id && a.status === "present"
      );
      const submissions = this.state.submissions.filter((s) => s.user_id === student.id);

      if (attendances.length === 0 && submissions.length === 0) {
        items.push({
          id: `na-student-${student.id}`,
          type: "zero_participation_student",
          title: `Zero Participation: ${student.full_name}`,
          subtitle: `Enrolled in ${enrollments.length} club(s) with 0 attendances and 0 deliverables submitted.`,
          severity: "warning",
          entity_id: student.id,
          action_label: "Inspect Transcript",
          action_url: `/transcript`,
        });
      }
    });

    // 3. Pending Activities Awaiting Review
    this.state.activities.forEach((act) => {
      if (act.status === "submitted") {
        const club = this.getClubById(act.club_id);
        if (campusId && club?.campus_id && club.campus_id !== campusId) return;

        items.push({
          id: `na-act-${act.id}`,
          type: "pending_activity",
          title: `Pending Activity Approval: ${act.title}`,
          subtitle: `${club?.name || "Club"} submitted lesson plan for faculty review.`,
          severity: "info",
          entity_id: act.id,
          action_label: "Review Plan",
          action_url: `/activities`,
        });
      }
    });

    // 4. Pending Duty Leave Applications
    this.state.dutyLeaves.forEach((dl) => {
      if (dl.status === "pending") {
        items.push({
          id: `na-dl-${dl.id}`,
          type: "pending_duty_leave",
          title: `Duty Leave Application: ${dl.user_name}`,
          subtitle: `${dl.event_name} (${dl.dates}) pending Campus Manager sanction.`,
          severity: "warning",
          entity_id: dl.id,
          action_label: "Review Leave",
          action_url: `/duty-leave`,
        });
      }
    });

    return items;
  }

  public getAdminDashboardMetrics(params?: {
    campusId?: string;
    clubId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const { campusId, clubId } = params || {};

    let clubs = this.state.clubs.filter((c) => c.category !== "Parent Society");
    if (campusId) clubs = clubs.filter((c) => c.campus_id === campusId);
    if (clubId) clubs = clubs.filter((c) => c.id === clubId);

    let clubDays = this.state.clubDays;
    if (campusId) clubDays = clubDays.filter((d) => d.campus_id === campusId);

    // 1. KPI Totals
    const students = this.state.students.filter((s) => s.role === "student");
    const totalEnrolled = students.length;

    let attendances = this.state.attendances.filter((a) => a.status === "present");
    if (clubId) attendances = attendances.filter((a) => a.club_id === clubId);

    let submissions = this.state.submissions;
    if (clubId) submissions = submissions.filter((s) => s.club_id === clubId);

    const evaluations = this.state.evaluations;
    const avgScore = evaluations.length > 0
      ? Math.round((evaluations.reduce((acc, e) => acc + e.rubric_scores.total, 0) / evaluations.length) * 10) / 10
      : 0;

    // 2. Attendance Trends (Weekly Data Points for Recharts AreaChart)
    const attendanceTrends = clubDays.map((cd, index) => {
      const dayAttendances = this.state.attendances.filter(
        (a) => a.club_day_id === cd.id && a.status === "present"
      );
      return {
        name: `Day ${index + 1} (${cd.date.substring(5, 10)})`,
        date: cd.date,
        title: cd.title,
        attendances: dayAttendances.length,
        rate: Math.min(100, Math.round((dayAttendances.length / Math.max(1, totalEnrolled)) * 100)),
      };
    });

    // 3. Participation by Club (For Recharts BarChart)
    const clubParticipation = clubs.map((c) => {
      const clubMembers = this.state.memberships.filter(
        (m) => m.club_id === c.id && m.status === "approved"
      ).length;
      const clubAtt = this.state.attendances.filter(
        (a) => a.club_id === c.id && a.status === "present"
      ).length;
      const clubSubs = this.state.submissions.filter((s) => s.club_id === c.id).length;
      const totalPossible = clubMembers * (clubDays.length || 4);
      const pct = totalPossible > 0 ? Math.round((clubAtt / totalPossible) * 100) : 0;

      return {
        name: c.name.length > 14 ? `${c.name.substring(0, 12)}...` : c.name,
        fullName: c.name,
        members: clubMembers,
        attendances: clubAtt,
        submissions: clubSubs,
        attendancePct: pct,
      };
    });

    // 4. Event Funnel (For Recharts Funnel/BarChart)
    const events = this.state.events;
    const totalReg = this.state.eventRegistrations.filter((r) => r.status === "confirmed").length;
    const totalCheckin = this.state.eventRegistrations.filter((r) => r.checked_in).length;
    const totalPodium = this.state.eventRegistrations.filter(
      (r) => r.position && r.position !== "participant"
    ).length;
    const totalCerts = this.state.certificates.length;

    const eventFunnel = [
      { stage: "Event Registrations", count: totalReg, fill: "#22D3EE" },
      { stage: "Venue Check-Ins", count: totalCheckin, fill: "#3B82F6" },
      { stage: "Podium Winners", count: totalPodium, fill: "#8B5CF6" },
      { stage: "Certificates Issued", count: totalCerts, fill: "#34D399" },
    ];

    // 5. Top Contributors (Students with highest attendances + submissions)
    const topContributors = students
      .map((s) => {
        const attCount = this.state.attendances.filter(
          (a) => a.user_id === s.id && a.status === "present"
        ).length;
        const subCount = this.state.submissions.filter((sub) => sub.user_id === s.id).length;
        const userSubs = this.state.submissions.filter((sub) => sub.user_id === s.id).map((sub) => sub.id);
        const userEvals = this.state.evaluations.filter((e) => userSubs.includes(e.submission_id));
        const userAvg = userEvals.length > 0
          ? Math.round((userEvals.reduce((acc, e) => acc + e.rubric_scores.total, 0) / userEvals.length) * 10) / 10
          : 0;

        return {
          id: s.id,
          name: s.full_name,
          studentId: s.student_id || "MSOT-TEMP",
          campus: s.campus_name || "Delhi-NCR",
          attendances: attCount,
          submissions: subCount,
          averageScore: userAvg,
          scoreTotal: attCount * 10 + subCount * 15 + userAvg * 5,
        };
      })
      .sort((a, b) => b.scoreTotal - a.scoreTotal)
      .slice(0, 10);

    // 6. Zero Participation Students
    const zeroParticipationStudents = students
      .filter((s) => {
        const attCount = this.state.attendances.filter(
          (a) => a.user_id === s.id && a.status === "present"
        ).length;
        const subCount = this.state.submissions.filter((sub) => sub.user_id === s.id).length;
        return attCount === 0 && subCount === 0;
      })
      .map((s) => ({
        id: s.id,
        name: s.full_name,
        studentId: s.student_id || "MSOT-TEMP",
        email: s.email,
        campus: s.campus_name || "Delhi-NCR",
      }));

    // 7. Inactive Clubs
    const inactiveClubs = this.state.clubs
      .filter((c) => c.category !== "Parent Society")
      .map((c) => {
        const acts = this.state.activities.filter((a) => a.club_id === c.id);
        const lastAct = acts.length > 0 ? acts[acts.length - 1].created_at : "None";
        return {
          id: c.id,
          name: c.name,
          campus: c.campus_id,
          activitiesCount: acts.length,
          lastActivity: lastAct,
        };
      })
      .filter((c) => c.activitiesCount === 0);

    return {
      kpi: {
        totalEnrolled,
        totalClubs: clubs.length,
        totalAttendances: attendances.length,
        totalSubmissions: submissions.length,
        averageRubricScore: avgScore,
        activeCertificates: totalCerts,
      },
      attendanceTrends,
      clubParticipation,
      eventFunnel,
      topContributors,
      zeroParticipationStudents,
      inactiveClubs,
    };
  }
}

export const appStore = new Store();
