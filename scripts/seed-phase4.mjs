import fs from "fs";
import path from "path";
import {
  buildCanonicalCertificateData,
  signCertificateData,
} from "../src/lib/crypto.mjs";
import {
  generateCertificatePdf,
  generateTranscriptPdf,
  generateDutyLeavePdf,
} from "../src/lib/pdf.ts";

const SEED_FILE = path.resolve("src/lib/seed-data.json");
const SAMPLES_DIR = path.resolve("docs/samples");

if (!fs.existsSync(SAMPLES_DIR)) {
  fs.mkdirSync(SAMPLES_DIR, { recursive: true });
}

const seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf-8"));

// 1. SEED EVENTS
const events = [
  {
    id: "e1111111-1111-1111-1111-111111111111",
    name: "Gambade 2026 - Annual Inter-Campus Sports Olympiad",
    code: "GAMBADE_2026",
    description: "The premier inter-campus sporting championship uniting MSOT campuses. Features track & field, football leagues, basketball, and table tennis.",
    category: "Sports",
    campus_id: null, // Inter-campus
    campus_name: "All Campuses (Inter-Campus)",
    banner_url: "/logos/khel-society.png",
    venue: "MSOT Central Sports Complex & Athletics Arena",
    rules: "Teams must adhere to official collegiate guidelines. Mandatory sports kit required. Fair play rules strictly enforced by referee council.",
    schedule_details: "Day 1: Track & Field preliminaries; Day 2: Football and Basketball Knockouts; Day 3: Finals & Closing Ceremonies.",
    start_date: "2026-11-06T09:00:00Z",
    end_date: "2026-11-08T18:00:00Z",
    registration_start: "2026-10-15T00:00:00Z",
    registration_end: "2026-11-04T23:59:59Z",
    mode: "both",
    min_team_size: 3,
    max_team_size: 8,
    capacity: 250,
    enrolled_count: 64,
    is_inter_campus: true,
    status: "live",
    created_by: "u0000000-0000-0000-0000-000000000001",
    created_at: "2026-10-15T10:00:00Z",
  },
  {
    id: "e2222222-2222-2222-2222-222222222222",
    name: "Mirai HackTech 2026 - 24hr AI & Systems Hackathon",
    code: "HACKATHON_2026",
    description: "Build cutting-edge distributed microservices, agentic AI pipelines, or edge hardware within 24 hours. Evaluated by venture founders and tech directors.",
    category: "Technical",
    campus_id: null,
    campus_name: "All Campuses (Inter-Campus)",
    banner_url: "/logos/kaizen-dev.png",
    venue: "Kaizen Innovation Center & Auditorium B",
    rules: "Teams of 2-4 members. No pre-written code; boilerplates allowed. Git commits timestamped. Live deployment required at evaluation.",
    schedule_details: "Saturday 10:00 AM: Problem statement reveal; Saturday 11:00 AM: Sprint starts; Sunday 11:00 AM: Code freeze & pitches.",
    start_date: "2026-11-14T10:00:00Z",
    end_date: "2026-11-15T14:00:00Z",
    registration_start: "2026-10-20T00:00:00Z",
    registration_end: "2026-11-10T23:59:59Z",
    mode: "team",
    min_team_size: 2,
    max_team_size: 4,
    capacity: 120,
    enrolled_count: 48,
    is_inter_campus: true,
    status: "published",
    created_by: "u0000000-0000-0000-0000-000000000001",
    created_at: "2026-10-16T12:00:00Z",
  },
  {
    id: "e3333333-3333-3333-3333-333333333333",
    name: "International Conference on Next-Gen Computing (ICNGC 2026)",
    code: "INTL_CONF_2026",
    description: "Collegiate research symposium presenting novel student research papers, system designs, and algorithmic breakthroughs to global academia.",
    category: "Academic",
    campus_id: null,
    campus_name: "All Campuses (Inter-Campus)",
    banner_url: "/logos/kaizen-intelligence.png",
    venue: "Main Convocation Hall & Hybrid Global Stream",
    rules: "Individual registrations. Submissions peer-reviewed by IEEE student chapter committee. Oral presentation length: 15 minutes.",
    schedule_details: "Day 1: Keynote on Distributed AI; Day 2: Parallel research paper tracks and poster displays.",
    start_date: "2026-11-20T09:30:00Z",
    end_date: "2026-11-21T17:00:00Z",
    registration_start: "2026-10-18T00:00:00Z",
    registration_end: "2026-11-15T23:59:59Z",
    mode: "individual",
    min_team_size: 1,
    max_team_size: 1,
    capacity: 300,
    enrolled_count: 85,
    is_inter_campus: true,
    status: "published",
    created_by: "u0000000-0000-0000-0000-000000000001",
    created_at: "2026-10-17T09:00:00Z",
  },
  {
    id: "e4444444-4444-4444-4444-444444444444",
    name: "Cross Road 2026 - Annual Cultural & Performing Arts Fest",
    code: "CROSS_ROAD_2026",
    description: "Battle of the bands, street theatre, classical dance showcases, debate showdowns, and acoustic night hosted by Malhar Cultural Society.",
    category: "Cultural",
    campus_id: "c1111111-1111-1111-1111-111111111111",
    campus_name: "Delhi-NCR Campus",
    banner_url: "/logos/malhar.png",
    venue: "Open Air Amphitheatre & Student Commons",
    rules: "Solo performances: 4-6 minutes. Group acts: up to 12 members. Professional acoustics provided.",
    schedule_details: "Friday Eve: Inauguration; Saturday: Competitive events; Sunday: Grand Pro-Night.",
    start_date: "2026-11-27T16:00:00Z",
    end_date: "2026-11-29T22:00:00Z",
    registration_start: "2026-10-25T00:00:00Z",
    registration_end: "2026-11-22T23:59:59Z",
    mode: "both",
    min_team_size: 1,
    max_team_size: 12,
    capacity: 400,
    enrolled_count: 140,
    is_inter_campus: false,
    status: "published",
    created_by: "u0000000-0000-0000-0000-000000000001",
    created_at: "2026-10-18T14:00:00Z",
  },
];

