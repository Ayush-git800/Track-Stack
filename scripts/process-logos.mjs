import sharp from "sharp";
import fs from "fs";
import path from "path";

const RAW_DIR = path.resolve("public/logos/raw");
const OUT_DIR = path.resolve("public/logos");
const ICONS_DIR = path.resolve("public/icons");

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}
if (!fs.existsSync(ICONS_DIR)) {
  fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// 512x512 circular mask for perfect antialiased edges
const circleMask512 = Buffer.from(`
  <svg width="512" height="512" viewBox="0 0 512 512">
    <circle cx="256" cy="256" r="254" fill="#ffffff" />
  </svg>
`);

async function saveBoth(pipeline, baseName) {
  const pngPath = path.join(OUT_DIR, `${baseName}.png`);
  const webpPath = path.join(OUT_DIR, `${baseName}.webp`);

  const pngBuf = await pipeline.clone().png({ quality: 95 }).toBuffer();
  await sharp(pngBuf).toFile(pngPath);

  const webpBuf = await pipeline.clone().webp({ quality: 90 }).toBuffer();
  await sharp(webpBuf).toFile(webpPath);

  console.log(`✓ Generated ${baseName}.png and ${baseName}.webp`);
}

async function processNexcell() {
  const rawFile = fs.existsSync(path.join(RAW_DIR, "nexcell.jpg"))
    ? path.join(RAW_DIR, "nexcell.jpg")
    : path.join(RAW_DIR, "nexcell.jpeg");

  // Center ~ (360, 810), radius ~ 295 -> left: 65, top: 515, width: 590, height: 590
  const cropped = await sharp(rawFile)
    .extract({ left: 65, top: 515, width: 590, height: 590 })
    .resize(512, 512, { kernel: "lanczos3" })
    .composite([{ input: circleMask512, blend: "dest-in" }]);

  await saveBoth(cropped, "nexcell");
}

async function processKhelSociety() {
  const rawFile = path.join(RAW_DIR, "khel-society.jpeg");
  // Center ~ (360, 812), radius ~ 306 -> left: 54, top: 505, width: 612, height: 612
  const cropped = await sharp(rawFile)
    .extract({ left: 54, top: 505, width: 612, height: 612 })
    .resize(512, 512, { kernel: "lanczos3" })
    .composite([{ input: circleMask512, blend: "dest-in" }]);

  await saveBoth(cropped, "khel-society");
}

async function processMalhar() {
  const rawFile = fs.existsSync(path.join(RAW_DIR, "malhar-club.jpg"))
    ? path.join(RAW_DIR, "malhar-club.jpg")
    : path.join(RAW_DIR, "malhar-club.jpeg");

  // Center ~ (360, 800), radius ~ 305 -> left: 55, top: 495, width: 610, height: 610
  const cropped = await sharp(rawFile)
    .extract({ left: 55, top: 495, width: 610, height: 610 })
    .resize(512, 512, { kernel: "lanczos3" })
    .composite([{ input: circleMask512, blend: "dest-in" }]);

  await saveBoth(cropped, "malhar");
}

async function processKaizenSubClub(fileName, outName) {
  const filePath = path.join(RAW_DIR, fileName);
  // These are small circular badges on white/transparent rectangles
  // dev-club (284x238), cp-club (292x268), intelligence-club (266x234)
  const meta = await sharp(filePath).metadata();
  const minSide = Math.min(meta.width, meta.height);
  // Crop square around center
  const left = Math.floor((meta.width - minSide) / 2);
  const top = Math.floor((meta.height - minSide) / 2);

  // Inset slightly by 4% to remove any white border / corner
  const inset = Math.floor(minSide * 0.04);
  const cropSize = minSide - inset * 2;

  const cropped = await sharp(filePath)
    .extract({
      left: left + inset,
      top: top + inset,
      width: cropSize,
      height: cropSize,
    })
    .resize(512, 512, { kernel: "lanczos3" })
    .composite([{ input: circleMask512, blend: "dest-in" }]);

  await saveBoth(cropped, outName);
}

async function processKaizenSociety() {
  const rawFile = path.join(RAW_DIR, "kaizen_logo.avif");
  // 375x373 avif -> circular 512x512
  const meta = await sharp(rawFile).metadata();
  const minSide = Math.min(meta.width, meta.height);
  const inset = Math.floor(minSide * 0.03);
  const cropSize = minSide - inset * 2;
  const left = Math.floor((meta.width - minSide) / 2) + inset;
  const top = Math.floor((meta.height - minSide) / 2) + inset;

  const cropped = await sharp(rawFile)
    .extract({ left, top, width: cropSize, height: cropSize })
    .resize(512, 512, { kernel: "lanczos3" })
    .composite([{ input: circleMask512, blend: "dest-in" }]);

  await saveBoth(cropped, "kaizen-society");
}

async function processTrackStackBanner() {
  const rawFile = path.join(RAW_DIR, "track-stack.png");
  // raw is 1408x768
  // 1. Lockup banner (trim or resize nicely)
  await sharp(rawFile)
    .trim()
    .resize(1000, null, { withoutEnlargement: true })
    .png({ quality: 95 })
    .toFile(path.join(OUT_DIR, "track-stack-lockup.png"));

  await sharp(rawFile)
    .trim()
    .resize(1000, null, { withoutEnlargement: true })
    .webp({ quality: 90 })
    .toFile(path.join(OUT_DIR, "track-stack-lockup.webp"));

  console.log("✓ Generated track-stack-lockup.png & webp");

  // 2. Mark (glowing TS icon at left, ~x205-525, y200-565 -> width ~320, height ~365)
  // Let's do exact crop around the mark:
  const markPipeline = sharp(rawFile)
    .extract({ left: 200, top: 195, width: 335, height: 375 })
    .resize(512, 512, {
      fit: "contain",
      background: { r: 6, g: 11, b: 24, alpha: 0 },
    });

  const mark512 = await markPipeline.clone().png().toBuffer();
  await sharp(mark512).toFile(path.join(OUT_DIR, "track-stack-mark.png"));
  await sharp(mark512).webp().toFile(path.join(OUT_DIR, "track-stack-mark.webp"));
  console.log("✓ Generated track-stack-mark.png & webp");

  // PWA Icons & Favicon
  await sharp(mark512).resize(192, 192).toFile(path.join(ICONS_DIR, "icon-192.png"));
  await sharp(mark512).resize(512, 512).toFile(path.join(ICONS_DIR, "icon-512.png"));
  // Maskable with safe padding on dark navy background
  await sharp(mark512)
    .resize(400, 400)
    .extend({
      top: 56,
      bottom: 56,
      left: 56,
      right: 56,
      background: { r: 6, g: 11, b: 24, alpha: 1 },
    })
    .toFile(path.join(ICONS_DIR, "icon-maskable.png"));

  // Favicon (32x32 png, also write to public/favicon.ico)
  const fav32 = await sharp(mark512).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.resolve("public/favicon.ico"), fav32);
  fs.writeFileSync(path.resolve("public/favicon.png"), fav32);
  console.log("✓ Generated PWA icons and favicon");
}

