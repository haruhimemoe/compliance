/**
 * @file src/types.ts
 * @desc The shapes the rules read and return: one beatmapset's facts from osu!, and a verdict.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

export const COMPLIANCE_STATUSES = ["ok", "potential", "disallowed"] as const;
export const COMPLIANCE_REASONS = ["dmca", "artist", "source", "rightsholder", "fa_only"] as const;

/** ok: allowed. potential: needs a closer look (read `notes`). disallowed: not allowed. */
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];

/**
 * Why a set isn't allowed:
 * - dmca: taken down, or osu! shows a content notice
 * - artist: the artist doesn't allow their music in osu!
 * - fa_only: only the artist's Featured Artist tracks are allowed
 * - source: from a game or label that doesn't allow its music in osu!
 * - rightsholder: the rights holder withdrew this track
 */
export type ComplianceReason = (typeof COMPLIANCE_REASONS)[number];

export type ComplianceVerdict = {
  status: ComplianceStatus;
  reason?: ComplianceReason;
  /** The artist's notes from the omc data. May hold markdown links. */
  notes?: string;
};

/**
 * One beatmapset's osu! fields the rules read. Build it from an osu! API v2 beatmapset with
 * `factsFromOsuBeatmapset`, or by hand from a cache.
 */
export type BeatmapsetFacts = {
  setId: number;
  /** osu!'s status string: "ranked", "approved", "loved", "qualified", "pending", "wip", "graveyard". */
  status: string;
  artist: string;
  title: string;
  /** The unicode fields; use the romanized ones when osu! has none. */
  artistUnicode: string;
  titleUnicode: string;
  /** "" when there's none. */
  source: string;
  /** osu!'s tags string as sent (space-separated). "" when there are none. */
  tags: string;
  /** The Featured Artist track id; null for an unlicensed song. */
  trackId: number | null;
  /** `availability.download_disabled`. */
  downloadDisabled: boolean;
  /** `availability.more_information`: null when osu! shows no content notice. */
  moreInformation: string | null;
};
