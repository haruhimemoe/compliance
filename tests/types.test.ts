/**
 * @file tests/types.test.ts
 * @desc Consumer typing, checked by `bun run typecheck` (this repo compiles with
 *       exactOptionalPropertyTypes on): optional fields accept an explicit undefined, and
 *       OsuBeatmapset accepts the nulls typed osu! clients use.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { expect, it } from "vitest";
import {
  type ComplianceReason,
  type ComplianceVerdict,
  factsFromOsuBeatmapset,
  type OsuBeatmapset,
  verdictText,
} from "../src/index.js";

it("takes a reason that may be undefined", () => {
  const reason: ComplianceReason | undefined = undefined;
  const notes: string | undefined = undefined;
  const verdict: ComplianceVerdict = { status: "ok", reason, notes };
  expect(verdictText({ status: verdict.status, reason })).toBe("Allowed");
});

it("takes an availability of null from typed osu! clients", () => {
  const set: OsuBeatmapset = {
    id: 1,
    status: "ranked",
    artist: "a",
    title: "t",
    availability: null,
  };
  expect(factsFromOsuBeatmapset(set)).toBeNull();
});
