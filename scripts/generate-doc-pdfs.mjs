// scripts/generate-doc-pdfs.mjs
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

console.log("===============================================================");
console.log("📄 GENERATING TRACK STACK DOCUMENTATION PDFS (pdf-lib)");
console.log("===============================================================\n");

// Helper class for multi-page document layout
class PDFDocBuilder {
  constructor(title, docType) {
    this.title = title;
    this.docType = docType;
    this.pages = [];
    this.doc = null;
    this.fontRegular = null;
    this.fontBold = null;
    this.fontMono = null;
    this.currentPage = null;
    this.y = 750;
    this.pageWidth = 595.28;  // A4 Portrait
    this.pageHeight = 841.89;
    this.leftMargin = 50;
    this.rightMargin = 50;
    this.printableWidth = this.pageWidth - this.leftMargin - this.rightMargin;
    this.pageNumber = 0;
  }

  async init() {
    this.doc = await PDFDocument.create();
    this.fontRegular = await this.doc.embedFont(StandardFonts.Helvetica);
    this.fontBold = await this.doc.embedFont(StandardFonts.HelveticaBold);
    this.fontMono = await this.doc.embedFont(StandardFonts.Courier);
    this.addNewPage();
  }

  addNewPage() {
    this.currentPage = this.doc.addPage([this.pageWidth, this.pageHeight]);
    this.pages.push(this.currentPage);
    this.pageNumber++;
    this.y = this.pageHeight - 60;

    // Header (Top border line & title)
    this.currentPage.drawLine({
      start: { x: this.leftMargin, y: this.pageHeight - 40 },
      end: { x: this.pageWidth - this.rightMargin, y: this.pageHeight - 40 },
      thickness: 1,
      color: rgb(0.14, 0.51, 0.96), // Brand Blue #22D3EE / #3B82F6
    });

    this.currentPage.drawText("TRACK STACK • Mirai School of Technology", {
      x: this.leftMargin,
      y: this.pageHeight - 34,
      size: 7.5,
      font: this.fontBold,
      color: rgb(0.02, 0.04, 0.09),
    });

    const docTypeWidth = this.fontRegular.widthOfTextAtSize(this.docType, 7.5);
    this.currentPage.drawText(this.docType, {
      x: this.pageWidth - this.rightMargin - docTypeWidth,
      y: this.pageHeight - 34,
      size: 7.5,
      font: this.fontRegular,
      color: rgb(0.35, 0.42, 0.55),
    });

    // Reset cursor
    this.y = this.pageHeight - 65;
  }

  ensureSpace(requiredPt) {
    if (this.y - requiredPt < 55) {
      this.addNewPage();
    }
  }

  drawTitleBlock(supertitle, mainTitle, subtitle) {
    this.ensureSpace(85);

    // Cyan/Navy accent badge
    this.currentPage.drawRectangle({
      x: this.leftMargin,
      y: this.y - 4,
      width: 4,
      height: 48,
      color: rgb(0.14, 0.83, 0.93), // Cyan #22D3EE
    });

    this.currentPage.drawText(this.sanitize(supertitle).toUpperCase(), {
      x: this.leftMargin + 14,
      y: this.y + 30,
      size: 8.5,
      font: this.fontBold,
      color: rgb(0.14, 0.51, 0.96),
    });

    this.currentPage.drawText(this.sanitize(mainTitle), {
      x: this.leftMargin + 14,
      y: this.y + 10,
      size: 16,
      font: this.fontBold,
      color: rgb(0.02, 0.04, 0.09),
    });

    this.currentPage.drawText(this.sanitize(subtitle), {
      x: this.leftMargin + 14,
      y: this.y - 6,
      size: 9,
      font: this.fontRegular,
      color: rgb(0.35, 0.42, 0.55),
    });

    this.y -= 38;
  }

