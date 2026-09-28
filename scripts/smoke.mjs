/**
 * @file scripts/smoke.mjs
 * @desc Imports the built package the way Node consumers will (dist/, JSON import attributes),
 *       checks one verdict per outcome, that dist/data/LICENSE and dist/index.d.ts exist, and
 *       that every data file listed in docs/vendored-data.md ships with the sha256 recorded
 *       there (so a data refresh with stale hashes fails here). Run by `bun run test:dist`.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Mon Sep 28, 2026
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
// The doc's table lists the files: | `file` | `upstream path` | `sha256` |, each hash on its own
// file's row, so a hash that moved to another file's row fails.
const doc = readFileSync(new URL("../docs/vendored-data.md", import.meta.url), "utf8");
const rows = [...doc.matchAll(/^\| `([^`]+)` \| `[^`]+` \| `([0-9a-f]{64})` \|$/gm)];
assert.ok(rows.length > 0, "docs/vendored-data.md lists no data files");
for (const [, file, hash] of rows) {
  const bytes = readFileSync(new URL(`../dist/data/${file}`, import.meta.url));
  const actual = createHash("sha256").update(bytes).digest("hex");
  assert.equal(actual, hash, `dist/data/${file} differs from the vendored bytes`);
}
console.log("smoke: ok");
