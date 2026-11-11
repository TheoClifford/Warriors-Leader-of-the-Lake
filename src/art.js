/* =========================================================================
   ART — every image in the game is painted here at runtime.
   Scenes: Canvas, layered like a woodcut print (sky, ridges, trees, figures, grain).
   Portraits, sigils, icons, map: inline SVG.
   ========================================================================= */

function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

function hexRgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function mix(a, b, t) { const A = hexRgb(a), B = hexRgb(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function rgba(hex, a) { const c = hexRgb(hex); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

/* ---------- Creature outlines (shared by canvas and SVG) ---------- */
const SHAPES = {
  sit: { w: 100, h: 98,
    d: 'M30,96 C17,92 15,72 23,60 C29,48 41,40 51,36 L53,26 C52,20 54,16 56,14 L57,3 L64,11 L72,3 L74,15 C78,19 81,24 83,28 L82,31 C80,34 77,36 72,37 C71,46 73,57 74,66 L75,93 C76,95 79,96 82,97 L30,97 Z',
    tail: 'M33,97 C16,99 2,94 5,82 C6,79 10,79 11,82 C10,90 20,92 33,92 Z' },
  walk: { w: 120, h: 77,
    d: 'M22,32 C40,26 60,26 78,28 L84,20 C85,16 86,13 88,12 L89,2 L94,9 L100,3 L101,13 C104,15 107,17 108,19 L107,22 C105,24 102,25 99,25 C95,27 92,30 91,34 C90,38 89,42 90,46 L92,74 L97,76 L85,76 L83,50 C75,52 50,52 42,50 L40,74 L43,76 L31,76 C29,66 25,56 23,46 C21,40 21,36 22,32 Z',
    far: 'M78,48 L77,73 L82,76 L84,50 Z M34,48 L36,73 L41,76 L44,50 Z',
    tail: 'M24,31 C12,28 4,20 7,8 C8,5 12,5 12,9 C10,18 16,24 25,27 Z' },
  lie: { w: 120, h: 48,
    d: 'M10,46 C8,36 16,26 34,24 C56,22 76,24 86,26 L90,18 C91,14 93,12 95,11 L96,3 L101,9 L106,4 L107,13 C110,15 113,18 114,22 L113,25 C110,28 106,29 101,29 C100,34 102,40 108,44 L114,47 L10,47 Z',
    tail: 'M12,46 C30,50 62,50 84,45 L84,47 C62,52 30,52 12,48 Z' },
  fox: { w: 140, h: 69,
    d: 'M20,30 C40,24 70,22 95,26 L104,18 L106,8 L112,16 L116,10 L117,20 C124,22 132,26 138,30 L136,32 C128,33 120,34 114,36 C108,40 104,44 102,48 L104,66 L108,68 L98,68 L94,50 C80,52 60,52 50,50 L46,66 L50,68 L40,68 C38,58 34,48 30,42 Z',
    tail: 'M26,32 C8,34 -4,48 2,60 C14,58 24,48 32,40 Z' },
  badger: { w: 140, h: 58,
    d: 'M10,50 C6,30 30,16 60,14 C85,12 105,16 118,26 C128,32 134,38 138,44 L134,47 C126,46 120,46 114,48 L112,56 L104,58 L102,50 C80,52 60,52 44,52 L42,58 L32,58 L30,52 C20,54 12,54 10,50 Z',
    tail: '' },
  dog: { w: 140, h: 88,
    d: 'M20,40 C40,34 80,34 100,36 L108,26 C110,18 116,14 122,14 L126,10 L128,16 C132,18 136,24 140,28 L138,32 C132,34 126,34 120,36 C118,42 114,48 112,52 L114,86 L120,88 L106,88 L102,58 C80,60 56,60 44,58 L40,86 L46,88 L32,88 C30,74 26,60 24,52 Z',
    tail: 'M22,40 C12,34 8,24 11,16 C13,14 15,15 15,17 C13,24 17,32 25,37 Z' },
};
const PATH_CACHE = {};
function p2d(d) { return PATH_CACHE[d] || (PATH_CACHE[d] = new Path2D(d)); }

/* ---------- Pelts ---------- */
const PELTS = {
  ginger: { b: '#c8692a', d: '#8e3f14', l: '#eca05c', n: 'Ginger' },
  golden: { b: '#c89a45', d: '#8a6424', l: '#e8c47c', n: 'Golden' },
  brown: { b: '#7a5434', d: '#4a2f1b', l: '#a67c53', n: 'Brown' },
  grey: { b: '#7f8487', d: '#4c5154', l: '#aeb4b6', n: 'Grey' },
  blue: { b: '#6c7d8e', d: '#44505e', l: '#9aabbb', n: 'Blue-grey' },
  silver: { b: '#b4bac0', d: '#6b737a', l: '#e3e8eb', n: 'Silver' },
  black: { b: '#27231f', d: '#121110', l: '#4d4843', n: 'Black' },
  white: { b: '#e6e2d8', d: '#b5ae9f', l: '#ffffff', n: 'White' },
  cream: { b: '#d8bf94', d: '#a88c60', l: '#f2e1be', n: 'Cream' },
};
const PATTERNS = { solid: 'Solid', tabby: 'Tabby', patched: 'White-patched', tortie: 'Tortoiseshell', dappled: 'Dappled' };
const EYES = { green: '#86c45d', amber: '#e3a332', blue: '#74b8e4', yellow: '#e8d64c', copper: '#cf6e2e' };

/* ---------- SVG portraits ---------- */
let SVG_UID = 0;
const TABBY_STRIPES = ['M26,62 C30,66 31,72 29,78', 'M31,52 C36,56 38,63 36,70', 'M38,45 C43,49 45,56 44,62', 'M46,40 C50,44 52,50 51,56', 'M60,15 L61,21', 'M64,13 L64,19', 'M68,14 L67,20', 'M72,27 L79,26', 'M75,75 L69,76', 'M75,83 L69,84', 'M10,92 L14,88', 'M17,96 L19,91', 'M21,72 C25,76 26,82 24,88'];
function catSVG(o) {
  const id = 'cp' + (++SVG_UID);
  const pe = PELTS[o.pelt] || PELTS.grey;
  const eye = EYES[o.eyes] || EYES.amber;
  const rng = mulberry(hashStr(o.seed || o.pelt + o.pattern));
  const S = SHAPES.sit;
  let pat = '';
  if (o.pattern === 'tabby') pat = `<g stroke="${pe.d}" stroke-width="2.6" stroke-linecap="round" fill="none" opacity=".8">${TABBY_STRIPES.map(d => `<path d="${d}"/>`).join('')}</g>`;
  if (o.pattern === 'patched') pat = `<g fill="#efeae0"><ellipse cx="74" cy="58" rx="5.5" ry="17"/><ellipse cx="79" cy="32" rx="5" ry="4"/><rect x="65" y="89" width="19" height="10"/><ellipse cx="48" cy="92" rx="16" ry="7"/></g>`;
  if (o.pattern === 'tortie') {
    const cols = [o.pelt === 'black' ? '#c8692a' : '#231e1b', o.pelt === 'ginger' ? '#231e1b' : '#c8692a', '#d8a868'];
    let s = '';
    for (let i = 0; i < 9; i++) s += `<ellipse cx="${(15 + rng() * 70).toFixed(1)}" cy="${(10 + rng() * 85).toFixed(1)}" rx="${(5 + rng() * 9).toFixed(1)}" ry="${(4 + rng() * 7).toFixed(1)}" fill="${cols[i % 3]}" opacity=".9" transform="rotate(${(rng() * 180).toFixed(0)} 50 50)"/>`;
    pat = s;
  }
  if (o.pattern === 'dappled') {
    let s = ''; for (let i = 0; i < 22; i++) s += `<circle cx="${(18 + rng() * 55).toFixed(1)}" cy="${(40 + rng() * 52).toFixed(1)}" r="${(1.2 + rng() * 1.8).toFixed(1)}" fill="${pe.l}" opacity=".85"/>`;
    pat = s;
  }
  const bg = o.bg === false ? '' : `<rect x="-20" y="-20" width="140" height="140" fill="url(#${id}bg)"/>`;
  return `<svg viewBox="${o.view || '0 -4 100 104'}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
<defs>
 <radialGradient id="${id}bg" cx=".6" cy=".35" r=".8"><stop offset="0" stop-color="#22393a"/><stop offset="1" stop-color="#0b1517"/></radialGradient>
 <linearGradient id="${id}sh" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></linearGradient>
 <clipPath id="${id}c"><path d="${S.d}"/><path d="${S.tail}"/></clipPath>
</defs>
${bg}
<ellipse cx="50" cy="98" rx="38" ry="3.5" fill="#000" opacity=".45"/>
<g clip-path="url(#${id}c)">
 <rect x="0" y="0" width="100" height="100" fill="${pe.b}"/>
 ${pat}
 <rect x="0" y="0" width="100" height="100" fill="url(#${id}sh)"/>
 <path d="M66,12 L71,6 L72,15 Z" fill="#6e3f3f" opacity=".45"/>
</g>
<ellipse cx="75.5" cy="21" rx="2.9" ry="1.9" fill="${eye}" transform="rotate(-12 75.5 21)"/>
<ellipse cx="75.6" cy="21" rx=".7" ry="1.7" fill="#0a0a0a"/>
<circle cx="76.4" cy="20.3" r=".5" fill="#fff" opacity=".9"/>
<path d="M81.5,29.5 L83.2,29.2 L82.2,31 Z" fill="#3a2424"/>
<g stroke="#f2efe6" stroke-width=".45" opacity=".55" stroke-linecap="round"><path d="M80,33 L94,31"/><path d="M80,34 L93,35.5"/><path d="M79,34.5 L91,39"/></g>
</svg>`;
}

/* ---------- Sigils & glyphs ---------- */
const SIGILS = {
  lionheart: '<circle cx="20" cy="20" r="6.5"/><g>' + Array.from({ length: 14 }, (_, i) => { const a = i / 14 * Math.PI * 2; return `<path d="M${(20 + Math.cos(a) * 9.5).toFixed(1)},${(20 + Math.sin(a) * 9.5).toFixed(1)} L${(20 + Math.cos(a + .18) * 15.5).toFixed(1)},${(20 + Math.sin(a + .18) * 15.5).toFixed(1)}"/>`; }).join('') + '</g>',
  feathertail: '<path d="M10,32 C16,24 22,14 31,7"/><path d="M14,27 C12,22 13,17 17,13 C20,17 22,20 21,22"/><path d="M18,22 C17,16 20,11 25,9 C26,13 26,16 24,18"/><path d="M14,27 C19,28 23,27 26,23 C29,19 30,14 31,7"/>',
  yellowfang: '<path d="M13,8 C14,18 17,27 22,33 C24,26 26,18 27,8 C22,10 18,10 13,8 Z"/><path d="M17,13 C18,19 20,24 22,28"/>',
  bluestar: '<path d="M20,5 L22.6,15 L32,12 L25,19 L32,26 L22.6,23 L20,33 L17.4,23 L8,26 L15,19 L8,12 L17.4,15 Z"/><path d="M6,36 C11,33 15,33 20,36 C25,39 29,39 34,36"/>',
  firestar: '<path d="M20,35 C11,34 8,26 11,19 C13,23 15,24 16,23 C14,16 18,9 24,5 C23,11 27,14 29,19 C31,24 30,33 20,35 Z"/><path d="M20,35 C16,32 16,27 19,23 C21,27 24,28 24,31 C24,33 22,35 20,35 Z"/>',
  dark: '<circle cx="20" cy="20" r="14"/><circle cx="20" cy="20" r="8" fill="#050505" stroke-dasharray="2 3"/>',
  thunder: '<path d="M20,35 L20,15"/><path d="M20,30 C13,30 9,26 11,22 C7,21 6,16 10,14 C8,10 12,6 16,8 C17,4 23,4 24,8 C28,6 32,10 30,14 C34,16 33,21 29,22 C31,26 27,30 20,30 Z"/>',
  wind: '<path d="M5,14 C14,14 22,13 27,10 C31,8 30,3 26,4"/><path d="M5,21 C16,21 26,20 31,18 C36,16 36,11 32,11"/><path d="M5,28 C14,28 21,29 25,32 C28,35 26,38 23,37"/>',
  river: '<path d="M4,15 C9,10 13,10 18,15 C23,20 27,20 32,15 C34,13 35,12 36,12"/><path d="M4,24 C9,19 13,19 18,24 C23,29 27,29 32,24 C34,22 35,21 36,21"/><path d="M4,33 C9,28 13,28 18,33 C23,38 27,38 32,33"/>',
  shadow: '<path d="M16,34 L16,30 M16,6 L9,16 L13,16 L7,24 L12,24 L5,31 L27,31 L20,24 L25,24 L19,16 L23,16 Z"/><path d="M33,6 C28,7 26,13 29,17 C31,19 34,19 36,18 C32,17 30,11 33,6 Z"/>',
  sky: '<path d="M4,26 C12,16 22,12 36,12"/><path d="M8,30 C15,22 24,19 34,19"/><path d="M12,34 C18,28 25,26 32,26"/><circle cx="31" cy="7" r="2.2"/>',
};
function sigil(key, color = 'currentColor', size = 22) {
  return `<svg viewBox="0 0 40 40" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${SIGILS[key] || ''}</svg>`;
}

const ICONS = {
  prey: '<path d="M4,15 C4,10 9,7 13,8 C15,5 19,5 20,8 C21,10 20,12 18,13 C17,16 13,17 9,17 C6,17 4,16.5 4,15 Z" fill="currentColor" stroke="none"/><circle cx="17.5" cy="9.5" r=".9" fill="#0b1517" stroke="none"/><path d="M4,15 C2,15 1,17 1.5,19 C2,21 5,21 7,20" fill="none"/>',
  herbs: '<path d="M4,20 C6,12 11,6 20,4 C19,13 14,19 4,20 Z" fill="currentColor" stroke="none" opacity=".9"/><path d="M4,20 C8,15 12,11 17,7" stroke="#0b1517"/>',
  cats: '<ellipse cx="12" cy="15.5" rx="4.6" ry="4" fill="currentColor" stroke="none"/><circle cx="5.5" cy="10" r="2.1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6" r="2.1" fill="currentColor" stroke="none"/><circle cx="14.5" cy="6" r="2.1" fill="currentColor" stroke="none"/><circle cx="18.5" cy="10" r="2.1" fill="currentColor" stroke="none"/>',
  favour: '<path d="M12,2 L14.2,9.3 L22,9.6 L15.8,14.2 L18,21.6 L12,17.2 L6,21.6 L8.2,14.2 L2,9.6 L9.8,9.3 Z" fill="currentColor" stroke="none"/>',
  mood: '<path d="M12,21 C7,21 4,17 4,13 C4,8 8,5 12,5 C16,5 20,8 20,13" fill="none"/><path d="M20,13 C20,17 17,19 14,18" fill="none"/><path d="M8,5 L7,1.5 L10.5,4 M16,5 L17,1.5 L13.5,4" fill="none"/>',
  camp: '<path d="M2,20 C4,10 8,7 12,7 C16,7 20,10 22,20" fill="none"/><path d="M6,20 C7,16 9,15 11,15 C13,15 14,17 15,20" fill="none"/><path d="M15,20 C16,18 17,17 19,17 C20,17 21,19 21,20" fill="none"/>',
  territory: '<path d="M3,20 C6,14 4,8 9,5 C13,3 15,8 19,7 C21,7 22,9 21,12 C19,16 21,19 18,21" fill="none" stroke-dasharray="2.4 2.2"/><circle cx="9" cy="5" r="1.6" fill="currentColor" stroke="none"/>',
  clans: '<circle cx="12" cy="4.5" r="2.4" fill="currentColor" stroke="none"/><circle cx="19.5" cy="10" r="2.4" fill="currentColor" stroke="none"/><circle cx="16.5" cy="19" r="2.4" fill="currentColor" stroke="none"/><circle cx="7.5" cy="19" r="2.4" fill="currentColor" stroke="none"/><circle cx="4.5" cy="10" r="2.4" fill="currentColor" stroke="none"/>',
  starclan: '<path d="M12,3 L13.6,10.4 L21,12 L13.6,13.6 L12,21 L10.4,13.6 L3,12 L10.4,10.4 Z" fill="none"/><circle cx="19" cy="4.5" r="1" fill="currentColor"/><circle cx="5" cy="19" r="1" fill="currentColor"/>',
  elders: '<path d="M3,18 C3,12 8,9 13,10 C17,10.5 20,13 21,17" fill="none"/><path d="M3,18 L21,18 M14,10 C14,7 16,5 19,5" fill="none"/><path d="M6,21 C10,19.5 15,19.5 19,21" fill="none"/>',
  saga: '<path d="M5,20 C7,14 9,9 12,3"/><path d="M10,21 C12,15 14,10 17,4"/><path d="M15,21.5 C17,17 18.5,13 21,8"/>',
  moon: '<path d="M15,3 C9,3 5,8 5,13 C5,18 9,22 14,22 C17,22 20,20 21,17 C14,18 9,13 10,8 C10.5,6 12,4 15,3 Z" fill="none"/>',
  paw: '<ellipse cx="12" cy="16" rx="5" ry="4.2" fill="currentColor" stroke="none"/><circle cx="5.2" cy="10.2" r="2.2" fill="currentColor" stroke="none"/><circle cx="9.5" cy="6.2" r="2.2" fill="currentColor" stroke="none"/><circle cx="14.5" cy="6.2" r="2.2" fill="currentColor" stroke="none"/><circle cx="18.8" cy="10.2" r="2.2" fill="currentColor" stroke="none"/>',
};
function icon(k, extra = '') { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${ICONS[k]}</svg>`; }

/* Nine lives as a small constellation */
function livesSVG(n) {
  const pts = [[8, 26], [20, 15], [33, 9], [47, 6], [61, 7], [75, 11], [88, 17], [99, 26], [108, 37]];
  let lines = '', stars = '';
  for (let i = 0; i < pts.length - 1; i++) lines += `<line x1="${pts[i][0]}" y1="${pts[i][1]}" x2="${pts[i + 1][0]}" y2="${pts[i + 1][1]}" stroke="${i < n - 1 ? 'rgba(188,214,232,.45)' : 'rgba(147,164,157,.18)'}" stroke-width="1"/>`;
  pts.forEach((p, i) => {
    const lit = i < n;
    stars += lit
      ? `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="rgba(188,214,232,.18)"/><path d="M${p[0]},${p[1] - 4.2} L${p[0] + 1.2},${p[1] - 1.2} L${p[0] + 4.2},${p[1]} L${p[0] + 1.2},${p[1] + 1.2} L${p[0]},${p[1] + 4.2} L${p[0] - 1.2},${p[1] + 1.2} L${p[0] - 4.2},${p[1]} L${p[0] - 1.2},${p[1] - 1.2} Z" fill="#dcecf6"/>`
      : `<circle cx="${p[0]}" cy="${p[1]}" r="2.2" fill="none" stroke="rgba(147,164,157,.45)" stroke-width="1"/>`;
  });
  return `<svg viewBox="0 0 116 42" width="116" height="42" role="img" aria-label="${n} of nine lives remain">${lines}${stars}</svg>`;
}

/* =========================================================================
   CANVAS SCENE PAINTER
   ========================================================================= */
const W = 1200, H = 760;
const TIMES = {
  night: { sky: ['#060d18', '#0e2033', '#1c3648'], dark: .62, stars: 1, ground: '#0e1a18' },
  dusk: { sky: ['#121735', '#4b3957', '#c47b4f'], dark: .48, stars: .3, ground: '#151714' },
  dawn: { sky: ['#1b2944', '#6a7890', '#dcb688'], dark: .36, stars: .1, ground: '#1a201a' },
  day: { sky: ['#4f7488', '#90afba', '#d3dccd'], dark: .14, stars: 0, ground: '#25301f' },
  grey: { sky: ['#4b5762', '#84919a', '#bcc5ca'], dark: .2, stars: 0, ground: '#c4ced3' },
  starless: { sky: ['#040605', '#0a0f0a', '#161d13'], dark: .78, stars: 0, ground: '#070906' },
  dream: { sky: ['#071030', '#152a58', '#2f4f86'], dark: .5, stars: 1.4, ground: '#0b1630' },
  fire: { sky: ['#140907', '#4d1d10', '#d0662a'], dark: .55, stars: 0, ground: '#140b07' },
};
const FOLIAGE = [
  ['#456f3d', '#567f46', '#35592f'],
  ['#2f5529', '#3b6733', '#24451f'],
  ['#8d5a26', '#a46c2e', '#6c4420', '#7f6b2b'],
  null,
];
const SHADOW = '#050a0c';

function Painter(ctx, seed, time, season) {
  this.c = ctx; this.r = mulberry(seed); this.t = TIMES[time] || TIMES.night; this.time = time; this.season = season;
}
Painter.prototype = {
  rand(a = 0, b = 1) { return a + (b - a) * this.r(); },
  sh(col, extra = 0) { return mix(col, SHADOW, Math.min(.95, this.t.dark + extra)); },
  sky(horizon = H) {
    const c = this.c, s = this.t.sky;
    const g = c.createLinearGradient(0, 0, 0, horizon);
    g.addColorStop(0, s[0]); g.addColorStop(.6, s[1]); g.addColorStop(1, s[2]);
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  },
  stars(n, yMax = H * .6, scale = 1) {
    const c = this.c; const k = this.t.stars * scale; if (!k) return;
    for (let i = 0; i < n * k; i++) {
      const x = this.rand(0, W), y = Math.pow(this.r(), 1.4) * yMax, r = this.r() < .06 ? this.rand(1.3, 2.1) : this.rand(.4, 1.1);
      c.fillStyle = `rgba(225,236,246,${this.rand(.35, .95)})`;
      c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    }
  },
  silverpelt(x0, y0, x1, y1, width = 90) {
    const c = this.c; if (!this.t.stars) return;
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
    c.save();
    c.globalCompositeOperation = 'screen';
    for (let i = 0; i < 26; i++) {
      const t = this.r(), off = (this.r() - .5) * width * .9;
      const x = x0 + dx * t + nx * off, y = y0 + dy * t + ny * off;
      const g = c.createRadialGradient(x, y, 0, x, y, this.rand(40, 110));
      g.addColorStop(0, 'rgba(160,190,225,.10)'); g.addColorStop(1, 'rgba(160,190,225,0)');
      c.fillStyle = g; c.fillRect(x - 120, y - 120, 240, 240);
    }
    for (let i = 0; i < 900 * this.t.stars; i++) {
      const t = this.r(), off = (this.r() + this.r() + this.r() - 1.5) * width * .7;
      const x = x0 + dx * t + nx * off, y = y0 + dy * t + ny * off;
      c.fillStyle = `rgba(230,240,250,${this.rand(.15, .75)})`;
      c.fillRect(x, y, this.rand(.6, 1.6), this.rand(.6, 1.6));
    }
    c.restore();
  },
  moon(x, y, r, phase = 1) {
    const c = this.c;
    const g = c.createRadialGradient(x, y, r * .5, x, y, r * 4);
    g.addColorStop(0, 'rgba(230,236,240,.22)'); g.addColorStop(1, 'rgba(230,236,240,0)');
    c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 4, 0, 7); c.fill();
    c.fillStyle = '#ece9de'; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    c.fillStyle = 'rgba(160,160,150,.25)';
    for (let i = 0; i < 6; i++) { c.beginPath(); c.arc(x + this.rand(-r * .6, r * .6), y + this.rand(-r * .6, r * .6), this.rand(r * .08, r * .22), 0, 7); c.fill(); }
    if (phase < 1) { c.save(); c.beginPath(); c.arc(x, y, r + .5, 0, 7); c.clip(); c.fillStyle = 'rgba(8,14,24,.94)'; c.beginPath(); c.arc(x + r * (phase * 2.1), y - r * .1, r * 1.05, 0, 7); c.fill(); c.restore(); }
  },
  ridge(base, amp, rough, col, steps = 60) {
    const c = this.c; c.fillStyle = col; c.beginPath(); c.moveTo(0, H);
    const ph = this.rand(0, 100), ph2 = this.rand(0, 100);
    for (let i = 0; i <= steps; i++) {
      const x = i / steps * W;
      const y = base - amp * (Math.sin(i / steps * 3.1 + ph) * .55 + Math.sin(i / steps * 7.3 + ph2) * .3) - this.rand(0, rough);
      c.lineTo(x, y);
    }
    c.lineTo(W, H); c.closePath(); c.fill();
  },
  ground(y, col) { const c = this.c; c.fillStyle = col; c.beginPath(); c.moveTo(0, H); c.lineTo(0, y); for (let i = 0; i <= 30; i++) c.lineTo(i / 30 * W, y + this.rand(-4, 4)); c.lineTo(W, H); c.fill(); },
  oak(x, y, s, extra = 0) {
    const c = this.c, fol = FOLIAGE[this.season];
    const trunk = this.sh('#3a2c20', extra);
    c.fillStyle = trunk;
    c.beginPath(); c.moveTo(x - 10 * s, y); c.quadraticCurveTo(x - 6 * s, y - 60 * s, x - 4 * s, y - 110 * s); c.lineTo(x + 4 * s, y - 110 * s); c.quadraticCurveTo(x + 6 * s, y - 60 * s, x + 12 * s, y); c.fill();
    c.strokeStyle = trunk; c.lineCap = 'round';
    const branches = [[-1, .55], [1, .62], [-1, .8], [1, .86], [0, 1]];
    branches.forEach(([dir, h]) => { c.lineWidth = (5 - h * 2) * s; c.beginPath(); c.moveTo(x, y - 100 * s * h); c.quadraticCurveTo(x + dir * 30 * s, y - 120 * s * h, x + dir * 55 * s, y - 135 * s * h - 10 * s); c.stroke(); });
    if (!fol) { // bare boughs in leaf-bare
      c.lineWidth = 1.5 * s;
      const twigs = [];
      for (let i = 0; i < 26; i++) { const a = this.rand(-2.6, -.5), bx = x + this.rand(-50, 50) * s, by = y - this.rand(90, 150) * s; twigs.push([bx, by, bx + Math.cos(a) * 26 * s, by + Math.sin(a) * 26 * s]); }
      twigs.forEach(t => { c.beginPath(); c.moveTo(t[0], t[1]); c.lineTo(t[2], t[3]); c.stroke(); });
      if (this.season === 3) { c.strokeStyle = 'rgba(225,232,238,.28)'; c.lineWidth = .9 * s; twigs.forEach(t => { c.beginPath(); c.moveTo(t[0], t[1] - 1); c.lineTo(t[2], t[3] - 1); c.stroke(); }); }
      return;
    }
    for (let i = 0; i < 16; i++) {
      const bx = x + this.rand(-70, 70) * s, by = y - this.rand(110, 200) * s, br = this.rand(28, 50) * s;
      c.fillStyle = this.sh(fol[i % fol.length], extra + this.rand(-.05, .1));
      c.beginPath(); c.arc(bx, by, br, 0, 7); c.fill();
    }
  },
  pine(x, y, s, extra = 0) {
    const c = this.c; const col = this.sh(this.season === 3 ? '#26392e' : '#1f3a2a', extra);
    c.fillStyle = this.sh('#2d2219', extra); c.fillRect(x - 3 * s, y - 40 * s, 6 * s, 40 * s);
    c.fillStyle = col;
    const tiers = 7;
    for (let i = 0; i < tiers; i++) {
      const ty = y - 30 * s - i * 26 * s, tw = (60 - i * 7) * s;
      c.beginPath(); c.moveTo(x - tw, ty); c.lineTo(x, ty - 44 * s); c.lineTo(x + tw, ty);
      for (let j = 0; j < 6; j++) c.lineTo(x + tw - (j + .5) * tw / 3, ty + (j % 2 ? 6 : -2) * s);
      c.closePath(); c.fill();
    }
    if (this.season === 3) { c.fillStyle = 'rgba(232,238,240,.5)'; for (let i = 0; i < tiers; i++) { const ty = y - 30 * s - i * 26 * s, tw = (60 - i * 7) * s; c.beginPath(); c.moveTo(x - tw * .8, ty - 6 * s); c.lineTo(x, ty - 40 * s); c.lineTo(x + tw * .2, ty - 30 * s); c.closePath(); c.fill(); } }
  },
  deadTree(x, y, s, col) {
    const c = this.c; c.strokeStyle = col; c.lineCap = 'round';
    const branch = (bx, by, a, len, w, d) => {
      if (d > 5 || len < 6) return;
      const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
      c.lineWidth = w; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(bx + Math.cos(a + .3) * len * .5, by + Math.sin(a + .3) * len * .5, ex, ey); c.stroke();
      branch(ex, ey, a - this.rand(.3, .7), len * this.rand(.55, .75), w * .62, d + 1);
      branch(ex, ey, a + this.rand(.3, .7), len * this.rand(.55, .75), w * .62, d + 1);
    };
    branch(x, y, -Math.PI / 2 + this.rand(-.12, .12), 120 * s, 16 * s, 0);
  },
  trunks(n, y0, y1, extra = .1) {
    const c = this.c;
    for (let i = 0; i < n; i++) {
      const x = this.rand(-20, W + 20), w = this.rand(14, 46), lean = this.rand(-12, 12);
      c.fillStyle = this.sh('#352a20', extra + this.rand(0, .15));
      c.beginPath(); c.moveTo(x - w / 2, y1); c.lineTo(x - w / 3 + lean, y0); c.lineTo(x + w / 3 + lean, y0); c.lineTo(x + w / 2, y1); c.fill();
    }
  },
  canopy(y, depth, extra = 0) {
    const c = this.c, fol = FOLIAGE[this.season];
    if (!fol) { c.strokeStyle = this.sh('#2b241d', extra); c.lineWidth = 2; for (let i = 0; i < 80; i++) { const x = this.rand(0, W), yy = this.rand(0, y); c.beginPath(); c.moveTo(x, yy); c.lineTo(x + this.rand(-40, 40), yy + this.rand(-30, 30)); c.stroke(); } return; }
    for (let i = 0; i < 70; i++) { c.fillStyle = this.sh(fol[i % fol.length], extra + this.rand(0, .15)); c.beginPath(); c.arc(this.rand(-40, W + 40), this.rand(-40, y), this.rand(40, depth), 0, 7); c.fill(); }
  },
  bracken(x, y, s, flip = 1, col) {
    const c = this.c; col = col || this.sh(this.season === 2 ? '#7a4f22' : this.season === 3 ? '#4d3f30' : '#2f4f2a', .2);
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 2.2 * s; c.lineCap = 'round';
    const len = 120 * s, a0 = -1.25 * flip;
    c.beginPath(); c.moveTo(x, y);
    const ex = x + Math.cos(a0) * len * .4 * flip + 50 * s * flip, ey = y - len * .9;
    c.quadraticCurveTo(x + 10 * s * flip, y - len * .7, ex, ey); c.stroke();
    for (let i = 1; i < 12; i++) {
      const t = i / 12, px = x + (ex - x) * t * t + 10 * s * flip * (1 - t) * t, py = y + (ey - y) * t;
      const l = (1 - t) * 28 * s + 6 * s;
      c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px + l * .6 * flip, py - l * .1, px + l * flip, py + l * .35); c.lineTo(px + l * .9 * flip, py + l * .5); c.quadraticCurveTo(px + l * .4 * flip, py + l * .2, px, py + 1); c.fill();
      c.beginPath(); c.moveTo(px, py); c.quadraticCurveTo(px - l * .5 * flip, py - l * .3, px - l * .8 * flip, py - l * .05); c.lineTo(px - l * .7 * flip, py + l * .1); c.quadraticCurveTo(px - l * .3 * flip, py, px, py + 1); c.fill();
    }
  },
  grass(y0, y1, n, col) { const c = this.c; c.strokeStyle = col; c.lineWidth = 1.4; for (let i = 0; i < n; i++) { const x = this.rand(0, W), y = this.rand(y0, y1), h = this.rand(8, 22); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + this.rand(-4, 4), y - h * .6, x + this.rand(-8, 8), y - h); c.stroke(); } },
  water(y0, y1, top, bot, glintX = null) {
    const c = this.c; const g = c.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, top); g.addColorStop(1, bot); c.fillStyle = g; c.fillRect(0, y0, W, y1 - y0);
    c.strokeStyle = 'rgba(210,225,235,.14)'; c.lineWidth = 1.2;
    for (let i = 0; i < 90; i++) { const y = this.rand(y0 + 4, y1), x = this.rand(0, W), l = this.rand(10, 60) * (y - y0) / (y1 - y0 + 1) + 6; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y); c.stroke(); }
    if (glintX !== null) { c.fillStyle = 'rgba(236,233,222,.35)'; for (let i = 0; i < 40; i++) { const y = this.rand(y0 + 2, y1), w = this.rand(8, 40) * (1 - (y - y0) / (y1 - y0) * .3); c.fillRect(glintX - w / 2 + this.rand(-14, 14), y, w, 1.6); } }
  },
  cliff(side, top, bottom, width, col) {
    const c = this.c; c.fillStyle = col; c.beginPath();
    const x0 = side < 0 ? 0 : W;
    c.moveTo(x0, bottom);
    for (let i = 0; i <= 14; i++) { const t = i / 14; const y = bottom - (bottom - top) * t; const x = x0 - side * (width * (1 - t * .25) + this.rand(-18, 18)); c.lineTo(x, y); }
    c.lineTo(x0, top - 20); c.closePath(); c.fill();
    c.strokeStyle = rgba('#ffffff', .05); c.lineWidth = 1.5;
    for (let i = 0; i < 18; i++) { const y = this.rand(top, bottom); const x = x0 - side * this.rand(10, width * .9); c.beginPath(); c.moveTo(x, y); c.lineTo(x - side * this.rand(20, 60), y + this.rand(-6, 6)); c.stroke(); }
  },
  den(x, y, w, h, col) {
    const c = this.c; c.fillStyle = col; c.beginPath(); c.ellipse(x, y, w, h, 0, Math.PI, 0); c.fill();
    c.strokeStyle = mix(col, '#000000', .3); c.lineWidth = 1.6;
    for (let i = 0; i < 22; i++) { const a = this.rand(Math.PI, Math.PI * 2), r = this.rand(.6, 1); const px = x + Math.cos(a) * w * r, py = y + Math.sin(a) * h * r; c.beginPath(); c.moveTo(px, py); c.lineTo(px + this.rand(-14, 14), py + this.rand(-10, 4)); c.stroke(); }
    c.fillStyle = '#030607'; c.beginPath(); c.ellipse(x + w * .1, y, w * .28, h * .45, 0, Math.PI, 0); c.fill();
  },
  figure(kind, x, y, s, col, flip = false, rot = 0) {
    const c = this.c, S = SHAPES[kind];
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.scale(flip ? -s : s, s); c.translate(-S.w / 2, -S.h);
    if (S.far) { c.fillStyle = mix(col, '#000000', .4); c.fill(p2d(S.far)); }
    c.fillStyle = col; c.fill(p2d(S.d)); if (S.tail) c.fill(p2d(S.tail));
    if (kind === 'badger') { c.strokeStyle = '#d9d6cc'; c.lineWidth = 3; c.lineCap = 'round'; c.beginPath(); c.moveTo(136, 40); c.quadraticCurveTo(120, 26, 100, 22); c.stroke(); }
    c.restore();
  },
  eyes(x, y, s, col = '#e8d24a', gap = 16) {
    const c = this.c; c.save(); c.shadowColor = col; c.shadowBlur = 14 * s;
    c.fillStyle = col; c.beginPath(); c.ellipse(x, y, 5 * s, 2.4 * s, -.15, 0, 7); c.ellipse(x + gap * s, y - 1 * s, 5 * s, 2.4 * s, .15, 0, 7); c.fill(); c.restore();
  },
  spirit(kind, x, y, s, flip = false, alpha = 1) {
    const c = this.c, S = SHAPES[kind];
    c.save(); c.translate(x, y); c.scale(flip ? -s : s, s); c.translate(-S.w / 2, -S.h);
    const path = p2d(S.d), tail = S.tail ? p2d(S.tail) : null;
    c.globalAlpha = alpha;
    c.shadowColor = 'rgba(190,220,250,.9)'; c.shadowBlur = 18;
    c.fillStyle = 'rgba(170,205,240,.16)'; c.fill(path); if (tail) c.fill(tail);
    c.shadowBlur = 6; c.strokeStyle = 'rgba(220,236,252,.75)'; c.lineWidth = 1.1 / s * 1.4; c.stroke(path); if (tail) c.stroke(tail);
    c.save(); c.clip(path);
    c.shadowBlur = 4; c.fillStyle = 'rgba(240,248,255,.9)';
    for (let i = 0; i < 26; i++) { c.beginPath(); c.arc(this.rand(0, S.w), this.rand(0, S.h), this.rand(.4, 1.2) / s * 1.6, 0, 7); c.fill(); }
    c.restore(); c.restore();
  },
  mist(y, h, a, col = '#c9d6dc') { const c = this.c; const g = c.createLinearGradient(0, y - h, 0, y + h); g.addColorStop(0, rgba(col, 0)); g.addColorStop(.5, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(0, y - h, W, h * 2); },
  snow(n) { const c = this.c; c.fillStyle = 'rgba(240,244,246,.75)'; for (let i = 0; i < n; i++) { c.beginPath(); c.arc(this.rand(0, W), this.rand(0, H), this.rand(.8, 2.6), 0, 7); c.fill(); } },
  rain(n) { const c = this.c; c.strokeStyle = 'rgba(200,215,225,.22)'; c.lineWidth = 1; for (let i = 0; i < n; i++) { const x = this.rand(0, W), y = this.rand(0, H); c.beginPath(); c.moveTo(x, y); c.lineTo(x - 7, y + 24); c.stroke(); } },
  glow(x, y, r, col, a) { const c = this.c; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2); },
  house(x, y, w, h, col, lit = true) {
    const c = this.c; c.fillStyle = col; c.fillRect(x, y - h, w, h);
    c.beginPath(); c.moveTo(x - 14, y - h); c.lineTo(x + w / 2, y - h - h * .55); c.lineTo(x + w + 14, y - h); c.fill();
    c.fillRect(x + w * .7, y - h - h * .5, w * .1, h * .3);
    if (lit) { [[.18, .35], [.6, .35]].forEach(([fx, fy]) => { this.glow(x + w * fx + 14, y - h + h * fy + 14, 70, '#f0b25a', .25); c.fillStyle = '#f2c06e'; c.fillRect(x + w * fx, y - h + h * fy, 28, 28); c.fillStyle = col; c.fillRect(x + w * fx + 13, y - h + h * fy, 2, 28); c.fillRect(x + w * fx, y - h + h * fy + 13, 28, 2); }); }
  },
  fence(y, h, col) { const c = this.c; c.fillStyle = col; for (let x = -10; x < W + 20; x += 26) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y - h); c.lineTo(x + 11, y - h - 10); c.lineTo(x + 22, y - h); c.lineTo(x + 22, y); c.fill(); } c.fillRect(0, y - h * .8, W, 8); c.fillRect(0, y - h * .3, W, 8); },
  hatch(alpha = .05) { const c = this.c; c.strokeStyle = `rgba(0,0,0,${alpha})`; c.lineWidth = 1; for (let i = -H; i < W; i += 7) { c.beginPath(); c.moveTo(i, H); c.lineTo(i + H * .6, 0); c.stroke(); } },
  tint(col, a, mode = 'color') { const c = this.c; c.save(); c.globalCompositeOperation = mode; c.globalAlpha = a; c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore(); },
  vignette(k = .65) { const c = this.c; const g = c.createRadialGradient(W / 2, H * .45, H * .3, W / 2, H * .5, H * .95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${k})`); c.fillStyle = g; c.fillRect(0, 0, W, H); },
};

let GRAIN = null;
function grainTile() {
  if (GRAIN) return GRAIN;
  const g = document.createElement('canvas'); g.width = g.height = 160;
  const gc = g.getContext('2d'); const id = gc.createImageData(160, 160); const r = mulberry(7);
  for (let i = 0; i < id.data.length; i += 4) { const v = r() * 255; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
  gc.putImageData(id, 0, 0); GRAIN = g; return g;
}

/* ---------- Scene compositions ---------- */
const DARK_CAT = '#080d0e';
function catCol(p, pelt, k = .55) { return pelt ? p.sh(PELTS[pelt].b, k - p.t.dark) : DARK_CAT; }

const SCENES = {
  hollow(p, o) {
    p.sky(H * .5); p.stars(220, H * .35); if (p.time === 'night') p.moon(880, 95, 26, o.moonPhase ?? 1);
    p.ridge(260, 30, 10, p.sh('#1c2d27', .15));
    for (let i = 0; i < 9; i++) p.oak(p.rand(0, W), 300 + p.rand(-10, 10), p.rand(.6, .9), .2);
    const rock = p.sh('#4d4a44', .05);
    p.ground(560, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#3c3427', .1));
    p.cliff(-1, 230, 700, 330, rock); p.cliff(1, 210, 700, 360, mix(rock, '#000000', .12));
    const c = p.c; c.fillStyle = mix(rock, '#000000', .25); c.fillRect(830, 380, 220, 22); // Highledge
    p.figure('sit', 940, 382, 1.05, catCol(p, o.pelt, .5));
    const denC = p.sh(p.season === 2 ? '#5b4120' : '#2e3b24', .2);
    p.den(330, 600, 120, 70, denC); p.den(560, 575, 90, 56, mix(denC, '#000000', .1)); p.den(160, 655, 90, 60, denC);
    c.fillStyle = p.sh('#4a3826', .2); c.beginPath(); c.ellipse(720, 640, 40, 14, 0, 0, 7); c.fill();
    p.figure('sit', 640, 690, .85, DARK_CAT); p.figure('sit', 790, 700, .8, DARK_CAT, true); p.figure('walk', 470, 705, .9, DARK_CAT);
    p.figure('lie', 900, 700, .8, DARK_CAT, true);
    if (p.season === 3) { p.snow(260); p.mist(620, 90, .12); }
  },
  forest(p, o) {
    p.sky(H * .7); p.stars(80, H * .3);
    p.trunks(12, 0, 560, .3); p.canopy(160, 120, .25);
    p.mist(500, 120, p.time === 'day' ? .12 : .06);
    p.trunks(7, 0, 640, .12);
    if (p.time === 'day' || p.time === 'dawn') { const c = p.c; c.save(); c.globalCompositeOperation = 'screen'; for (let i = 0; i < 5; i++) { const x = p.rand(100, 1000); c.fillStyle = 'rgba(240,225,170,.06)'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 60, 0); c.lineTo(x + 260, 700); c.lineTo(x + 120, 700); c.fill(); } c.restore(); }
    p.ground(640, p.season === 3 ? p.sh('#c9d2d6', -.25) : p.sh('#2a2a1c', .2));
    p.figure('walk', 470, 690, .95, DARK_CAT); p.figure('walk', 610, 682, .9, DARK_CAT); p.figure('walk', 740, 694, .85, DARK_CAT);
    p.bracken(60, 770, 1.6, 1); p.bracken(1150, 770, 1.8, -1); p.bracken(280, 780, 1.1, 1);
    if (p.season === 3) p.snow(220);
  },
  border(p, o) {
    p.sky(H * .6); p.stars(150, H * .3); if (p.time === 'night') p.moon(950, 110, 22, .6);
    const right = o.clan || 'wind';
    p.ridge(420, 40, 8, p.sh('#3e4a34', .2));
    if (right === 'shadow') for (let i = 0; i < 9; i++) p.pine(650 + i * 70 + p.rand(-20, 20), 560, p.rand(1.1, 1.5), .12);
    else if (right === 'river') { p.water(470, 560, p.sh('#4a6c7a', .05), p.sh('#2b4552', .15), 950); }
    else p.ridge(470, 30, 6, p.sh('#55583a', .2));
    for (let i = 0; i < 6; i++) p.oak(p.rand(-40, 460), 560, p.rand(.9, 1.3), .12);
    p.ground(560, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#2c3220', .15));
    const c = p.c; c.fillStyle = p.sh('#5d7d8c', 0); c.beginPath(); c.moveTo(560, 560); c.bezierCurveTo(540, 620, 640, 680, 600, 760); c.lineTo(690, 760); c.bezierCurveTo(720, 680, 610, 620, 600, 560); c.fill();
    p.figure('sit', 440, 690, 1.05, catCol(p, o.pelt)); p.figure('sit', 770, 680, 1, DARK_CAT, true); p.figure('sit', 860, 700, .9, DARK_CAT, true);
    p.grass(600, 760, 160, p.sh('#3c4a2a', .25));
  },
  moor(p, o) {
    p.sky(H * .62); p.stars(200, H * .4); if (p.time === 'night') p.moon(300, 120, 24, 1);
    p.ridge(430, 50, 6, p.sh('#3c4734', .25)); p.ridge(500, 40, 6, p.sh('#4c5536', .2)); p.ridge(600, 30, 5, p.sh('#59603d', .15));
    const c = p.c;
    for (let i = 0; i < 26; i++) { const x = p.rand(0, W), y = p.rand(520, 740), r = p.rand(10, 30); c.fillStyle = p.sh('#2f3d25', .2); c.beginPath(); c.arc(x, y, r, Math.PI, 0); c.fill(); if (p.season < 2) { c.fillStyle = p.sh('#d8b23a', .1); for (let j = 0; j < 6; j++) { c.beginPath(); c.arc(x + p.rand(-r, r), y - p.rand(0, r * .8), 2, 0, 7); c.fill(); } } }
    p.grass(560, 760, 260, p.sh('#6c6c44', .3));
    p.figure('walk', 600, 690, 1, DARK_CAT); p.figure('walk', 760, 676, .9, DARK_CAT, false, -.08);
    if (p.season === 3) p.snow(220);
  },
  pines(p, o) {
    p.sky(H * .6); p.stars(140, H * .3);
    for (let i = 0; i < 14; i++) p.pine(p.rand(0, W), 520 + p.rand(-10, 20), p.rand(1, 1.5), .3);
    p.mist(520, 90, .1, '#9fb0a0');
    for (let i = 0; i < 9; i++) p.pine(p.rand(0, W), 640 + p.rand(0, 30), p.rand(1.4, 2), .12);
    p.ground(640, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#2a2117', .15));
    p.figure('sit', 560, 720, 1, DARK_CAT); p.eyes(580, 645, .7, '#d9c64a', 11);
    if (p.season === 3) p.snow(200);
  },
  river(p, o) {
    p.sky(H * .55); p.stars(160, H * .3); if (p.time === 'night') p.moon(840, 100, 24, 1);
    p.ridge(380, 30, 6, p.sh('#2b3a33', .25));
    for (let i = 0; i < 7; i++) p.oak(p.rand(0, W), 430, p.rand(.7, 1), .25);
    p.water(430, 760, p.sh('#557886', -.05), p.sh('#1e3440', .1), 840);
    const c = p.c;
    [[300, 600], [460, 640], [640, 610], [820, 650]].forEach(([x, y]) => { c.fillStyle = p.sh('#6c6a62', .05); c.beginPath(); c.ellipse(x, y, 60, 18, 0, 0, 7); c.fill(); });
    c.strokeStyle = p.sh('#4c5a34', .2); c.lineWidth = 2.5;
    for (let i = 0; i < 70; i++) { const x = p.rand(0, 220) + (i % 2 ? 980 : 0), y = p.rand(560, 760); c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + p.rand(-10, 10), y - 60, x + p.rand(-16, 16), y - p.rand(80, 140)); c.stroke(); }
    p.figure('sit', 640, 600, .9, DARK_CAT, true);
  },
  lake(p, o) {
    p.sky(H * .5); p.stars(220, H * .4); if (p.time === 'night') p.moon(760, 120, 24, o.moonPhase ?? 1);
    p.ridge(380, 25, 5, p.sh('#2b3a36', .2));
    p.water(380, 620, p.sh('#5d7f8f', -.05), p.sh('#24404c', .1), p.time === 'night' ? 760 : null);
    const c = p.c; c.fillStyle = p.sh('#4c4a3e', .1); c.fillRect(780, 520, 260, 10); for (let i = 0; i < 6; i++) c.fillRect(800 + i * 44, 528, 6, 50); // half-bridge
    p.ground(620, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#57513f', .15));
    for (let i = 0; i < 40; i++) { c.fillStyle = p.sh('#77705e', .1 + p.rand(0, .2)); c.beginPath(); c.ellipse(p.rand(0, W), p.rand(630, 760), p.rand(6, 18), p.rand(3, 8), 0, 0, 7); c.fill(); }
    p.figure('sit', 420, 720, 1.1, catCol(p, o.pelt)); p.figure('sit', 560, 730, .9, DARK_CAT);
    p.bracken(1150, 770, 1.5, -1);
  },
  gathering(p, o) {
    p.sky(H * .55); p.stars(260, H * .45); p.silverpelt(100, 0, 1100, 260, 110);
    if (!o.clouded) p.moon(830, 130, 34, 1);
    else { p.moon(830, 130, 34, 1); const c = p.c; for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(30,38,48,.85)'; c.beginPath(); c.ellipse(760 + p.rand(-120, 140), 120 + p.rand(-30, 40), p.rand(90, 160), p.rand(20, 36), 0, 0, 7); c.fill(); } }
    p.ridge(400, 25, 5, p.sh('#25352f', .25));
    p.water(400, 760, p.sh('#4f6e7e', .05), p.sh('#15262e', .1), 830);
    const c = p.c; c.fillStyle = p.sh('#223024', .2);
    c.beginPath(); c.ellipse(560, 520, 340, 70, 0, Math.PI, 0); c.lineTo(900, 530); c.lineTo(220, 530); c.fill();
    const keep = p.season; p.season = Math.min(p.season, 2); if (keep === 3) p.season = 3;
    p.oak(560, 470, 1.6, .15); p.season = keep;
    c.strokeStyle = p.sh('#3a2c20', .1); c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.moveTo(0, 650); c.quadraticCurveTo(140, 600, 300, 520); c.stroke(); // the tree-bridge
    for (let i = 0; i < 34; i++) { const x = 270 + p.rand(0, 580), top = 520 - 70 * Math.sqrt(Math.max(0, 1 - Math.pow((x - 560) / 340, 2))); p.figure(p.r() < .7 ? 'sit' : 'walk', x, top + p.rand(6, 30), p.rand(.34, .48), p.sh('#2a3836', .1), p.r() < .5); }
  },
  moonpool(p, o) {
    p.sky(H * .6); p.stars(300, H * .55, 1.2); p.silverpelt(-60, 320, 1260, 0, 130);
    const rock = p.sh('#3d3b38', -.05);
    p.cliff(-1, 140, 760, 380, rock); p.cliff(1, 160, 760, 400, mix(rock, '#000000', .15));
    const c = p.c;
    c.fillStyle = mix(rock, '#000000', .2); c.beginPath(); c.moveTo(400, 540); [[430, 420], [452, 360], [488, 318], [512, 290], [540, 262], [562, 240], [600, 234], [640, 238], [668, 252], [700, 280], [722, 322], [746, 360], [770, 430], [800, 540]].forEach(([x, y]) => c.lineTo(x + p.rand(-6, 6), y + p.rand(-6, 6))); c.closePath(); c.fill();
    const wf = c.createLinearGradient(0, 240, 0, 510); wf.addColorStop(0, 'rgba(200,220,240,.75)'); wf.addColorStop(1, 'rgba(160,195,230,.25)');
    c.fillStyle = wf; c.beginPath(); c.moveTo(560, 236); c.bezierCurveTo(566, 330, 548, 430, 552, 510); c.lineTo(652, 510); c.bezierCurveTo(650, 430, 636, 330, 640, 236); c.quadraticCurveTo(600, 226, 560, 236); c.fill();
    c.strokeStyle = 'rgba(235,245,252,.5)'; c.lineWidth = 1.4;
    for (let i = 0; i < 14; i++) { const x0 = 566 + i * 5.5 + p.rand(-2, 2); c.beginPath(); c.moveTo(x0, 240); c.bezierCurveTo(x0 + p.rand(-4, 4), 330, x0 - 10 + p.rand(-4, 4), 430, x0 - 8 + p.rand(-6, 6), 505); c.stroke(); }
    p.glow(600, 505, 90, '#e6f0fa', .25);
    c.fillStyle = mix(rock, '#000000', .3); c.beginPath(); c.ellipse(600, 600, 460, 150, 0, 0, 7); c.fill();
    const g = c.createRadialGradient(600, 590, 20, 600, 600, 400); g.addColorStop(0, '#2c4a72'); g.addColorStop(1, '#0a1428');
    c.fillStyle = g; c.beginPath(); c.ellipse(600, 600, 400, 115, 0, 0, 7); c.fill();
    c.save(); c.beginPath(); c.ellipse(600, 600, 400, 115, 0, 0, 7); c.clip(); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(230,240,250,${p.rand(.2, .9)})`; c.fillRect(p.rand(200, 1000), p.rand(490, 715), p.rand(.6, 2), p.rand(.6, 2)); } c.restore();
    p.glow(600, 590, 380, '#9cc4f0', .12);
    const spirits = o.spirits ?? 5;
    for (let i = 0; i < spirits; i++) p.spirit('sit', 360 + i * (480 / Math.max(1, spirits - 1)), 560 - Math.abs(i - (spirits - 1) / 2) * 12, .9, i > spirits / 2);
    p.figure('lie', 470, 755, 1.25, catCol(p, o.pelt, .45)); p.figure('sit', 770, 760, 1.05, DARK_CAT, true);
  },
  twoleg(p, o) {
    p.sky(H * .6); p.stars(80, H * .3);
    p.ridge(400, 20, 5, p.sh('#2a332c', .25));
    p.house(640, 470, 330, 190, p.sh('#3a3530', .2), true);
    p.fence(560, 120, p.sh('#4a3b2c', .12));
    p.figure('sit', 720, 444, .75, catCol(p, o.other || 'ginger', .45));
    p.ground(560, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#283020', .15));
    p.grass(560, 760, 220, p.sh('#3b4a2b', .25));
    p.figure('sit', 420, 720, 1.15, catCol(p, o.pelt)); p.bracken(80, 770, 1.6, 1);
  },
  snow(p, o) {
    p.sky(H * .7); p.stars(120, H * .35);
    p.season = 3;
    for (let i = 0; i < 12; i++) p.deadTree(p.rand(0, W), 520, p.rand(.8, 1.4), p.sh('#2d2a26', .1));
    p.ground(520, p.sh('#cdd6da', -.3)); p.mist(540, 80, .2, '#e8eef0');
    for (let i = 0; i < 4; i++) p.deadTree(p.rand(0, W), 700, p.rand(1.6, 2.2), p.sh('#221f1c', .05));
    p.ground(700, p.sh('#dde4e7', -.35));
    p.figure('lie', 520, 690, 1, DARK_CAT); p.figure('sit', 640, 690, .95, DARK_CAT, true); p.figure('lie', 740, 700, .8, DARK_CAT, true);
    p.snow(420);
  },
  battle(p, o) {
    p.sky(H * .7); const c = p.c;
    p.ridge(420, 30, 6, p.sh('#2a2220', .2)); for (let i = 0; i < 6; i++) p.oak(p.rand(0, W), 460, p.rand(.8, 1.1), .3);
    p.ground(560, p.season === 3 ? p.sh('#b9c2c6', -.1) : p.sh('#2d2418', .2));
    p.mist(600, 120, .12, '#d4a070');
    const pairs = [[300, 650, .9], [620, 700, 1.15], [930, 640, .85], [480, 600, .6], [800, 590, .6]];
    pairs.forEach(([x, y, s]) => { p.figure('walk', x - 55 * s, y, s, DARK_CAT, false, -.35); p.figure('walk', x + 55 * s, y, s, '#0c1011', true, .28); });
    c.fillStyle = 'rgba(20,14,12,.6)'; for (let i = 0; i < 40; i++) { c.beginPath(); c.arc(p.rand(0, W), p.rand(560, 740), p.rand(1, 3), 0, 7); c.fill(); }
    p.bracken(1160, 770, 1.6, -1, '#0a0c0b'); p.bracken(40, 770, 1.4, 1, '#0a0c0b');
  },
  darkforest(p, o) {
    p.sky(H); const c = p.c;
    for (let i = 0; i < 14; i++) p.deadTree(p.rand(-40, W + 40), 600 + p.rand(-30, 30), p.rand(1.2, 2.2), '#0c110c');
    p.mist(560, 160, .16, '#4f6a3a');
    for (let i = 0; i < 30; i++) { const x = p.rand(0, W), y = p.rand(560, 740); p.glow(x, y, 26, '#a6c45a', .35); c.fillStyle = '#d6f08a'; c.beginPath(); c.ellipse(x, y, 4, 2, 0, 0, 7); c.fill(); }
    p.ground(640, '#060806');
    p.figure('sit', 640, 600, 2.1, '#030403'); p.eyes(676, 444, 1.2, '#e3c84a', 13);
    p.figure('sit', 300, 740, 1, catCol(p, o.pelt, .4));
  },
  fire(p, o) {
    p.sky(H); const c = p.c;
    p.glow(600, 760, 900, '#ff8a3a', .35);
    for (let i = 0; i < 16; i++) p.deadTree(p.rand(0, W), 640, p.rand(1.2, 2), '#120806');
    c.fillStyle = 'rgba(40,24,18,.5)'; for (let i = 0; i < 20; i++) { c.beginPath(); c.ellipse(p.rand(0, W), p.rand(0, 400), p.rand(80, 200), p.rand(30, 60), 0, 0, 7); c.fill(); }
    c.fillStyle = '#ffd08a'; for (let i = 0; i < 120; i++) c.fillRect(p.rand(0, W), p.rand(200, 760), 2, 2);
    p.ground(680, '#100806');
    p.figure('walk', 400, 740, 1, '#050302', true, .1); p.figure('walk', 560, 730, .9, '#050302', true); p.figure('walk', 700, 745, .8, '#050302', true, .05);
  },
  flood(p, o) {
    p.sky(H * .6);
    p.cliff(-1, 200, 760, 320, p.sh('#4b4943', .1)); p.cliff(1, 190, 760, 350, p.sh('#403e38', .1));
    p.water(560, 760, p.sh('#4d5e5c', 0), p.sh('#1e2b2c', .1));
    const c = p.c; c.fillStyle = p.sh('#4b4943', .2); c.beginPath(); c.ellipse(620, 560, 140, 40, 0, Math.PI, 0); c.fill();
    p.figure('sit', 580, 540, .8, DARK_CAT); p.figure('sit', 670, 545, .7, DARK_CAT, true); p.figure('lie', 620, 525, .5, DARK_CAT);
    p.rain(500);
  },
  vigil(p, o) {
    p.sky(H * .5); p.stars(320, H * .45, 1.1); p.silverpelt(0, 120, 1200, 40, 100);
    p.cliff(-1, 260, 760, 260, p.sh('#3e3c37', .1)); p.cliff(1, 240, 760, 280, p.sh('#36342f', .1));
    p.ground(600, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#2f2a20', .2));
    p.figure('lie', 600, 690, 1.05, catCol(p, o.dead || 'grey', .4));
    [[380, 700, 1, false], [470, 650, .85, false], [730, 650, .85, true], [830, 705, 1, true], [600, 615, .7, true]].forEach(([x, y, s, f]) => p.figure('sit', x, y, s, DARK_CAT, f));
    p.spirit('sit', 600, 470, .9, false, .7);
  },
  ice(p, o) {
    p.sky(H * .5); p.stars(320, H * .45, 1.2); p.silverpelt(200, 0, 1000, 300, 110); p.moon(300, 110, 26, 1);
    p.ridge(380, 20, 4, p.sh('#3a4a52', .1));
    const c = p.c; const g = c.createLinearGradient(0, 380, 0, 760); g.addColorStop(0, '#5a7488'); g.addColorStop(1, '#c9d9e2');
    c.fillStyle = g; c.fillRect(0, 380, W, 380);
    c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1.3;
    for (let i = 0; i < 22; i++) { let x = p.rand(0, W), y = p.rand(400, 760); c.beginPath(); c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += p.rand(-60, 60); y += p.rand(-14, 14); c.lineTo(x, y); } c.stroke(); }
    c.fillStyle = p.sh('#223024', .1); c.beginPath(); c.ellipse(820, 410, 150, 26, 0, Math.PI, 0); c.fill();
    const ks = p.season; p.season = 3; p.oak(820, 400, .75, .15); p.season = ks;
    for (let i = 0; i < 9; i++) p.figure('walk', 180 + i * 62, 560 - i * 14 + p.rand(-4, 4), .55 - i * .025, DARK_CAT);
    p.snow(160);
  },
  fox(p, o) {
    p.sky(H * .7); p.stars(60, H * .25);
    p.trunks(10, 0, 600, .3); p.canopy(150, 110, .25);
    p.ground(620, p.season === 3 ? p.sh('#c9d2d6', -.2) : p.sh('#2a2a1c', .2));
    p.figure('fox', 760, 690, 1.6, p.sh('#a0491e', .1), true);
    p.figure('sit', 400, 715, 1, catCol(p, o.pelt));
    p.bracken(1100, 770, 1.6, -1); p.bracken(120, 770, 1.3, 1);
  },
  badger(p, o) {
    p.sky(H * .5); p.stars(120, H * .3);
    p.cliff(-1, 120, 760, 420, p.sh('#47443d', .05)); p.cliff(1, 160, 760, 420, p.sh('#3b3933', .05));
    p.ground(640, p.sh('#2c271e', .2));
    p.figure('badger', 720, 700, 1.9, '#141414', true);
    p.figure('sit', 330, 560, .9, catCol(p, o.pelt));
    const c = p.c; c.fillStyle = p.sh('#55524a', .1); c.beginPath(); c.ellipse(330, 566, 80, 20, 0, 0, 7); c.fill();
  },
  gorge(p, o) {
    p.sky(H * .5); p.stars(200, H * .4);
    const c = p.c; c.fillStyle = p.sh('#3b3a35', 0);
    c.beginPath(); c.moveTo(0, 400); c.lineTo(520, 420); c.lineTo(560, 760); c.lineTo(0, 760); c.fill();
    c.fillStyle = p.sh('#34332f', 0); c.beginPath(); c.moveTo(W, 380); c.lineTo(700, 410); c.lineTo(660, 760); c.lineTo(W, 760); c.fill();
    p.water(700, 760, '#3d5f78', '#21384a');
    for (let i = 0; i < 6; i++) p.oak(p.rand(0, 480), 410, p.rand(.6, .9), .2);
    p.figure('dog', 330, 420, 1.4, '#060707');
    p.figure('sit', 480, 424, .9, catCol(p, o.pelt));
    p.spirit('walk', 620, 360, 1, true, .85);
  },
  den(p, o) {
    const c = p.c; c.fillStyle = '#0d1410'; c.fillRect(0, 0, W, H);
    p.glow(600, 300, 600, '#9db8a0', .08);
    c.strokeStyle = '#1e2a1c'; c.lineWidth = 3;
    for (let i = 0; i < 200; i++) { const a = p.rand(Math.PI, Math.PI * 2), r = p.rand(.7, 1.1); const x = 600 + Math.cos(a) * 760 * r, y = 760 + Math.sin(a) * 700 * r; c.beginPath(); c.moveTo(x, y); c.lineTo(x + p.rand(-40, 40), y + p.rand(-30, 30)); c.stroke(); }
    const moss = '#2b3d24';
    [[380, 640, 220], [800, 660, 240]].forEach(([x, y, w]) => { c.fillStyle = moss; c.beginPath(); c.ellipse(x, y, w, 46, 0, 0, 7); c.fill(); });
    p.figure('lie', 390, 640, 1.4, catCol(p, o.elder || 'grey', .55));
    if (o.kits) { p.figure('lie', 800, 650, 1.3, catCol(p, 'silver', .5), true); for (let i = 0; i < 3; i++) p.figure('sit', 740 + i * 46, 668, .38, catCol(p, ['ginger', 'black', 'cream'][i], .45), i % 2 === 0); }
    else p.figure('lie', 800, 660, 1.2, catCol(p, 'brown', .55), true);
  },
  title(p, o) {
    p.sky(H * .55); p.stars(380, H * .6, 1.3); p.silverpelt(-80, 420, 1280, -40, 140);
    p.moon(940, 120, 28, .55);
    p.ridge(470, 40, 6, '#0a1513');
    p.water(500, 640, '#1b3446', '#0a1820', 940);
    const c = p.c; c.fillStyle = '#08100e'; c.beginPath(); c.ellipse(860, 520, 160, 30, 0, Math.PI, 0); c.fill();
    p.season = 2; p.oak(860, 505, .8, .5);
    p.season = 1;
    p.ground(640, '#070d0c');
    for (let i = 0; i < 7; i++) p.figure('sit', 120 + i * 40 + p.rand(-6, 6), 650, .32 + p.rand(0, .05), '#050909', false);
    p.figure('sit', 1040, 746, 1.8, '#040807', true);
    p.bracken(30, 770, 1.8, 1, '#050909');
    [[250, 190], [370, 150], [500, 175], [640, 130], [760, 165]].forEach(([x, y], i) => p.spirit('sit', x, y, .44 + (i % 2) * .06, i > 2, .42));
  },
};

const SCENE_TIME = { moonpool: 'night', gathering: 'night', vigil: 'night', ice: 'night', darkforest: 'starless', fire: 'fire', title: 'night', den: 'night', snow: 'grey', flood: 'grey', battle: 'dusk' };

function paintScene(canvas, key, o = {}) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const cw = canvas.clientWidth || 800, ch = canvas.clientHeight || 500;
  canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr);
  const ctx = canvas.getContext('2d');
  const scale = Math.max(cw / W, ch / H) * dpr;
  const ox = (canvas.width - W * scale) / 2, oy = (canvas.height - H * scale) * .7;
  ctx.setTransform(scale, 0, 0, scale, ox, oy);
  const season = o.season ?? 1;
  let time = o.time || SCENE_TIME[key] || (season === 3 ? 'grey' : 'dusk');
  if (o.dream) time = 'dream';
  const p = new Painter(ctx, hashStr(key + (o.seed || '')), time, season);
  (SCENES[key] || SCENES.forest)(p, o);
  if (o.dream) { p.tint('#3c64b4', .55, 'color'); p.stars(260, H, 1); p.vignette(.7); }
  ctx.save(); ctx.globalAlpha = .07; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(grainTile(), 'repeat'); ctx.fillRect(-10, -10, W + 20, H + 20); ctx.restore();
  p.hatch(.035);
  p.vignette(o.dream ? .5 : .62);
}

/* ---------- Drifting star-motes for StarClan scenes (the one ambient motion) ---------- */
const MOTES = { cv: null, raf: 0, list: [] };
function startMotes(canvas, on) {
  cancelAnimationFrame(MOTES.raf);
  const ctx = canvas.getContext('2d');
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = canvas.clientWidth * dpr; canvas.height = canvas.clientHeight * dpr;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!on) return;
  const n = 46;
  MOTES.list = Array.from({ length: n }, () => ({ x: Math.random(), y: Math.random(), r: .6 + Math.random() * 1.6, s: .00008 + Math.random() * .00022, ph: Math.random() * 6.28 }));
  const draw = (t) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const m of MOTES.list) {
      if (!reduce) { m.y -= m.s * 16; m.x += Math.sin(t / 3000 + m.ph) * .00008; if (m.y < -.02) { m.y = 1.02; m.x = Math.random(); } }
      const a = .35 + .45 * Math.sin(t / 900 + m.ph);
      ctx.fillStyle = `rgba(214,232,250,${Math.max(.05, a)})`;
      ctx.shadowColor = 'rgba(190,220,250,.9)'; ctx.shadowBlur = 8 * dpr;
      ctx.beginPath(); ctx.arc(m.x * canvas.width, m.y * canvas.height, m.r * dpr, 0, 7); ctx.fill();
    }
    if (!reduce) MOTES.raf = requestAnimationFrame(draw);
  };
  MOTES.raf = requestAnimationFrame(draw);
}

/* =========================================================================
   TERRITORY MAP (SVG) — scratched into bark, the way elders draw it in the dust
   ========================================================================= */
const ZONE_GEOM = {
  twolegnest: { pts: '150,40 250,40 240,110 170,120 140,100', lx: 196, ly: 78 },
  skyoak: { pts: '250,40 350,40 345,95 300,110 240,110', lx: 296, ly: 72 },
  greenway: { pts: '350,40 450,40 460,100 400,115 345,95', lx: 402, ly: 70 },
  streammeadow: { pts: '140,100 170,120 185,180 180,250 150,300 130,200', lx: 158, ly: 196 },
  oakwood: { pts: '170,120 240,110 300,110 270,150 265,200 240,250 180,250 185,180', lx: 226, ly: 178 },
  hollow: { pts: '300,110 345,95 360,140 340,185 290,190 265,200 270,150', lx: 312, ly: 150 },
  ravine: { pts: '345,95 400,115 430,130 420,200 380,210 340,185 360,140', lx: 386, ly: 160 },
  thornmarsh: { pts: '400,115 460,100 470,120 470,250 440,250 420,200 430,130', lx: 446, ly: 180 },
  lakeshore: { pts: '180,250 240,250 265,200 290,190 340,185 380,210 420,200 440,250 450,300 150,300', lx: 300, ly: 262 },
};
function mapSVG(state) {
  const Z = state.zones;
  let zones = '';
  for (const id in ZONE_GEOM) {
    const g = ZONE_GEOM[id], z = Z[id], def = ZONES[id];
    let fill = '#2a3b2c', op = .55, dash = '';
    if (!z.explored) { fill = '#101a18'; op = .9; dash = 'stroke-dasharray="3 4"'; }
    else if (z.owner === 'thunder') { fill = '#4f6e44'; op = .5; }
    else if (z.owner) { fill = '#6e3a30'; op = .5; }
    else { fill = '#5a5030'; op = .45; }
    const label = z.explored ? def.name : 'Unexplored';
    const sel = state.zoneSel === id;
    zones += `<polygon class="zone" data-zone="${id}" tabindex="0" role="button" aria-label="${label}" points="${g.pts}" fill="${fill}" fill-opacity="${op}" stroke="${sel ? '#bcd6e8' : '#e2dcc8'}" stroke-opacity="${sel ? 1 : .55}" stroke-width="${sel ? 3 : 1.4}" ${dash} filter="url(#rough)"/>`;
  }
  let labels = '';
  for (const id in ZONE_GEOM) {
    const g = ZONE_GEOM[id], z = Z[id], def = ZONES[id];
    const name = z.explored ? def.short : '?';
    labels += `<text x="${g.lx}" y="${g.ly}" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-style="italic" font-size="${z.explored ? 11.5 : 16}" fill="#e2dcc8" fill-opacity="${z.explored ? .9 : .55}" pointer-events="none">${name}</text>`;
    if (z.explored && z.owner && z.owner !== 'thunder') labels += `<text x="${g.lx}" y="${g.ly + 13}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-size="9.5" fill="#f0a090" pointer-events="none">held by ${CLANS[z.owner].name}</text>`;
    if (z.explored && !z.owner) labels += `<text x="${g.lx}" y="${g.ly + 13}" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-size="9.5" fill="#d9c98a" pointer-events="none">unclaimed</text>`;
  }
  const grain = Array.from({ length: 70 }, (_, i) => { const x = (i * 8.7) % 600; return `<path d="M${x},0 C${x + 6},140 ${x - 6},280 ${x + 3},420" stroke="#000" stroke-opacity=".18" stroke-width="${(i % 3) + .6}" fill="none"/>`; }).join('');
  return `<svg viewBox="0 0 600 420" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Map of ThunderClan territory">
<defs>
 <filter id="rough"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="4"/><feDisplacementMap in="SourceGraphic" scale="4"/></filter>
 <linearGradient id="bark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2a2219"/><stop offset="1" stop-color="#17130e"/></linearGradient>
 <pattern id="reeds" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0,8 L8,0" stroke="#e2dcc8" stroke-opacity=".08"/></pattern>
</defs>
<rect width="600" height="420" fill="url(#bark)"/>${grain}
<path d="M0,300 C120,292 240,306 300,302 C380,298 480,292 600,300 L600,420 L0,420 Z" fill="#203646" fill-opacity=".9" filter="url(#rough)"/>
<ellipse cx="300" cy="360" rx="40" ry="16" fill="#2d3c2a" stroke="#e2dcc8" stroke-opacity=".5" filter="url(#rough)"/>
<text x="300" y="364" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-style="italic" font-size="10" fill="#e2dcc8" fill-opacity=".8">Island</text>
<text x="300" y="404" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-style="italic" font-size="13" fill="#bcd6e8" fill-opacity=".75">The lake. RiverClan holds the far shore.</text>
<rect x="0" y="0" width="128" height="300" fill="url(#reeds)"/>
<text x="64" y="150" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-size="15" fill="#e2dcc8" fill-opacity=".6">WindClan</text>
<text x="64" y="166" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="10" fill="#e2dcc8" fill-opacity=".5">the open moor</text>
<path d="M140,300 C128,240 136,180 132,120 C128,80 110,50 72,30" stroke="#7fa6c4" stroke-opacity=".7" stroke-width="2.2" fill="none" filter="url(#rough)"/>
<g transform="translate(60,24)"><circle r="9" fill="#bcd6e8" fill-opacity=".18"/><path d="M0,-6 L1.5,-1.5 L6,0 L1.5,1.5 L0,6 L-1.5,1.5 L-6,0 L-1.5,-1.5 Z" fill="#dcecf6"/></g>
<text x="76" y="18" font-family="IM Fell English, Georgia, serif" font-style="italic" font-size="11" fill="#bcd6e8">Moonpool</text>
<rect x="472" y="0" width="128" height="196" fill="#0d1510" fill-opacity=".5"/>
<text x="536" y="96" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-size="15" fill="#e2dcc8" fill-opacity=".6">ShadowClan</text>
<text x="536" y="112" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="10" fill="#e2dcc8" fill-opacity=".5">pines and marsh</text>
<rect x="472" y="200" width="128" height="100" fill="#1a2028" fill-opacity=".5"/>
<text x="536" y="250" text-anchor="middle" font-family="IM Fell English, Georgia, serif" font-size="15" fill="#e2dcc8" fill-opacity=".6">SkyClan</text>
<text x="536" y="266" text-anchor="middle" font-family="Alegreya, Georgia, serif" font-style="italic" font-size="10" fill="#e2dcc8" fill-opacity=".5">the tall-tree ridge</text>
${zones}${labels}
<g transform="translate(312,132)" pointer-events="none"><path d="M-12,8 C-10,-4 -4,-8 0,-8 C4,-8 10,-4 12,8" stroke="#bcd6e8" stroke-width="1.6" fill="none"/></g>
</svg>`;
}