  drawH1(text) {
    this.ensureSpace(35);
    this.y -= 10;
    this.currentPage.drawText(this.sanitize(text), {
      x: this.leftMargin,
      y: this.y,
      size: 12,
      font: this.fontBold,
      color: rgb(0.04, 0.08, 0.2),
    });

    this.currentPage.drawLine({
      start: { x: this.leftMargin, y: this.y - 4 },
      end: { x: this.leftMargin + 120, y: this.y - 4 },
      thickness: 1.5,
      color: rgb(0.14, 0.83, 0.93),
    });

    this.y -= 16;
  }

  drawH2(text) {
    this.ensureSpace(24);
    this.y -= 6;
    this.currentPage.drawText(this.sanitize(text), {
      x: this.leftMargin,
      y: this.y,
      size: 10,
      font: this.fontBold,
      color: rgb(0.12, 0.2, 0.4),
    });
    this.y -= 14;
  }

  sanitize(str) {
    if (!str) return "";
    return String(str)
      .replace(/[•]/g, "*")
      .replace(/[—–]/g, "-")
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      .replace(/[→]/g, "->")
      .replace(/[^\x20-\x7E\t]/g, " "); // keep printable ASCII
  }

  drawParagraph(text) {
    const rawLines = text.split("\n");
    for (const raw of rawLines) {
      const clean = this.sanitize(raw).trim();
      if (!clean) {
        this.y -= 4;
        continue;
      }
      const fontSize = 8.5;
      const lineHeight = 12;
      const words = clean.split(/\s+/);
      let line = "";

      for (const w of words) {
        const testLine = line ? `${line} ${w}` : w;
        const width = this.fontRegular.widthOfTextAtSize(testLine, fontSize);
        if (width > this.printableWidth) {
          this.ensureSpace(lineHeight);
          this.currentPage.drawText(line, {
            x: this.leftMargin,
            y: this.y,
            size: fontSize,
            font: this.fontRegular,
            color: rgb(0.15, 0.2, 0.28),
          });
          this.y -= lineHeight;
          line = w;
        } else {
          line = testLine;
        }
      }

      if (line) {
        this.ensureSpace(lineHeight);
        this.currentPage.drawText(line, {
          x: this.leftMargin,
          y: this.y,
          size: fontSize,
          font: this.fontRegular,
          color: rgb(0.15, 0.2, 0.28),
        });
        this.y -= lineHeight;
      }
      this.y -= 3;
    }
  }

  drawBullet(title, desc) {
    const cleanTitle = this.sanitize(title);
    const cleanDesc = this.sanitize(desc);
    const fontSize = 8.5;
    const lineHeight = 12;
    const bulletX = this.leftMargin + 10;
    const textX = this.leftMargin + 20;
    const textWidth = this.pageWidth - this.rightMargin - textX;

    const fullText = `${cleanTitle}: ${cleanDesc}`;
    const words = fullText.split(/\s+/);
    let line = "";
    let isFirstLine = true;

    for (const w of words) {
      const testLine = line ? `${line} ${w}` : w;
      const width = this.fontRegular.widthOfTextAtSize(testLine, fontSize);
      if (width > textWidth) {
        this.ensureSpace(lineHeight);
        if (isFirstLine) {
          this.currentPage.drawText("*", {
            x: bulletX,
            y: this.y,
            size: fontSize + 1,
            font: this.fontBold,
            color: rgb(0.14, 0.51, 0.96),
          });
          isFirstLine = false;
        }
        this.currentPage.drawText(line, {
          x: textX,
          y: this.y,
          size: fontSize,
          font: this.fontRegular,
          color: rgb(0.15, 0.2, 0.28),
        });
        this.y -= lineHeight;
        line = w;
      } else {
        line = testLine;
      }
    }

    if (line) {
      this.ensureSpace(lineHeight);
      if (isFirstLine) {
        this.currentPage.drawText("*", {
          x: bulletX,
          y: this.y,
          size: fontSize + 1,
          font: this.fontBold,
          color: rgb(0.14, 0.51, 0.96),
        });
      }
      this.currentPage.drawText(line, {
        x: textX,
        y: this.y,
        size: fontSize,
        font: this.fontRegular,
        color: rgb(0.15, 0.2, 0.28),
      });
      this.y -= lineHeight;
    }

    this.y -= 2;
  }