// 2. SEED TEAMS (Gambade & Hackathon)
const eventTeams = [
  {
    id: "t1111111-1111-1111-1111-111111111111",
    event_id: "e1111111-1111-1111-1111-111111111111",
    event_name: "Gambade 2026",
    name: "Delhi Strikers",
    leader_id: "u0000000-0000-0000-0000-000000000005", // Chintu
    leader_name: "Chintu",
    leader_student_id: "MSOT2024CS042",
    status: "registered",
    members_count: 4,
    created_at: "2026-10-20T09:00:00Z",
  },
  {
    id: "t2222222-2222-2222-2222-222222222222",
    event_id: "e1111111-1111-1111-1111-111111111111",
    event_name: "Gambade 2026",
    name: "Mirai Titans",
    leader_id: "u0000000-0000-0000-0000-000000000004", // Rishav Raj
    leader_name: "Rishav Raj",
    leader_student_id: "MSOT2023CS019",
    status: "registered",
    members_count: 4,
    created_at: "2026-10-21T11:00:00Z",
  },
  {
    id: "t3333333-3333-3333-3333-333333333333",
    event_id: "e2222222-2222-2222-2222-222222222222",
    event_name: "Mirai HackTech 2026",
    name: "Neural Nexus",
    leader_id: "u0000000-0000-0000-0000-000000000005", // Chintu
    leader_name: "Chintu",
    leader_student_id: "MSOT2024CS042",
    status: "registered",
    members_count: 3,
    created_at: "2026-10-22T14:30:00Z",
  },
];

