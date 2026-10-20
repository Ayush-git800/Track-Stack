export type UserRole =
  | "admin"
  | "campus_manager"
  | "faculty_advisor"
  | "student_coordinator"
  | "student";

export type ClubCategory =
  | "Technical"
  | "Cultural"
  | "Sports"
  | "Entrepreneurship"
  | "Parent Society";

export type MembershipStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "waitlisted"
  | "withdrawn";

export type ActivityFormat =
  | "workshop"
  | "hackathon"
  | "practice"
  | "performance"
  | "discussion"
  | "guest_lecture"
  | "competition";

export type ActivityStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "changes_requested"
  | "announced"
  | "live"
  | "closed"
  | "evaluated";

export interface Campus {
  id: string;
  name: string;
  code: string;
  city: string;
  is_active: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  student_id?: string;
  campus_id: string;
  campus_name?: string;
  year_of_study?: number;
  program?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  club_id?: string; // If coordinator or advisor
  club_name?: string;
}

export interface Club {
  id: string;
  name: string;
  code: string;
  description: string;
  parent_club_id?: string | null;
  parent_name?: string;
  campus_id: string;
  campus_name?: string;
  category: ClubCategory;
  capacity: number;
  enrolled_count?: number;
  status: "pending" | "approved" | "inactive" | "archived";
  meeting_day: string;
  meeting_time: string;
  meeting_venue: string;
  logo_url: string;
  accent_color: string;
  advisors?: string[];
  coordinators?: string[];
  created_at?: string;
}

export interface ClubMember {
  id: string;
  club_id: string;
  club_name?: string;
  club_logo?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  student_id?: string;
  year_of_study?: number;
  designation: "primary" | "secondary";
  status: MembershipStatus;
  join_request_note?: string;
  decision_note?: string;
  waitlist_position?: number | null;
  joined_at?: string | null;
  created_at: string;
}

export interface ClubDay {
  id: string;
  campus_id: string;
  campus_name?: string;
  date: string;
  title: string;
  academic_term: string;
  status: "scheduled" | "planning" | "announced" | "active" | "completed" | "cancelled";
  activity_count?: number;
}

export interface Activity {
  id: string;
  club_id: string;
  club_name?: string;
  club_logo?: string;
  club_accent?: string;
  club_day_id: string;
  club_day_date?: string;
  club_day_title?: string;
  title: string;
  topic: string;
  format: ActivityFormat;
  venue: string;
  description: string;
  deliverable_spec?: string;
  submission_deadline?: string;
  status: ActivityStatus;
  created_by?: string;
  approved_by?: string;
  created_at?: string;
  comments?: ActivityComment[];
}

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  content: string;
  type: "comment" | "change_request" | "approval";
  created_at: string;
}

export interface SystemSettings {
  membership_rules: {
    max_clubs_per_student: number;
    year_overrides: Record<string, number>;
  };
  checkin_rules: {
    window_minutes: number;
    late_grace_minutes: number;
    require_geo: boolean;
    qr_rotation_seconds: number;
  };
  flow_timings: {
    plan_days_before: number;
    announce_days_before: number;
    submission_hours: number;
    evaluation_days: number;
    monthly_report_day: number;
  };
  submission_rules: {
    allowed_types: string[];
    max_size_mb: number;
    late_allowed: boolean;
    late_penalty_percent: number;
  };
  staff_domain_hint: {
    allowed_domains: string[];
  };
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "action_required";
  link?: string;
  is_read: boolean;
  created_at: string;
}

export interface CheckinSession {
  id: string;
  club_id: string;
  club_name?: string;
  club_day_id: string;
  club_day_title?: string;
  activity_id?: string;
  started_at: string;
  expires_at: string;
  grace_until: string;
  status: "active" | "closed" | "expired";
  current_otp: string;
  current_token?: string;
  geo_enabled: boolean;
  campus_lat: number;
  campus_lng: number;
  radius_meters: number;
  created_by?: string;
  created_at: string;
  checked_in_count?: number;
}

