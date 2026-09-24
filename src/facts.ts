/**
 * @file src/facts.ts
 * @desc osu! API v2 beatmapset → BeatmapsetFacts. Takes a BeatmapsetExtended (each row's
 *       `beatmapset` in GET /api/v2/beatmaps, or GET /api/v2/beatmapsets/{id}) and returns null for
 *       a compact beatmapset, which lacks the fields the rules need.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import type { BeatmapsetFacts } from "./types.js";

/**
 * The osu! API v2 beatmapset fields the rules read (snake_case, as osu! sends them). Validate the
 * response yourself; extra fields are ignored.
 */
export type OsuBeatmapset = {
  id: number;
  status: string;
  artist: string;
  title: string;
  artist_unicode?: string | null | undefined;
  title_unicode?: string | null | undefined;
  source?: string | null | undefined;
  /** Absent (not null) on a compact beatmapset. */
  tags?: string | null | undefined;
  /** null when the song isn't a Featured Artist track. */
  track_id?: number | null | undefined;
  /** Absent on a compact beatmapset. */
  availability?:
    | { download_disabled: boolean; more_information?: string | null | undefined }
    | null
    | undefined;
};

/**
 * @function factsFromOsuBeatmapset
 * @param set {OsuBeatmapset} an osu! API v2 beatmapset
 * @returns {BeatmapsetFacts | null} the facts, or null when availability, track_id or tags is
 *          missing (a compact beatmapset can't be judged: ask GET /api/v2/beatmapsets/{id})
 */
export const factsFromOsuBeatmapset = (set: OsuBeatmapset): BeatmapsetFacts | null => {
  if (!set.availability || set.track_id === undefined || set.tags === undefined) return null;
  return {
    setId: set.id,
    status: set.status,
    artist: set.artist,
    title: set.title,
    artistUnicode: set.artist_unicode ?? set.artist,
    titleUnicode: set.title_unicode ?? set.title,
    source: set.source ?? "",
    tags: set.tags ?? "",
    trackId: set.track_id,
    downloadDisabled: set.availability.download_disabled,
    // Upstream treats anything but null as a notice; an absent field is no notice.
    moreInformation: set.availability.more_information ?? null,
  };
};