// 3. SEED REGISTRATIONS
const eventRegistrations = [
  // Delhi Strikers (Gambade)
  {
    id: "reg-alex-gambade",
    event_id: "e1111111-1111-1111-1111-111111111111",
    event_name: "Gambade 2026",
    user_id: "u0000000-0000-0000-0000-000000000005",
    user_name: "Chintu",
    user_email: "alex.johnson@student.mirai.edu",
    student_id: "MSOT2024CS042",
    campus_name: "Delhi-NCR Campus",
    team_id: "t1111111-1111-1111-1111-111111111111",
    team_name: "Delhi Strikers",
    role: "leader",
    status: "confirmed",
    checked_in: true,
    checkin_time: "2026-11-06T09:12:00Z",
    position: "1st",
    score: 98.5,
    registered_at: "2026-10-20T09:00:00Z",
  },
  {
    id: "reg-member1-gambade",
    event_id: "e1111111-1111-1111-1111-111111111111",
    event_name: "Gambade 2026",
    user_id: "u0000000-0000-0000-0000-000000000010",
    user_name: "Sarah Chen",
    user_email: "sarah.chen@student.mirai.edu",
    student_id: "MSOT2024CS015",
    campus_name: "Delhi-NCR Campus",
    team_id: "t1111111-1111-1111-1111-111111111111",
    team_name: "Delhi Strikers",
    role: "member",
    status: "confirmed",
    checked_in: true,
    checkin_time: "2026-11-06T09:14:00Z",
    position: "1st",
    score: 98.5,
    registered_at: "2026-10-20T09:15:00Z",
  },
  // Rishav Raj (Mirai Titans)
  {
    id: "reg-rohan-gambade",
    event_id: "e1111111-1111-1111-1111-111111111111",
    event_name: "Gambade 2026",
    user_id: "u0000000-0000-0000-0000-000000000004",
    user_name: "Rishav Raj",
    user_email: "rohan.coordinator@mirai.edu",
    student_id: "MSOT2023CS019",
    campus_name: "Delhi-NCR Campus",
    team_id: "t2222222-2222-2222-2222-222222222222",
    team_name: "Mirai Titans",
    role: "leader",
    status: "confirmed",
    checked_in: true,
    checkin_time: "2026-11-06T09:20:00Z",
    position: "2nd",
    score: 94.0,
    registered_at: "2026-10-21T11:00:00Z",
  },
  // Conference Solo Registration for Chintu
  {
    id: "reg-alex-conf",
    event_id: "e3333333-3333-3333-3333-333333333333",
    event_name: "International Conference on Next-Gen Computing (ICNGC 2026)",
    user_id: "u0000000-0000-0000-0000-000000000005",
    user_name: "Chintu",
    user_email: "alex.johnson@student.mirai.edu",
    student_id: "MSOT2024CS042",
    campus_name: "Delhi-NCR Campus",
    team_id: null,
    role: "individual",
    status: "confirmed",
    checked_in: false,
    position: null,
    score: null,
    registered_at: "2026-10-22T10:00:00Z",
  },
];

// 4. SEED 20 CRYPTOGRAPHICALLY SIGNED CERTIFICATES
const certificates = [];
const studentList = [
  { name: "Chintu", id: "MSOT2024CS042", uid: "u0000000-0000-0000-0000-000000000005", email: "alex.johnson@student.mirai.edu" },
  { name: "Sarah Chen", id: "MSOT2024CS015", uid: "u0000000-0000-0000-0000-000000000010", email: "sarah.chen@student.mirai.edu" },
  { name: "Rishav Raj", id: "MSOT2023CS019", uid: "u0000000-0000-0000-0000-000000000004", email: "rohan.coordinator@mirai.edu" },
  { name: "Ananya Rao", id: "MSOT2024CS088", uid: "u0000000-0000-0000-0000-000000000011", email: "ananya.rao@student.mirai.edu" },
  { name: "Aditya Mehta", id: "MSOT2024CS102", uid: "u0000000-0000-0000-0000-000000000012", email: "aditya.mehta@student.mirai.edu" },
];

