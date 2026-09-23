/**
 * @file scripts/smoke.mjs
 * @desc Imports the built package the way Node consumers will (dist/, JSON import attributes)
 *       and checks one verdict per outcome. Run by `bun run test:dist` after a build.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { evaluateBeatmapset } from "../dist/index.js";

const facts = (overrides) => ({
  setId: 1,
  status: "graveyard",
  artist: "Test Artist",
  title: "Test Title",
  artistUnicode: "Test Artist",
  titleUnicode: "Test Title",
  source: "",
  tags: "",
  trackId: null,
  downloadDisabled: false,
  moreInformation: null,
  ...overrides,
});

assert.deepEqual(evaluateBeatmapset(facts({})), { status: "ok" });
assert.equal(
  evaluateBeatmapset(facts({ artist: "Igorrr", artistUnicode: "Igorrr" })).reason,
  "artist",
);
assert.equal(
  evaluateBeatmapset(facts({ artist: "Yuyoyuppe", artistUnicode: "Yuyoyuppe" })).status,
  "potential",
);
assert.ok(
  existsSync(new URL("../dist/data/LICENSE", import.meta.url)),
  "dist/data/LICENSE missing",
);
assert.ok(existsSync(new URL("../dist/index.d.ts", import.meta.url)), "dist/index.d.ts missing");
// The shipped data must be the vendored bytes, so the hashes in docs/vendored-data.md hold.
// Match the file's own row, not the whole doc, so a hash that moved to another file's row fails.
const doc = readFileSync(new URL("../docs/vendored-data.md", import.meta.url), "utf8");
for (const file of [
  "artists/restricted.json",
  "labels/MEGAREX.json",
  "overrides/edge-cases.json",
  "sources/banned.json",
  "LICENSE",
]) {
  const bytes = readFileSync(new URL(`../dist/data/${file}`, import.meta.url));
  const hash = createHash("sha256").update(bytes).digest("hex");
  const row = doc.split("\n").find((line) => line.startsWith(`| \`${file}\` |`));
  assert.ok(row?.includes(`\`${hash}\``), `dist/data/${file} differs from the vendored bytes`);
}
console.log("smoke: ok");
