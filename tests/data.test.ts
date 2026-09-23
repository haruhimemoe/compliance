/**
 * @file tests/data.test.ts
 * @desc The data checks at import: the shipped lists parse, and a malformed re-vendor throws with
 *       the file's name instead of producing wrong verdicts.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { describe, expect, it } from "vitest";
import {
  ARTISTS,
  BANNED_SOURCES,
  LABEL_TRACKS,
  OVERRIDES,
  parseArtists,
  parseLabel,
  parseOverrides,
  parseSources,
} from "../src/data.js";

describe("shipped data", () => {
  it("parses every list", () => {
    expect(ARTISTS.size).toBeGreaterThan(0);
    expect(OVERRIDES.length).toBeGreaterThan(0);
    expect(BANNED_SOURCES.length).toBeGreaterThan(0);
    expect(LABEL_TRACKS.length).toBeGreaterThan(0);
  });

  it("NFKC-normalizes names", () => {
    expect(parseSources(["ＤＪＭＡＸ"])).toEqual(["DJMAX"]);
    expect(parseArtists({ Ｉｇｏｒｒｒ: { status: "disallowed" } }).has("Igorrr")).toBe(true);
  });

  it("reads missing and empty notes as none", () => {
    const rules = parseArtists({
      A: { status: "potential" },
      B: { status: "potential", notes: "" },
    });
    expect(rules.get("A")?.notes).toBeNull();
    expect(rules.get("B")?.notes).toBeNull();
  });
});

describe("malformed data", () => {
  it.each([
    ["not an object", []],
    ["an unknown status", { A: { status: "banned" } }],
    ["notes that aren't text", { A: { status: "potential", notes: 1 } }],
  ])("artists: rejects %s", (_, raw) => {
    expect(() => parseArtists(raw)).toThrow("artists/restricted.json");
  });

  it.each([
    ["not an array", {}],
    ["an empty artist", [{ artist: "", title: "t", resultOverride: "ok" }]],
    ["an unknown result", [{ artist: "a", title: "t", resultOverride: "maybe" }]],
    [
      "a reason that isn't text",
      [{ artist: "a", title: "t", resultOverride: "ok", failureReasonOverride: 1 }],
    ],
  ])("overrides: rejects %s", (_, raw) => {
    expect(() => parseOverrides(raw)).toThrow("overrides/edge-cases.json");
  });

  it.each([
    ["not an array", "DJMAX"],
    ["an empty name", ["DJMAX", ""]],
    ["a non-string", ["DJMAX", 1]],
  ])("sources: rejects %s", (_, raw) => {
    expect(() => parseSources(raw)).toThrow("sources/banned.json");
  });

  it.each([
    ["not an object", ["x"]],
    ["tracks that aren't a list of names", { lapix: "Cave of Points" }],
  ])("label: rejects %s", (_, raw) => {
    expect(() => parseLabel(raw)).toThrow("labels/MEGAREX.json");
  });
});