  drawCodeBox(title, codeLines) {
    const boxHeight = codeLines.length * 11 + 20;
    this.ensureSpace(boxHeight);

    this.currentPage.drawRectangle({
      x: this.leftMargin,
      y: this.y - boxHeight + 10,
      width: this.printableWidth,
      height: boxHeight,
      color: rgb(0.96, 0.97, 0.99),
      borderColor: rgb(0.85, 0.88, 0.93),
      borderWidth: 1,
    });

    this.currentPage.drawText(this.sanitize(title), {
      x: this.leftMargin + 10,
      y: this.y - 2,
      size: 7.5,
      font: this.fontBold,
      color: rgb(0.14, 0.51, 0.96),
    });

    let codeY = this.y - 14;
    for (const cl of codeLines) {
      const cleanCl = this.sanitize(cl).substring(0, 85);
      this.currentPage.drawText(cleanCl, {
        x: this.leftMargin + 10,
        y: codeY,
        size: 7,
        font: this.fontMono,
        color: rgb(0.2, 0.25, 0.35),
      });
      codeY -= 11;
    }

    this.y -= (boxHeight + 4);
  }

  drawTable(headers, rows) {
    const colCount = headers.length;
    const colWidth = this.printableWidth / colCount;
    const rowHeight = 16;
    const totalHeight = (rows.length + 1) * rowHeight + 8;

    this.ensureSpace(totalHeight);

    // Header Background
    this.currentPage.drawRectangle({
      x: this.leftMargin,
      y: this.y - rowHeight + 2,
      width: this.printableWidth,
      height: rowHeight,
      color: rgb(0.04, 0.08, 0.2), // Dark Navy
    });

    for (let c = 0; c < colCount; c++) {
      const headerText = this.sanitize(headers[c]).substring(0, Math.floor(colWidth / 5));
      this.currentPage.drawText(headerText, {
        x: this.leftMargin + c * colWidth + 6,
        y: this.y - 8,
        size: 7.5,
        font: this.fontBold,
        color: rgb(1, 1, 1),
      });
    }

    this.y -= rowHeight;

    // Rows
    for (let r = 0; r < rows.length; r++) {
      this.ensureSpace(rowHeight);
      const isAlt = r % 2 === 1;
      if (isAlt) {
        this.currentPage.drawRectangle({
          x: this.leftMargin,
          y: this.y - rowHeight + 2,
          width: this.printableWidth,
          height: rowHeight,
          color: rgb(0.96, 0.97, 0.99),
        });
      }

      this.currentPage.drawLine({
        start: { x: this.leftMargin, y: this.y - rowHeight + 2 },
        end: { x: this.leftMargin + this.printableWidth, y: this.y - rowHeight + 2 },
        thickness: 0.5,
        color: rgb(0.9, 0.92, 0.95),
      });

      for (let c = 0; c < colCount; c++) {
        const text = this.sanitize(String(rows[r][c] || "")).substring(0, Math.floor(colWidth / 4.8));
        this.currentPage.drawText(text, {
          x: this.leftMargin + c * colWidth + 6,
          y: this.y - 8,
          size: 7,
          font: this.fontRegular,
          color: rgb(0.15, 0.2, 0.28),
        });
      }

      this.y -= rowHeight;
    }

    this.y -= 6;
  }

