import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();
const AGENTS = "AGENTS.md";
// The shared contract is referenced by version, never copied. The version itself is
// checked by hipdiscovery/Claude-Instructions/shared/check-contract.mjs.
const CONTRACT_REF = /^Shared contract: hipdiscovery\/Claude-Instructions\/shared\/AGENT-CONTRACT\.md @ \d{4}-\d{2}-\d{2}$/m;
const LOCAL_COPY = "docs/agent-guides/agent-contract.md";
const FORBIDDEN_FILES = new Set(["CLAUDE.md", "CODEX.md", "CHATGPT.md"]);
const FORBIDDEN_DIRS = new Set([".claude", ".codex", ".agents"]);
const SKIP_DIRS = new Set([".git", "node_modules", ".wrangler", "coverage", "dist", "build", ".build"]);
const problems = [];

function logicalLines(text) {
  if (!text) return 0;
  const lines = text.split(/\r?\n/);
  return lines.length - (/\r?\n$/.test(text) ? 1 : 0);
}

if (!existsSync(join(ROOT, AGENTS))) {
  problems.push("missing root AGENTS.md");
} else {
  const data = readFileSync(join(ROOT, AGENTS));
  const text = data.toString("utf8");
  const lines = logicalLines(text);
  if (data.length > 12_288 || lines > 200) problems.push(`AGENTS.md exceeds hard ceiling (${data.length} bytes, ${lines} lines)`);
  if (!CONTRACT_REF.test(text)) problems.push("AGENTS.md must end with the versioned shared-contract reference line");
  if (!/master/i.test(text)) problems.push("AGENTS.md must state master-only repository policy");
  if (!/GitHub Actions/i.test(text)) problems.push("AGENTS.md must state the no-GitHub-Actions policy");
}

if (existsSync(join(ROOT, LOCAL_COPY))) problems.push(`${LOCAL_COPY} must not exist: reference the shared contract instead of copying it`);

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    const rel = relative(ROOT, path).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      if (FORBIDDEN_DIRS.has(entry.name)) problems.push(`forbidden agent directory: ${rel}`);
      if (rel === ".github/workflows") {
        const files = readdirSync(path, { withFileTypes: true }).filter(item => item.isFile());
        if (files.length) problems.push(`GitHub Actions workflows are forbidden (${files.map(item => item.name).join(", ")})`);
        continue;
      }
      walk(path);
      continue;
    }
    if (!entry.isFile()) continue;
    if (FORBIDDEN_FILES.has(entry.name)) problems.push(`forbidden agent mirror: ${rel}`);
    if (entry.name === AGENTS && rel !== AGENTS) problems.push(`nested agent contract is not allowed: ${rel}`);
  }
}

walk(ROOT);

if (problems.length) {
  console.error("Agent policy violation:\n" + problems.map(item => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("Agent policy OK: root AGENTS.md, versioned shared-contract reference, no vendor mirrors/Actions, size policy present.");
