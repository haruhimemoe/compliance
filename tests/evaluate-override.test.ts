/**
 * @file tests/evaluate-override.test.ts
 * @desc The override branch (`src/evaluate.ts`) when a per-track override gives a non-ok result
 *       with no `disallowedByRightsholder` reason: potential, or disallowed with no reason. The
 *       real vendored overrides never do this today, so this test injects a fake one through a
 *       mocked `data.js`.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { describe, expect, it, vi } from "vitest";
import type { BeatmapsetFacts } from "../src/types.js";

vi.mock("../src/data.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/data.js")>();
  return {
    ...actual,
    OVERRIDES: [
      {
        artist: "Fake Artist",
        title: "Fake Title",
        resultOverride: "potential",
        failureReasonOverride: null,
      },
    ],
  };
});

const facts = (overrides: Partial<BeatmapsetFacts> = {}): BeatmapsetFacts => ({
  status: "graveyard",
  artist: "Fake Artist",
  title: "Fake Title",
  artistUnicode: "Fake Artist",
  titleUnicode: "Fake Title",
  source: "",
  tags: "",
  trackId: null,
  downloadDisabled: false,
  moreInformation: null,
  ...overrides,
});

describe("override result without disallowedByRightsholder", () => {
  it("keeps the override's status and drops the reason", async () => {
    const { evaluateBeatmapset } = await import("../src/evaluate.js");
    expect(evaluateBeatmapset(facts())).toEqual({ status: "potential" });
  });
});
