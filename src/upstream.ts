/**
 * @file src/upstream.ts
 * @desc Where the rules and data came from: the omc-api commit src/data/ was copied from, and the
 *       osu! wiki pages the rules put into practice.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

/** The omc-api commit the rules were ported from and src/data/ was copied from. */
export const UPSTREAM = {
  repo: "https://github.com/hburn7/omc-api",
  commit: "bb356b3df4228dddadbae9e8b5348f720e8aaa18",
  committedAt: "2026-06-28",
} as const;

/** The osu! wiki pages behind the rules. */
export const RULE_LINKS = {
  contentUsage: "https://osu.ppy.sh/wiki/en/Rules/Content_usage_permissions",
  officialSupport: "https://osu.ppy.sh/wiki/en/Tournaments/Official_support",
} as const;
