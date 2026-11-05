/**
 * Tiny template language used by the files under templates/:
 *
 *   {{key}}                      value from the context (unknown names throw, so typos never ship)
 *   {{#if menu}} … {{/if}}       block kept when ctx.menu is truthy
 *   {{#unless menu}} … {{/unless}}
 *   {{else}}                     inside either block
 *   {{lb}}                       a literal "{{" (for docs that show Twig); the context always provides it
 *
 * A block tag alone on its line disappears with the line, so the output has no blank lines where a tag was.
 * Inline tags (`READ{{#if x}} | UPDATE{{/if}}`) work too. A backslash before a tag is ordinary text, so
 * `GlpiPlugin\{{Key}}` renders as expected.
 */

const TAG_SPLIT = /(\{\{(?:#if \w+|#unless \w+|else|\/if|\/unless)\}\})/;
const TAG = /^\{\{(#if|#unless|else|\/if|\/unless)(?: (\w+))?\}\}$/;
const OWN_LINE_TAG = /^[ \t]*(\{\{(?:#if \w+|#unless \w+|else|\/if|\/unless)\}\})[ \t]*\r?\n/gm;

/**
 * @param {string} template
 * @param {Record<string, unknown>} ctx
 * @param {string} [file] used in error messages
 */
export function renderString(template, ctx, file = "template") {
  const source = template.replace(OWN_LINE_TAG, "$1");
  const parts = source.split(TAG_SPLIT);
  /** @type {{ kind: string, active: boolean }[]} */
  const stack = [];
  const isActive = () => stack.every((frame) => frame.active);
  let out = "";

  for (const part of parts) {
    const match = TAG.exec(part);
    if (!match) {
      if (isActive()) out += part;
      continue;
    }
    const [, tag, name] = match;
    if (tag === "#if" || tag === "#unless") {
      if (!(name in ctx)) throw new Error(`${file}: unknown condition "${name}" in ${part}`);
      const value = Boolean(ctx[name]);
      stack.push({ kind: tag.slice(1), active: tag === "#if" ? value : !value });
    } else if (tag === "else") {
      const top = stack.at(-1);
      if (!top) throw new Error(`${file}: {{else}} outside of a block`);
      top.active = !top.active;
    } else {
      const top = stack.pop();
      if (!top || top.kind !== tag.slice(1)) throw new Error(`${file}: unbalanced ${part}`);
    }
  }
  if (stack.length > 0) throw new Error(`${file}: unclosed {{#${stack.at(-1).kind}}}`);

  return out.replace(/\{\{\s*(\w+)\s*\}\}/g, (whole, name) => {
    if (name === "lb" && !("lb" in ctx)) return "{{";
    if (!(name in ctx)) throw new Error(`${file}: unknown placeholder ${whole}`);
    return String(ctx[name]);
  });
}
