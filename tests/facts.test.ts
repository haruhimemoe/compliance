/**
 * @file tests/facts.test.ts
 * @desc osu! API v2 beatmapset (BeatmapsetExtended) → BeatmapsetFacts, against a recorded
 *       /api/v2/beatmaps row.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { describe, expect, it } from "vitest";
import { evaluateBeatmapset, factsFromOsuBeatmapset, type OsuBeatmapset } from "../src/index.js";
import fixture from "./fixtures/osu-beatmaps.json" with { type: "json" };

const set = (): OsuBeatmapset => {
  const row = fixture.beatmaps[0];
  if (!row) throw new Error("fixture has no rows");
  return row.beatmapset;
};

describe("factsFromOsuBeatmapset", () => {
  it("maps the recorded row's beatmapset", () => {
    expect(factsFromOsuBeatmapset(set())).toEqual({
      setId: 1,
      status: "ranked",
      artist: "Kenji Ninuma",
      title: "DISCOPRINCE",
      artistUnicode: "Kenji Ninuma",
      titleUnicode: "DISCOPRINCE",
      source: "",
      tags: "katamari",
      trackId: null,
      downloadDisabled: false,
      moreInformation: null,
    });
  });

  it("feeds evaluateBeatmapset", () => {
    const facts = factsFromOsuBeatmapset(set());
    expect(facts && evaluateBeatmapset(facts)).toEqual({ status: "ok" });
  });

  it("falls back to the romanized fields and empty strings", () => {
    const facts = factsFromOsuBeatmapset({
      ...set(),
      artist_unicode: null,
      title_unicode: undefined,
      source: null,
      tags: null,
    });
    expect(facts).toMatchObject({
      artistUnicode: "Kenji Ninuma",
      titleUnicode: "DISCOPRINCE",
      source: "",
      tags: "",
    });
  });

  it("reads an absent more_information as no notice, not a DMCA", () => {
    const facts = factsFromOsuBeatmapset({
      ...set(),
      availability: { download_disabled: false },
    });
    expect(facts?.moreInformation).toBeNull();
  });

  it("keeps a notice and a Featured Artist track id", () => {
    const facts = factsFromOsuBeatmapset({
      ...set(),
      track_id: 42,
      availability: { download_disabled: true, more_information: "https://example.com/dmca" },
    });
    expect(facts).toMatchObject({
      trackId: 42,
      downloadDisabled: true,
      moreInformation: "https://example.com/dmca",
    });
  });

  it.each([
    ["availability", { availability: undefined }],
    ["track_id", { track_id: undefined }],
    ["tags", { tags: undefined }],
  ])("returns null when %s is absent", (_, missing) => {
    expect(factsFromOsuBeatmapset({ ...set(), ...missing })).toBeNull();
  });

  it("ignores fields it doesn't use", () => {
    const facts = factsFromOsuBeatmapset({ ...set(), ...{ covers: {}, bpm: 180 } });
    expect(facts).not.toHaveProperty("covers");
  });
});
