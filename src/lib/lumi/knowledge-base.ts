// src/lib/lumi/knowledge-base.ts

export interface LumiFaqItem {
  id: string;
  question: string;
  answer: string;
  category: "membership" | "checkin" | "submissions" | "evaluations" | "events" | "certificates" | "duty_leave" | "transcript" | "general";
  roles: string[];
  keywords: string[];
  deepLink?: { label: string; url: string };
  active?: boolean;
}

export type TrackStackFAQ = LumiFaqItem;
export type FAQCategory = LumiFaqItem["category"];

export const LUMI_FAQS: LumiFaqItem[] = [
  // ==========================================
  // 1. MEMBERSHIP & CLUBS (1-10)
  // ==========================================
  {
    id: "faq-mem-1",
    question: "How do I join a club or society on Track Stack?",
    answer: "Go to the Clubs & Societies directory (/clubs), browse through the clubs and societies, and click 'Request to Join'. The student coordinator for that club will review your request. You can view all available clubs and track your status anytime.",
    category: "membership",
    roles: ["student"],
    keywords: ["join", "apply", "membership", "request", "enrol", "all clubs", "available clubs", "list of clubs", "clubs and societies", "societies", "clubs", "society", "browse clubs"],
    deepLink: { label: "Browse Clubs", url: "/clubs" },
  },
  {
    id: "faq-mem-2",
    question: "Why does the 2-club limit exist?",
    answer: "To ensure students can balance rigorous academic coursework with deep extracurricular commitment, MSOT enforces a maximum of 2 active club memberships per student. This rule is enforced by a database trigger and can be adjusted per year of study by the campus administrator.",
    category: "membership",
    roles: ["student", "student_coordinator", "faculty_advisor"],
    keywords: ["limit", "2 clubs", "two club limit", "maximum clubs", "cap", "third club"],
  },
  {
    id: "faq-mem-3",
    question: "Can I leave or withdraw from a club?",
    answer: "Yes, you can withdraw from any club you have joined by going to the club page and clicking 'Withdraw Membership'. When you leave, a seat automatically opens up for the next student on the waitlist.",
    category: "membership",
    roles: ["student"],
    keywords: ["withdraw", "leave", "quit", "cancel membership"],
    deepLink: { label: "My Clubs", url: "/dashboard" },
  },
  {
    id: "faq-mem-4",
    question: "What happens if a club reaches its member capacity?",
    answer: "If a club reaches its capacity limit, you will be placed on the verified waitlist. When an existing member leaves or if the campus administrator raises the club's capacity, waitlisted students are automatically promoted in order of application.",
    category: "membership",
    roles: ["student"],
    keywords: ["waitlist", "capacity", "full", "queue", "promoted"],
  },
  {
    id: "faq-mem-5",
    question: "What are the clubs and sub-clubs on Track Stack?",
    answer: "NexCell, Malhar, and Khel Society are independent clubs. Kaizen Society is the technical club that features 3 specialized sub-clubs: Dev Club (Kaizen Dev Club), CP Club (Competitive Programming), and KI (Kaizen Intelligence). Students join and participate directly in the individual clubs.",
    category: "membership",
    roles: ["student", "student_coordinator", "campus_manager"],
    keywords: ["parent society", "kaizen society", "sub club", "cluster", "nexcell", "malhar", "khel", "dev club", "cp club", "ki"],
  },
  {
    id: "faq-mem-6",
    question: "What is primary vs secondary club designation?",
    answer: "You can designate one of your clubs as your 'Primary' club for leadership and core transcript emphasis, while your other club acts as 'Secondary'. You can toggle this designation from your Profile screen.",
    category: "membership",
    roles: ["student"],
    keywords: ["primary", "secondary", "designation", "emphasis"],
    deepLink: { label: "Profile Settings", url: "/profile" },
  },
  {
    id: "faq-mem-7",
    question: "Can senior year students have a different club limit?",
    answer: "Yes, Admin > System Settings supports per-year-of-study overrides (for instance, 1 club max for 4th year capstone students). Check with your campus manager or admin for current limits.",
    category: "membership",
    roles: ["student", "admin", "campus_manager"],
    keywords: ["year override", "senior year", "4th year", "rule"],
  },
  {
    id: "faq-mem-8",
    question: "How do coordinators approve new members?",
    answer: "Student coordinators navigate to their Club space, open the 'Members' tab, and review pending join requests. You can approve or reject each request with an optional note for the student.",
    category: "membership",
    roles: ["student_coordinator", "admin"],
    keywords: ["approve member", "pending requests", "roster", "coordinator"],
    deepLink: { label: "Manage Clubs", url: "/clubs/manage" },
  },
  {
    id: "faq-mem-9",
    question: "Can a student be coordinator in one club and member in another?",
    answer: "Yes! Track Stack uses role-based permissions scoped to individual clubs. You can serve as Student Coordinator in Kaizen Dev Club while participating as a regular student member in Khel Society.",
    category: "membership",
    roles: ["student", "student_coordinator"],
    keywords: ["dual role", "different role", "multiple clubs"],
  },
  {
    id: "faq-mem-10",
    question: "Why is my club request pending for several days?",
    answer: "Club join requests are reviewed by student coordinators. If a coordinator has not reviewed your application within 3 days, feel free to use the 'Contact a human' option to send an escalation nudge.",
    category: "membership",
    roles: ["student"],
    keywords: ["pending request", "waiting", "delayed", "not approved"],
  },

  // ==========================================
  // 2. CHECK-IN, QR & ATTENDANCE (11-20)
  // ==========================================
  {
    id: "faq-chk-1",
    question: "How does rotating QR check-in work?",
    answer: "During an active Saturday Club Day, the student coordinator starts a check-in session. A rotating QR code and a 6-digit one-time code (OTP) are projected on screen. Open your Track Stack app, go to QR Check-In, and scan the QR or type the rotating 6-digit OTP code.",
    category: "checkin",
    roles: ["student", "student_coordinator"],
    keywords: ["check in", "qr code", "how to check in", "scan", "rotating", "rotat", "otp"],
    deepLink: { label: "Go to QR Check-In", url: "/checkin" },
  },
  {
    id: "faq-chk-2",
    question: "Why does the check-in QR code rotate every 20-30 seconds?",
    answer: "To prevent screenshot sharing and proxy check-ins. Each rotating QR code is HMAC-signed on the server and expires strictly after 25 seconds. Static screenshots taken earlier will fail validation immediately.",
    category: "checkin",
    roles: ["student", "student_coordinator"],
    keywords: ["rotating qr", "anti screenshot", "expiry", "proxy", "rotat"],
  },
  {
    id: "faq-chk-3",
    question: "What should I do if my QR check-in expired while scanning?",
    answer: "Simply wait a few seconds for the next rotating QR code to appear on the coordinator's screen display and scan again. Alternatively, type the rotating 6-digit one-time code (OTP) shown below the QR code.",
    category: "checkin",
    roles: ["student"],
    keywords: ["expired qr", "token expired", "scan failed", "too late", "otp", "screen", "rotat"],
  },
  {
    id: "faq-chk-4",
    question: "Why was my attendance marked LATE?",
    answer: "Check-in sessions have an administrative grace period window (default 15 minutes from session start). If you check in after the grace period has elapsed, your attendance is verified and credited, but flagged as LATE in your record.",
    category: "checkin",
    roles: ["student"],
    keywords: ["late", "grace period", "flagged late", "tardy", "window"],
  },
  {
    id: "faq-chk-5",
    question: "Why did my location or geo-fence check fail?",
    answer: "If the campus administrator has enabled GPS geo-checking for that Club Day, you must be within the designated campus radius (e.g. 300 meters). Ensure browser location permissions are granted and that you are physically present on campus.",
    category: "checkin",
    roles: ["student"],
    keywords: ["gps", "location", "geo check", "radius", "out of bounds"],
  },
  {
    id: "faq-chk-6",
    question: "What is device fingerprinting and why was my check-in flagged?",
    answer: "To prevent a single student from checking in multiple classmates using one phone, Track Stack generates an anonymous device fingerprint hash. If the same phone checks in multiple distinct students within a session, the system flags the records for coordinator review.",
    category: "checkin",
    roles: ["student", "student_coordinator"],
    keywords: ["device reuse", "fingerprint", "proxy", "multiple students"],
  },
  {
    id: "faq-chk-7",
    question: "Can coordinators manually correct my attendance?",
    answer: "Yes, coordinators can mark a student present, absent, or excused. However, a mandatory reason is strictly required for every adjustment, and all changes write before/after state to the immutable audit log. Students cannot edit attendance.",
    category: "checkin",
    roles: ["student", "student_coordinator"],
    keywords: ["manual attendance", "correction", "excused", "absent"],
  },
  {
    id: "faq-chk-8",
    question: "How long is the check-in window open?",
    answer: "The default check-in window length is 30 to 45 minutes, configurable by the campus administrator in Admin > Settings. Coordinators can also close the window early once all present members have scanned.",
    category: "checkin",
    roles: ["student_coordinator", "admin"],
    keywords: ["window length", "duration", "how long", "close window"],
  },
  {
    id: "faq-chk-9",
    question: "What is the Coordinator Run Screen?",
    answer: "The Coordinator Run Screen (/activities/[id]/run) is designed for one-handed operation on a mobile phone during Saturday Club Days. It features a big check-in button, live attendee counter, presenter tags, and quick present/absent toggles.",
    category: "checkin",
    roles: ["student_coordinator"],
    keywords: ["run screen", "coordinator view", "one hand"],
    deepLink: { label: "Activity Planning", url: "/activities" },
  },
  {
    id: "faq-chk-10",
    question: "Can I check in if I am on the club waitlist?",
    answer: "No. Only students with an approved club membership can check in to regular Saturday Club Day sessions. Once you are promoted off the waitlist, you can participate and check in.",
    category: "checkin",
    roles: ["student"],
    keywords: ["waitlist checkin", "not approved", "membership required"],
  },

  // ==========================================
  // 3. SUBMISSIONS & DELIVERABLES (21-30)
  // ==========================================
  {
    id: "faq-sub-1",
    question: "How do I submit my project deliverable for a Club Day?",
    answer: "Go to your Activity Submissions tab (/activities), select the active activity, upload your file (PDF, PPT, DOCX, ZIP, or images up to 20MB) or paste your GitHub/live project URL, and click 'Submit Deliverable'.",
    category: "submissions",
    roles: ["student"],
    keywords: ["submit", "upload", "deliverable", "project", "assignment"],
    deepLink: { label: "Go to Submissions", url: "/activities" },
  },
  {
    id: "faq-sub-2",
    question: "What file types and sizes are allowed for submissions?",
    answer: "Allowed file formats are PDF, PPT, PPTX, DOC, DOCX, PNG, JPG, and ZIP. The default maximum file size is 20 MB. External links (such as GitHub repositories or Figma links) are also supported.",
    category: "submissions",
    roles: ["student"],
    keywords: ["file format", "max size", "allowed types", "20mb", "pdf ppt"],
  },
  {
    id: "faq-sub-3",
    question: "Can I resubmit or update my deliverable before the deadline?",
    answer: "Yes, you can resubmit and upload a revised version before the submission deadline. Track Stack retains full version history (v1, v2, etc.) so faculty evaluators can see your progress. The latest version is scored.",
    category: "submissions",
    roles: ["student"],
    keywords: ["resubmit", "update deliverable", "version history", "replace", "deadline"],
  },
  {
    id: "faq-sub-4",
    question: "What happens if I submit past the deadline?",
    answer: "If late submissions are permitted by campus settings, your deliverable will be accepted but clearly flagged as 'LATE'. Some rubrics deduct marks for late submissions.",
    category: "submissions",
    roles: ["student"],
    keywords: ["late submission", "past deadline", "deadline missed"],
  },
  {
    id: "faq-sub-5",
    question: "Are submission files secure and private?",
    answer: "Yes, all uploaded files are sanitized and stored in private cloud storage. Access is strictly controlled via short-lived signed URLs, accessible only to you, your club coordinator, and faculty advisors.",
    category: "submissions",
    roles: ["student", "faculty_advisor"],
    keywords: ["privacy", "storage", "secure", "signed url"],
  },
  {
    id: "faq-sub-6",
    question: "How do coordinators track who has not submitted?",
    answer: "Coordinators and advisors can open the activity submissions queue to see all pending and received submissions. Automated 48-hour email reminders are also sent to members who have not submitted.",
    category: "submissions",
    roles: ["student_coordinator", "faculty_advisor"],
    keywords: ["unsubmitted", "who has not submitted", "reminders"],
  },

  // ==========================================
  // 4. EVALUATIONS & RUBRICS (31-38)
  // ==========================================
  {
    id: "faq-eval-1",
    question: "How are project deliverables evaluated?",
    answer: "Faculty advisors and coordinators score submissions against standardized rubrics: Content (0-10), Presentation (0-10), and Participation (0-10). Rubric weights and criteria are configurable by the administrator.",
    category: "evaluations",
    roles: ["student", "faculty_advisor", "student_coordinator"],
    keywords: ["rubric", "grading", "evaluation", "score", "criteria"],
  },
  {
    id: "faq-eval-2",
    question: "When do students get to see their scores and comments?",
    answer: "Scores and written feedback remain confidential while grading is in progress. Once the faculty advisor clicks 'Publish Evaluations', students can view their scores, faculty remarks, and the class average.",
    category: "evaluations",
    roles: ["student", "faculty_advisor"],
    keywords: ["scores published", "hidden scores", "see my marks", "feedback"],
    deepLink: { label: "View Transcript & Scores", url: "/transcript" },
  },
  {
    id: "faq-eval-3",
    question: "What is the 5-day evaluation grace window?",
    answer: "Faculty advisors are nudged to evaluate submissions within 5 days of the submission deadline. Automated reminders are sent to ensure timely feedback for students.",
    category: "evaluations",
    roles: ["faculty_advisor", "student_coordinator"],
    keywords: ["5 day evaluation", "window", "grading deadline"],
  },

  // ==========================================
  // 5. FLAGSHIP EVENTS & TEAMS (39-46)
  // ==========================================
  {
    id: "faq-evt-1",
    question: "What are Flagship Events on Track Stack?",
    answer: "Flagship events are premier campus-wide or inter-campus championships: Gambade (Sports Olympiad), Mirai HackTech (Autonomous AI Hackathon), ICNGC (Computing Conference), and Cross Road (Cultural Festival).",
    category: "events",
    roles: ["student"],
    keywords: ["flagship events", "gambade", "hackathon", "cross road", "icngc"],
    deepLink: { label: "Browse Events", url: "/events" },
  },
  {
    id: "faq-evt-2",
    question: "How do I register a team for a hackathon or sports event?",
    answer: "Open the event on the Events page (/events), click 'Register Now', select 'Create New Team', choose a team name, and invite your teammates by student ID or email. You automatically become the Team Leader.",
    category: "events",
    roles: ["student"],
    keywords: ["create team", "form team", "invite teammates", "register team"],
    deepLink: { label: "Events Directory", url: "/events" },
  },
  {
    id: "faq-evt-3",
    question: "Can a student join two teams for the same event?",
    answer: "No. Database constraints strictly prevent duplicate registrations. A student can only belong to one team per event.",
    category: "events",
    roles: ["student"],
    keywords: ["two teams", "multiple teams", "duplicate registration"],
  },
  {
    id: "faq-evt-4",
    question: "How does event check-in work?",
    answer: "Event check-in operates using the same rotating HMAC QR code system. On event day, arrive at the venue and scan the rotating QR projected at the welcome lobby to confirm your presence.",
    category: "events",
    roles: ["student", "student_coordinator"],
    keywords: ["event check in", "venue checkin", "presence"],
  },

  // ==========================================
  // 6. CERTIFICATES & HMAC VERIFICATION (47-54)
  // ==========================================
  {
    id: "faq-crt-1",
    question: "How are Track Stack certificates verified and where can I verify an achievement certificate?",
    answer: "Every certificate contains an HMAC-SHA256 signature generated from canonical data (ID, student ID, event, type, issue date, and signatory). Anyone can visit /verify/[certificateId] to verify the digital signature in real time.",
    category: "certificates",
    roles: ["student", "admin"],
    keywords: ["verify certificate", "verify", "verification", "hmac", "sha256", "anti tamper", "validity", "achievement"],
    deepLink: { label: "Certificate Verification", url: "/certificates" },
  },
  {
    id: "faq-crt-2",
    question: "What certificate statuses are displayed on the verification page?",
    answer: "There are three possible states: VALID (authentic signature matching the ledger), REVOKED (withdrawn by administration with timestamp and mandatory reason), or INVALID_TAMPERED (signature mismatch indicating document tampering).",
    category: "certificates",
    roles: ["student", "admin"],
    keywords: ["certificate status", "revoked", "invalid", "tampered"],
  },
  {
    id: "faq-crt-3",
    question: "Where can I download my PDF certificates?",
    answer: "You can download high-resolution PDF certificates from your Co-Curricular Transcript page (/transcript) or from your student dashboard.",
    category: "certificates",
    roles: ["student"],
    keywords: ["download certificate", "pdf certificate", "get certificate"],
    deepLink: { label: "My Transcript & Certificates", url: "/transcript" },
  },
  {
    id: "faq-crt-4",
    question: "What is the difference between Participation and Winner certificates?",
    answer: "Participation certificates are issued to all verified attendees who checked in. Winner certificates (Gold, Silver, Bronze) are awarded to top podium finishers and signed by the Campus Director.",
    category: "certificates",
    roles: ["student"],
    keywords: ["winner certificate", "participation certificate", "podium"],
  },

  // ==========================================
  // 7. DUTY LEAVE (55-60)
  // ==========================================
  {
    id: "faq-dl-1",
    question: "What is Duty Leave and how does auto-filing work?",
    answer: "Duty Leave excuses academic attendance when you represent MSOT at an approved inter-campus event. When you register for an inter-campus flagship event, Track Stack automatically files a Duty Leave request to the Campus Manager on your behalf.",
    category: "duty_leave",
    roles: ["student"],
    keywords: ["duty leave", "attendance exemption", "auto filing", "excused classes"],
    deepLink: { label: "Duty Leave Portal", url: "/duty-leave" },
  },
  {
    id: "faq-dl-2",
    question: "How do I download my approved Duty Leave sanction letter?",
    answer: "Once the Campus Manager approves your request, open the Duty Leave page (/duty-leave) and click 'Download PDF'. This official signed letter can be presented to your course faculty.",
    category: "duty_leave",
    roles: ["student"],
    keywords: ["download duty leave", "sanction letter", "pdf letter", "proof"],
    deepLink: { label: "Duty Leave Portal", url: "/duty-leave" },
  },
  {
    id: "faq-dl-3",
    question: "How do Campus Managers review Duty Leave applications?",
    answer: "Campus Managers can review pending duty leave requests under /duty-leave, inspect the event details and dates, and approve or reject with comments.",
    category: "duty_leave",
    roles: ["campus_manager", "admin"],
    keywords: ["manager approve duty leave", "review duty leave", "sanction"],
  },

  // ==========================================
  // 8. TRANSCRIPTS & GENERAL (61-68)
  // ==========================================
  {
    id: "faq-trn-1",
    question: "How do I download my Co-Curricular Transcript and what is it?",
    answer: "The Co-Curricular Transcript is an official, verified PDF ledger of your collegiate extracurricular journey at MSOT. You can view and download your verified transcript PDF anytime from /transcript with an embedded verification QR code.",
    category: "transcript",
    roles: ["student"],
    keywords: ["transcript", "download transcript", "transcript pdf", "pdf", "co-curricular", "portfolio", "placement", "qr"],
    deepLink: { label: "View Transcript", url: "/transcript" },
  },
  {
    id: "faq-trn-2",
    question: "What is the Placement Readiness JSON API?",
    answer: "Track Stack exposes an authorized endpoint (/api/transcript/[studentId]) providing structured extracurricular achievements for campus recruitment and placement cell integrations.",
    category: "transcript",
    roles: ["student", "admin"],
    keywords: ["placement api", "json endpoint", "recruitment", "resume"],
  },
  {
    id: "faq-gen-1",
    question: "How do I switch campuses or view activities in Bangalore/Jaipur?",
    answer: "If you have administrative access, you can filter dashboards by campus. Regular students are bound to their home campus, but can participate in inter-campus flagship events.",
    category: "general",
    roles: ["student", "admin"],
    keywords: ["switch campus", "bangalore", "jaipur", "change campus"],
  },
  {
    id: "faq-gen-2",
    question: "How do I contact support or escalate an unresolved issue?",
    answer: "If Lumi cannot resolve your problem, click 'Contact a human' at the bottom of the chat. This routes an urgent support ticket to your club coordinator or campus manager.",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor"],
    keywords: ["contact human", "support", "escalate", "help", "coordinator contact"],
  },
  {
    id: "faq-gen-3",
    question: "Where can I view the Club Day Saturday schedule?",
    answer: "Navigate to the Club Day Calendar (/calendar) to view the schedule, session topics, venues, and deadlines for every Saturday of the academic term.",
    category: "general",
    roles: ["student"],
    keywords: ["calendar", "saturday schedule", "club day dates"],
    deepLink: { label: "Club Day Calendar", url: "/calendar" },
  },
  {
    id: "faq-gen-4",
    question: "Can I delete my chat history with Lumi?",
    answer: "Yes, you can click 'Delete my chat history' at the top of the Lumi chat drawer at any time. All stored messages and conversation sessions will be permanently purged from your account.",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor", "campus_manager", "admin"],
    keywords: ["delete chat", "clear history", "privacy", "purge"],
  },
  {
    id: "faq-gen-5",
    question: "Who built Track Stack and Lumi? Tell me about the creators.",
    answer: "Track Stack and I were built by team **Version Controllers** at Mirai School of Technology (MSOT)! The team consists of **Ayush Chauhan** (Team Leader) and **Rishav Ranjan**, both first-year B.Tech CSE students who engineered this platform to bring verified, low-effort club activity management to campus.",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor", "campus_manager", "admin"],
    keywords: ["who built", "who created", "who made", "creators", "team", "version controllers", "ayush chauhan", "rishav ranjan", "developer"],
  },
  {
    id: "faq-gen-6",
    question: "How are you doing today, Lumi? How is your day?",
    answer: "I'm doing fantastic, thank you for asking! 😊 I'm always energized and ready to help you with your club activities, check-ins, or just chat about your college day. How are your classes going?",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor", "campus_manager", "admin"],
    keywords: ["how are you", "kya haal", "kaise ho", "kaisa hai", "how's it going", "what's up", "sab theek"],
  },
  {
    id: "faq-gen-7",
    question: "Tell me a joke or a fun tech trivia!",
    answer: "Here's a classic one: Why do programmers always prefer dark mode? Because light attracts bugs! 😄 Just like Track Stack's sleek dark navy theme. Have a great, bug-free day ahead!",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor", "campus_manager", "admin"],
    keywords: ["joke", "funny", "hasao", "chutkula", "trivia", "laugh"],
  },
  {
    id: "faq-gen-8",
    question: "I am feeling stressed about exams and college projects. Any advice or motivation?",
    answer: "Take a deep breath! College life can definitely feel overwhelming at times. Break your assignments into smaller 25-minute sprints (Pomodoro technique), stay hydrated, and don't hesitate to reach out to your club mentors in Kaizen Dev Club or faculty advisors. Remember, learning is a continuous journey—you're doing great! 🚀",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor", "campus_manager", "admin"],
    keywords: ["stress", "stressed", "tension", "exam", "motivation", "motivat", "padhai", "help study", "advice"],
  },
  {
    id: "faq-gen-9",
    question: "Good morning or good evening!",
    answer: "A very warm greeting to you! ☀️ Hope your day at Mirai School of Technology is going smoothly. Let me know if you need help checking your attendance, tracking deadlines, or preparing for the next Saturday Club Day!",
    category: "general",
    roles: ["student", "student_coordinator", "faculty_advisor", "campus_manager", "admin"],
    keywords: ["good morning", "good evening", "good afternoon", "shubh prabhat", "namaste", "namaskar"],
  },
];

