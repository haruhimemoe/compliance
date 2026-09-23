/**
 * @file scripts/check-consumer.mjs
 * @desc Installs the packed package into a throwaway project, then typechecks a consumer strictly
 *       (no skipLibCheck, so a broken .d.ts can't hide as `any`) and runs it. No peer dependencies
 *       here, so there's no version matrix: usage is `node scripts/check-consumer.mjs` (after
 *       `bun run build`). Needs the npm registry.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)));
const dir = mkdtempSync(path.join(tmpdir(), "compliance-consumer-"));
const run = (command, args, cwd = dir) =>
  execFileSync(command, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });

try {
  const tarball = run("npm", ["pack", "--silent", "--pack-destination", dir], root).trim();
  writeFileSync(path.join(dir, "package.json"), JSON.stringify({ type: "module", private: true }));
  run("npm", ["install", "--silent", "--no-audit", "--no-fund", path.join(dir, tarball)]);
  writeFileSync(
    path.join(dir, "tsconfig.json"),
    JSON.stringify({
      compilerOptions: {
        strict: true,
        exactOptionalPropertyTypes: true,
        noEmit: true,
        skipLibCheck: false,
        module: "nodenext",
        moduleResolution: "nodenext",
        target: "ES2023",
        lib: ["ES2023", "DOM"],
        types: [],
      },
      files: ["consumer.ts"],
    }),
  );
  writeFileSync(
    path.join(dir, "consumer.ts"),
    `import {
  type BeatmapsetFacts,
  type ComplianceReason,
  evaluateBeatmapset,
  factsFromOsuBeatmapset,
  type OsuBeatmapset,
  verdictText,
} from "@haruhimemoe/compliance";

// setId is optional; the rules don't read it.
const facts: BeatmapsetFacts = {
  status: "ranked",
  artist: "a",
  title: "t",
  artistUnicode: "a",
  titleUnicode: "t",
  source: "",
  tags: "",
  trackId: null,
  downloadDisabled: false,
  moreInformation: null,
};
const verdict = evaluateBeatmapset(facts);
if (verdict.status !== "ok") throw new Error("expected ok");
// @ts-expect-error an unknown reason must not typecheck (it would if types were any)
const bad: ComplianceReason = "nonsense";

const set: OsuBeatmapset = {
  id: 1,
  status: "ranked",
  artist: "a",
  title: "t",
  availability: null,
};
if (factsFromOsuBeatmapset(set) !== null) throw new Error("expected null for a compact set");
if (verdictText({ status: "ok" }) !== "Allowed") throw new Error("verdictText");
void bad;
console.log("consumer: ok");
`,
  );
  run(path.join(root, "node_modules", ".bin", "tsc"), ["-p", dir]);
  run(process.execPath, ["--experimental-strip-types", "--no-warnings", "consumer.ts"]);
  console.log("consumer: ok");
} catch (error) {
  console.error(`consumer: FAILED\n${error.stdout ?? ""}${error.stderr ?? error.message}`);
  process.exitCode = 1;
} finally {
  rmSync(dir, { recursive: true, force: true });
}
