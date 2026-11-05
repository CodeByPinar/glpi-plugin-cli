/**
 * A header-only GNU gettext .mo file.
 *
 * GLPI registers a plugin's text domain only when a `locales/<lang>.mo` or `locales/en_GB.mo` exists. Without one,
 * every `__('…', 'plugin')` call re-runs the loader (≈150 µs instead of <1 µs), which adds up to tenths of a second
 * on a busy page. This file carries no translations; it just makes the domain known.
 */
export function buildEmptyMo() {
  const header = "Content-Type: text/plain; charset=UTF-8\nContent-Transfer-Encoding: 8bit\n";
  const msgid = Buffer.from("\0", "latin1");
  const msgstr = Buffer.from(header + "\0", "utf8");

  const count = 1;
  const originalsOffset = 28;
  const translationsOffset = originalsOffset + 8 * count;
  const hashOffset = translationsOffset + 8 * count;
  const msgidOffset = hashOffset; // hash table is empty
  const msgstrOffset = msgidOffset + msgid.length;

  const buffer = Buffer.alloc(msgstrOffset + msgstr.length);
  buffer.writeUInt32LE(0x950412de, 0); // magic
  buffer.writeUInt32LE(0, 4); // format revision
  buffer.writeUInt32LE(count, 8);
  buffer.writeUInt32LE(originalsOffset, 12);
  buffer.writeUInt32LE(translationsOffset, 16);
  buffer.writeUInt32LE(0, 20); // hash table size
  buffer.writeUInt32LE(hashOffset, 24);
  buffer.writeUInt32LE(msgid.length - 1, originalsOffset);
  buffer.writeUInt32LE(msgidOffset, originalsOffset + 4);
  buffer.writeUInt32LE(msgstr.length - 1, translationsOffset);
  buffer.writeUInt32LE(msgstrOffset, translationsOffset + 4);
  msgid.copy(buffer, msgidOffset);
  msgstr.copy(buffer, msgstrOffset);
  return buffer;
}