const certDefs = [
  {
    user: studentList[0],
    type: "winner",
    title: "1st Place Winner - Gambade 2026 4x100m Athletics Relay",
    description: "Awarded 1st Place Gold Medal for stellar athletic speed and team baton coordination representing Delhi-NCR Campus in the annual Gambade Olympiad.",
    eventId: "e1111111-1111-1111-1111-111111111111",
    eventName: "Gambade 2026",
    signatoryName: "Ayush Chauhan",
    signatoryTitle: "Campus Director & System Administrator",
    date: "2026-11-08",
  },
  {
    user: studentList[0],
    type: "achievement",
    title: "Best Architecture Award - Kaizen Dev Activity #1",
    description: "Awarded top faculty rubric evaluation (9.5/10) for designing high-performance event-driven microservices lab.",
    activityId: "ac100000-0000-0000-0000-000000000001",
    activityTitle: "Microservices Architecture Lab",
    clubName: "Kaizen Dev Club",
    signatoryName: "Gaurav Kumar",
    signatoryTitle: "Faculty Advisor, Kaizen Dev Club",
    date: "2026-10-26",
  },
  {
    user: studentList[0],
    type: "participation",
    title: "Certificate of Participation - Club Day #1",
    description: "Verified on-time attendance and active participation in Delhi-NCR Saturday Club Day #1 technical sprints.",
    activityId: "ac100000-0000-0000-0000-000000000001",
    activityTitle: "Microservices Architecture Lab",
    clubName: "Kaizen Dev Club",
    signatoryName: "Gaurav Kumar",
    signatoryTitle: "Faculty Advisor, Kaizen Dev Club",
    date: "2026-10-24",
  },
  {
    user: studentList[1],
    type: "winner",
    title: "1st Place Winner - Gambade 2026 4x100m Athletics Relay",
    description: "Awarded 1st Place Gold Medal representing Delhi Strikers at Gambade 2026.",
    eventId: "e1111111-1111-1111-1111-111111111111",
    eventName: "Gambade 2026",
    signatoryName: "Ayush Chauhan",
    signatoryTitle: "Campus Director & System Administrator",
    date: "2026-11-08",
  },
  {
    user: studentList[2],
    type: "achievement",
    title: "2nd Place Runner-Up - Gambade 2026 Football Tournament",
    description: "Captain of Mirai Titans securing Silver Medal in inter-campus football finals.",
    eventId: "e1111111-1111-1111-1111-111111111111",
    eventName: "Gambade 2026",
    signatoryName: "Ayush Chauhan",
    signatoryTitle: "Campus Director & System Administrator",
    date: "2026-11-08",
  },
];

// Expand to exactly 20 certificates
for (let i = 0; i < 20; i++) {
  const base = certDefs[i % certDefs.length];
  const certIndex = i + 1;
  const certId = `MSOT-CERT-2026-${String(certIndex).padStart(4, "0")}`;
  const student = studentList[i % studentList.length];

  const canonicalObj = {
    id: certId,
    user_id: student.uid,
    event_id: base.eventId || null,
    activity_id: base.activityId || null,
    club_id: null,
    type: base.type,
    issue_date: base.date,
    signatory_name: base.signatoryName,
  };

  const canonicalData = buildCanonicalCertificateData(canonicalObj);
  const signature = signCertificateData(canonicalData);

  certificates.push({
    id: certId,
    user_id: student.uid,
    user_name: student.name,
    student_id: student.id,
    user_email: student.email,
    campus_name: "Delhi-NCR Campus",
    type: base.type,
    title: base.title,
    description: base.description,
    event_id: base.eventId || null,
    event_name: base.eventName || null,
    activity_id: base.activityId || null,
    activity_title: base.activityTitle || null,
    club_id: null,
    club_name: base.clubName || null,
    issue_date: base.date,
    signatory_name: base.signatoryName,
    signatory_title: base.signatoryTitle,
    canonical_data: canonicalData,
    signature: signature,
    pdf_url: `/api/certificates/${certId}/download`,
    status: i === 19 ? "revoked" : "valid", // 1 revoked certificate for testing
    revocation_reason: i === 19 ? "Administrative test revocation for verification guard" : null,
    revoked_at: i === 19 ? "2026-10-27T10:00:00Z" : null,
    issued_by: "u0000000-0000-0000-0000-000000000002",
    created_at: `${base.date}T10:00:00Z`,
  });
}

// 5. SEED DUTY LEAVE REQUEST
const dutyLeaves = [
  {
    id: "dl-alex-gambade-01",
    user_id: "u0000000-0000-0000-0000-000000000005",
    user_name: "Chintu",
    student_id: "MSOT2024CS042",
    campus_name: "Delhi-NCR Campus",
    event_id: "e1111111-1111-1111-1111-111111111111",
    event_name: "Gambade 2026 - Annual Inter-Campus Sports Olympiad",
    event_registration_id: "reg-alex-gambade",
    dates: "2026-11-06 to 2026-11-08",
    reason: "Representing Delhi-NCR Campus in the 4x100m Athletics Relay and Football Team.",
    status: "approved",
    approver_id: "u0000000-0000-0000-0000-000000000002",
    approver_name: "Sundaram Mishra (Campus Manager)",
    approver_comments: "Official duty leave sanctioned. Student is granted academic attendance waiver for 3 days of competition.",
    letter_pdf_url: "/api/duty-leave/dl-alex-gambade-01/download",
    created_at: "2026-10-20T09:05:00Z",
    updated_at: "2026-10-21T14:00:00Z",
  },
];

