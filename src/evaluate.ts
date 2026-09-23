/**
 * @file src/evaluate.ts
 * @desc The rules: a port of hburn7/omc-api's validator.ts (MIT) over its data files (commit in
 *       UPSTREAM). First matching rule wins: DMCA, overrides, Featured Artist track,
 *       Ranked/Approved/Loved, banned source (tags, then source), label tracks, restricted artist
 *       (artist, then title). Text is NFKC-normalized and compared case-insensitively, except
 *       tags, which follow upstream's rule exactly. Deviations from upstream are in the README.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { ARTISTS, BANNED_SOURCES, LABEL_TRACKS, nfkc, OVERRIDES } from "./data.js";
import type { BeatmapsetFacts, ComplianceVerdict } from "./types.js";

const OK: ComplianceVerdict = { status: "ok" };
const LEADERBOARD_STATUSES: ReadonlySet<string> = new Set(["ranked", "approved", "loved"]);

/**
 * @function isLeaderboardStatus
 * @param status {string} a beatmapset status from osu! ("ranked", "graveyard", ...)
 * @returns {boolean} true for Ranked, Approved and Loved
 */
export const isLeaderboardStatus = (status: string): boolean => LEADERBOARD_STATUSES.has(status);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const wholeWord = (value: string): RegExp =>
  new RegExp(`\\b${escapeRegex(value.toLowerCase())}\\b`);

const isLicensed = (trackId: number | null): boolean => trackId !== null && trackId > 0;

const findOverride = (artist: string, title: string) =>
  OVERRIDES.find(
    (entry) =>
      artist.toLowerCase() === entry.artist.toLowerCase() &&
      title.toLowerCase().includes(entry.title.toLowerCase()),
  );

// Upstream's rule exactly, so verdicts agree with the Tournament Committee's tool: split the tags
// as sent on "," and look for an element equal to a banned name lowercased. The tags aren't
// lowercased, trimmed or NFKC-normalized. osu! tags are space-separated, so the source field
// (next) does most of the work.
const tagsHaveBannedSource = (tags: string): boolean => {
  const elements = tags.split(",");
  return BANNED_SOURCES.some((source) => elements.includes(source.toLowerCase()));
};

const isBannedSource = (source: string): boolean =>
  BANNED_SOURCES.some((banned) => source.toLowerCase().includes(banned.toLowerCase()));

// Same artist, and the title holds the track name or the part of it before the first "(".
const isLabelTrack = (artist: string, title: string): boolean => {
  const titleLower = title.toLowerCase();
  return LABEL_TRACKS.some(
    ([labelArtist, tracks]) =>
      labelArtist.toLowerCase() === artist.toLowerCase() &&
      tracks.some((track) => {
        const trackLower = track.toLowerCase();
        const beforeParen = trackLower.split("(")[0]?.trim();
        return (
          titleLower.includes(trackLower) || (!!beforeParen && titleLower.includes(beforeParen))
        );
      }),
  );
};

// A multi-word artist field matches a listed name as a whole word; a one-word field must equal it.
const restrictedArtistKey = (artist: string): string | null => {
  const lower = artist.toLowerCase();
  for (const key of ARTISTS.keys()) {
    const hit = artist.includes(" ") ? wholeWord(key).test(lower) : key.toLowerCase() === lower;
    if (hit) return key;
  }
  return null;
};

// A listed multi-word name matches anywhere in the title; a one-word name as a whole word.
const restrictedArtistInTitle = (title: string): string | null => {
  const lower = title.toLowerCase();
  for (const key of ARTISTS.keys()) {
    const hit = key.includes(" ") ? lower.includes(key.toLowerCase()) : wholeWord(key).test(lower);
    if (hit) return key;
  }
  return null;
};

const withNotes = (verdict: ComplianceVerdict, notes: string | null): ComplianceVerdict =>
  notes ? { ...verdict, notes } : verdict;

// Featured Artist tracks returned "ok" at rule 3, so an fa_only match here is always unlicensed.
const artistVerdict = (key: string): ComplianceVerdict | null => {
  const rule = ARTISTS.get(key);
  if (!rule) return null;
  switch (rule.status) {
    case "fa_only":
      return withNotes({ status: "disallowed", reason: "fa_only" }, rule.notes);
    case "potential":
      return withNotes({ status: "potential" }, rule.notes);
    case "disallowed":
      return withNotes({ status: "disallowed", reason: "artist" }, rule.notes);
  }
};

/**
 * @function evaluateBeatmapset
 * @param facts {BeatmapsetFacts} one beatmapset's osu! fields
 * @returns {ComplianceVerdict} ok, potential (with the artist's notes), or disallowed with a reason
 */
export const evaluateBeatmapset = (facts: BeatmapsetFacts): ComplianceVerdict => {
  // 1. DMCA: not downloadable, or osu! shows a content notice.
  if (facts.downloadDisabled || facts.moreInformation !== null) {
    return { status: "disallowed", reason: "dmca" };
  }
  const artist = nfkc(facts.artist);
  const title = nfkc(facts.title);
  const artistUnicode = nfkc(facts.artistUnicode);
  const titleUnicode = nfkc(facts.titleUnicode);

  // 2. Overrides, unicode fields first.
  const override = findOverride(artistUnicode, titleUnicode) ?? findOverride(artist, title);
  if (override) {
    if (override.resultOverride === "ok") return OK;
    return override.failureReasonOverride === "disallowedByRightsholder"
      ? { status: override.resultOverride, reason: "rightsholder" }
      : { status: override.resultOverride };
  }

  // 3. Featured Artist track. 4. Ranked, Approved or Loved.
  if (isLicensed(facts.trackId) || isLeaderboardStatus(facts.status)) return OK;

  // 5. Banned source: tags, then the source field.
  if (tagsHaveBannedSource(facts.tags) || isBannedSource(nfkc(facts.source))) {
    return { status: "disallowed", reason: "source" };
  }

  // 6. Tracks a label has withdrawn.
  if (isLabelTrack(artistUnicode, titleUnicode) || isLabelTrack(artist, title)) {
    return { status: "disallowed", reason: "rightsholder" };
  }

  // 7. Restricted artist: the artist field, then a name in the title (remixes, features).
  const byArtist = restrictedArtistKey(artistUnicode) ?? restrictedArtistKey(artist);
  const artistResult = byArtist ? artistVerdict(byArtist) : null;
  if (artistResult) return artistResult;
  const inTitle = restrictedArtistInTitle(titleUnicode) ?? restrictedArtistInTitle(title);
  const titleResult = inTitle ? artistVerdict(inTitle) : null;
  if (titleResult) return titleResult;

  return OK;
};
