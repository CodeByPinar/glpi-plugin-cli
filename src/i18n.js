const MESSAGES = {
  en: {
    intro: " create-glpi-plugin ",
    "key.prompt": "Plugin key (folder name: lowercase letters and digits, e.g. myplugin)",
    "key.placeholder": "myplugin",
    "key.invalid": "Use 2–30 lowercase letters or digits, starting with a letter. It becomes the folder, the namespace GlpiPlugin\\Key and the table prefix glpi_plugin_key_.",
    "key.missing": "Give the plugin key: create-glpi-plugin <key> --yes",
    "name.prompt": "Display name (shown in Setup → Plugins and in the menu)",
    "description.prompt": "One-line description (optional)",
    "author.prompt": "Author",
    "glpi.prompt": "Which GLPI versions should it run on?",
    "glpi.both": "GLPI 11 and 12, one code base (recommended)",
    "glpi.11": "GLPI 11 only",
    "glpi.12": "GLPI 12 only",
    "features.prompt": "Which parts do you need? (space to toggle)",
    "features.menu": "Menu entry with an overview page",
    "features.config": "Settings page (Setup → Plugins → your plugin)",
    "features.itemtype": "Item type: table, list with search, form, history (adds the menu)",
    "features.cron": "Automatic action (cron task)",
    "features.tickettab": "Tab on tickets",
    "sector.prompt": "Where should the menu entry go?",
    "sector.plugins": "Plugins",
    "sector.tools": "Tools",
    "sector.admin": "Administration",
    "sector.management": "Management",
    "sector.assets": "Assets",
    "sector.helpdesk": "Assistance",
    "sector.config": "Setup",
    "agents.prompt": "Which AI coding tools do you use? (AGENTS.md and docs/glpi-rules.md are always written)",
    "agents.claude": "Claude Code (CLAUDE.md + a skill)",
    "agents.cursor": "Cursor (.cursor/rules)",
    "license.prompt": "License",
    "license.gpl": "GPL-3.0-or-later (same as GLPI, recommended)",
    "license.mit": "MIT",
    "git.prompt": "Create the first git commit?",
    cancelled: "Cancelled. Nothing was written.",
    "dir.exists": "The folder {dir} exists and is not empty. Pick another key or pass --force to write into it anyway.",
    "spinner.start": "Writing {key}…",
    "spinner.done": "{count} files written to {dir}",
    "git.done": "Git repository initialised with a first commit.",
    "git.skipped": "Git skipped: {reason}",
    "git.missing": "git is not installed",
    "git.identity": "no git identity (set user.name / user.email, then commit yourself)",
    "next.title": "Next steps",
    "next.steps": [
      "Copy or symlink the folder into <glpi>/plugins/{key}",
      "Install and enable it: Setup → Plugins, or from the GLPI folder:",
      "   php bin/console {prefix}plugin:install {key} -u glpi && php bin/console {prefix}plugin:activate {key}",
      "Open <glpi>/plugins/{key}/front/{page}.php",
      "Read docs/glpi-rules.md before you change the code. Your AI tools read it too.",
      "No GLPI at hand?  cd {key}/docker && docker compose up -d  →  http://localhost:8080 (glpi / glpi)",
    ],
    outro: "Happy hacking.",
    "error.invalidOption": "Invalid value for --{flag}: {value}. Allowed: {allowed}",
    help: `create-glpi-plugin — scaffold a GLPI 11 / 12 plugin

Usage
  npx create-glpi-plugin [key] [options]
  npm create glpi-plugin [key] -- [options]

Options
  --display <name>        Display name (default: the key, capitalised)
  --description <text>    One-line description
  --author <name>         Author name
  --glpi both|11|12       GLPI target (default: both)
  --features <list>       Comma-separated: menu,config,itemtype,cron,tickettab or none (default: menu,config)
  --sector <name>         Menu sector: plugins,tools,admin,management,assets,helpdesk,config (default: plugins)
  --agent <list>          AI coding tools: claude,cursor or none (default: claude,cursor)
  --license <id>          GPL-3.0-or-later or MIT (default: GPL-3.0-or-later)
  --repo <url>            Homepage / repository URL written into setup.php and plugin.xml
  --icon <class>          Tabler icon class for the menu (default: ti ti-puzzle)
  --dir <path>            Output folder (default: ./<key>)
  --force                 Write into a non-empty folder
  --no-git                Do not create the first git commit
  -y, --yes               Non-interactive: flags + defaults, no prompts
  --tr                    Turkish prompts
  -v, --version           Print the version
  -h, --help              Show this help

Examples
  npx create-glpi-plugin
  npx create-glpi-plugin inventorynotes --features menu,itemtype,cron --glpi both --yes
`,
  },
  tr: {
    intro: " create-glpi-plugin ",
    "key.prompt": "Eklenti anahtarı (klasör adı: küçük harf ve rakam, ör. eklentim)",
    "key.placeholder": "eklentim",
    "key.invalid": "Harfle başlayan 2–30 küçük harf veya rakam. Klasör adı, GlpiPlugin\\Anahtar ad alanı ve glpi_plugin_anahtar_ tablo öneki olur.",
    "key.missing": "Eklenti anahtarını verin: create-glpi-plugin <anahtar> --yes",
    "name.prompt": "Görünen ad (Ayarlar → Eklentiler ve menüde görünür)",
    "description.prompt": "Tek satır açıklama (isteğe bağlı)",
    "author.prompt": "Yazar",
    "glpi.prompt": "Hangi GLPI sürümlerinde çalışsın?",
    "glpi.both": "GLPI 11 ve 12, tek kod tabanı (önerilen)",
    "glpi.11": "Yalnızca GLPI 11",
    "glpi.12": "Yalnızca GLPI 12",
    "features.prompt": "Hangi parçalar gerekli? (boşluk ile seç)",
    "features.menu": "Menü girdisi ve genel bakış sayfası",
    "features.config": "Ayar sayfası (Ayarlar → Eklentiler → eklentiniz)",
    "features.itemtype": "Nesne tipi: tablo, aramalı liste, form, geçmiş (menüyü de ekler)",
    "features.cron": "Otomatik eylem (cron görevi)",
    "features.tickettab": "Taleplerde sekme",
    "sector.prompt": "Menü girdisi nereye gelsin?",
    "sector.plugins": "Eklentiler",
    "sector.tools": "Araçlar",
    "sector.admin": "Yönetim",
    "sector.management": "İşletme",
    "sector.assets": "Varlıklar",
    "sector.helpdesk": "Destek",
    "sector.config": "Ayarlar",
    "agents.prompt": "Hangi yapay zekâ kodlama araçlarını kullanıyorsunuz? (AGENTS.md ve docs/glpi-rules.md her zaman yazılır)",
    "agents.claude": "Claude Code (CLAUDE.md + skill)",
    "agents.cursor": "Cursor (.cursor/rules)",
    "license.prompt": "Lisans",
    "license.gpl": "GPL-3.0-or-later (GLPI ile aynı, önerilen)",
    "license.mit": "MIT",
    "git.prompt": "İlk git commit'i oluşturulsun mu?",
    cancelled: "İptal edildi. Hiçbir şey yazılmadı.",
    "dir.exists": "{dir} klasörü var ve boş değil. Başka bir anahtar seçin veya yine de yazmak için --force verin.",
    "spinner.start": "{key} yazılıyor…",
    "spinner.done": "{count} dosya yazıldı: {dir}",
    "git.done": "Git deposu ilk commit ile oluşturuldu.",
    "git.skipped": "Git atlandı: {reason}",
    "git.missing": "git kurulu değil",
    "git.identity": "git kimliği yok (user.name / user.email ayarlayıp kendiniz commit edin)",
    "next.title": "Sonraki adımlar",
    "next.steps": [
      "Klasörü <glpi>/plugins/{key} içine kopyalayın veya bağlayın",
      "Kurup etkinleştirin: Ayarlar → Eklentiler, ya da GLPI klasöründen:",
      "   php bin/console {prefix}plugin:install {key} -u glpi && php bin/console {prefix}plugin:activate {key}",
      "<glpi>/plugins/{key}/front/{page}.php adresini açın",
      "Kodu değiştirmeden önce docs/glpi-rules.md dosyasını okuyun. Yapay zekâ araçlarınız da okur.",
      "Elinizde GLPI yok mu?  cd {key}/docker && docker compose up -d  →  http://localhost:8080 (glpi / glpi)",
    ],
    outro: "Kolay gelsin.",
    "error.invalidOption": "--{flag} için geçersiz değer: {value}. İzin verilenler: {allowed}",
    help: `create-glpi-plugin — GLPI 11 / 12 eklenti iskeleti

Kullanım
  npx create-glpi-plugin [anahtar] [seçenekler]

Seçenekler
  --display <ad>          Görünen ad (varsayılan: anahtar, baş harfi büyük)
  --description <metin>   Tek satır açıklama
  --author <ad>           Yazar adı
  --glpi both|11|12       GLPI hedefi (varsayılan: both)
  --features <liste>      Virgülle: menu,config,itemtype,cron,tickettab veya none (varsayılan: menu,config)
  --sector <ad>           Menü bölümü: plugins,tools,admin,management,assets,helpdesk,config (varsayılan: plugins)
  --agent <liste>         Yapay zekâ araçları: claude,cursor veya none (varsayılan: claude,cursor)
  --license <id>          GPL-3.0-or-later veya MIT (varsayılan: GPL-3.0-or-later)
  --repo <url>            setup.php ve plugin.xml içine yazılacak depo adresi
  --icon <sınıf>          Menü için Tabler ikon sınıfı (varsayılan: ti ti-puzzle)
  --dir <yol>             Çıktı klasörü (varsayılan: ./<anahtar>)
  --force                 Boş olmayan klasöre yaz
  --no-git                İlk git commit'ini oluşturma
  -y, --yes               Etkileşimsiz: bayraklar + varsayılanlar
  --tr                    Türkçe sorular
  -v, --version           Sürümü yazdır
  -h, --help              Bu yardımı göster
`,
  },
};

let locale = "en";

export function setLocale(value) {
  locale = value in MESSAGES ? value : "en";
}

export function getLocale() {
  return locale;
}

/** Locale from the environment: Turkish when LANG / LC_ALL / LC_MESSAGES starts with `tr`. */
export function detectLocale(env = process.env) {
  const value = env.LC_ALL || env.LC_MESSAGES || env.LANG || "";
  return /^tr/i.test(value) ? "tr" : "en";
}

/**
 * @param {string} key
 * @param {Record<string, string | number>} [vars] `{name}` placeholders
 */
export function t(key, vars = {}) {
  const message = MESSAGES[locale][key] ?? MESSAGES.en[key];
  if (message === undefined) throw new Error(`missing message: ${key}`);
  const fill = (text) => text.replace(/\{(\w+)\}/g, (whole, name) => (name in vars ? String(vars[name]) : whole));
  return Array.isArray(message) ? message.map(fill) : fill(message);
}