  async build(outputPath) {
    const total = this.pages.length;
    for (let i = 0; i < total; i++) {
      const page = this.pages[i];
      // Footer line
      page.drawLine({
        start: { x: this.leftMargin, y: 35 },
        end: { x: this.pageWidth - this.rightMargin, y: 35 },
        thickness: 0.5,
        color: rgb(0.85, 0.88, 0.93),
      });

      page.drawText("Track Stack • Built by Team Version Controllers (Ayush Chauhan & Rishav Ranjan)", {
        x: this.leftMargin,
        y: 22,
        size: 7,
        font: this.fontRegular,
        color: rgb(0.4, 0.45, 0.55),
      });

      const pageStr = `Page ${i + 1} of ${total}`;
      const pageStrWidth = this.fontRegular.widthOfTextAtSize(pageStr, 7);
      page.drawText(pageStr, {
        x: this.pageWidth - this.rightMargin - pageStrWidth,
        y: 22,
        size: 7,
        font: this.fontRegular,
        color: rgb(0.4, 0.45, 0.55),
      });
    }

    const pdfBytes = await this.doc.save();
    fs.writeFileSync(outputPath, pdfBytes);
    console.log(`✅ Generated: ${outputPath} (${total} pages, ${(pdfBytes.length / 1024).toFixed(1)} KB)`);
  }
}

