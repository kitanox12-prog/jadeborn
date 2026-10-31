/* ===================== LANGUAGE: English / Türkçe =====================
   Only the gameplay language changes; Orhun, Handan, Lumen, NPC and place names stay as they are.
   How it works: TR_DICT (l_tr.js) maps English text, with every number replaced by '#', to Turkish
   ('#' is filled back in order, '#1'..'#9' when the order changes). Content tables are translated
   once at load, descriptions that are functions get wrapped, canvas text goes through tr(), and a
   MutationObserver translates any English the UI writes into the page. TR_PATS covers sentences
   with names inside, trItem() rebuilds generated item names. */
const LANG = (() => { try { const v = localStorage.getItem('jadeborn_lang'); if (v === 'en' || v === 'tr') return v; } catch (e) { } return /^tr/i.test(navigator.language || '') ? 'tr' : 'en'; })();
const TR_ON = LANG === 'tr';
const TR_MAP = new Map(Object.entries(TR_DICT));
const TR_CACHE = new Map(), TR_MISS = new Set();
const TR_NUM = /\d+(?:\.\d+)?/g;
function trSkel(s) { return s.replace(TR_NUM, '#'); }
function trFill(t, n) {
  if (/#[1-9]/.test(t)) return t.replace(/#([1-9])/g, (_, i) => n[i - 1] !== undefined ? n[i - 1] : '');
  let i = 0; return t.replace(/#/g, () => n[i] !== undefined ? n[i++] : '#');
}
function setLang(l) {
  try { if (G.started && G.mode !== 'survivor') saveGame(true); localStorage.setItem('jadeborn_lang', l); } catch (e) { }
  location.reload();
}

/* ---------- generated item names: "Moonlit Sabre of the Fen" -> "Bataklığın Ay Işıklı Palası" ---------- */
const TR_ITEM = {
  pre: { 'Worn': 'Yıpranmış', 'Plain': 'Sade', 'Sturdy': 'Sağlam', "Traveler's": 'Yolcu', 'Fine': 'Kaliteli', 'Tempered': 'Su Verilmiş', 'Keen': 'Keskin', 'Polished': 'Cilalı',
    'Lanternforged': 'Fenerdövme', 'Moonlit': 'Ay Işıklı', 'Emberwrought': 'Kordövme', 'Duskwoven': 'Akşamdokuma', 'Jadeborn': 'Yeşimdoğan', "Dawnbreaker's": 'Şafakkıran', 'First-Light': 'İlkışık', 'Starfallen': 'Yıldızdüşmüş' },
  base: { 'Longsword': ['Uzun Kılıç', 'Uzun Kılıcı'], 'Sabre': ['Pala', 'Palası'], 'Broadblade': ['Geniş Kılıç', 'Geniş Kılıcı'], "Duelist's Blade": ['Düellocu Kılıcı', 'Düellocu Kılıcı'],
    'Greataxe': ['Büyük Balta', 'Büyük Baltası'], "Headsman's Axe": ['Cellat Baltası', 'Cellat Baltası'], 'War Cleaver': ['Savaş Satırı', 'Savaş Satırı'],
    'Spear': ['Mızrak', 'Mızrağı'], 'Glaive': ['Kılıçlı Mızrak', 'Kılıçlı Mızrağı'], 'Halberd': ['Teber', 'Teberi'],
    'Twin Blades': ['İkiz Kılıçlar', 'İkiz Kılıçları'], 'Paired Fangs': ['Çift Diş', 'Çift Dişi'], 'Twin Sabres': ['İkiz Palalar', 'İkiz Palaları'],
    'Staff': ['Asa', 'Asası'], 'Rod': ['Çubuk', 'Çubuğu'], 'Willow Stave': ['Söğüt Asa', 'Söğüt Asası'], 'Lantern Staff': ['Fener Asası', 'Fener Asası'],
    'Orb': ['Küre', 'Küresi'], 'Moon Sphere': ['Ay Küresi', 'Ay Küresi'], "Seer's Orb": ['Kâhin Küresi', 'Kâhin Küresi'],
    'Wand': ['Değnek', 'Değneği'], 'Jade Wand': ['Yeşim Değnek', 'Yeşim Değneği'], 'Spark Rod': ['Kıvılcım Çubuğu', 'Kıvılcım Çubuğu'],
    'Tome': ['Kitap', 'Kitabı'], 'Grimoire': ['Büyü Kitabı', 'Büyü Kitabı'], 'Storm Codex': ['Fırtına Kodeksi', 'Fırtına Kodeksi'],
    'Brigandine': ['Pullu Yelek', 'Pullu Yeleği'], 'Mail Coat': ['Zincir Zırh', 'Zincir Zırhı'], 'Leather Jerkin': ['Deri Yelek', 'Deri Yeleği'], 'Scale Hauberk': ['Pul Zırh', 'Pul Zırhı'],
    'Robe': ['Cübbe', 'Cübbesi'], 'Mantle': ['Pelerin', 'Pelerini'], 'Spellweave Coat': ['Büyüdokuma Ceket', 'Büyüdokuma Ceketi'], 'Night Robe': ['Gece Cübbesi', 'Gece Cübbesi'],
    'Warband Token': ['Savaş Bölüğü Nişanı', 'Savaş Bölüğü Nişanı'], 'Iron Signet': ['Demir Mühür', 'Demir Mührü'], "Duelist's Charm": ['Düellocu Tılsımı', 'Düellocu Tılsımı'],
    'Oathband': ['Yemin Yüzüğü', 'Yemin Yüzüğü'], 'Wolf-Tooth Pendant': ['Kurt Dişi Kolye', 'Kurt Dişi Kolyesi'],
    'Jade Charm': ['Yeşim Tılsım', 'Yeşim Tılsımı'], 'Moonstone Band': ['Aytaşı Yüzük', 'Aytaşı Yüzüğü'], 'Lantern Locket': ['Fener Madalyon', 'Fener Madalyonu'],
    'Spellbound Ring': ['Büyülü Yüzük', 'Büyülü Yüzüğü'], 'Starlit Brooch': ['Yıldızlı Broş', 'Yıldızlı Broşu'],
    'Charm': ['Tılsım', 'Tılsımı'], 'Band': ['Yüzük', 'Yüzüğü'], 'Amulet': ['Muska', 'Muskası'], 'Lantern Token': ['Fener Nişanı', 'Fener Nişanı'], 'Signet': ['Mühür', 'Mührü'] },
  suf: { ' of the Fen': 'Bataklığın', ' of Embers': 'Közlerin', ' of Brightfield': "Brightfield'in", ' of the Keep': 'Kalenin', ' of Velmara': "Velmara'nın",
    ' of the Ember Road': "Kor Yolu'nun", ' of Frostspire': "Frostspire'ın", ' of the Cold Forge': 'Soğuk Ocağın', ' of the Emberwood': "Emberwood'un", ' of Glasswater': "Glasswater'ın",
    ' of the Starwatch': "Yıldız Gözcüleri'nin", ' of the Sunscar Dunes': "Sunscar Dunes'un", ' of the Thornveil': "Thornveil'in", ' of the Cindermaw Caldera': "Cindermaw Caldera'nın",
    ' of the Skyreach Spires': "Skyreach Spires'ın", ' of the Dawnless Gate': "Dawnless Gate'in" },
};
TR_ITEM.preKeys = Object.keys(TR_ITEM.pre).sort((a, b) => b.length - a.length);
function trItem(s) {
  let suf = '';
  for (const k in TR_ITEM.suf) if (s.endsWith(k)) { suf = k; break; }
  const body = suf ? s.slice(0, -suf.length) : s;
  const pre = TR_ITEM.preKeys.find(k => body.startsWith(k + ' ')); if (!pre) return null;
  const base = TR_ITEM.base[body.slice(pre.length + 1)]; if (!base) return null;
  return suf ? `${TR_ITEM.suf[suf]} ${TR_ITEM.pre[pre]} ${base[1]}` : `${TR_ITEM.pre[pre]} ${base[0]}`;
}

/* ---------- sentences with names or markup inside ---------- */
const TR_PATS = [
  [/^(Orhun|Handan) learned <b>(.+)<\/b>$/, m => `${m[1]} <b>${tr(m[2])}</b> becerisini öğrendi`],
  [/^New skill for (Orhun|Handan): <b>(.+)<\/b>\. Equip it in Skills \(K\)\.$/, m => `${m[1]} için yeni beceri: <b>${tr(m[2])}</b>. Beceriler (K) penceresinden takabilirsin.`],
  [/^Bags full\. Sold (<span[^>]*>)(.+)<\/span> for (\d+)g$/, m => `Çanta dolu. ${m[1]}${tr(m[2])}</span> ${m[3]} altına satıldı`],
  [/^Loot: (<span[^>]*>)(.+)<\/span>$/, m => `Ganimet: ${m[1]}${tr(m[2])}</span>`],
  [/^<b>(.+)<\/b> complete\. Return to (.+)\.$/, m => `<b>${tr(m[1])}</b> tamamlandı. ${tr(m[2])} seni bekliyor.`],
  [/^Quest accepted: <b>(.+)<\/b>$/, m => `Görev alındı: <b>${tr(m[1])}</b>`],
  [/^<b>(.+)<\/b> turned in\. \+(\d+) xp, \+(\d+)g$/, m => `<b>${tr(m[1])}</b> teslim edildi. +${m[2]} XP, +${m[3]} altın`],
  [/^(.+) has fallen([.!])$/, m => `${tr(m[1])} düştü${m[2]}`],
  [/^(.+) is back on (?:their|his|her) feet\.$/, m => `${tr(m[1])} yeniden ayağa kalktı.`],
  [/^(.+) rises again\.$/, m => `${tr(m[1])} yeniden ayağa kalkıyor.`],
  [/^The gate of (.+) opens\.$/, m => `${m[1]} kapısı açılıyor.`],
  [/^The way east is sealed until (.+) burns again\.$/, m => `Doğu yolu, ${tr(m[1])} yeniden yanana dek kapalı.`],
  [/^(.+) burns again$/, m => `${tr(m[1])} yeniden yanıyor`],
  [/^(.+)! Dodge to break free!$/, m => `${tr(m[1])}! Kurtulmak için yuvarlan!`],
  [/^E {1,2}Talk to (.+)$/, m => `E  ${tr(m[1])} ile konuş`],
  [/^\+(\d+)g$/, m => `+${m[1]} altın`],
  [/^\+(\d+) xp$/, m => `+${m[1]} XP`],
  [/^Evolved: (.+)$/, m => `Evrimleşti: ${tr(m[1])}`],
  [/^Speak with (.+)$/, m => `${tr(m[1])} ile konuş`],
  [/^Return to (.+)$/, m => `Teslim: ${tr(m[1])}`],
  [/^Relight the beacon of (.+)$/, m => `${m[1]} işaret fenerini yeniden yak`],
  [/^Travelling to (.+)$/, m => `${m[1]} yolculuğu…`],
  [/^Orhun & Handan · (.+) · (.+)$/, m => `Orhun & Handan · ${m[1]} · ${m[2]}`],
  [/^Filter: (.+)$/, m => `Filtre: ${tr(m[1])}`],
  [/^Quest accepted: (.+)$/, m => `Görev alındı: ${tr(m[1])}`],
  [/^(.+) complete\. Return to (.+)\.$/, m => `${tr(m[1])} tamamlandı. ${tr(m[2])} seni bekliyor.`],
  [/^(.+) turned in\. \+(\d+) xp, \+(\d+)g$/, m => `${tr(m[1])} teslim edildi. +${m[2]} XP, +${m[3]} altın`],
  [/^(\d+)g$/, m => `${m[1]} altın`],
  [/^Lv (\d+) (.+)$/, m => `Sv ${m[1]} ${tr(m[2])}`],
  [/^casting (.+)$/, m => `${tr(m[1])} hazırlıyor`],
  [/^Talents: (.+)$/, m => `Yetenekler: ${m[1].split(', ').map(tr).join(', ')}`],
  [/^Trinkets go to the hero you are playing \((.+)\)\.$/, m => `Takılar oynadığın kahramana gider (${m[1]}).`],
  [/^(\S+) (armor|trinket|weapon)$/, m => `${tr(m[1])} ${{ armor: 'zırh', trinket: 'takı', weapon: 'silah' }[m[2]]}`],
  [/^(\S+) gear$/, m => `${tr(m[1])} teçhizat`],
  [/^(Common|Uncommon|Rare|Epic|Legendary) (.+)$/, m => `${tr(m[1])} ${tr(m[2])}`],
  [/^Level (\d+) · (\d+) (Hollow|foes) defeated · (\d+) gold carried$/, m => `Seviye ${m[1]} · ${m[2]} ${m[3] === 'Hollow' ? 'Hiçlik' : 'düşman'} yenildi · ${m[4]} altın`],
];

function tr(s) {
  if (!TR_ON || s == null) return s;
  s = String(s);
  if (!/[A-Za-z]/.test(s)) return s;
  let r = TR_CACHE.get(s); if (r !== undefined) return r;
  r = trCore(s);
  if (TR_CACHE.size > 12000) TR_CACHE.clear();
  TR_CACHE.set(s, r); if (r !== s) TR_CACHE.set(r, r);
  return r;
}
function trCore(s, shallow) {
  const m = /^(\s*)([\s\S]*?)(\s*)$/.exec(s), a = m[1], c = m[2], z = m[3];
  if (!c) return s;
  const t = TR_MAP.get(trSkel(c.replace(/\s+/g, ' ')));
  if (t !== undefined) return a + trFill(t, c.match(TR_NUM) || []) + z;
  for (const [re, f] of TR_PATS) { const mm = re.exec(c); if (mm) return a + f(mm) + z; }
  if (shallow) return s;
  const it = trItem(c); if (it) return a + it + z;
  // "· Guardian", "Berserker ·": translate what sits between the separators
  const sep = /^([·•–-]\s*)?([\s\S]*?)(\s*[·•])?$/.exec(c);
  if (sep && (sep[1] || sep[3]) && sep[2]) { const q = tr(sep[2]); if (q !== sep[2]) return a + (sep[1] || '') + q + (sep[3] || '') + z; }
  // longer text: translate it part by part (" · " lists, then sentences)
  for (const sp of [/(\s+·\s+)/, /(?<=[.!?…])(\s+)/]) {
    const parts = c.split(sp);
    if (parts.length > 2) { let ch = false; const o = parts.map((p, i) => { if (i % 2) return p; const q = tr(p); if (q !== p) ch = true; return q; }); if (ch) return a + o.join('') + z; }
  }
  if (TR_MISS.size < 3000) TR_MISS.add(c);
  return s;
}
// tag-aware: whole string first (patterns may include markup), else each text run between tags
function trHTML(s) {
  if (!TR_ON || s == null) return s;
  s = String(s);
  if (s.indexOf('<') < 0) return tr(s);
  const w = trCore(s, true); if (w !== s) return w;
  return s.split(/(<[^>]+>)/).map(p => p[0] === '<' || !p.trim() ? p : tr(p)).join('');
}
// translate a content string and remember the result as already-Turkish
function trD(s) { if (!TR_ON || typeof s !== 'string') return s; const t = tr(s); TR_CACHE.set(t, t); return t; }
function trWrapFn(o, k) { const f = o[k]; if (typeof f !== 'function' || f._tr) return; o[k] = function () { return trD(f.apply(this, arguments)); }; o[k]._tr = 1; }

/* ---------- content tables ---------- */
function trApplyData() {
  for (const q of QUESTS) { q.name = trD(q.name); q.text = trD(q.text); if (q.done && q.done !== 'end') q.done = trD(q.done); for (const o of q.obj || []) if (o.label) o.label = trD(o.label); }
  for (const k in BANTER) for (const l of BANTER[k]) l[1] = trD(l[1]);
  for (const k in NPC_TALK) NPC_TALK[k] = NPC_TALK[k].map(trD);
  for (const k in NPCS) { NPCS[k].name = trD(NPCS[k].name); if (NPCS[k].title) NPCS[k].title = trD(NPCS[k].title); }
  for (const k in FOES) FOES[k].name = trD(FOES[k].name);
  for (const k in HERO) if (HERO[k].title) HERO[k].title = trD(HERO[k].title);
  for (let i = 0; i < RARITY.length; i++) RARITY[i] = trD(RARITY[i]);
  for (const r of RARITY_B) r.n = trD(r.n);
  for (const k of ['orhun', 'handan']) for (const a of SKILL_POOL[k]) { a.name = trD(a.name); if (typeof a.desc === 'string') a.desc = trD(a.desc); else trWrapFn(a, 'desc'); }
  for (const k in DODGE) DODGE[k].name = trD(DODGE[k].name);
  for (const b of BOONS) { b.n = trD(b.n); if (typeof b.d === 'string') b.d = trD(b.d); else trWrapFn(b, 'd'); }
  for (const lv in TALENTS) for (const k in TALENTS[lv]) for (const x of TALENTS[lv][k]) { x[1] = trD(x[1]); x[2] = trD(x[2]); }
  for (const k in WPROF) { WPROF[k].name = trD(WPROF[k].name); WPROF[k].desc = trD(WPROF[k].desc); }
  if (typeof SVW !== 'undefined') {
    for (const k in SVW) { SVW[k].name = trD(SVW[k].name); if (SVW[k].evoName) SVW[k].evoName = trD(SVW[k].evoName); trWrapFn(SVW[k], 'd'); }
    for (const k in SVP) { SVP[k].name = trD(SVP[k].name); trWrapFn(SVP[k], 'd'); }
    for (const f of SV_FORGE) { f.name = trD(f.name); trWrapFn(f, 'd'); }
    for (const s of SV_STAGES) { s.name = trD(s.name); s.blurb = trD(s.blurb); }
  }
  for (const k in POSES) POSES[k] = trD(POSES[k]);
  for (const k in SPOT_INFO) SPOT_INFO[k].label = trD(SPOT_INFO[k].label);
}

/* ---------- page text ---------- */
const TR_ATTRS = ['title', 'aria-label', 'placeholder', 'data-more', 'data-lv'];
const TR_INLINE = new Set(['B', 'I', 'EM', 'STRONG', 'SMALL', 'BR', 'U']);
function trSkip(el) { return !el || el.nodeName === 'SCRIPT' || el.nodeName === 'STYLE' || (el.closest && el.closest('[data-notr]')); }
function trText(n) {
  const v = n.nodeValue; if (!v || v.length > 3000 || !/[A-Za-z]/.test(v)) return;
  if (trSkip(n.parentElement)) return;
  const t = tr(v); if (t !== v) n.nodeValue = t;
}
function trAttrs(el) { for (const a of TR_ATTRS) { const v = el.getAttribute(a); if (v && /[A-Za-z]/.test(v)) { const t = tr(v); if (t !== v) el.setAttribute(a, t); } } }
// a short element holding only <b>/<i>/<small> markup is translated as one sentence (help rows, tooltips)
function trInline(el) {
  if (!el.firstElementChild || el.id || !/[A-Za-z]/.test(el.textContent)) return false;
  for (const c of el.children) if (!TR_INLINE.has(c.nodeName) || c.id || c.className) return false;
  const h = el.innerHTML.trim(); if (h.length > 700) return false;
  const t = tr(h); if (t !== h) { el.innerHTML = t; return true; }
  return false;
}
function trTree(root) {
  if (root.nodeType === 3) return trText(root);
  if (root.nodeType !== 1 || trSkip(root)) return;
  if (root.hasAttribute && TR_ATTRS.some(a => root.hasAttribute(a))) trAttrs(root);
  root.querySelectorAll('[title],[aria-label],[placeholder],[data-more],[data-lv]').forEach(trAttrs);
  if (trInline(root)) return;
  root.querySelectorAll('td,p,li,small,span,div').forEach(e => { if (e.children.length && e.children.length < 6) trInline(e); });
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = w.nextNode())) trText(n);
}

