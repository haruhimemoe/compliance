/**
 * @file tests/vendor.test.ts
 * @desc The vendored omc-api data matches the hashes and commit recorded in
 *       docs/vendored-data.md, and ships with its license.
 * @author David @dvhsh (https://dvh.sh)
 * @created Wed Sep 23, 2026
 * @modified Wed Sep 23, 2026
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
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

  it.each([
    "artists/restricted.json",
    "labels/MEGAREX.json",
    "overrides/edge-cases.json",
    "sources/banned.json",
    "LICENSE",
  ])("%s matches the hash in the doc", (file) => {
    expect(doc).toContain(`| \`${file}\` |`);
    expect(doc).toContain(sha256(file));
  });

  it("ships the MIT license, and the package license carries its notice", () => {
    expect(readFileSync(path.join(DATA, "LICENSE"), "utf8")).toContain("MIT License");
    expect(readFileSync(path.join(ROOT, "LICENSE"), "utf8")).toContain("Copyright (c) 2025 hburn7");
  });
});
