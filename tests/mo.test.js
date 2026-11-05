import assert from "node:assert/strict";
import { test } from "node:test";

import { buildEmptyMo } from "../src/mo.js";

test("the empty .mo has a valid little-endian header with one (header) entry", () => {
  const mo = buildEmptyMo();
  assert.equal(mo.readUInt32LE(0), 0x950412de);
  assert.equal(mo.readUInt32LE(4), 0);
  const count = mo.readUInt32LE(8);
  assert.equal(count, 1);
  const originals = mo.readUInt32LE(12);
  const translations = mo.readUInt32LE(16);
  assert.equal(mo.readUInt32LE(20), 0); // no hash table

  const idLength = mo.readUInt32LE(originals);
  const idOffset = mo.readUInt32LE(originals + 4);
  assert.equal(idLength, 0);
  assert.equal(mo[idOffset], 0); // NUL-terminated empty msgid

  const strLength = mo.readUInt32LE(translations);
  const strOffset = mo.readUInt32LE(translations + 4);
  const header = mo.subarray(strOffset, strOffset + strLength).toString("utf8");
  assert.match(header, /Content-Type: text\/plain; charset=UTF-8/);
  assert.equal(mo[strOffset + strLength], 0);
  assert.equal(mo.length, strOffset + strLength + 1);
});
