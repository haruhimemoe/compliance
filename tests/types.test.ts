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
  type BeatmapsetFacts,
  COMPLIANCE_REASONS,
  COMPLIANCE_STATUSES,
  type ComplianceReason,
  type ComplianceVerdict,
  evaluateBeatmapset,
  factsFromOsuBeatmapset,
  type OsuBeatmapset,
  verdictText,
} from "../src/index.js";

it("setId is optional; the rules don't read it", () => {
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
  expect(evaluateBeatmapset(facts)).toEqual({ status: "ok" });
});

it("COMPLIANCE_STATUSES and COMPLIANCE_REASONS are frozen", () => {
  expect(Object.isFrozen(COMPLIANCE_STATUSES)).toBe(true);
  expect(Object.isFrozen(COMPLIANCE_REASONS)).toBe(true);
});

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