// ---------------------------------------------------------------------------
// 1. GENERATE PDF 1: TRACK STACK TECHNICAL SPECIFICATION
// ---------------------------------------------------------------------------
async function generateTechnicalPdf() {
  const b = new PDFDocBuilder("Technical Specification", "ARCHITECTURE & TECHNICAL SPECIFICATION");
  await b.init();

  b.drawTitleBlock(
    "Engineering Deep Dive",
    "Track Stack: Technical Architecture & System Specification",
    "Comprehensive guide on architecture, technology stack, security cryptography, and implementation details."
  );

  b.drawH1("1. Architecture Overview & Core Stack");
  b.drawParagraph(
    "Track Stack is engineered as a high-integrity, production-grade Club Activity Management Platform for Mirai School of Technology (MSOT). The platform unifies club governance, attendance check-ins, deliverable versioning, rubric evaluations, events, duty leaves, and verifiable transcripts into a reactive App Router architecture."
  );

  b.drawTable(
    ["Layer / Technology", "Primary Purpose", "Why We Chose It"],
    [
      ["Next.js 16 (App Router)", "Full-Stack Web Framework", "Server components, fast API route handlers, unified SSR/CSR execution."],
      ["TypeScript (Strict)", "Type System", "Zero-any policy, end-to-end type safety between database schemas and client."],
      ["React 19", "Reactive UI Runtime", "Server actions, concurrent rendering primitives, responsive state hydration."],
      ["Tailwind CSS", "Utility Design System", "High-contrast dark navy tokens (#060B18), glassmorphism, responsive styles."],
      ["Supabase (PostgreSQL)", "Relational Database", "Hosted PostgreSQL with Row Level Security (RLS) enforcement on every table."],
      ["pdf-lib", "Vector PDF Engine", "Server-side vector rendering of cryptographic certificates & transcripts."],
      ["qrcode", "Matrix Code Encoding", "Dynamic SVG and PNG QR generation for rotating tokens and public lookups."],
      ["Google Gemini SDK", "Lumi AI Assistant", "Gemini 2.5 Flash model for conversational campus assistance and tools."],
      ["Sharp", "High-Fidelity Imaging", "Image processing, circular avatars, and WebP compression."],
      ["Zod", "Schema Validation", "Strict runtime boundary validation on API requests and environment variables."]
    ]
  );

  b.drawH1("2. Cryptographic Security & Anti-Proxy Architecture");
  b.drawParagraph(
    "To solve the endemic challenge of attendance fraud, proxy check-ins, and forged paper certificates in educational institutions, Track Stack implements a five-tier cryptographic security engine:"
  );

  b.drawBullet(
    "Rotating Time-Stepped HMAC Tokens",
    "Every 25 seconds, the coordinator projector view derives a fresh token: HMAC-SHA256(sessionId:clubDayId:exp:salt:otp, HMAC_SECRET). Expired tokens are rejected instantly by server-side guards, permanently eliminating WhatsApp screenshot forwarding."
  );
  b.drawBullet(
    "Haversine GPS Geofencing",
    "The client scanner submits device GPS coordinates. The server calculates Great-Circle distance using the Haversine formula against campus coordinates (28.5355 N, 77.3910 E), rejecting check-ins outside the 300m radius."
  );
  b.drawBullet(
    "Hardware Device Fingerprinting",
    "Combines browser user-agent, viewport geometry, and hardware metrics into a deterministic 8-character hex digest. Multiple check-ins from the same device flag the record with device_reuse_flag = true for coordinator review."
  );
  b.drawBullet(
    "Cryptographically Signed Certificates",
    "Certificates embed an HMAC-SHA256 digital signature of canonical student and event data. Verification recomputes this signature on /verify/[id], detecting any document tampering or revocation."
  );

  b.drawH1("3. Page-by-Page Technical Engineering");
  b.drawParagraph("Each route in Track Stack is built with dedicated architectural principles:");

  b.drawBullet(
    "Landing Page (/)",
    "Public hero showcasing university tagline, theme initializer script, and live Public Certificate Verification lookup form querying /verify/[id]."
  );
  b.drawBullet(
    "Authentication (/login, /register)",
    "Dual email/password and workable Google Workspace OAuth selector, with 1-tap demo credentials switcher for rapid evaluation across all 5 roles."
  );
  b.drawBullet(
    "Analytics Dashboards (/dashboard)",
    "Role-scoped Recharts visualizations (Admin, Campus Manager, Faculty Advisor, Student Coordinator, Student) rendering attendance funnels in sub-50ms."
  );
  b.drawBullet(
    "Coordinator Run Deck (/activities/[id]/run)",
    "Mobile-first, one-handed operational controller with SVG rotating QR countdown ring, 6-digit OTP tabular display, and 1-tap attendance toggles with mandatory reason auditing."
  );
  b.drawBullet(
    "Submissions Engine (/activities/[id]/submissions)",
    "Multi-format file upload engine (PDF, PPTX, ZIP, links) with full version history archiving (v1, v2) and automated late-submission tagging."
  );
  b.drawBullet(
    "Rubric Evaluation (/activities/[id]/evaluate)",
    "Standardized 0-10 rubrics (Technical Depth 40%, Presentation 30%, Participation 30%) with draft score concealment until official publication."
  );
  b.drawBullet(
    "Clubs & Sub-Clubs Directory (/clubs, /clubs/society/[id])",
    "Campus directory managing NexCell, Malhar, Khel Society, and Kaizen Society with its 3 specialized sub-clubs: Dev Club, CP Club, and KI."
  );
  b.drawBullet(
    "Events & 200+ Concurrency (/events, /events/[id])",
    "Flagship hackathons and Olympiads with atomic team formation and waitlist promotion, stress tested for 200+ concurrent student registrations."
  );
  b.drawBullet(
    "Duty Leave Portal (/duty-leave)",
    "Automatic leave request dispatch on inter-campus event registration, routed to Campus Manager for approval with downloadable signed PDF letters."
  );
  b.drawBullet(
    "Co-Curricular Transcript (/transcript)",
    "Student-owned verified record compiling club memberships, attendance %, activity scores, and achievements with embedded verification QR code."
  );
  b.drawBullet(
    "Admin Audit Ledger (/admin/audit)",
    "Append-only, immutable record of attendance corrections, grade modifications, certificate revocations, and system configuration adjustments."
  );
  b.drawBullet(
    "Lumi AI Assistant Console (/admin/lumi & Floating Drawer)",
    "Dual-engine conversational assistant (Google Gemini SDK + scored local knowledge base) with safe read-only RLS tools and multilingual NLP."
  );

  b.drawH1("4. Database Schema & Migration Indexing");
  b.drawParagraph(
    "Track Stack features 7 comprehensive PostgreSQL migrations located in supabase/migrations/:"
  );
  b.drawBullet("001_initial_schema.sql", "Core user directory, campus definitions, club registries, and basic membership tables.");
  b.drawBullet("002_phase2_schema.sql", "2-club membership constraint triggers, waitlist queues, and Club Day activity lifecycle tables.");
  b.drawBullet("003_phase3_schema.sql", "Rotating check-in sessions, attendance logs, submissions with versioning, and rubric evaluations.");
  b.drawBullet("004_phase4_schema.sql", "Campus events, team registrations, digital certificates, and Duty Leave approval queues.");
  b.drawBullet("005_phase5_schema.sql", "Monthly reports table, audit log ledger, notifications centre, and cron automation tracking.");
  b.drawBullet("006_phase6_lumi.sql", "Lumi FAQ knowledge-base schema, query analytics, and escalation support requests.");
  b.drawBullet("007_phase7_performance.sql", "Compound B-Tree indexes (attendances, submissions, events, users) optimizing queries for sub-second p95 latency under 500 concurrent virtual users.");

  b.drawH1("5. Development Team: Version Controllers");
  b.drawParagraph(
    "Track Stack was architected and developed by team Version Controllers at Mirai School of Technology:\n• Ayush Chauhan (Team Leader) — GitHub: https://github.com/Ayush-git800\n• Rishav Ranjan — GitHub: https://github.com/rishavgiri1106-dotcom"
  );

  const outPath = path.join(process.cwd(), "docs/TRACK_STACK_TECHNICAL_SPECIFICATION.pdf");
  await b.build(outPath);
}

