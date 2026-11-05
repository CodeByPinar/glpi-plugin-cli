import assert from "node:assert/strict";
import { test } from "node:test";

import { renderString } from "../src/render.js";

test("replaces placeholders and keeps backslashes before them", () => {
  assert.equal(renderString("GlpiPlugin\\{{Key}}\\Item", { Key: "Demo" }), "GlpiPlugin\\Demo\\Item");
  assert.equal(renderString("{{ key }} / {{KEY}}", { key: "demo", KEY: "DEMO" }), "demo / DEMO");
});

test("throws on unknown placeholders and conditions", () => {
  assert.throws(() => renderString("{{nope}}", {}), /unknown placeholder \{\{nope\}\}/);
  assert.throws(() => renderString("{{#if nope}}x{{/if}}", {}), /unknown condition/);
  assert.throws(() => renderString("{{#if a}}x", { a: true }), /unclosed/);
  assert.throws(() => renderString("{{#if a}}x{{/unless}}", { a: true }), /unbalanced/);
});

test("{{lb}} yields a literal double brace", () => {
  assert.equal(renderString("Twig: {{lb}} var }}", {}), "Twig: {{ var }}");
});

test("block tags on their own line vanish with the line", () => {
  const template = ["a", "{{#if yes}}", "b", "{{/if}}", "{{#if no}}", "c", "{{/if}}", "d", ""].join("\n");
  assert.equal(renderString(template, { yes: true, no: false }), "a\nb\nd\n");
});

test("indented block tags keep the indentation of the content only", () => {
  const template = "    x\n    {{#if yes}}\n    y\n    {{/if}}\n    z\n";
  assert.equal(renderString(template, { yes: true }), "    x\n    y\n    z\n");
});

test("inline tags, else and unless", () => {
  assert.equal(renderString("READ{{#if a}} | UPDATE{{/if}}{{#unless a}} | NONE{{/unless}};", { a: true }), "READ | UPDATE;");
  assert.equal(renderString("READ{{#if a}} | UPDATE{{/if}}{{#unless a}} | NONE{{/unless}};", { a: false }), "READ | NONE;");
  assert.equal(renderString("{{#if a}}yes{{else}}no{{/if}}", { a: false }), "no");
});

test("nested blocks", () => {
  const template = "{{#if a}}A{{#if b}}B{{else}}b{{/if}}{{/if}}{{#unless a}}-{{/unless}}";
  assert.equal(renderString(template, { a: true, b: true }), "AB");
  assert.equal(renderString(template, { a: true, b: false }), "Ab");
  assert.equal(renderString(template, { a: false, b: true }), "-");
});

test("GitHub expressions survive (dots are not placeholders)", () => {
  const line = "name: PHP ${{ matrix.php }} on ${{ steps.v.outputs.version }}";
  assert.equal(renderString(line, {}), line);
});