if (TR_ON) {
  document.documentElement.lang = 'tr';
  trApplyData();
  const _ft = floatText; floatText = function (x, y, text, col, size) { return _ft(x, y, typeof text === 'string' ? tr(text) : text, col, size); };
  const _bk = bark; bark = function (who, text) { return _bk(who, trHTML(text)); };
  const _to = textOutlined; textOutlined = function (g, s, x, y, col, size) { return _to(g, typeof s === 'string' ? tr(s) : s, x, y, col, size); };
  const _toast = toast; toast = function (html) { return _toast(trHTML(html)); };
  const _ban = banner; banner = function (t, s) { return _ban(trHTML(t), s ? trHTML(s) : s); };
  const _pd = playDialog; playDialog = function (lines, onEnd) {
    return _pd(lines.map(l => Object.assign({}, l, { text: l.text != null ? trHTML(l.text) : l.text, actions: l.actions && l.actions.map(a => Object.assign({}, a, { label: tr(a.label) })) })), onEnd);
  };
  trTree(document.body);
  new MutationObserver(recs => {
    for (const r of recs) {
      if (r.type === 'characterData') trText(r.target);
      else if (r.type === 'attributes') { if (!trSkip(r.target)) trAttrs(r.target); }
      else for (const n of r.addedNodes) trTree(n);
    }
  }).observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: TR_ATTRS });
}

/* ---------- language switch: title screen + game menu ---------- */
addMenuItem({ id: 'lang', order: 84, label: TR_ON ? 'Dil: Türkçe' : 'Language: English', icon: MI('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.5 3 14.5 0 18M12 3c-3 3.5-3 14.5 0 18"/>'), fn: () => setLang(TR_ON ? 'en' : 'tr') });
