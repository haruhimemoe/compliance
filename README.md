# @haruhimemoe/compliance

Checks osu! beatmapsets against the content rules for [officially supported osu! tournaments](https://osu.ppy.sh/wiki/en/Tournaments/Official_support). You pass in a beatmapset's osu! fields and get back **ok**, **potential** (needs a closer look) or **disallowed**, with a reason.

- The rules are a port of [hburn7/omc-api](https://github.com/hburn7/omc-api) (MIT), the engine behind the osu! Mappool Compliance checker and the Tournament Committee's site. Its service is closed to outside callers, so this package runs the same rules over copies of its data.
- No network, no dependencies, no database. You bring the osu! data.
- Runs anywhere modern JavaScript runs: Node 22.12+, Bun, Deno, bundlers, browsers. The whole package adds about 30 KB to a browser bundle (12 KB gzipped).

This package gives a guide, not a ruling. The Tournament Committee decides. See [Limits](#limits).

## Install

ESM only (Node 22.12+ can also `require()` it; Node 22.12.0 itself prints an `ExperimentalWarning` for the CommonJS-loads-ESM `require()`, gone by 22.18.0).

Bundling with Rollup needs [`@rollup/plugin-json`](https://github.com/rollup/plugins/tree/master/packages/json) for the `with { type: "json" }` data imports. Vite, esbuild and webpack need no extra config.

```sh
bun add @haruhimemoe/compliance
# or: npm install @haruhimemoe/compliance
```

## Use

```ts
import { evaluateBeatmapset, factsFromOsuBeatmapset, verdictText } from "@haruhimemoe/compliance";

// Any osu! API v2 beatmapset with the extended fields: each row's `beatmapset` in
// GET /api/v2/beatmaps?ids[]=…, or GET /api/v2/beatmapsets/{id}.
const response = await fetch("https://osu.ppy.sh/api/v2/beatmaps?ids[]=129891", {
  headers: { Authorization: `Bearer ${token}` },
});
const { beatmaps } = await response.json();

const facts = factsFromOsuBeatmapset(beatmaps[0].beatmapset);
if (facts) {
  const verdict = evaluateBeatmapset(facts);
  // { status, reason?, notes? }; see ComplianceVerdict
  console.log(verdict.status, verdictText(verdict));
}
```

`factsFromOsuBeatmapset` returns `null` for a compact beatmapset (no `availability`, `track_id` or `tags`). Ask `GET /api/v2/beatmapsets/{id}` for that set instead.

A verdict belongs to a beatmapset, not a difficulty. Check each set once and apply the result to every map from it.

## API

| Export | What it is |
| --- | --- |
| `evaluateBeatmapset(facts)` | The rules. Returns a `ComplianceVerdict`. |
| `factsFromOsuBeatmapset(set)` | osu! API v2 beatmapset → `BeatmapsetFacts`, or `null` for a compact one. |
| `verdictText(verdict)` | The reason in plain words, or the status when there's no reason. |
| `REASON_TEXT`, `OK_TEXT`, `POTENTIAL_TEXT`, `DISALLOWED_TEXT` | The strings `verdictText` uses. |
| `isLeaderboardStatus(status)` | `true` for Ranked, Approved and Loved. |
| `COMPLIANCE_STATUSES`, `COMPLIANCE_REASONS` | The possible values, for validation or UI. |
| `UPSTREAM` | The omc-api commit the rules and data come from. |
| `RULE_LINKS` | The osu! wiki pages behind the rules. |
| Types | `BeatmapsetFacts`, `ComplianceVerdict`, `ComplianceStatus`, `ComplianceReason`, `OsuBeatmapset`. |

Branch on `status`. `reason` explains a verdict: it's set on almost every disallowed verdict, but a per-track override in the data can give disallowed or potential with no reason, or potential with `rightsholder`.

`notes` holds the artist's notes from the omc data and may contain markdown links. Render them as text or parse the links yourself; never inject them as HTML.

### Reasons

| `reason` | Meaning |
| --- | --- |
| `dmca` | Taken down, or osu! shows a content notice. |
| `artist` | The artist doesn't allow their music in osu!. |
| `fa_only` | Only the artist's Featured Artist tracks are allowed, and this isn't one. |
| `source` | From a game or label that doesn't allow its music in osu!. |
| `rightsholder` | The rights holder withdrew this track. |

## Rule order

First match wins. Artist, title, their unicode forms and the source are NFKC-normalized and compared case-insensitively. Tags follow upstream's rule exactly (rule 5).

1. **DMCA:** `availability.download_disabled`, or `availability.more_information` is not null → disallowed, `dmca`.
2. **Overrides** (`overrides/edge-cases.json`): artist equal and title containing the entry's title, unicode fields first → the entry's status. `disallowedByRightsholder` becomes `rightsholder`.
3. **Featured Artist track:** `track_id` > 0 → ok.
4. **Ranked, Approved or Loved** → ok.
5. **Banned source** (`sources/banned.json`): the tags split on `,` as osu! sent them, with an element equal to a banned name lowercased; then the `source` field containing a banned name → disallowed, `source`.
6. **Label tracks** (`labels/MEGAREX.json`): artist equal and the title containing a listed track, or the part of it before the first `(` → disallowed, `rightsholder`.
7. **Restricted artist** (`artists/restricted.json`): the artist field (a multi-word field matches a listed name as a whole word; a one-word field must equal it), then a listed name in the title (multi-word names anywhere, one-word names as whole words). `fa_only` → disallowed `fa_only`; `disallowed` → disallowed `artist`; `potential` → potential with the artist's notes.

Anything else is ok.

## Deviations from upstream

These rarely change a verdict on real osu! data. The tag rule copies upstream exactly, commas and all, so answers agree with the Tournament Committee's tool.

- **Source** is NFKC-normalized like artist and title; upstream compares it as sent. A source in full-width characters (`ＤＪＭＡＸ`) matches a banned source here and not upstream.
- **Notes:** only the data's artist notes are returned. Upstream also fills generic notes per reason; use `verdictText` for that.
- **Absent `more_information`** counts as no notice. Upstream checks `!== null`, so a missing field reads as a DMCA there. osu! always sends the key, so this only guards against a malformed response.
- **Upstream's `skipLeaderboardCheck` option isn't ported.** It lets a caller opt out of rule 4 (Ranked/Approved/Loved → ok); this package always applies rule 4. That matches upstream's default (the option is off unless a caller sets it), so this only differs if you needed to turn it off.

## Limits

- The lists are only as current as the vendored commit (`UPSTREAM`). Artists and labels change their minds; check the date. Two known gaps against the live [Content usage permissions](https://osu.ppy.sh/wiki/en/Rules/Content_usage_permissions) wiki page's "Allowed, with exceptions" section (dated 2026-02-18 there, but edited since): gxxberlol was added to that section on 2026-04-18, and the vendored data at `bb356b3` predates it, so this package reads gxxberlol's two banned tracks ("KICKICKICKICKICKICKIKI" and "newb artist rave") as ok. Igorrr moved the other way: the wiki page now allows Igorrr only for collaborations that appear on Ruby My Dear's Featured Artist listing, but the vendored data still marks Igorrr disallowed outright, so this package is stricter than current policy for an Igorrr/Ruby My Dear collaboration.
- Permission from an artist can override a verdict. The host emails proof to tournaments@ppy.sh, as the [Official support](https://osu.ppy.sh/wiki/en/Tournaments/Official_support) page explains.
- `potential` means a person has to read the notes and decide.
- The Tournament Committee has the final say.

## Data and license

MIT. See [LICENSE](LICENSE), which also carries omc-api's MIT notice (Copyright (c) 2025 hburn7) for the ported rules and the data (`src/data/` in the repo, `dist/data/` in the installed package). The data's source, hashes and refresh steps are in [docs/vendored-data.md](docs/vendored-data.md).

Not affiliated with osu!, ppy Pty Ltd, the osu! Tournament Committee or omc-api.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and how to submit a change, and [CHANGELOG.md](CHANGELOG.md) for release history.