// ---------------------------------------------------------------------------
// 2. GENERATE PDF 2: TRACK STACK PRODUCT & FEATURE GUIDE
// ---------------------------------------------------------------------------
async function generateProductPdf() {
  const b = new PDFDocBuilder("Product & Feature Guide", "COMPLETE PRODUCT MANUAL & FEATURE WALKTHROUGH");
  await b.init();

  b.drawTitleBlock(
    "Official Product Manual",
    "Track Stack: Complete Product & Feature Walkthrough",
    "Detailed guide to platform motive, user roles, core principles, and end-to-end walkthrough of every single screen."
  );

  b.drawH1("1. Purpose, Motive & Institutional Problem");
  b.drawParagraph(
    "Modern college extracurriculars are plagued by disorganized administration. Student attendance is collected via paper sheets or Google Forms prone to proxy signing. Assignment deliverables are shared over WhatsApp groups where feedback is lost. Certificates are easily forged, and graduating students leave university without a unified, verified transcript of their co-curricular achievements."
  );
  b.drawParagraph(
    "Track Stack solves this problem for Mirai School of Technology (MSOT) by delivering a unified, verified, and low-effort ecosystem built on three unshakeable pillars:"
  );
  b.drawBullet("VERIFIED", "Every attendance mark, submission, evaluation score, and certificate is backed by cryptographic proofs, timestamped logs, and immutable audit trails.");
  b.drawBullet("LOW EFFORT FOR COORDINATORS", "Student coordinators can manage an entire Saturday Club Day session directly from a mobile phone in seconds using single-tap controls.");
  b.drawBullet("STUDENT-OWNED RECORD", "Every student can download a tamper-proof Co-Curricular Transcript PDF with embedded QR verification, ready for placement drives and higher studies.");

  b.drawH1("2. Role-Based Governance Model");
  b.drawParagraph("Track Stack provides specialized operational dashboards and workflows for five user roles:");

  b.drawBullet(
    "System Administrator (Ayush Chauhan)",
    "Global governance, institution-wide settings (max 2 clubs per student, grace periods), immutable audit log inspection, and Lumi AI knowledge-base management."
  );
  b.drawBullet(
    "Campus Manager (Sundaram Mishra)",
    "Delhi-NCR campus oversight, Duty Leave review and approval for inter-campus competitions, and review of mathematically reconciled monthly reports."
  );
  b.drawBullet(
    "Faculty Advisor (Gaurav Kumar)",
    "Reviews and approves proposed Saturday Club Day plans, conducts 0-10 rubric evaluations, conceals draft scores, and issues achievement certificates."
  );
  b.drawBullet(
    "Student Coordinator (Rishav Raj)",
    "Controls the live mobile Run Deck for their club, projects the rotating QR code, marks rosters with single-tap controls, corrects attendance with mandatory reasons, and posts club announcements."
  );
  b.drawBullet(
    "Student (Chintu)",
    "Explores clubs, enrolls under the 2-club limit, scans rotating QR codes, submits project deliverables with revision versioning, registers for hackathons, and downloads verified certificates and transcripts."
  );

  b.drawH1("3. Detailed Walkthrough of Every Single Feature");

  b.drawH2("A. Rotating QR Anti-Proxy Check-In");
  b.drawParagraph(
    "The coordinator screen displays a live QR code that regenerates every 25 seconds with an animated countdown ring and a large tabular 6-digit OTP. The server verifies time-stepped HMAC-SHA256 signatures, rejecting forwarded screenshots. Students inside the 300m campus geofence check in instantly."
  );

  b.drawH2("B. Submissions Engine & Revision History");
  b.drawParagraph(
    "Students upload deliverables in PDF, PPTX, DOCX, ZIP, or external repository links. When resubmitted before the deadline, the platform increments the version counter (v1, v2) rather than overwriting files, preserving the complete academic history for faculty review."
  );

  b.drawH2("C. Rubric Evaluation with Draft Score Concealment");
  b.drawParagraph(
    "Evaluators grade submissions on 0-10 rubrics across Technical Depth (40%), Presentation (30%), and Participation (30%). Scores remain strictly concealed as 'Draft' until officially published to maintain fair grading across all students."
  );

  b.drawH2("D. Cryptographically Verified Certificates");
  b.drawParagraph(
    "Certificates feature an embedded cryptographic HMAC signature and scannable QR code. Entering any certificate ID on the public lookup page (/verify/[id]) recomputes the signature against database records, proving authenticity (VALID) or flagging modifications (INVALID-TAMPERED)."
  );

  b.drawH2("E. Automated Inter-Campus Duty Leave");
  b.drawParagraph(
    "When a student registers for an approved inter-campus competition (such as Gambade or HackTech), Track Stack automatically generates a Duty Leave request. The Campus Manager approves it with comments, producing an official signed PDF letter for faculty clearance."
  );

  b.drawH2("F. Co-Curricular Transcript");
  b.drawParagraph(
    "Students can download their complete university transcript anytime. It synthesizes club memberships, attendance percentages, rubric scores, and earned certificates into a vector PDF with a verification QR code, backed by an authorized /api/transcript/[studentId] API endpoint."
  );

  b.drawH2("G. Reconciled Monthly Reports & Scheduled Cron Flow");
  b.drawParagraph(
    "At month-end, automated jobs compile comprehensive club performance summaries sent to Campus Managers. Report figures strictly match raw transactional database records (0.00% discrepancy), downloadable in vector PDF and CSV formats."
  );

  b.drawH2("H. Meet Lumi: The Campus AI Assistant");
  b.drawParagraph(
    "Lumi is Track Stack's official conversational companion, available via a floating glowing avatar drawer on every screen. Powered by Google Gemini Flash and a 60+ FAQ scored knowledge base, Lumi answers questions in English, Hindi, and Hinglish. It securely calls read-only tools to check attendance, club status, and deadlines, while maintaining firm guardrails against jailbreaks and unauthorized grade edits."
  );

  b.drawH1("4. Clubs Covered on Track Stack");
  b.drawParagraph(
    "Track Stack governs 4 core student clubs and Kaizen Society's 3 specialized sub-clubs:\n" +
    "• NexCell (Entrepreneurship Club) — Startup incubation, venture pitches (#3B9BE0)\n" +
    "• Malhar (Cultural Club) — Music, dance, dramatics, creative visual arts (#E8A935)\n" +
    "• Khel Society (Sports Club) — Athletics, football, inter-college tournaments (#1E6FC0)\n" +
    "• Kaizen Society (Technical Club) — Flagship engineering club with 3 chapters:\n" +
    "   - Dev Club (Kaizen Dev Club) — Full-stack, mobile, open source (#4FA39A)\n" +
    "   - CP Club — Competitive coding, algorithms, LeetCode/Codeforces (#A3E635)\n" +
    "   - KI (Kaizen Intelligence) — Machine learning, computer vision, AI (#D9A441)"
  );

  const outPath = path.join(process.cwd(), "docs/TRACK_STACK_PRODUCT_AND_FEATURE_GUIDE.pdf");
  await b.build(outPath);
}

