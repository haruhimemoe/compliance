<p align="center"><a href="https://github.com/haruhimemoe/compliance"><picture><source media="(prefers-color-scheme: light)" srcset="https://www.haruhime.moe/brand/repos/compliance-banner-on-light.svg"><img alt="@haruhimemoe/compliance" src="https://www.haruhime.moe/brand/repos/compliance-banner.svg" width="640"></picture></a></p>

# @haruhimemoe/compliance

Checks osu! beatmapsets against the content rules for [officially supported osu! tournaments](https://osu.ppy.sh/wiki/en/Tournaments/Official_support). You pass in a beatmapset's osu! fields and get back **ok**, **potential** (needs a closer look) or **disallowed**, with a reason.

- The rules are a port of [hburn7/omc-api](https://github.com/hburn7/omc-api) (MIT), the engine behind the osu! Mappool Compliance checker and the Tournament Committee's site. Its service is closed to outside callers, so this package runs the same rules over copies of its data.
- No network, no dependencies, no database. You bring the osu! data.
- Runs on Node 22.12+, Bun, Deno and in browsers through a bundler. See [Compatibility](#compatibility).
- To check maps without writing code, use the compliance check on [pools.haruhime.moe](https://pools.haruhime.moe/check) (in beta), which runs this package: paste beatmap IDs or links, a pool or a pack key.

This package gives a guide, not a ruling. The Tournament Committee decides. See [Limits](#limits).

## Install

```sh
bun add @haruhimemoe/compliance
# or: npm install @haruhimemoe/compliance
# or: deno add npm:@haruhimemoe/compliance
```

## Use

With a beatmapset from the osu! API v2:

```ts
import {
  evaluateBeatmapset,
  factsFromOsuBeatmapset,
  type OsuBeatmapset,
  verdictText,
} from "@haruhimemoe/compliance";

const token = "…"; // an osu! API v2 access token

// GET /api/v2/beatmaps takes up to 50 beatmap (difficulty) ids. Each row's `beatmapset` has the
// fields the rules read. GET /api/v2/beatmapsets/{id} works too.
const response = await fetch("https://osu.ppy.sh/api/v2/beatmaps?ids[]=129891", {
  headers: { Authorization: `Bearer ${token}` },
});
const { beatmaps } = (await response.json()) as { beatmaps: { beatmapset: OsuBeatmapset }[] };

const set = beatmaps[0]?.beatmapset;
const facts = set ? factsFromOsuBeatmapset(set) : null;
if (facts) {
  const verdict = evaluateBeatmapset(facts); // { status, reason?, notes? }
  console.log(verdict.status, verdictText(verdict));
}
```

The cast trusts osu!'s response. Validate it first if you need to.

`factsFromOsuBeatmapset` returns `null` when `availability`, `track_id` or `tags` is missing. A compact beatmapset, which osu! nests in some responses, has no `tags` and no `availability`. Ask `GET /api/v2/beatmapsets/{id}` for that set instead.

Using [`@haruhimemoe/osu`](https://github.com/haruhimemoe/osu)? The `OsuBeatmapsetExtended` sets its `getBeatmapsets` returns go straight into `factsFromOsuBeatmapset`.

With facts you already have, for example from a cache:

```ts
import { evaluateBeatmapset } from "@haruhimemoe/compliance";

const verdict = evaluateBeatmapset({
  status: "graveyard",
  artist: "Igorrr",
  title: "Example",
  artistUnicode: "Igorrr",
  titleUnicode: "Example",
  source: "",
  tags: "",
  trackId: null,
  downloadDisabled: false,
  moreInformation: null,
});
// { status: "disallowed", reason: "artist" }
```

A verdict belongs to a beatmapset, not a difficulty. Check each set once and apply the result to every map from it.

## API

Everything is a named export of `@haruhimemoe/compliance`.

| Export | What it is |
| --- | --- |
| `evaluateBeatmapset(facts)` | The rules. Returns a `ComplianceVerdict`. |
| `factsFromOsuBeatmapset(set)` | osu! API v2 beatmapset → `BeatmapsetFacts`, or `null`. |
| `verdictText(verdict)` | A verdict in plain words. |
| `REASON_TEXT`, `OK_TEXT`, `POTENTIAL_TEXT`, `DISALLOWED_TEXT` | The strings `verdictText` uses. |
| `isLeaderboardStatus(status)` | `true` for Ranked, Approved and Loved. |
| `COMPLIANCE_STATUSES`, `COMPLIANCE_REASONS` | The possible values, for validation or UI. |
| `UPSTREAM` | The omc-api commit the rules and data come from. |
| `RULE_LINKS` | The osu! wiki pages behind the rules. |
| Types | `BeatmapsetFacts`, `ComplianceVerdict`, `ComplianceStatus`, `ComplianceReason`, `OsuBeatmapset`. |

### `evaluateBeatmapset(facts: BeatmapsetFacts): ComplianceVerdict`

Runs the rules in [Rule order](#rule-order) and returns the first match. Synchronous, with no I/O. Treat the verdict as read-only.

Branch on `status`. `reason` explains a verdict: it's set on almost every disallowed verdict, but a per-track override in the data can give disallowed or potential with no reason, or potential with `rightsholder`.

`notes` holds the matched artist's notes from the omc data, when there are some. They may contain markdown links. Render them as text or parse the links yourself; never inject them as HTML.

### `factsFromOsuBeatmapset(set: OsuBeatmapset): BeatmapsetFacts | null`

Maps an osu! API v2 beatmapset (snake_case) to `BeatmapsetFacts`:

- `artist_unicode` and `title_unicode` fall back to `artist` and `title` when null or absent.
- `source` becomes `""` when null or absent, and `tags` when null.
- An absent `availability.more_information` becomes `null` (no content notice).

Returns `null` when `availability` is null or absent, or `track_id` or `tags` is absent. A `track_id` of `null` is fine: it means the song isn't a Featured Artist track.

### `verdictText(verdict: Pick<ComplianceVerdict, "status" | "reason">): string`

Returns `REASON_TEXT[reason]` when the verdict has a reason. Otherwise `POTENTIAL_TEXT` for potential, `DISALLOWED_TEXT` for disallowed and `OK_TEXT` for ok.

| Constant | Value |
| --- | --- |
| `OK_TEXT` | `"Allowed"` |
| `POTENTIAL_TEXT` | `"Needs a closer look"` |
| `DISALLOWED_TEXT` | `"Not allowed in officially supported tournaments"` |
| `REASON_TEXT` | A frozen object with one string per reason. See [Reasons](#reasons). |

### `isLeaderboardStatus(status: string): boolean`

`true` for `"ranked"`, `"approved"` and `"loved"`, the lowercase strings osu! API v2 sends. Anything else, `"Ranked"` included, is `false`.

### Constants

| Constant | Value |
| --- | --- |
| `COMPLIANCE_STATUSES` | Frozen `["ok", "potential", "disallowed"]`. |
| `COMPLIANCE_REASONS` | Frozen `["dmca", "artist", "source", "rightsholder", "fa_only"]`. |
| `UPSTREAM` | `{ repo: "https://github.com/hburn7/omc-api", commit: "bb356b3df4228dddadbae9e8b5348f720e8aaa18", committedAt: "2026-06-28" }` |
| `RULE_LINKS` | `{ contentUsage, officialSupport }`: the [Content usage permissions](https://osu.ppy.sh/wiki/en/Rules/Content_usage_permissions) and [Official support](https://osu.ppy.sh/wiki/en/Tournaments/Official_support) wiki URLs. |

### Types

`BeatmapsetFacts` is one beatmapset's osu! fields, the input to `evaluateBeatmapset`:

| Field | Type | From the osu! beatmapset |
| --- | --- | --- |
| `setId` (optional) | `number` | `id`. The rules don't read it; keep it to match a verdict back to your data. |
| `status` | `string` | `status`: `"ranked"`, `"approved"`, `"loved"`, `"qualified"`, `"pending"`, `"wip"` or `"graveyard"`. |
| `artist`, `title` | `string` | `artist`, `title`. |
| `artistUnicode`, `titleUnicode` | `string` | `artist_unicode`, `title_unicode`. Use the romanized fields when osu! has none. |
| `source` | `string` | `source`. `""` when there's none. |
| `tags` | `string` | `tags` as sent (space-separated). `""` when there are none. |
| `trackId` | `number \| null` | `track_id`. `null` when the song isn't a Featured Artist track. |
| `downloadDisabled` | `boolean` | `availability.download_disabled`. |
| `moreInformation` | `string \| null` | `availability.more_information`. `null` when osu! shows no content notice. |

`ComplianceVerdict` is `{ status: ComplianceStatus; reason?: ComplianceReason | undefined; notes?: string | undefined }`.

`ComplianceStatus` is `"ok" | "potential" | "disallowed"`. `ComplianceReason` is `"dmca" | "artist" | "source" | "rightsholder" | "fa_only"`.

`OsuBeatmapset` lists the osu! API v2 beatmapset fields the rules read: `id`, `status`, `artist`, `title`, and the optional `artist_unicode`, `title_unicode`, `source`, `tags`, `track_id` and `availability` (`{ download_disabled, more_information? }`). The optional ones also accept `null` and an explicit `undefined`. Extra fields are ignored, so a beatmapset typed by another osu! client usually fits.

### Reasons

| `reason` | `REASON_TEXT` | Set by |
| --- | --- | --- |
| `dmca` | Taken down, or osu! shows a content notice | Rule 1 |
| `artist` | This artist doesn't allow their music in osu! | Rule 7 |
| `fa_only` | Only this artist's Featured Artist tracks are allowed | Rule 7 |
| `source` | Comes from a game or label that doesn't allow its music in osu! | Rule 5 |
| `rightsholder` | The rights holder doesn't allow this track | Rules 2 and 6 |

### Errors

`evaluateBeatmapset`, `factsFromOsuBeatmapset` and `verdictText` don't throw on input that matches their types, and they don't validate it either. From plain JavaScript, a missing string field in `BeatmapsetFacts` can make `evaluateBeatmapset` throw a `TypeError`.

The package checks its data files when it's first imported and throws an `Error` naming the file if one is malformed. The published data passes that check.

## Rule order

First match wins. Artist, title, their unicode forms and the source are NFKC-normalized and compared case-insensitively. Tags follow upstream's rule exactly (rule 5).

1. **DMCA:** `availability.download_disabled`, or `availability.more_information` is not null → disallowed, `dmca`.
2. **Overrides** (`overrides/edge-cases.json`): artist equal and title containing the entry's title, unicode fields first → the entry's status. `disallowedByRightsholder` becomes `rightsholder`.
3. **Featured Artist track:** `track_id` > 0 → ok.
4. **Ranked, Approved or Loved** (`status` is `"ranked"`, `"approved"` or `"loved"`) → ok.
5. **Banned source** (`sources/banned.json`): the tags split on `,` as osu! sent them, with an element equal to a banned name lowercased; then the `source` field containing a banned name → disallowed, `source`.
6. **Label tracks** (`labels/MEGAREX.json`): artist equal and the title containing a listed track, or the part of it before the first `(`, unicode fields first → disallowed, `rightsholder`.
7. **Restricted artist** (`artists/restricted.json`): the artist field (a multi-word field matches a listed name as a whole word; a one-word field must equal it), then a listed name in the title (multi-word names anywhere, one-word names as whole words), unicode fields first each time. `fa_only` → disallowed, `fa_only`; `disallowed` → disallowed, `artist`; `potential` → potential. The verdict carries the artist's notes when the data has some.

Anything else is ok.

## Deviations from upstream

These rarely change a verdict on real osu! data. The tag rule copies upstream exactly, commas and all, so answers agree with the Tournament Committee's tool.

- **Source** is NFKC-normalized like artist and title; upstream compares it as sent. A source in full-width characters (`ＤＪＭＡＸ`) matches a banned source here and not upstream.
- **Notes:** only the data's artist notes are returned. Upstream also fills generic notes per reason; use `verdictText` for that.
- **Absent `more_information`** counts as no notice. Upstream checks `!== null`, so a missing field reads as a DMCA there. osu! always sends the key, so this only guards against a malformed response.
- **Upstream's `skipLeaderboardCheck` option isn't ported.** It lets a caller opt out of rule 4 (Ranked/Approved/Loved → ok); this package always applies rule 4. That matches upstream's default (the option is off unless a caller sets it), so this only differs if you needed to turn it off.
- **Upstream's `strict` option isn't ported.** It also checks artist and title against Chunithm and maimai track lists (`data/strict/`), as `source`. Upstream suggests it for world cups; it goes past the published rules, so this package doesn't ship those lists. `strict` is off by default upstream, so the default answers agree.

## Limits

- The lists are only as current as the vendored commit (`UPSTREAM`). Artists and labels change their minds; check the date.
- Known gaps against the "Allowed, with exceptions" section of the live [Content usage permissions](https://osu.ppy.sh/wiki/en/Rules/Content_usage_permissions) page (dated 2026-02-18 there, but edited since):
  - **gxxberlol** was added on 2026-04-18. The vendored data at `bb356b3` doesn't list them, so this package reads gxxberlol's two banned tracks ("KICKICKICKICKICKICKIKI" and "newb artist rave") as ok.
  - **Mlumìn // SoundWarper** was added on 2026-02-07 and isn't in the vendored data either. The page allows only their "Spinner (DnB Remix)" and asks you to get the artists' permission for any other track. This package reads every track of theirs as ok.
  - **Igorrr** moved the other way. The page now allows Igorrr only for collaborations on Ruby My Dear's Featured Artist listing, but the vendored data still marks Igorrr disallowed outright. This package is stricter than current policy for an Igorrr/Ruby My Dear collaboration.
  - **MEGAREX** tracks are allowed only when they're on a Featured Artist listing. The data catches the rest only through the tracks listed in `labels/MEGAREX.json` (rule 6) and a MEGAREX source (rule 5). Any other MEGAREX track reads as ok.
- Permission from an artist can override a verdict. The host emails proof to tournaments@ppy.sh, as the [Official support](https://osu.ppy.sh/wiki/en/Tournaments/Official_support) page explains.
- `potential` means a person has to read the notes and decide.
- The Tournament Committee has the final say.

## Compatibility

- **ESM only.** Node 22.12+ can also `require()` it. Node 22.12.0 prints an `ExperimentalWarning` for that `require()` unless the calling file is under `node_modules`. Node 22.13.0 and later don't.
- **Node** 22.12 or later (`engines`). CI runs the built package on Node 22.12 and 24.
- **Bun** and **Deno** (through the `npm:` specifier).
- **Bundlers:** Vite, esbuild and webpack need no extra config. Rollup needs [`@rollup/plugin-json`](https://github.com/rollup/plugins/tree/master/packages/json) for the `with { type: "json" }` data imports. The whole package adds about 30 KB to a browser bundle (12 KB gzipped), most of it the data.
- **TypeScript:** types ship in the package. CI typechecks a consumer with `strict`, `exactOptionalPropertyTypes` and `skipLibCheck: false`.

## License

MIT. See [LICENSE](LICENSE), which also carries omc-api's MIT notice (Copyright (c) 2025 hburn7) for the ported rules and the data (`src/data/` in the repo, `dist/data/` in the installed package). The data's source, hashes and refresh steps are in [docs/vendored-data.md](docs/vendored-data.md).

Not affiliated with osu!, ppy Pty Ltd, the osu! Tournament Committee or omc-api.

## Links

- [npm package](https://www.npmjs.com/package/@haruhimemoe/compliance)
- [CHANGELOG.md](CHANGELOG.md) for release history
- [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and how to submit a change
- [SECURITY.md](SECURITY.md) to report a vulnerability
- [Discord](https://discord.gg/bKy9kjMV4y) for questions and feedback
