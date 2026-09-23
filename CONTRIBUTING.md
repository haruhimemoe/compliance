# Contributing

1. Read [AGENTS.md](./AGENTS.md).
2. Branch from `main` (`feat/<topic>`, `fix/<topic>`, `data/<commit>` for a data refresh).
3. Write a failing test in `tests/`, make it pass, keep commits small and Conventional.
4. Run `bun run check && bun run typecheck && bun run test && bun run test:dist`.
5. Add a line to `CHANGELOG.md` under `## [Unreleased]`, in the right [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) section (Added, Changed, Deprecated, Removed, Fixed, Security).
6. Open a PR. CI must be green before merge.

Think a verdict is wrong? First check whether [omc-api](https://github.com/hburn7/omc-api) gives the same answer. If it does, the fix belongs upstream; open an issue here too so we pick it up on the next refresh.
