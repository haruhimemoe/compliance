/**
 * @file scripts/smoke.mjs
 * @desc Imports the built package the way Node consumers will (dist/, JSON import attributes)
 *       and checks one verdict per outcome. Run by `bun run test:dist` after a build.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
console.log("smoke: ok");