export interface ScoredFaq {
  faq: LumiFaqItem;
  score: number;
}

/**
 * Searches the FAQ knowledge base and scores entries based on keyword matches,
 * token overlap, and category relevancy.
 */
export function retrieveRelevantFaqs(
  query: string,
  userRole: string = "student",
  limit: number = 4
): ScoredFaq[] {
  if (!query || !query.trim()) {
    return LUMI_FAQS.filter((f) => f.roles.includes(userRole))
      .slice(0, limit)
      .map((f) => ({ faq: f, score: 10 }));
  }

  const cleanQuery = query.toLowerCase();
  const queryTokens = cleanQuery.split(/[\s,?.!-]+/).filter((t) => t.length > 2);

  const scored = LUMI_FAQS.map((faq) => {
    let score = 0;

    // Role weighting
    if (faq.roles.includes(userRole)) score += 5;

    // Exact question match
    if (cleanQuery.includes(faq.question.toLowerCase().slice(0, 20))) score += 50;

    // Keyword matches
    faq.keywords.forEach((kw) => {
      if (cleanQuery.includes(kw.toLowerCase())) {
        score += 25;
      }
    });

    // Token overlap in question and answer
    const qLower = faq.question.toLowerCase();
    const aLower = faq.answer.toLowerCase();

    queryTokens.forEach((token) => {
      if (qLower.includes(token)) score += 10;
      if (aLower.includes(token)) score += 4;
    });

    return { faq, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export const TRACK_STACK_FAQS = LUMI_FAQS;