export interface Attendance {
  id: string;
  session_id?: string;
  club_id: string;
  club_name?: string;
  club_day_id: string;
  club_day_date?: string;
  user_id: string;
  user_name?: string;
  student_id?: string;
  status: "present" | "absent" | "excused" | "late";
  checkin_method: "qr" | "code" | "manual_coordinator";
  checked_in_at: string;
  is_late: boolean;
  distance_meters?: number | null;
  device_hash?: string;
  ip_hash?: string;
  device_reuse_flag: boolean;
  is_presenter: boolean;
  spot_result?: "winner" | "runner_up" | "honourable_mention" | "participant" | null;
  correction_reason?: string | null;
  corrected_by?: string | null;
  corrected_at?: string | null;
}

export interface Submission {
  id: string;
  activity_id: string;
  activity_title?: string;
  club_id?: string;
  club_name?: string;
  user_id: string;
  user_name?: string;
  student_id?: string;
  version: number;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  file_url?: string;
  link_url?: string;
  is_late: boolean;
  notes?: string;
  submitted_at: string;
  evaluation?: Evaluation;
}

export interface RubricScores {
  content: number; // 0-10
  presentation: number; // 0-10
  participation: number; // 0-10
  total: number; // 0-10
}

export interface Evaluation {
  id: string;
  submission_id: string;
  activity_id: string;
  student_id: string;
  student_name?: string;
  evaluator_id: string;
  evaluator_name?: string;
  evaluator_role?: string;
  rubric_scores: RubricScores;
  feedback?: string;
  is_published: boolean;
  published_at?: string | null;
  created_at: string;
}

// ============================================================================
// PHASE 4: Events, Teams, Certificates, Duty Leave, and Transcripts
// ============================================================================

export type EventMode = "individual" | "team" | "both";
export type EventStatus = "draft" | "published" | "live" | "completed" | "cancelled";
export type TeamStatus = "forming" | "registered" | "waitlisted" | "cancelled";
export type RegistrationRole = "leader" | "member" | "individual";
export type RegistrationStatus = "confirmed" | "waitlisted" | "invited" | "declined" | "cancelled";
export type CertificateType = "participation" | "achievement" | "winner";
export type CertificateStatus = "valid" | "revoked";
export type DutyLeaveStatus = "pending" | "approved" | "rejected";

export interface CampusEvent {
  id: string;
  name: string;
  code: string;
  description: string;
  category: "Sports" | "Technical" | "Academic" | "Cultural";
  campus_id?: string | null; // null for inter-campus
  campus_name?: string;
  banner_url?: string;
  venue: string;
  rules: string;
  schedule_details: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  mode: EventMode;
  min_team_size: number;
  max_team_size: number;
  capacity: number;
  enrolled_count?: number;
  is_inter_campus: boolean;
  status: EventStatus;
  created_by?: string;
  created_at: string;
}

export interface EventTeam {
  id: string;
  event_id: string;
  event_name?: string;
  name: string;
  leader_id: string;
  leader_name?: string;
  leader_student_id?: string;
  status: TeamStatus;
  members_count?: number;
  members?: EventRegistration[];
  created_at: string;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  event_name?: string;
  user_id: string;
  user_name?: string;
  user_email?: string;
  student_id?: string;
  campus_name?: string;
  team_id?: string | null;
  team_name?: string | null;
  role: RegistrationRole;
  status: RegistrationStatus;
  checked_in: boolean;
  checkin_time?: string | null;
  position?: "1st" | "2nd" | "3rd" | "finalist" | "participant" | null;
  score?: number | null;
  registered_at: string;
}