// ---------------------------------------------------------------------------
// 3. GENERATE PDF 3: TRACK STACK README
// ---------------------------------------------------------------------------
async function generateReadmePdf() {
  const b = new PDFDocBuilder("README Documentation", "OFFICIAL REPOSITORY README");
  await b.init();

  const readmeContent = fs.readFileSync(path.join(process.cwd(), "README.md"), "utf8");
  const lines = readmeContent.split("\n");

  b.drawTitleBlock(
    "GitHub Documentation",
    "Track Stack: Official Project README",
    "Complete repository documentation, deployment guide, and developer manual."
  );

  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed || trimmed.startsWith("<p") || trimmed.startsWith("</p") || trimmed.startsWith("<img") || trimmed.startsWith("<a")) {
      continue;
    }

    if (trimmed.startsWith("# ")) {
      b.drawH1(trimmed.replace("# ", ""));
      continue;
    }
    if (trimmed.startsWith("## ")) {
      b.drawH1(trimmed.replace("## ", ""));
      continue;
    }
    if (trimmed.startsWith("### ")) {
      b.drawH2(trimmed.replace("### ", ""));
      continue;
    }

    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const cells = trimmed.split("|").slice(1, -1).map(c => c.trim().replace(/\*\*/g, ""));
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
        tableRows = [];
      } else if (trimmed.includes("---")) {
        // separator line, skip
      } else {
        tableRows.push(cells);
      }
      continue;
    } else if (inTable) {
      // Flush table
      if (tableHeaders.length > 0 && tableRows.length > 0) {
        b.drawTable(tableHeaders, tableRows);
      }
      inTable = false;
      tableHeaders = [];
      tableRows = [];
    }

    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      const bulletText = trimmed.replace(/^[-*]\s+/, "");
      const colonIdx = bulletText.indexOf(":");
      if (colonIdx > 0 && colonIdx < 35) {
        const title = bulletText.substring(0, colonIdx).replace(/\*\*/g, "");
        const desc = bulletText.substring(colonIdx + 1).trim().replace(/\*\*/g, "");
        b.drawBullet(title, desc);
      } else {
        b.drawBullet("Overview", bulletText.replace(/\*\*/g, ""));
      }
      continue;
    }

    if (trimmed.startsWith("```")) {
      // Collect code block
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      b.drawCodeBox("COMMAND SCRIPT / CONFIGURATION", codeLines.slice(0, 10));
      continue;
    }

    if (!trimmed.startsWith(">") && !trimmed.startsWith("---")) {
      b.drawParagraph(trimmed.replace(/\*\*/g, "").replace(/`/g, ""));
    }
  }

  if (inTable && tableHeaders.length > 0 && tableRows.length > 0) {
    b.drawTable(tableHeaders, tableRows);
  }

  const outPath = path.join(process.cwd(), "docs/TRACK_STACK_README.pdf");
  await b.build(outPath);
}

// Execute all generators
async function main() {
  await generateTechnicalPdf();
  await generateProductPdf();
  await generateReadmePdf();
  console.log("\n===============================================================");
  console.log("🎉 ALL 3 DOCUMENTATION PDFS GENERATED SUCCESSFULLY!");
  console.log("===============================================================\n");
}

main().catch((err) => {
  console.error("Failed to generate documentation PDFs:", err);
  process.exit(1);
});
