/**
 * Generates every PWA icon and the social preview card from one source design.
 * Run `npm run icons` after changing the brand mark.
 *
 * Rasterisation uses `sharp` (already a project dependency via Next.js), so the
 * script works anywhere the app builds — no ImageMagick needed.
 *
 * The mark: a violet→cyan gradient squircle with the VYBE waveform.
 */
import sharp from "sharp";
import { mkdirSync } from "node:fs";

const OUT = "public/icons";
mkdirSync(OUT, { recursive: true });
mkdirSync("public/images", { recursive: true });

const markSvg = (size, radius, padding) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="0.45" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
  <rect width="${size}" height="${size}" rx="${radius}" fill="url(#sheen)"/>
  <g transform="translate(PAD PAD) scale(SCALE)">
    <g fill="#ffffff">
      <rect x="2.6" y="8.2" width="3.4" height="7.6" rx="1.7"/>
      <rect x="8.1" y="4.4" width="3.4" height="15.2" rx="1.7"/>
      <rect x="13.6" y="2.2" width="3.4" height="19.6" rx="1.7"/>
      <rect x="19.1" y="6.8" width="3.4" height="10.4" rx="1.7"/>
    </g>
  </g>
</svg>`;

async function render(svg, outPath) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
  console.log(`✓ ${outPath}`);
}

// All icons are full-bleed: iOS and Android apply their own corner mask, and a
// transparent edge would show as white (iOS) or black (favicons) instead.
const jobs = [
  { name: "icon-192", size: 192, radius: 0, padding: 38 },
  { name: "icon-512", size: 512, radius: 0, padding: 102 },
  { name: "maskable-192", size: 192, radius: 0, padding: 48 },
  { name: "maskable-512", size: 512, radius: 0, padding: 128 },
  { name: "apple-touch-icon", size: 180, radius: 0, padding: 36 },
  { name: "icon-144", size: 144, radius: 0, padding: 29 },
  { name: "icon-384", size: 384, radius: 0, padding: 77 },

  // Vector favicon used by the browser tab.
  { name: "favicon", size: 64, radius: 12, padding: 20, svgOut: "src/app/icon.svg" },
];

for (const job of jobs) {
  const svg = markSvg(job.size, job.radius, job.padding);
  if (job.svgOut) {
    const { writeFileSync } = await import("node:fs");
    writeFileSync(job.svgOut, svg.trim());
    console.log(`✓ ${job.svgOut}`);
    continue;
  }
  await render(svg, `${OUT}/${job.name}.png`);
}

// Social preview card (1200x630)
const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#09090b"/>
      <stop offset="1" stop-color="#141021"/>
    </linearGradient>
    <radialGradient id="glowA" cx="0.18" cy="0.2" r="0.6">
      <stop offset="0" stop-color="#8b5cf6" stop-opacity="0.55"/>
      <stop offset="1" stop-color="#8b5cf6" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowB" cx="0.9" cy="0.1" r="0.55">
      <stop offset="0" stop-color="#22d3ee" stop-opacity="0.4"/>
      <stop offset="1" stop-color="#22d3ee" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="mark" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="0.45" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#06b6d4"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect width="1200" height="630" fill="url(#glowA)"/>
  <rect width="1200" height="630" fill="url(#glowB)"/>

  <g transform="translate(96 128)">
    <rect width="104" height="104" rx="24" fill="url(#mark)"/>
    <g transform="translate(17 17) scale(2.92)" fill="#ffffff">
      <rect x="2.6" y="8.2" width="3.4" height="7.6" rx="1.7"/>
      <rect x="8.1" y="4.4" width="3.4" height="15.2" rx="1.7"/>
      <rect x="13.6" y="2.2" width="3.4" height="19.6" rx="1.7"/>
      <rect x="19.1" y="6.8" width="3.4" height="10.4" rx="1.7"/>
    </g>
    <text x="132" y="40" font-family="Helvetica, Arial, sans-serif" font-size="24" fill="#a3a3b6" letter-spacing="8">PREMIUM MUSIC</text>
    <text x="132" y="92" font-family="Helvetica, Arial, sans-serif" font-size="58" font-weight="bold" fill="#ffffff" letter-spacing="2">VYBE</text>
  </g>

  <text x="96" y="360" font-family="Helvetica, Arial, sans-serif" font-size="56" font-weight="bold" fill="#ffffff">Sound without limits</text>
  <text x="96" y="416" font-family="Helvetica, Arial, sans-serif" font-size="26" fill="#a3a3b6">Millions of legally licensed tracks. No account. Free forever.</text>

  <g transform="translate(96 470)" stroke="#8b5cf6" stroke-width="5" stroke-linecap="round">
    <path d="M0 20 L20 20"/><path d="M44 30 L44 10"/><path d="M66 40 L66 0"/><path d="M88 28 L88 12"/><path d="M110 34 L110 6"/><path d="M132 24 L132 16"/>
  </g>
  <text x="1104" y="560" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#7f7f94">vybe.app</text>
</svg>`;
await render(og, "public/images/og-image.png");
