/**
 * Generates the eight curated-mix cover artworks in public/images.
 * Each mix gets a distinct two-stop gradient, a soft radial glow and a
 * generative-looking equalizer/arc motif, so the grid reads as designed
 * artwork rather than placeholder tiles.
 *
 * Run `npm run icons` (same pipeline) after adding a mix to services/curated.ts.
 * Output is plain SVG — tiny, crisp at any size, and cacheable by the SW.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "public/images";
mkdirSync(OUT, { recursive: true });

/** Deterministic pseudo-random so re-runs produce identical files. */
function rng(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const MIX_ART = [
  {
    file: "mix-late-night.svg",
    from: "#2a1a5e",
    to: "#0b0620",
    glow: "#7c3aed",
    motif: "bars",
    seed: 11,
  },
  {
    file: "mix-focus.svg",
    from: "#0c3b4d",
    to: "#04161f",
    glow: "#22d3ee",
    motif: "orbit",
    seed: 23,
  },
  {
    file: "mix-sunday.svg",
    from: "#5a3a12",
    to: "#1c1206",
    glow: "#f59e0b",
    motif: "sun",
    seed: 37,
  },
  {
    file: "mix-after-hours.svg",
    from: "#122a55",
    to: "#050b18",
    glow: "#3b82f6",
    motif: "bars",
    seed: 41,
  },
  {
    file: "mix-archive.svg",
    from: "#4d1030",
    to: "#180410",
    glow: "#ec4899",
    motif: "grooves",
    seed: 53,
  },
  {
    file: "mix-indie.svg",
    from: "#12401f",
    to: "#04130a",
    glow: "#22c55e",
    motif: "orbit",
    seed: 67,
  },
  {
    file: "mix-cinematic.svg",
    from: "#3a1361",
    to: "#0e0420",
    glow: "#a855f7",
    motif: "beam",
    seed: 79,
  },
  {
    file: "mix-global.svg",
    from: "#0b463f",
    to: "#031715",
    glow: "#14b8a6",
    motif: "wave",
    seed: 97,
  },
];

const W = 600;
const H = 600;

function bars(rand, color) {
  const count = 26;
  const gap = W / count;
  let out = `<g opacity="0.9">`;
  for (let i = 0; i < count; i += 1) {
    const h = 60 + rand() * 300;
    const x = i * gap + gap * 0.22;
    const w = gap * 0.56;
    out += `<rect x="${x.toFixed(1)}" y="${((H - h) / 2).toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(
      1,
    )}" rx="${(w / 2).toFixed(1)}" fill="${color}" opacity="${(0.35 + rand() * 0.5).toFixed(2)}"/>`;
  }
  return `${out}</g>`;
}

function orbit(rand, color) {
  let out = `<g fill="none" stroke="${color}" opacity="0.55">`;
  for (let i = 0; i < 7; i += 1) {
    const r = 70 + i * 36 + rand() * 22;
    out += `<circle cx="${W / 2}" cy="${H / 2}" r="${r.toFixed(1)}" stroke-width="${(1 + rand() * 1.6).toFixed(
      2,
    )}" opacity="${(0.2 + rand() * 0.6).toFixed(2)}"/>`;
  }
  out += `</g><circle cx="${W / 2}" cy="${H / 2}" r="46" fill="${color}" opacity="0.85"/>`;
  return out;
}

function sun(rand, color) {
  let out = `<g opacity="0.75">`;
  for (let i = 0; i < 9; i += 1) {
    const y = 300 + i * 26;
    out += `<rect x="0" y="${y}" width="${W}" height="${(2 + i * 0.9).toFixed(1)}" fill="${color}" opacity="${(
      0.5 -
      i * 0.045
    ).toFixed(2)}"/>`;
  }
  out += `</g><circle cx="${W / 2}" cy="330" r="150" fill="${color}" opacity="0.28"/>`;
  out += `<circle cx="${W / 2}" cy="330" r="150" fill="none" stroke="${color}" stroke-width="2" opacity="0.6"/>`;
  return out;
}

function grooves(rand, color) {
  let out = `<g fill="none" stroke="${color}" opacity="0.5">`;
  for (let i = 0; i < 22; i += 1) {
    const r = 40 + i * 12;
    out += `<circle cx="${W / 2}" cy="${H / 2}" r="${r}" stroke-width="1" opacity="${(
      0.12 +
      rand() * 0.4
    ).toFixed(2)}"/>`;
  }
  out += `</g><circle cx="${W / 2}" cy="${H / 2}" r="34" fill="${color}" opacity="0.9"/>`;
  out += `<circle cx="${W / 2}" cy="${H / 2}" r="150" fill="none" stroke="${color}" stroke-width="2.5" opacity="0.35" stroke-dasharray="4 10"/>`;
  return out;
}

function beam(rand, color) {
  let out = `<g opacity="0.7">`;
  for (let i = 0; i < 6; i += 1) {
    const x = -120 + i * 150 + rand() * 40;
    out += `<polygon points="${x},0 ${x + 120},0 ${x + 260},${H} ${x + 40},${H}" fill="${color}" opacity="${(
      0.05 +
      rand() * 0.12
    ).toFixed(3)}"/>`;
  }
  out += `</g><circle cx="${W / 2}" cy="${H / 2}" r="150" fill="${color}" opacity="0.12"/>`;
  out += `<circle cx="${W / 2}" cy="${H / 2}" r="150" fill="none" stroke="${color}" stroke-width="2" opacity="0.7"/>`;
  out += `<circle cx="${W / 2}" cy="${H / 2}" r="98" fill="none" stroke="${color}" stroke-width="1.2" opacity="0.5"/>`;
  out += `<circle cx="${W / 2}" cy="${H / 2}" r="46" fill="${color}" opacity="0.85"/>`;
  return out;
}

function wave(rand, color) {
  let out = `<g fill="none" stroke="${color}" stroke-linecap="round">`;
  for (let i = 0; i < 5; i += 1) {
    const amp = 40 + i * 26 + rand() * 20;
    const yBase = 190 + i * 56;
    let d = `M0 ${yBase}`;
    for (let x = 0; x <= W; x += 30) {
      d += ` Q ${x + 15} ${(yBase + Math.sin((x + i * 40) / 60) * amp * 0.5).toFixed(1)} ${x + 30} ${yBase}`;
    }
    out += `<path d="${d}" stroke-width="${(1.4 + i * 0.4).toFixed(1)}" opacity="${(0.18 + i * 0.1).toFixed(2)}"/>`;
  }
  return `${out}</g>`;
}

const motifs = { bars, orbit, sun, grooves, beam, wave };

for (const art of MIX_ART) {
  const rand = rng(art.seed);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${art.from}"/>
      <stop offset="1" stop-color="${art.to}"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.62">
      <stop offset="0" stop-color="${art.glow}" stop-opacity="0.55"/>
      <stop offset="1" stop-color="${art.glow}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="vig" cx="0.5" cy="0.5" r="0.75">
      <stop offset="0.55" stop-color="#000000" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.45"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  ${motifs[art.motif](rand, art.glow)}
  <rect width="${W}" height="${H}" fill="url(#vig)"/>
</svg>`;

  writeFileSync(`${OUT}/${art.file}`, svg);
  console.log(`✓ ${OUT}/${art.file}`);
}
