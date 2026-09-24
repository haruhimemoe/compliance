# Changelog

All notable changes to `@haruhimemoe/compliance` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html). While on 0.x, a rule or data change that can change a verdict is a minor version.

## [Unreleased]

## [0.1.0] - 2026-09-23

### Added

- `evaluateBeatmapset`: the osu! mappool content rules, ported from [hburn7/omc-api](https://github.com/hburn7/omc-api), with verdicts `ok`, `potential` or `disallowed` and a reason.
- `factsFromOsuBeatmapset` builds the input from an osu! API v2 beatmapset.
- `verdictText`, `REASON_TEXT` and the other text constants for showing verdicts.
- `isLeaderboardStatus`, `COMPLIANCE_STATUSES`, `COMPLIANCE_REASONS`, `UPSTREAM` and `RULE_LINKS`.
- Artist, override, source and label data vendored from omc-api at `bb356b3` (2026-06-28), with hashes pinned in `docs/vendored-data.md`.

[unreleased]: https://github.com/haruhimemoe/compliance/compare/085262bc158d7b8ce2580b62a7b6b147b7923ed5...HEAD
[0.1.0]: https://github.com/haruhimemoe/compliance/tree/085262bc158d7b8ce2580b62a7b6b147b7923ed5
