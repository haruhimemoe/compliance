/**
 * @file src/index.ts
 * @desc @haruhime/compliance: check osu! beatmapsets against the content rules for officially
 *       supported osu! tournaments. No network, no dependencies: you bring osu!'s data.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

export { evaluateBeatmapset, isLeaderboardStatus } from "./evaluate.js";
export { factsFromOsuBeatmapset, type OsuBeatmapset } from "./facts.js";
export { DISALLOWED_TEXT, OK_TEXT, POTENTIAL_TEXT, REASON_TEXT, verdictText } from "./text.js";
export {
  type BeatmapsetFacts,
  COMPLIANCE_REASONS,
  COMPLIANCE_STATUSES,
  type ComplianceReason,
  type ComplianceStatus,
  type ComplianceVerdict,
} from "./types.js";
export { RULE_LINKS, UPSTREAM } from "./upstream.js";
