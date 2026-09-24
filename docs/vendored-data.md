# Vendored data

`src/data/` holds byte-for-byte copies of [hburn7/omc-api](https://github.com/hburn7/omc-api)'s data files. Biome ignores the folder, so formatting never changes them. `tests/vendor.test.ts` checks these hashes against the files.

- **Upstream commit:** `bb356b3df4228dddadbae9e8b5348f720e8aaa18` (2026-06-28), also in `UPSTREAM` (`src/upstream.ts`).
- **Rules ported from:** `src/lib/validator.ts` at that commit.

| File | Upstream path | sha256 |
| --- | --- | --- |
| `artists/restricted.json` | `data/artists/restricted.json` | `1cf5cfe9418bca3d09a0ca6071af4b87202b3e9f737ef83b1ff3cea08873cbe6` |
| `labels/MEGAREX.json` | `data/labels/MEGAREX.json` | `8c06ceb6d89ab6a2de4ce540c0cd837f3f181d2ec87d04de806daa25508041b0` |
| `overrides/edge-cases.json` | `data/overrides/edge-cases.json` | `ecc607e08dba5e04d2c9078fbb936641a77e692f2542fe08eb90e686f0cd5272` |
| `sources/banned.json` | `data/sources/banned.json` | `193988777358e82631be575b3320a77e683fc6d12ba500c2e8212688759ef886` |
| `LICENSE` | `LICENSE` | `d4f78136cf82bebb11fbc84a0a9b3b804691e9aceecd5b88bac7d5781e4adab0` |

Not vendored: `data/strict/` (the Chunithm and maimai lists). Only omc's `strict` mode uses them, and that mode is stricter than the published rules.

## Refreshing

1. `git clone https://github.com/hburn7/omc-api "$TMPDIR/omc-api"` and note `git -C "$TMPDIR/omc-api" rev-parse HEAD`.
2. Read the diff of `src/lib/validator.ts` since the commit above. If a rule changed, write the failing test in `tests/evaluate.test.ts` first, then port the change to `src/evaluate.ts`.
3. Copy the four data files and `LICENSE` over `src/data/`. Upstream reads only the first file in `data/labels/`; if it added a label file, decide whether to port more and say so in the changelog.
4. Update `UPSTREAM` in `src/upstream.ts`, then the commit and hashes in this file (`shasum -a 256 src/data/*/*.json src/data/LICENSE`, or `sha256sum` on Linux).
5. `bun run test`. The rule tests pin verdicts against today's lists. If a data change moves one, look at why before updating the test.
6. Add a line under `## [Unreleased]` in `CHANGELOG.md` naming the new upstream commit, and say whether it can change a verdict. One that can is a minor version while on 0.x; the maintainers pick the number when they release.
