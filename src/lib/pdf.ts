import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import type { Certificate, DutyLeave, CoCurricularTranscript } from "./types.ts";

/**
 * Generate high-resolution, vector Certificate PDF in A4 Landscape (842 x 595 pt)
 */
export async function generateCertificatePdf(
  cert: Certificate,
  baseUrl: string = "http://localhost:3000"
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // A4 Landscape: width 842, height 595
  const page = doc.addPage([842, 595]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  // Background tint
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.98, 0.99, 1.0),
  });

  // Double Decorative Border
  // Outer Border (Navy)
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    borderColor: rgb(0.02, 0.04, 0.09), // #060B18
    borderWidth: 3,
  });

  // Inner Border (Cyan/Blue)
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(0.01, 0.52, 0.78), // #0284C7
    borderWidth: 1.5,
  });

  // Corner Accents
  const cornerSize = 14;
  const drawCorner = (cx: number, cy: number) => {
    page.drawRectangle({
      x: cx - cornerSize / 2,
      y: cy - cornerSize / 2,
      width: cornerSize,
      height: cornerSize,
      color: rgb(0.01, 0.52, 0.78),
    });
  };
  drawCorner(28, 28);
  drawCorner(width - 28, 28);
  drawCorner(28, height - 28);
  drawCorner(width - 28, height - 28);

  // Institution Header
  const orgName = "MIRAI SCHOOL OF TECHNOLOGY";
  const orgWidth = fontBold.widthOfTextAtSize(orgName, 18);
  page.drawText(orgName, {
    x: (width - orgWidth) / 2,
    y: height - 70,
    size: 18,
    font: fontBold,
    color: rgb(0.02, 0.04, 0.09),
  });

  const subHeader = "DELHI-NCR CAMPUS  •  DIRECTORATE OF STUDENT ACTIVITIES";
  const subWidth = fontRegular.widthOfTextAtSize(subHeader, 9);
  page.drawText(subHeader, {
    x: (width - subWidth) / 2,
    y: height - 88,
    size: 9,
    font: fontRegular,
    color: rgb(0.28, 0.33, 0.41),
  });

  // Certificate Type Title
  const isWinner = cert.type === "winner" || cert.type === "achievement";
  const certTypeTitle = isWinner
    ? "CERTIFICATE OF ACHIEVEMENT & EXCELLENCE"
    : "CERTIFICATE OF ACTIVE PARTICIPATION";
  const typeWidth = fontBold.widthOfTextAtSize(certTypeTitle, 22);

  page.drawText(certTypeTitle, {
    x: (width - typeWidth) / 2,
    y: height - 135,
    size: 22,
    font: fontBold,
    color: isWinner ? rgb(0.01, 0.52, 0.78) : rgb(0.15, 0.23, 0.36),
  });

  // Presentation Text
  const presentedText = "THIS IS PROUDLY PRESENTED TO";
  const pWidth = fontRegular.widthOfTextAtSize(presentedText, 10);
  page.drawText(presentedText, {
    x: (width - pWidth) / 2,
    y: height - 170,
    size: 10,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  // Recipient Name (Prominent)
  const studentName = cert.user_name.toUpperCase();
  const nameWidth = fontBold.widthOfTextAtSize(studentName, 26);
  page.drawText(studentName, {
    x: (width - nameWidth) / 2,
    y: height - 215,
    size: 26,
    font: fontBold,
    color: rgb(0.02, 0.04, 0.09),
  });

  // Underline beneath name
  page.drawLine({
    start: { x: (width - Math.max(nameWidth, 260)) / 2 - 20, y: height - 225 },
    end: { x: (width + Math.max(nameWidth, 260)) / 2 + 20, y: height - 225 },
    thickness: 1.5,
    color: rgb(0.01, 0.52, 0.78),
  });

  // Student Roll / ID
  const idText = `Student ID: ${cert.student_id}  |  Campus: ${cert.campus_name || "Delhi-NCR"}`;
  const idWidth = fontRegular.widthOfTextAtSize(idText, 10);
  page.drawText(idText, {
    x: (width - idWidth) / 2,
    y: height - 245,
    size: 10,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  // Description / Citation
  const citation = cert.description || `In recognition of verified participation and exemplary contribution in ${cert.title}.`;
  const citationWidth = fontRegular.widthOfTextAtSize(citation, 11);
  page.drawText(citation, {
    x: (width - Math.min(citationWidth, 680)) / 2,
    y: height - 290,
    size: 11,
    font: fontRegular,
    color: rgb(0.18, 0.24, 0.32),
  });

  // Generate QR Code linking to verification endpoint
  const verifyUrl = `${baseUrl}/verify/${cert.id}`;
  const qrPngBuffer = await QRCode.toBuffer(verifyUrl, {
    width: 140,
    margin: 1,
    color: {
      dark: "#060B18",
      light: "#FFFFFF",
    },
  });
  const qrImage = await doc.embedPng(qrPngBuffer);

  // Position QR Code at bottom center-left
  page.drawImage(qrImage, {
    x: 65,
    y: 65,
    width: 90,
    height: 90,
  });

  page.drawText("SCAN TO VERIFY", {
    x: 68,
    y: 52,
    size: 7,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });

  // Issue Date & Certificate ID Box
  page.drawText("CERTIFICATE DETAILS", {
    x: 175,
    y: 135,
    size: 8,
    font: fontBold,
    color: rgb(0.28, 0.33, 0.41),
  });
  page.drawText(`Certificate ID : ${cert.id}`, {
    x: 175,
    y: 118,
    size: 9,
    font: fontMono,
    color: rgb(0.02, 0.04, 0.09),
  });
  page.drawText(`Date of Issue  : ${cert.issue_date}`, {
    x: 175,
    y: 103,
    size: 9,
    font: fontMono,
    color: rgb(0.02, 0.04, 0.09),
  });
  page.drawText(`Integrity Check: Cryptographically Signed (HMAC-SHA256)`, {
    x: 175,
    y: 88,
    size: 8,
    font: fontRegular,
    color: rgb(0.05, 0.59, 0.41),
  });
  page.drawText(`Public Registry: ${baseUrl}/verify/${cert.id}`, {
    x: 175,
    y: 73,
    size: 8,
    font: fontRegular,
    color: rgb(0.35, 0.42, 0.52),
  });

  // Signatory Section (Right Side)
  const sigName = cert.signatory_name || "Dr. Vikram Malhotra";
  const sigTitle = cert.signatory_title || "Campus Director & Dean of Student Affairs";

  page.drawLine({
    start: { x: width - 260, y: 105 },
    end: { x: width - 65, y: 105 },
    thickness: 1,
    color: rgb(0.2, 0.25, 0.35),
  });

  const sigNameWidth = fontBold.widthOfTextAtSize(sigName, 11);
  page.drawText(sigName, {
    x: width - 65 - sigNameWidth,
    y: 90,
    size: 11,
    font: fontBold,
    color: rgb(0.02, 0.04, 0.09),
  });

  const sigTitleWidth = fontRegular.widthOfTextAtSize(sigTitle, 8);
  page.drawText(sigTitle, {
    x: width - 65 - sigTitleWidth,
    y: 76,
    size: 8,
    font: fontRegular,
    color: rgb(0.35, 0.42, 0.52),
  });

  // Cryptographic Signature Stamp Footer
  const sigStamp = `HMAC-SHA256: ${cert.signature || "UNVERIFIED"}`;
  page.drawText(sigStamp, {
    x: 35,
    y: 34,
    size: 7,
    font: fontMono,
    color: rgb(0.45, 0.52, 0.62),
  });

  const copyNotice = "TRACK STACK PLATFORM  •  OFFICIAL RECORD OF MIRAI SCHOOL OF TECHNOLOGY";
  const copyWidth = fontRegular.widthOfTextAtSize(copyNotice, 7);
  page.drawText(copyNotice, {
    x: width - copyWidth - 35,
    y: 34,
    size: 7,
    font: fontRegular,
    color: rgb(0.45, 0.52, 0.62),
  });

  return await doc.save();
}

/**
 * Generate Official Duty Leave Sanction Order PDF in A4 Portrait (595 x 842 pt)
 */
export async function generateDutyLeavePdf(
  leave: DutyLeave,
  baseUrl: string = "http://localhost:3000"
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4 Portrait
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  // Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 1,
  });

  // Header
  page.drawText("MIRAI SCHOOL OF TECHNOLOGY", {
    x: 50,
    y: height - 70,
    size: 16,
    font: fontBold,
    color: rgb(0.02, 0.04, 0.09),
  });

  page.drawText("OFFICE OF THE CAMPUS DIRECTOR & ACADEMIC REGISTRAR", {
    x: 50,
    y: height - 88,
    size: 9,
    font: fontRegular,
    color: rgb(0.3, 0.35, 0.45),
  });

  page.drawLine({
    start: { x: 50, y: height - 100 },
    end: { x: width - 50, y: height - 100 },
    thickness: 1.5,
    color: rgb(0.01, 0.52, 0.78),
  });

  // Order Title
  const title = "OFFICIAL DUTY LEAVE SANCTION ORDER";
  const titleWidth = fontBold.widthOfTextAtSize(title, 13);
  page.drawText(title, {
    x: (width - titleWidth) / 2,
    y: height - 135,
    size: 13,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });

  page.drawText(`Ref: MSOT/DL/${leave.id.substring(0, 8).toUpperCase()}`, {
    x: 50,
    y: height - 165,
    size: 9,
    font: fontMono,
    color: rgb(0.2, 0.25, 0.35),
  });

  page.drawText(`Date: ${leave.created_at.substring(0, 10)}`, {
    x: width - 150,
    y: height - 165,
    size: 9,
    font: fontMono,
    color: rgb(0.2, 0.25, 0.35),
  });

  // Body content
  let currentY = height - 200;
  const drawLineItem = (label: string, value: string) => {
    page.drawText(label, { x: 50, y: currentY, size: 10, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
    page.drawText(value, { x: 180, y: currentY, size: 10, font: fontRegular, color: rgb(0.05, 0.08, 0.15) });
    currentY -= 24;
  };

  drawLineItem("Student Name:", leave.user_name);
  drawLineItem("Student ID:", leave.student_id);
  drawLineItem("Campus:", leave.campus_name || "Delhi-NCR Campus");
  drawLineItem("Flagship Event:", leave.event_name);
  drawLineItem("Sanctioned Dates:", leave.dates);
  drawLineItem("Approval Status:", leave.status.toUpperCase());

  currentY -= 15;
  page.drawText("EXEMPTION SANCTION & DIRECTIVE:", {
    x: 50,
    y: currentY,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.04, 0.09),
  });
  currentY -= 20;

  const directiveText =
    "In accordance with MSOT Co-Curricular Excellence Regulations, the student named above is granted official Duty Leave to represent the institution in the approved inter-campus flagship event noted herein. Academic instructors and department heads are directed to record attendance as EXEMPTED / PRESENT FOR OFFICIAL DUTY, and facilitate access to missed laboratory sessions or assignments without academic penalty.";

  page.drawText(directiveText, {
    x: 50,
    y: currentY,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.2, 0.25, 0.35),
    lineHeight: 15,
    maxWidth: width - 100,
  });

  // Approver comments if any
  currentY -= 90;
  if (leave.approver_comments) {
    page.drawText(`Campus Manager Remarks: "${leave.approver_comments}"`, {
      x: 50,
      y: currentY,
      size: 9,
      font: fontRegular,
      color: rgb(0.05, 0.59, 0.41),
    });
    currentY -= 30;
  }

  // QR Code for verification
  const qrBuffer = await QRCode.toBuffer(`${baseUrl}/duty-leave`, { width: 100, margin: 1 });
  const qrImg = await doc.embedPng(qrBuffer);
  page.drawImage(qrImg, {
    x: 50,
    y: 70,
    width: 75,
    height: 75,
  });

  // Signature
  page.drawLine({
    start: { x: width - 220, y: 120 },
    end: { x: width - 50, y: 120 },
    thickness: 1,
    color: rgb(0.3, 0.35, 0.45),
  });

  page.drawText(leave.approver_name || "Campus Manager / Director", {
    x: width - 220,
    y: 105,
    size: 10,
    font: fontBold,
    color: rgb(0.02, 0.04, 0.09),
  });

  page.drawText("Competent Approving Authority", {
    x: width - 220,
    y: 92,
    size: 8,
    font: fontRegular,
    color: rgb(0.4, 0.45, 0.55),
  });

  page.drawText("Track Stack Verified Duty Leave System", {
    x: width - 220,
    y: 80,
    size: 7,
    font: fontMono,
    color: rgb(0.01, 0.52, 0.78),
  });

  return await doc.save();
}

/**
 * Generate Student Co-Curricular Transcript PDF in A4 Portrait (595 x 842 pt)
 */
export async function generateTranscriptPdf(
  transcript: CoCurricularTranscript
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();

  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontMono = await doc.embedFont(StandardFonts.Courier);

  // Background
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.99, 1.0, 1.0),
  });

  // Top header banner
  page.drawRectangle({
    x: 0,
    y: height - 90,
    width,
    height: 90,
    color: rgb(0.02, 0.04, 0.09), // #060B18
  });

  page.drawText("MIRAI SCHOOL OF TECHNOLOGY", {
    x: 40,
    y: height - 40,
    size: 14,
    font: fontBold,
    color: rgb(0.13, 0.83, 0.93), // #22D3EE
  });

  page.drawText("OFFICIAL VERIFIED CO-CURRICULAR TRANSCRIPT", {
    x: 40,
    y: height - 60,
    size: 10,
    font: fontBold,
    color: rgb(1.0, 1.0, 1.0),
  });

  page.drawText("AUTHENTIC STUDENT CO-CURRICULAR RECORD  •  TRACK STACK CAMPUS OS", {
    x: 40,
    y: height - 76,
    size: 7.5,
    font: fontMono,
    color: rgb(0.58, 0.64, 0.78),
  });

  // Student Profile Info Box
  page.drawRectangle({
    x: 40,
    y: height - 175,
    width: width - 80,
    height: 70,
    borderColor: rgb(0.85, 0.9, 0.95),
    borderWidth: 1,
    color: rgb(0.96, 0.98, 1.0),
  });

  page.drawText(`Student Name : ${transcript.student_name}`, { x: 55, y: height - 120, size: 9.5, font: fontBold, color: rgb(0.05, 0.1, 0.2) });
  page.drawText(`Student ID   : ${transcript.student_id}`, { x: 55, y: height - 138, size: 9, font: fontMono, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Campus       : ${transcript.campus_name}`, { x: 55, y: height - 156, size: 9, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });

  page.drawText(`Program      : ${transcript.program || "B.Tech Computer Science"}`, { x: 300, y: height - 120, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Year of Study: Year ${transcript.year_of_study || 2}`, { x: 300, y: height - 138, size: 9, font: fontRegular, color: rgb(0.1, 0.15, 0.25) });
  page.drawText(`Generated On : ${transcript.generated_at.substring(0, 10)}`, { x: 300, y: height - 156, size: 8.5, font: fontMono, color: rgb(0.3, 0.35, 0.45) });

  let curY = height - 200;

  // Section 1: Clubs & Attendance Record
  page.drawText("1. ENROLLED SOCIETIES & VERIFIED ATTENDANCE RECORD", {
    x: 40,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });
  curY -= 18;

  // Table header
  page.drawRectangle({ x: 40, y: curY - 14, width: width - 80, height: 18, color: rgb(0.92, 0.95, 0.98) });
  page.drawText("Club Name", { x: 50, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Category", { x: 220, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Role", { x: 340, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Check-ins", { x: 420, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Attendance", { x: 480, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  curY -= 26;

  for (const c of transcript.clubs) {
    page.drawText(c.club_name, { x: 50, y: curY, size: 8.5, font: fontBold, color: rgb(0.05, 0.08, 0.15) });
    page.drawText(c.category || "Society", { x: 220, y: curY, size: 8, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(c.designation.toUpperCase(), { x: 340, y: curY, size: 8, font: fontMono, color: rgb(0.01, 0.52, 0.78) });
    page.drawText(`${c.attendance_count} sessions`, { x: 420, y: curY, size: 8, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });
    page.drawText(`${c.attendance_pct}%`, { x: 480, y: curY, size: 8.5, font: fontBold, color: rgb(0.05, 0.59, 0.41) });
    curY -= 16;
  }

  curY -= 14;

  // Section 2: Submissions & Evaluated Deliverables
  page.drawText("2. PROJECT DELIVERABLES & FACULTY RUBRIC EVALUATIONS", {
    x: 40,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });
  curY -= 18;

  page.drawRectangle({ x: 40, y: curY - 14, width: width - 80, height: 18, color: rgb(0.92, 0.95, 0.98) });
  page.drawText("Activity / Deliverable", { x: 50, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Club", { x: 250, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Submission Date", { x: 380, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Score", { x: 480, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  curY -= 26;

  for (const s of transcript.submissions) {
    page.drawText(s.activity_title.substring(0, 36), { x: 50, y: curY, size: 8, font: fontRegular, color: rgb(0.05, 0.08, 0.15) });
    page.drawText(s.club_name.substring(0, 22), { x: 250, y: curY, size: 8, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(s.submitted_at.substring(0, 10), { x: 380, y: curY, size: 8, font: fontMono, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(s.score !== null ? `${s.score} / 10` : "Under Review", { x: 480, y: curY, size: 8.5, font: fontBold, color: rgb(0.01, 0.52, 0.78) });
    curY -= 16;
  }

  curY -= 14;

  // Section 3: Flagship Campus & Inter-Campus Events
  page.drawText("3. FLAGSHIP EVENTS & TOURNAMENT PARTICIPATION", {
    x: 40,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });
  curY -= 18;

  page.drawRectangle({ x: 40, y: curY - 14, width: width - 80, height: 18, color: rgb(0.92, 0.95, 0.98) });
  page.drawText("Event Name", { x: 50, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Team / Individual", { x: 250, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Dates", { x: 380, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("Position / Result", { x: 470, y: curY - 10, size: 8, font: fontBold, color: rgb(0.2, 0.25, 0.35) });
  curY -= 26;

  for (const e of transcript.events) {
    page.drawText(e.event_name, { x: 50, y: curY, size: 8, font: fontBold, color: rgb(0.05, 0.08, 0.15) });
    page.drawText(e.team_name || "Individual", { x: 250, y: curY, size: 8, font: fontRegular, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(e.dates, { x: 380, y: curY, size: 8, font: fontMono, color: rgb(0.3, 0.35, 0.45) });
    page.drawText(e.position || "Participant", { x: 470, y: curY, size: 8.5, font: fontBold, color: rgb(0.85, 0.45, 0.05) });
    curY -= 16;
  }

  curY -= 14;

  // Section 4: Certificates
  page.drawText("4. CRYPTOGRAPHICALLY VERIFIED CERTIFICATES ISSUED", {
    x: 40,
    y: curY,
    size: 10,
    font: fontBold,
    color: rgb(0.01, 0.52, 0.78),
  });
  curY -= 18;

  for (const cert of transcript.certificates) {
    page.drawText(`• ${cert.title} (${cert.id}) - Issued on ${cert.issue_date} [${cert.type.toUpperCase()}]`, {
      x: 50,
      y: curY,
      size: 8,
      font: fontRegular,
      color: rgb(0.15, 0.2, 0.3),
    });
    curY -= 14;
  }

  // Footer & Verification QR Code
  const qrBuffer = await QRCode.toBuffer(transcript.verification_url, { width: 100, margin: 1 });
  const qrImg = await doc.embedPng(qrBuffer);

  page.drawImage(qrImg, {
    x: 40,
    y: 35,
    width: 65,
    height: 65,
  });

  page.drawText("VERIFIED RECORD AUDIT TRAIL", { x: 115, y: 88, size: 8.5, font: fontBold, color: rgb(0.01, 0.52, 0.78) });
  page.drawText(`Ledger Signature: ${transcript.signature}`, { x: 115, y: 74, size: 7, font: fontMono, color: rgb(0.4, 0.45, 0.55) });
  page.drawText(`Public Verification URL: ${transcript.verification_url}`, { x: 115, y: 62, size: 7.5, font: fontRegular, color: rgb(0.2, 0.25, 0.35) });
  page.drawText("This transcript is cryptographically authenticated and backed by raw check-in, submission and evaluation logs.", {
    x: 115,
    y: 50,
    size: 6.5,
    font: fontRegular,
    color: rgb(0.45, 0.5, 0.6),
  });

  return await doc.save();
}