seed.events = events;
seed.eventTeams = eventTeams;
seed.eventRegistrations = eventRegistrations;
seed.certificates = certificates;
seed.dutyLeaves = dutyLeaves;

fs.writeFileSync(SEED_FILE, JSON.stringify(seed, null, 2), "utf-8");
console.log("✓ Seeded 4 Flagship Events, 3 Teams, 4 Registrations, 20 Signed Certificates, and 1 Duty Leave!");

// 6. GENERATE SAMPLE PDFS IN docs/samples/
async function generateSamplePdfs() {
  const sampleCert = certificates[0]; // Chintu 1st place
  const certPdfBuffer = await generateCertificatePdf(sampleCert, "http://localhost:3000");
  fs.writeFileSync(path.join(SAMPLES_DIR, "sample-certificate.pdf"), Buffer.from(certPdfBuffer));
  console.log("✓ Generated docs/samples/sample-certificate.pdf");

  const sampleLeave = dutyLeaves[0];
  const leavePdfBuffer = await generateDutyLeavePdf(sampleLeave, "http://localhost:3000");
  fs.writeFileSync(path.join(SAMPLES_DIR, "sample-duty-leave.pdf"), Buffer.from(leavePdfBuffer));
  console.log("✓ Generated docs/samples/sample-duty-leave.pdf");

  // Sample Transcript
  const sampleTranscript = {
    student_id: "MSOT2024CS042",
    student_name: "Chintu",
    student_uid: "u0000000-0000-0000-0000-000000000005",
    email: "alex.johnson@student.mirai.edu",
    program: "B.Tech Computer Science & Artificial Intelligence",
    year_of_study: 2,
    campus_name: "Delhi-NCR Campus",
    generated_at: new Date().toISOString(),
    clubs: [
      {
        club_id: "c1000000-0000-0000-0000-000000000001",
        club_name: "Kaizen Dev Club",
        category: "Technical",
        designation: "primary",
        joined_at: "2026-09-01",
        attendance_count: 8,
        attendance_pct: 100,
      },
      {
        club_id: "c1000000-0000-0000-0000-000000000002",
        club_name: "NexCell Entrepreneurship Club",
        category: "Entrepreneurship",
        designation: "secondary",
        joined_at: "2026-09-05",
        attendance_count: 7,
        attendance_pct: 88,
      },
    ],
    submissions: [
      {
        activity_title: "Microservices Architecture Lab",
        club_name: "Kaizen Dev Club",
        submitted_at: "2026-10-25",
        score: 9.5,
        feedback: "Exceptional system design and resiliency implementation.",
      },
    ],
    events: [
      {
        event_name: "Gambade 2026",
        role: "Team Leader",
        team_name: "Delhi Strikers",
        position: "1st Place Winner",
        dates: "Nov 06 - Nov 08, 2026",
      },
    ],
    certificates: [
      {
        id: "MSOT-CERT-2026-0001",
        title: "1st Place Winner - Gambade 2026 4x100m Athletics Relay",
        type: "winner",
        issue_date: "2026-11-08",
      },
      {
        id: "MSOT-CERT-2026-0002",
        title: "Best Architecture Award - Kaizen Dev Activity #1",
        type: "achievement",
        issue_date: "2026-10-26",
      },
    ],
    summary: {
      total_clubs: 2,
      total_attendances: 15,
      total_events: 1,
      total_certificates: 2,
      average_submission_score: 9.5,
    },
    verification_url: "http://localhost:3000/api/transcript/MSOT2024CS042",
    signature: signCertificateData("MSOT2024CS042|ALEX_JOHNSON|TRANSCRIPT_v1"),
  };

  const transcriptPdfBuffer = await generateTranscriptPdf(sampleTranscript);
  fs.writeFileSync(path.join(SAMPLES_DIR, "sample-transcript.pdf"), Buffer.from(transcriptPdfBuffer));
  console.log("✓ Generated docs/samples/sample-transcript.pdf");
}

generateSamplePdfs().then(() => {
  console.log("🎉 Phase 4 Seeding and Sample PDFs Complete!");
});
