/**
 * @file src/data.ts
 * @desc The omc-api lists, read once and checked at import: restricted artists, one label's
 *       withdrawn tracks, per-track overrides and banned sources. Every name is NFKC-normalized
 *       here, so the rules compare like with like. A bad re-vendor throws on the first import.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import restrictedArtists from "./data/artists/restricted.json" with { type: "json" };
import megarexTracks from "./data/labels/MEGAREX.json" with { type: "json" };
import edgeCases from "./data/overrides/edge-cases.json" with { type: "json" };
import bannedSources from "./data/sources/banned.json" with { type: "json" };

export const nfkc = (value: string): string => value.normalize("NFKC");

export type ArtistRule = {
  status: "fa_only" | "potential" | "disallowed";
  notes: string | null;
};

export type Override = {
  artist: string;
  title: string;
  resultOverride: "ok" | "potential" | "disallowed";
  failureReasonOverride: string | null;
};

const fail = (file: string, detail: string): never => {
  throw new Error(`@haruhime/compliance: src/data/${file} is malformed: ${detail}`);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const ARTIST_STATUSES: ReadonlySet<string> = new Set(["fa_only", "potential", "disallowed"]);
const RESULT_OVERRIDES: ReadonlySet<string> = new Set(["ok", "potential", "disallowed"]);

/**
 * @function parseArtists
 * @param raw {unknown} artists/restricted.json
 * @returns {Map<string, ArtistRule>} rules by NFKC-normalized artist name
 */
export const parseArtists = (raw: unknown): ReadonlyMap<string, ArtistRule> => {
  const file = "artists/restricted.json";
  if (!isRecord(raw)) return fail(file, "expected an object");
  const rules = new Map<string, ArtistRule>();
  for (const [name, rule] of Object.entries(raw)) {
    if (!isRecord(rule) || typeof rule.status !== "string" || !ARTIST_STATUSES.has(rule.status)) {
      return fail(file, `bad status for ${JSON.stringify(name)}`);
    }
    const notes = rule.notes ?? null;
    if (notes !== null && typeof notes !== "string") {
      return fail(file, `bad notes for ${JSON.stringify(name)}`);
    }
    rules.set(nfkc(name), { status: rule.status as ArtistRule["status"], notes: notes || null });
  }
  return rules;
};

/**
 * @function parseOverrides
 * @param raw {unknown} overrides/edge-cases.json
 * @returns {Override[]} the overrides, artist and title NFKC-normalized
 */
export const parseOverrides = (raw: unknown): readonly Override[] => {
  const file = "overrides/edge-cases.json";
  if (!Array.isArray(raw)) return fail(file, "expected an array");
  return raw.map((entry, index) => {
    if (
      !isRecord(entry) ||
      typeof entry.artist !== "string" ||
      !entry.artist ||
      typeof entry.title !== "string" ||
      !entry.title ||
      typeof entry.resultOverride !== "string" ||
      !RESULT_OVERRIDES.has(entry.resultOverride) ||
      (entry.failureReasonOverride !== undefined && typeof entry.failureReasonOverride !== "string")
    ) {
      return fail(file, `bad entry at index ${index}`);
    }
    return {
      artist: nfkc(entry.artist),
      title: nfkc(entry.title),
      resultOverride: entry.resultOverride as Override["resultOverride"],
      failureReasonOverride: entry.failureReasonOverride ?? null,
    };
  });
};

/**
 * @function parseSources
 * @param raw {unknown} sources/banned.json
 * @returns {string[]} banned source names, NFKC-normalized
 */
export const parseSources = (raw: unknown): readonly string[] => {
  const file = "sources/banned.json";
  if (!isStringArray(raw) || raw.some((name) => !name)) {
    return fail(file, "expected an array of names");
  }
  return raw.map(nfkc);
};

/**
 * @function parseLabel
 * @param raw {unknown} one labels/*.json file
 * @returns {[string, string[]][]} [artist, withdrawn tracks] pairs, NFKC-normalized
 */
export const parseLabel = (raw: unknown): readonly (readonly [string, readonly string[]])[] => {
  const file = "labels/MEGAREX.json";
  if (!isRecord(raw)) return fail(file, "expected an object");
  return Object.entries(raw).map(([artist, tracks]) => {
    if (!isStringArray(tracks)) return fail(file, `bad tracks for ${JSON.stringify(artist)}`);
    return [nfkc(artist), tracks.map(nfkc)] as const;
  });
};

export const ARTISTS = parseArtists(restrictedArtists);
export const OVERRIDES = parseOverrides(edgeCases);
export const BANNED_SOURCES = parseSources(bannedSources);
// Upstream reads only the first label file (labels[0]); MEGAREX is the only one.
export const LABEL_TRACKS = parseLabel(megarexTracks);
