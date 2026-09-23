/**
 * @file src/text.ts
 * @desc Verdicts in plain words, for anyone showing a result to a person.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import type { ComplianceReason, ComplianceVerdict } from "./types.js";

export const REASON_TEXT: Record<ComplianceReason, string> = {
  dmca: "Taken down by a DMCA notice",
  artist: "This artist doesn't allow their music in osu!",
  fa_only: "Only this artist's Featured Artist tracks are allowed",
  source: "Comes from a game or label that doesn't allow its music in osu!",
  rightsholder: "The rights holder doesn't allow this track",
};
export const OK_TEXT = "Allowed";
export const POTENTIAL_TEXT = "Needs a closer look";
export const DISALLOWED_TEXT = "Not allowed in officially supported tournaments";

/**
 * @function verdictText
 * @param verdict {Pick<ComplianceVerdict, "status" | "reason">} one set's result
 * @returns {string} its reason in plain words, or its status when there's no reason
 */
export const verdictText = ({
  status,
  reason,
}: Pick<ComplianceVerdict, "status" | "reason">): string => {
  if (reason) return REASON_TEXT[reason];
  if (status === "potential") return POTENTIAL_TEXT;
  if (status === "disallowed") return DISALLOWED_TEXT;
  return OK_TEXT;
};
