# Contributing

## Setup

You need [Bun](https://bun.sh) (the repo pins 1.4.2 in `packageManager`) and Node 22.12 or later (`.nvmrc` has 24).

```sh
bun install
```

Read [AGENTS.md](./AGENTS.md) first. It has the rules this package keeps and the file layout.

## Checks

```sh
bun run check && bun run typecheck && bun run test && bun run test:dist
```

| Script | What it does |
| --- | --- |
| `bun run check` | Biome lint and format check. `bun run check:fix` applies fixes. |
| `bun run typecheck` | `tsc --noEmit` over `src/`, `tests/` and `vitest.config.ts`. |
| `bun run test` | Vitest. `bun run test:watch` keeps it running. |
| `bun run test:coverage` | Vitest with a 95% coverage floor on `src/`. CI runs this one. |
| `bun run test:dist` | Builds `dist/` and imports it in Node (`scripts/smoke.mjs`). |
| `bun run check:consumer` | Packs the package, installs it in a temp project, then typechecks and runs a strict consumer. |

## Making a change

1. Branch from `main` (`feat/<topic>`, `fix/<topic>`, `data/<commit>` for a data refresh).
2. Write a failing test in `tests/`, make it pass, keep commits small and [Conventional](https://www.conventionalcommits.org/en/v1.0.0/).
3. Run the checks above.
4. Add a line to `CHANGELOG.md` under `## [Unreleased]`, in the right [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) section (Added, Changed, Deprecated, Removed, Fixed, Security).
5. Open a PR. CI must be green before merge.

A data refresh follows [docs/vendored-data.md](docs/vendored-data.md).

Think a verdict is wrong? First check whether [omc-api](https://github.com/hburn7/omc-api) gives the same answer. If it does, the fix belongs upstream; open an issue here too so we pick it up on the next refresh.

Releases are cut by the maintainers.
