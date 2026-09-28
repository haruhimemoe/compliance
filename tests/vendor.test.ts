/**
 * @file tests/vendor.test.ts
 * @desc The vendored omc-api data matches the hashes and commit recorded in
 *       docs/vendored-data.md, and ships with its license. The doc's table is the one list of
 *       vendored files: every file in src/data/ has a row, and every row a file.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Mon Sep 28, 2026
 */

import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { UPSTREAM } from "../src/index.js";

const ROOT = path.resolve(import.meta.dirname, "..");
const DATA = path.join(ROOT, "src", "data");
const doc = readFileSync(path.join(ROOT, "docs", "vendored-data.md"), "utf8");
const sha256 = (file: string) =>
  createHash("sha256")
    .update(readFileSync(path.join(DATA, file)))
    .digest("hex");

describe("vendored omc-api data", () => {
  it("records the upstream commit in the doc", () => {
    expect(doc).toContain(UPSTREAM.commit);
  });

  // Each row: | `file` | `upstream path` | `sha256` |, so a hash stays tied to its own file.
  const rows = [...doc.matchAll(/^\| `([^`]+)` \| `[^`]+` \| `([0-9a-f]{64})` \|$/gm)].map(
    ([, file = "", hash = ""]) => [file, hash] as const,
  );

  it("has a row for every vendored file, and a file for every row", () => {
    const files = readdirSync(DATA, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => path.relative(DATA, path.join(entry.parentPath, entry.name)))
      .sort();
    expect(rows.map(([file]) => file).sort()).toEqual(files);
  });

  it.each(rows)("%s matches the hash in the doc", (file, hash) => {
    expect(sha256(file)).toBe(hash);
  });

  it("ships the MIT license, and the package license carries its notice", () => {
    expect(readFileSync(path.join(DATA, "LICENSE"), "utf8")).toContain("MIT License");
    expect(readFileSync(path.join(ROOT, "LICENSE"), "utf8")).toContain("Copyright (c) 2025 hburn7");
  });
});