async function processLumi() {
  const rawFile = path.join(RAW_DIR, "lumi.png");
  if (!fs.existsSync(rawFile)) {
    console.warn("⚠️ public/logos/raw/lumi.png not found, skipping Lumi processing.");
    return;
  }

  // 1. Mascot Crop (square 512x512 of only robot + circular glow, with circular mask)
  // Glow center at cx=367, cy=437, radius ~215, crop 470x470 from left: 132, top: 202
  const mascotPipeline = sharp(rawFile)
    .extract({ left: 132, top: 202, width: 470, height: 470 })
    .resize(512, 512, { kernel: "lanczos3" })
    .composite([{ input: circleMask512, blend: "dest-in" }]);

  const mascot512 = await mascotPipeline.clone().png({ quality: 95 }).toBuffer();
  await sharp(mascot512).toFile(path.join(OUT_DIR, "lumi-mascot.png"));

  const mascotWebp = await mascotPipeline.clone().webp({ quality: 90 }).toBuffer();
  await sharp(mascotWebp).toFile(path.join(OUT_DIR, "lumi-mascot.webp"));
  console.log("✓ Generated lumi-mascot.png and lumi-mascot.webp");

  // 2. Lockup (Full logo: mascot + LUMI AI ASSISTANT, trimmed of excess margins without stretching)
  const lockupPipeline = sharp(rawFile)
    .extract({ left: 110, top: 175, width: 1040, height: 535 })
    .resize(1000, null, { withoutEnlargement: true });

  await lockupPipeline.clone().png({ quality: 95 }).toFile(path.join(OUT_DIR, "lumi-lockup.png"));
  await lockupPipeline.clone().webp({ quality: 90 }).toFile(path.join(OUT_DIR, "lumi-lockup.webp"));
  console.log("✓ Generated lumi-lockup.png and lumi-lockup.webp");

  // 3. PWA and Notification Icons (Square 192x192 and 512x512)
  await sharp(mascot512).resize(192, 192).toFile(path.join(OUT_DIR, "lumi-icon-192.png"));
  await sharp(mascot512).resize(512, 512).toFile(path.join(OUT_DIR, "lumi-icon-512.png"));
  await sharp(mascot512).resize(192, 192).toFile(path.join(ICONS_DIR, "lumi-icon-192.png"));
  await sharp(mascot512).resize(512, 512).toFile(path.join(ICONS_DIR, "lumi-icon-512.png"));
  console.log("✓ Generated lumi-icon-192.png and lumi-icon-512.png");
}

async function main() {
  console.log("🚀 Starting logo processing...");
  try {
    await processNexcell();
    await processKhelSociety();
    await processMalhar();
    await processKaizenSubClub("cp-club.png", "cp-club");
    await processKaizenSubClub("dev-club.png", "kaizen-dev");
    await processKaizenSubClub("intelligence-club.png", "kaizen-intelligence");
    await processKaizenSociety();
    await processTrackStackBanner();
    await processLumi();
    console.log("✨ All logos processed successfully!");
  } catch (err) {
    console.error("❌ Error processing logos:", err);
    process.exit(1);
  }
}

main();
