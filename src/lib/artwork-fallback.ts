/**
 * Deterministic SVG artwork generator used when a source has no cover image.
 * It is generated client- and server-side with no external request, so cards
 * always look intentional instead of showing a broken image.
 */
export function artworkPlaceholder(seed: string, size = 600): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hash % 360;
  const hue2 = (hue + 48) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 72% 46%)"/>
      <stop offset="1" stop-color="hsl(${hue2} 78% 30%)"/>
    </linearGradient>
    <radialGradient id="r" cx="30%" cy="24%" r="80%">
      <stop offset="0" stop-color="rgba(255,255,255,.35)"/>
      <stop offset="1" stop-color="rgba(255,255,255,0)"/>
    </radialGradient>
  </defs>
  <rect width="600" height="600" fill="url(#g)"/>
  <rect width="600" height="600" fill="url(#r)"/>
  <g fill="none" stroke="rgba(255,255,255,.28)" stroke-width="2">
    <circle cx="300" cy="300" r="196"/>
    <circle cx="300" cy="300" r="140"/>
    <circle cx="300" cy="300" r="86"/>
  </g>
  <circle cx="300" cy="300" r="34" fill="rgba(255,255,255,.9)"/>
  <circle cx="300" cy="300" r="10" fill="hsl(${hue} 60% 22%)"/>
</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
