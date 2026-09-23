/**
 * @file tests/evaluate.test.ts
 * @desc The omc-api rule port: each rule, the rule order conflicts (DMCA beats Ranked, FA beats a
 *       restricted artist, fa_only without a track id), whole-word matching, NFKC and case folding.
 *       Cases mirror upstream's src/test/validator.test.ts against the vendored data.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { describe, expect, it } from "vitest";
import { type BeatmapsetFacts, evaluateBeatmapset } from "../src/index.js";

const facts = (overrides: Partial<BeatmapsetFacts> = {}): BeatmapsetFacts => {
  const base: BeatmapsetFacts = {
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
  };
  const merged = { ...base, ...overrides };
  // Like the upstream helpers: setting artist/title sets the unicode field too unless given.
  return {
    ...merged,
    artistUnicode: overrides.artistUnicode ?? merged.artist,
    titleUnicode: overrides.titleUnicode ?? merged.title,
  };
};

const verdict = (overrides: Partial<BeatmapsetFacts>) => evaluateBeatmapset(facts(overrides));

describe("evaluateBeatmapset", () => {
  it("passes an ordinary graveyard map", () => {
    expect(verdict({})).toEqual({ status: "ok" });
  });

  describe("rule 1: DMCA", () => {
    it("flags download_disabled", () => {
      expect(verdict({ downloadDisabled: true })).toEqual({ status: "disallowed", reason: "dmca" });
    });
    it("flags a content notice (more_information)", () => {
      expect(verdict({ moreInformation: "https://example.com/notice" })).toEqual({
        status: "disallowed",
        reason: "dmca",
      });
    });
    it("beats Ranked", () => {
      expect(verdict({ status: "ranked", downloadDisabled: true }).reason).toBe("dmca");
    });
    it("beats a Featured Artist track and an ok override", () => {
      expect(verdict({ trackId: 99, downloadDisabled: true }).reason).toBe("dmca");
      expect(
        verdict({
          artist: "Morimori Atsushi",
          title: "Tits or get the fuck out!!",
          moreInformation: "notice",
        }).reason,
      ).toBe("dmca");
    });
  });

  describe("rule 2: overrides", () => {
    it("allows the listed Morimori Atsushi track despite fa_only (case-insensitive)", () => {
      expect(verdict({ artist: "Morimori Atsushi", title: "TITS OR GET THE FUCK OUT!!" })).toEqual({
        status: "ok",
      });
    });
    it("matches an override title contained in a longer title", () => {
      expect(
        verdict({ artist: "Lusumi", title: "Something /execution_program.wav Something" }),
      ).toEqual({
        status: "disallowed",
        reason: "rightsholder",
      });
    });
    it("needs the artist to match exactly", () => {
      expect(verdict({ artist: "Lusumi feat. X", title: "execution_program" })).toEqual({
        status: "ok",
      });
      expect(verdict({ artist: "Lusumi", title: "Different Title" })).toEqual({ status: "ok" });
    });
    it("beats Ranked", () => {
      expect(
        verdict({ artist: "Lusumi", title: "execution_program", status: "ranked" }).reason,
      ).toBe("rightsholder");
    });
    it("matches on the unicode fields", () => {
      expect(
        verdict({
          artist: "different",
          title: "different",
          artistUnicode: "Morimori Atsushi",
          titleUnicode: "Tits or get the fuck out!!",
        }),
      ).toEqual({ status: "ok" });
    });
  });

  describe("rule 3: Featured Artist tracks", () => {
    it("allows a licensed track from a disallowed artist", () => {
      expect(verdict({ artist: "Igorrr", trackId: 1234 })).toEqual({ status: "ok" });
    });
    it("allows a licensed track from an fa_only artist, even named in the title", () => {
      expect(verdict({ title: "Song Name (Akira Complex Remix)", trackId: 1234 })).toEqual({
        status: "ok",
      });
    });
    it("allows a licensed MEGAREX track and a licensed banned source", () => {
      expect(verdict({ artist: "lapix", title: "Cave of Points", trackId: 1234 })).toEqual({
        status: "ok",
      });
      expect(verdict({ source: "DJMAX RESPECT", trackId: 5 })).toEqual({ status: "ok" });
    });
    it.each([0, -1])("treats track id %s as unlicensed", (trackId) => {
      expect(verdict({ artist: "Igorrr", trackId }).status).toBe("disallowed");
    });
  });

  describe("rule 4: Ranked, Approved, Loved", () => {
    it.each(["ranked", "approved", "loved"])("allows %s maps from restricted artists", (status) => {
      expect(verdict({ artist: "Igorrr", status })).toEqual({ status: "ok" });
      expect(verdict({ artist: "lapix", title: "Cave of Points", status })).toEqual({
        status: "ok",
      });
    });
    it.each(["graveyard", "wip", "pending", "qualified"])("does not allow %s maps", (status) => {
      expect(verdict({ artist: "lapix", title: "Cave of Points", status }).status).toBe(
        "disallowed",
      );
    });
  });

  describe("rule 5: banned sources", () => {
    it.each(["some,djmax,tag", "megarex,neowiz", "djmax,megarex,neowiz", "dj max"])(
      "flags tags %j (a comma-separated element equal to a banned name, lowercased)",
      (tags) => {
        expect(verdict({ tags })).toEqual({ status: "disallowed", reason: "source" });
      },
    );
    // Upstream's rule exactly, so we agree with the Tournament Committee's tool: tags split on ","
    // only, and compared as sent (not lowercased, trimmed or NFKC-normalized).
    it.each([
      "rhythm,game,original",
      "",
      "djmaxx remix",
      "djmax respect v",
      "DJMAX",
      "some, djmax",
      "ｄｊｍａｘ",
    ])("passes tags %j, as upstream does", (tags) => {
      expect(verdict({ tags })).toEqual({ status: "ok" });
    });
    it.each(["MEGAREX", "DJMAX RESPECT", "DJ Max Portable 3", "Neowiz", "ｄｊｍａｘ"])(
      "flags source %j (substring, case- and width-insensitive)",
      (source) => {
        expect(verdict({ source })).toEqual({ status: "disallowed", reason: "source" });
      },
    );
    it("passes an unrelated source", () => {
      expect(verdict({ source: "Touhou" })).toEqual({ status: "ok" });
    });
    it("comes before the artist rules", () => {
      expect(verdict({ artist: "Igorrr", source: "DJMAX" }).reason).toBe("source");
    });
  });

  describe("rule 6: label tracks (MEGAREX)", () => {
    it.each([
      ["lapix", "Cave of Points"],
      ["LAPIX", "Cave of Points"],
      ["lapix", "CAVE OF POINTS"],
      ["lapix", "NEO GRAVITY (Extended)"],
      ["Camellia", "What Is Hitech?"],
      ["lapix & Camellia", "Dead Music"],
      ["lapix", "Flying Castle"],
      ["lapix", "Flying Castle (Extended Mix)"],
    ])("flags %s - %s", (artist, title) => {
      expect(verdict({ artist, title })).toEqual({ status: "disallowed", reason: "rightsholder" });
    });
    it.each([
      ["Different Artist", "Flying Castle"],
      ["Some Artist", "Beachy Saturday"],
      ["xi", "FREEDOM DiVE"],
    ])("passes %s - %s", (artist, title) => {
      expect(verdict({ artist, title })).toEqual({ status: "ok" });
    });
    it("matches on the unicode fields", () => {
      expect(
        verdict({
          artist: "different",
          title: "different",
          artistUnicode: "lapix",
          titleUnicode: "Cave of Points",
        }),
      ).toEqual({ status: "disallowed", reason: "rightsholder" });
    });
  });

  describe("rule 7: restricted artists", () => {
    it("flags an fa_only artist's unlicensed track", () => {
      expect(verdict({ artist: "Akira Complex", title: "Some Song" })).toEqual({
        status: "disallowed",
        reason: "fa_only",
      });
    });
    it("flags an fa_only artist in a collab", () => {
      expect(verdict({ artist: "uma vs. Morimori Atsushi" }).reason).toBe("fa_only");
    });
    it("flags an fa_only artist named in the title", () => {
      expect(verdict({ title: "Song Name (Akira Complex Remix)" }).reason).toBe("fa_only");
    });
    it("flags a disallowed artist, in any case, with or without spaces", () => {
      for (const artist of ["Igorrr", "IgOrRr", "Hatsuki Yura"]) {
        expect(verdict({ artist })).toEqual({ status: "disallowed", reason: "artist" });
      }
    });
    it("flags a disallowed artist named in the title", () => {
      expect(verdict({ title: "Amazing Track (feat. Igorrr)" }).reason).toBe("artist");
    });
    it("marks a potential artist with its notes", () => {
      expect(verdict({ artist: "Yuyoyuppe" })).toEqual({
        status: "potential",
        notes: "Tracks from or themed around Touhou should not be uploaded or used.",
      });
    });
    it("keeps markdown links in notes", () => {
      expect(verdict({ artist: "Frums" }).notes).toContain(
        "[non-commercial use requirements](https://",
      );
    });
    it.each(["NOMA feat. Someone", "NOMA vs. Good Artist", "Track (NOMA Remix)"])(
      "matches whole words: flags %j",
      (artist) => {
        expect(verdict({ artist }).status).toBe("disallowed");
      },
    );
    it.each(["nomanoa", "Tsunomaki Watame", "Binomaly"])(
      "matches whole words: passes %j",
      (artist) => {
        expect(verdict({ artist })).toEqual({ status: "ok" });
      },
    );
    it("checks the unicode artist and falls back to the romanized one", () => {
      expect(verdict({ artist: "Clean Artist", artistUnicode: "Igorrr" }).reason).toBe("artist");
      expect(verdict({ artist: "Igorrr", artistUnicode: "Clean Artist" }).reason).toBe("artist");
    });
    it("normalizes with NFKC before matching", () => {
      expect(verdict({ artist: "Ｉｇｏｒｒｒ" }).reason).toBe("artist");
      expect(verdict({ artist: "owl*tree", artistUnicode: "owl＊tree", title: "Teriqma" })).toEqual(
        {
          status: "ok",
        },
      );
    });
    it("leaves a CJK artist that isn't listed alone", () => {
      expect(verdict({ artist: "sakuzyo", artistUnicode: "削除", title: "Cyberozar" })).toEqual({
        status: "ok",
      });
    });
  });
});
