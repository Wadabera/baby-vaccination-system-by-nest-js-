/**
 * Case-sensitivity check for imports, for deploying to Linux hosts.
 *
 * Run from either package:  node ../scripts/check-import-case.cjs .
 *
 * Windows treats `Index.js` and `index.js` as one file; Linux does not. A build
 * that passes locally can therefore fail on Vercel or Render. This resolves every
 * relative import with EXACT-case semantics, so the discrepancy surfaces before
 * a deploy instead of after one.
 *
 * It was written after exactly that failure: src/components/ui/Index.js was
 * re-exported as a barrel, thirteen files imported the directory, and the Vercel
 * build failed on `./components/ui` because no lowercase `index.js` existed. The
 * barrel has since been deleted and those imports now name their module
 * directly, which removes the directory-index resolution step entirely. This
 * check stays so the next rename cannot introduce the same class of failure.
 *
 * Deliberately not a `prebuild` hook: a false positive would block local builds
 * too. Run it when renaming or adding files.
 *
 * Package subpaths are skipped, because they resolve through the package's
 * `exports` map, which a filesystem walk cannot model.
 */
const fs = require("fs");
const path = require("path");

const root = process.argv[2];
const srcRoot = path.join(root, "src");

const EXTS = ["", ".jsx", ".tsx", ".js", ".ts", ".mjs"];
const INDEXES = ["index.jsx", "index.tsx", "index.js", "index.ts"];

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

/** Resolves `spec` from `fromFile` requiring exact case at every step. */
function resolveExact(spec, fromFile) {
  let base;
  if (spec.startsWith(".")) {
    base = path.resolve(path.dirname(fromFile), spec);
  } else {
    // Bare specifier. Only the package ROOT name is checked on disk, and only
    // for case. Deeper subpaths are resolved through the package's `exports`
    // map, which a filesystem walk cannot model -- so they are deliberately
    // skipped rather than reported as false positives.
    const parts = spec.split("/");
    const pkg = spec.startsWith("@") ? parts.slice(0, 2).join("/") : parts[0];

    const nm = path.join(root, "node_modules");
    let entries;
    try {
      entries = fs.readdirSync(nm);
    } catch {
      return { ok: true };
    }

    if (!entries.includes(pkg)) {
      const loose = entries.find((e) => e.toLowerCase() === pkg.toLowerCase());
      if (loose) {
        return { ok: false, reason: "CASE", at: "node_modules", asked: pkg, actual: loose };
      }
    }
    return { ok: true };
  }

  // Walk each segment and require the directory entry to match byte for byte.
  // The final segment may legitimately be written without its extension
  // (`./pages/Home`), so extension-appended candidates are checked too.
  const rel = path.relative(root, base);
  const segments = rel.split(path.sep);
  let walked = root;
  // Tracks the fully-resolved path INCLUDING any extension that was appended,
  // so the file checks below test the name that actually exists on disk.
  let resolved = root;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const isLast = i === segments.length - 1;

    let entries;
    try {
      entries = fs.readdirSync(walked);
    } catch {
      return { ok: false, reason: "unreadable dir", at: path.relative(root, walked) };
    }

    // Candidate spellings, most specific first.
    const candidates = isLast ? [segment, ...EXTS.slice(1).map((e) => segment + e)] : [segment];
    const hit = candidates.find((c) => entries.includes(c));

    if (hit) {
      walked = path.join(walked, hit);
      resolved = walked;
      continue;
    }

    // Not found with exact case. Only a case difference is interesting;
    // anything else is a genuinely absent file and not what this script is for.
    const loose = candidates.find((c) =>
      entries.some((e) => e.toLowerCase() === c.toLowerCase()),
    );
    if (loose) {
      const actual = entries.find((e) => e.toLowerCase() === loose.toLowerCase());
      return {
        ok: false,
        reason: "CASE",
        at: path.relative(root, walked),
        asked: loose,
        actual,
      };
    }

    return { ok: false, reason: "MISSING", at: path.relative(root, walked), asked: segment };
  }

  if (fs.existsSync(resolved) && fs.statSync(resolved).isFile()) return { ok: true };

  // Directory import: look for an index file. `fs.existsSync` must NOT be used
  // here — on Windows it matches case-insensitively, so it would happily accept
  // `Index.js` for a request for `index.js` and report the very problem this
  // script exists to find as fine.
  if (fs.existsSync(resolved) && fs.statSync(resolved).isDirectory()) {
    let entries;
    try {
      entries = fs.readdirSync(resolved);
    } catch {
      return { ok: false, reason: "unreadable dir", at: path.relative(root, resolved) };
    }
    for (const index of INDEXES) {
      if (entries.includes(index)) return { ok: true };
    }
    const loose = INDEXES.find((i) => entries.some((e) => e.toLowerCase() === i.toLowerCase()));
    if (loose) {
      return {
        ok: false,
        reason: "CASE",
        at: path.relative(root, resolved),
        asked: loose,
        actual: entries.find((e) => e.toLowerCase() === loose.toLowerCase()),
      };
    }
  }

  return { ok: false, reason: "NO EXTENSION MATCH", at: rel };
}

const files = walk(srcRoot).filter((f) => /\.(jsx?|tsx?)$/.test(f));
const problems = [];
let checked = 0;

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const specs = new Set();
  // Both quote styles: the backend is written with single quotes throughout,
  // and a double-quote-only pattern would have silently reported it as clean.
  for (const m of text.matchAll(/from\s+["']([^"']+)["']/g)) specs.add(m[1]);
  for (const m of text.matchAll(/import\s+["']([^"']+)["']/g)) specs.add(m[1]);
  for (const m of text.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);

  for (const spec of specs) {
    checked++;
    const res = resolveExact(spec, file);
    if (res.ok) continue;
    problems.push(
      `${res.reason.padEnd(18)} ${path.relative(root, file).padEnd(46)} -> ${spec}` +
        (res.asked ? `\n${" ".repeat(20)}wanted '${res.asked}' but disk has '${res.actual}' in ${res.at}` : ""),
    );
  }
}

console.log(`checked ${checked} imports across ${files.length} files`);
if (problems.length === 0) {
  console.log("OK - every import resolves with exact case (Linux safe)");
} else {
  console.log(`\n${problems.length} problem(s):\n`);
  for (const p of problems) console.log("  " + p);
}
