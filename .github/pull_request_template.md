## Summary

<!-- What changed and why. Link the issue if there is one. -->

## Checklist (AGENTS.md)

- [ ] A rule change started as a failing case in `tests/evaluate.test.ts`
- [ ] `bun run check && bun run typecheck && bun run test && bun run test:dist`
- [ ] `bun run test:coverage` (95% floor) and `bun run check:consumer`
- [ ] `src/data/` is byte-for-byte upstream, refreshed per `docs/vendored-data.md` (hashes updated)
- [ ] Any deviation from omc-api is listed in the README's "Deviations from upstream"
- [ ] A line under `## [Unreleased]` in `CHANGELOG.md` for anything users will notice
