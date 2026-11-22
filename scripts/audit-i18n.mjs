/**
 * i18n audit: compares every t("key") used in src/ against the message catalogues.
 *
 * Fails (exit 1) when a key is used but missing from en.ts, or present in en.ts
 * but missing from another locale. Run via `npm run i18n:audit` in CI.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = "src";
const LOCALES_DIR = "src/i18n/locales";

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

function flatten(obj, prefix = "", out = new Map()) {
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object") flatten(value, path, out);
    else out.set(path, String(value));
  }
  return out;
}

async function loadLocale(code) {
  const file = `${LOCALES_DIR}/${code}.ts`;
  const mod = await import(`file://${process.cwd()}/${file}?t=${Date.now()}`);
  const dict = mod.default ?? mod[code];
  return flatten(dict);
}

const codes = readdirSync(LOCALES_DIR)
  .filter((f) => f.endsWith(".ts"))
  .map((f) => f.replace(/\.ts$/, ""));

const en = await loadLocale("en");

// Collect used keys: t("a.b"), t('a.b'), and t(`a.b`)
const used = new Map(); // key -> [files]
const CALL_RE = /\bt\(\s*["'`]([A-Za-z0-9_.-]+)["'`]/g;
const KEY_PROP_RE = /(?:titleKey|labelKey|descriptionKey|messageKey)\s*:\s*["'`]([A-Za-z0-9_.-]+)["'`]/g;

for (const file of walk(SRC)) {
  if (file.includes("/i18n/locales/")) continue;
  const text = readFileSync(file, "utf8");
  for (const re of [CALL_RE, KEY_PROP_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text))) {
      const key = m[1];
      if (!used.has(key)) used.set(key, new Set());
      used.get(key).add(file.replace(/^src\//, ""));
    }
  }
}

// Dynamic key construction (t(`library.${x}`)) can't be statically resolved;
// report the prefixes so they can be eyeballed.
const dynamicPrefixes = new Set();
for (const file of walk(SRC)) {
  if (file.includes("/i18n/locales/")) continue;
  const text = readFileSync(file, "utf8");
  const re = /t\(\s*`([A-Za-z0-9_.]+)\$\{/g;
  let m;
  while ((m = re.exec(text))) dynamicPrefixes.add(m[1]);
}

const missingInEn = [...used.keys()].filter((k) => !en.has(k)).sort();
const otherLocales = codes.filter((c) => c !== "en");
const localeMaps = {};
for (const code of otherLocales) localeMaps[code] = await loadLocale(code);

const missingPerLocale = {};
for (const code of otherLocales) {
  const map = localeMaps[code];
  const missing = [...en.keys()].filter((k) => !map.has(k)).sort();
  if (missing.length) missingPerLocale[code] = missing;
}

const unused = [...en.keys()].filter((k) => !used.has(k)).sort();

console.log(`Locales: ${codes.join(", ")}`);
console.log(`Keys in en.ts: ${en.size}`);
console.log(`Keys used in src: ${used.size}`);
if (dynamicPrefixes.size) console.log(`Dynamic prefixes: ${[...dynamicPrefixes].join(", ")}`);
console.log("");

if (missingInEn.length) {
  console.log(`❌ Missing from en.ts (${missingInEn.length}):`);
  for (const key of missingInEn) console.log(`   ${key}   ← ${[...used.get(key)].join(", ")}`);
  console.log("");
}

for (const [code, keys] of Object.entries(missingPerLocale)) {
  console.log(`❌ ${code}.ts missing ${keys.length} keys:`);
  console.log(`   ${keys.slice(0, 40).join("\n   ")}${keys.length > 40 ? `\n   … +${keys.length - 40} more` : ""}`);
  console.log("");
}

if (unused.length) {
  console.log(`ℹ️  Defined but unused (${unused.length}): ${unused.slice(0, 25).join(", ")}${unused.length > 25 ? " …" : ""}`);
}

const ok = missingInEn.length === 0 && Object.keys(missingPerLocale).length === 0;
console.log(ok ? "\n✅ i18n OK" : "\n❌ i18n FAILED");
process.exit(ok ? 0 : 1);