export interface Certificate {
  id: string; // e.g. MSOT-CERT-2026-0001
  user_id: string;
  user_name: string;
  student_id: string;
  user_email?: string;
  campus_name: string;
  type: CertificateType;
  title: string;
  description: string;
  event_id?: string | null;
  event_name?: string | null;
  activity_id?: string | null;
  activity_title?: string | null;
  club_id?: string | null;
  club_name?: string | null;
  issue_date: string;
  signatory_name: string;
  signatory_title: string;
  canonical_data: string;
  signature: string;
  pdf_url?: string;
  status: CertificateStatus;
  revocation_reason?: string | null;
  revoked_at?: string | null;
  issued_by?: string;
  created_at: string;
}

export interface DutyLeave {
  id: string;
  user_id: string;
  user_name: string;
  student_id: string;
  campus_name: string;
  event_id: string;
  event_name: string;
  event_registration_id: string;
  dates: string;
  reason: string;
  status: DutyLeaveStatus;
  approver_id?: string | null;
  approver_name?: string | null;
  approver_comments?: string | null;
  letter_pdf_url?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface CoCurricularTranscript {
  student_id: string;
  student_name: string;
  student_uid: string;
  email: string;
  program: string;
  year_of_study: number;
  campus_name: string;
  generated_at: string;
  clubs: {
    club_id: string;
    club_name: string;
    category: string;
    designation: string;
    joined_at: string;
    attendance_count: number;
    attendance_pct: number;
  }[];
  submissions: {
    activity_title: string;
    club_name: string;
    submitted_at: string;
    score: number | null;
    feedback?: string;
  }[];
  events: {
    event_name: string;
    role: string;
    team_name?: string | null;
    position: string | null;
    dates: string;
  }[];
  certificates: {
    id: string;
    title: string;
    type: string;
    issue_date: string;
  }[];
  summary: {
    total_clubs: number;
    total_attendances: number;
    total_events: number;
    total_certificates: number;
    average_submission_score: number;
  };
  verification_url: string;
  signature: string;
}

// ============================================================================
// PHASE 5: REPORTING, ANNOUNCEMENTS, AUTOMATIONS & NOTIFICATIONS
// ============================================================================

export interface MonthlyReport {
  id: string;
  club_id: string;
  club_name: string;
  campus_id: string;
  campus_name: string;
  month: string; // e.g. "October 2026"
  period_start: string;
  period_end: string;
  total_members: number;
  total_club_days: number;
  total_attendances: number;
  attendance_rate: number; // Percentage 0-100
  submissions_count: number;
  evaluated_count: number;
  average_score: number; // 0-10
  highlights: string[];
  status: "generated" | "sent";
  generated_at: string;
  sent_at?: string | null;
  csv_url?: string;
  pdf_url?: string;
}

export interface Announcement {
  id: string;
  club_id: string;
  club_name: string;
  campus_id?: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  is_pinned: boolean;
  target_audience: "all_members" | "coordinators" | "all_campus";
  created_at: string;
  expires_at?: string | null;
}

export type NotificationType =
  | "reminder"
  | "announcement"
  | "approval"
  | "grade"
  | "duty_leave"
  | "system";

export interface InAppNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  link_url?: string;
  read: boolean;
  created_at: string;
}

export interface UserNotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  club_reminders: boolean;
  submission_alerts: boolean;
  announcement_emails: boolean;
  duty_leave_updates: boolean;
}

export interface SentNotificationLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  subject: string;
  channel: "email" | "in_app" | "both";
  status: "sent" | "delivered" | "failed" | "console_fallback";
  template: string;
  metadata?: Record<string, unknown>;
  sent_at: string;
}

export interface CronRunLog {
  id: string;
  job_name: string;
  status: "success" | "skipped" | "error";
  items_processed: number;
  details: Record<string, unknown>;
  executed_at: string;
  idempotency_key: string;
}

export interface NeedsAttentionItem {
  id: string;
  type: "inactive_club" | "zero_participation_student" | "pending_activity" | "pending_duty_leave";
  title: string;
  subtitle: string;
  severity: "critical" | "warning" | "info";
  entity_id: string;
  action_label: string;
  action_url: string;
  days_stale?: number;
}


