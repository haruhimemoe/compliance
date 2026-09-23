/**
 * @file tests/text.test.ts
 * @desc Verdicts in plain words: every reason, and the status fallbacks.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { describe, expect, it } from "vitest";
import {
  COMPLIANCE_REASONS,
  DISALLOWED_TEXT,
  OK_TEXT,
  POTENTIAL_TEXT,
  REASON_TEXT,
  verdictText,
} from "../src/index.js";

describe("verdictText", () => {
  it.each(COMPLIANCE_REASONS)("names reason %s", (reason) => {
    expect(verdictText({ status: "disallowed", reason })).toBe(REASON_TEXT[reason]);
  });

  it("falls back by status when there's no reason", () => {
    expect(verdictText({ status: "potential" })).toBe(POTENTIAL_TEXT);
    expect(verdictText({ status: "disallowed" })).toBe(DISALLOWED_TEXT);
    expect(verdictText({ status: "ok" })).toBe(OK_TEXT);
  });
});
