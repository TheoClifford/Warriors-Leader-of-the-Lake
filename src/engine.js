/* =========================================================================
   ENGINE — state, the round of the seasons, war, prey, kin
   ========================================================================= */
let S = null;

function freshState() {
  const clans = {};
  OTHER_CLANS.forEach(id => clans[id] = { att: CLANS[id].start.att, str: CLANS[id].start.str, sick: false });
  return {
    v: 1, year: 1, season: 0, actions: 2,
    player: { pre: 'Ash', suf: 'fern', custom: '', sex: 'she', pelt: 'grey', pattern: 'tabby', eyes: 'amber', heart: null },
    lives: 9, leapYear: 0,
    cats: { warriors: 12, apprentices: 4, queens: 2, kits: 4, elders: 3 },
    prey: 30, herbs: 8, favour: 4, mood: 1, honour: 4, dark: 0, camp: 1, scent: 1,
    deputy: null, clans,
    zones: {
      hollow: { explored: true, owner: 'thunder' }, oakwood: { explored: true, owner: 'thunder' }, lakeshore: { explored: true, owner: 'thunder' },
      twolegnest: { explored: false, owner: null }, skyoak: { explored: false, owner: null }, ravine: { explored: false, owner: null }, greenway: { explored: false, owner: null },
      thornmarsh: { explored: true, owner: 'shadow' }, streammeadow: { explored: true, owner: null },
    },
    allies: [], legends: [], walked: [], boons: [],
    bless: { prey: 1, kits: 1, claws: 1, herbs: 1, scent: 0, dreams: 0 },
    flags: {}, used: {}, log: [], queue: [], scene: null, tab: 'camp', zoneSel: null,
    trainBonus: 0, stats: { born: 0, died: 0, named: 0, won: 0, lost: 0 }, over: false,
  };
}

/* ---------- Small helpers used throughout the content ---------- */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const chance = p => Math.random() < p;
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function F(k) { return S.flags[k]; }
function flag(k, v = true) { S.flags[k] = v; }
function isHeart(h) { return S.player.heart === h; }
function leaderName() { return (S.player.custom || S.player.pre) + 'star'; }
function warriorName() { return (S.player.custom || S.player.pre) + S.player.suf; }
function pr(she, he) { return S.player.sex === 'she' ? she : he; }
function warName() { return pick(NAME_PRE) + pick(NAME_SUF); }
function kitPre() { return pick(NAME_PRE); }
function cn(id) { return CLANS[id].name; }
function ldr(id) { return CLANS[id].leader; }
function seasonName() { return SEASONS[S.season]; }
function seasonLabel() { return `${SEASONS[S.season]} of the ${YEARS[S.year - 1] || 'last'} year`; }
function hasBoon(b) { return S.boons.includes(b); }
function totalCats() { const c = S.cats; return c.warriors + c.apprentices + c.queens + c.kits + c.elders + 1; }
function deputyName() { return S.deputy ? COUNCIL[S.deputy].name : 'your deputy'; }

function add(k, n) {
  const lim = { prey: [0, 999], herbs: [0, 60], favour: [0, 20], mood: [-5, 5], honour: [0, 10], dark: [0, 10], camp: [0, 3], scent: [0, 3] }[k];
  let v = S[k] + n;
  if (k === 'mood' && isHeart('steadfast')) v = Math.max(-2, v);
  if (k === 'favour' && n > 0 && isHeart('ambitious')) v = S[k] + Math.max(0, n - 1);
  S[k] = clamp(v, lim[0], lim[1]);
}
function addCats(type, n) { S.cats[type] = Math.max(0, S.cats[type] + n); if (n > 0 && type === 'kits') S.stats.born += n; }
function killCats(n, order = ['warriors']) {
  n = Math.max(0, n | 0);
  let left = n, dead = 0;
  for (const t of order) { const k = Math.min(left, S.cats[t]); S.cats[t] -= k; left -= k; dead += k; if (!left) break; }
  S.stats.died += dead; return dead;
}
function rel(id, n) {
  S.clans[id].att = clamp(S.clans[id].att + n, -5, 5);
  if (S.clans[id].att < 2 && S.allies.includes(id)) { S.allies = S.allies.filter(a => a !== id); logSaga(`The alliance with ${cn(id)} broke.`); }
}
function attWord(a) { return a <= -4 ? 'Blood feud' : a <= -2 ? 'Hostile' : a === -1 ? 'Wary' : a === 0 ? 'Watchful' : a === 1 ? 'Civil' : a <= 3 ? 'Friendly' : 'Trusted'; }
function moodWord(m) { return m <= -4 ? 'Despairing' : m <= -2 ? 'Restless' : m === -1 ? 'Uneasy' : m === 0 ? 'Steady' : m <= 2 ? 'Content' : m <= 4 ? 'Proud' : 'Exultant'; }

function skill(k) {
  let best = 0;
  for (const id in COUNCIL) best = Math.max(best, COUNCIL[id].skills[k] + (S.deputy === id ? 1 : 0));
  if (k === 'claw' && isHeart('valiant')) best += 1;
  if (k === 'tongue' && isHeart('kindred')) best += 1;
  if (k === 'herbs' && isHeart('shrewd')) best += 1;
  if (k === 'stars' && isHeart('steadfast')) best += 1;
  return best;
}

function loseLife(why) {
  if (hasBoon('leap') && S.leapYear !== S.year) { S.leapYear = S.year; logSaga(`StarClan turned aside a death: ${why}. The leader's leap was spent for this year.`); return 'spared'; }
  S.lives -= 1;
  logSaga(`${leaderName()} lost a life: ${why}. ${S.lives} remain.`);
  if (S.lives <= 0) { S.queue.unshift({ k: 'ending', why: 'fallen' }); }
  return 'lost';
}

function logSaga(text) { S.log.push({ y: S.year, s: S.season, t: text }); }

/* ---------- Prey, kin, seasons ---------- */
const SEASON_MULT = [1.0, 1.3, 1.05, 0.4];
function ownedPrey() { let p = 0; for (const id in S.zones) if (S.zones[id].owner === 'thunder') p += ZONES[id].prey; return p; }
function huntYield() {
  const c = S.cats;
  const base = c.warriors * 1.75 + c.apprentices * .7;
  const m = SEASON_MULT[S.season] * (1 + .1 * S.bless.prey) * (1 + .05 * (ownedPrey() - 5)) * (S.deputy === 'hazelstride' ? 1.1 : 1) * (F('greenwayShut') ? .93 : 1);
  return Math.max(0, Math.round(base * m * (0.9 + Math.random() * .2)));
}
function upkeep() { const c = S.cats; return Math.round(c.warriors * 1.2 + c.apprentices + c.queens * 1.3 + c.kits * .5 + c.elders + 1); }
function patrolYield() { return Math.round((5 + skill('hunt') * 1.2) * SEASON_MULT[S.season] * (1 + .1 * S.bless.prey) * (0.85 + Math.random() * .3)); }
function herbYield() { return Math.round(([4, 6, 4, 1][S.season] + (F('catmint') ? 2 : 0) + (F('nettleStays') ? 1 : 0)) * (isHeart('shrewd') ? 1.5 : 1) * (1 + .2 * S.bless.herbs)); }
function warMult() { return { valiant: 1.25, ambitious: 1.15, kindred: .92 }[S.player.heart] || 1; }

function fight({ clan, sent, lead = false, mode = 'attack', aim = 'prey', foe = 0 }) {
  sent = Math.max(1, Math.min(sent, S.cats.warriors));
  if (isHeart('valiant')) lead = true;
  let mine = sent * (1 + .12 * S.bless.claws) * warMult() * (1 + .04 * S.mood) * (lead ? 1.2 : 1) * (S.deputy === 'oakfang' ? 1.1 : 1);
  if (hasBoon('lion') && S.allies.length) mine *= 1.15;
  if (F('spyRiver') && clan === 'river') mine *= 1.2;
  if (mode === 'defend') mine *= (1 + .15 * S.camp) * (hasBoon('leap') ? 1.25 : 1);
  let theirs = foe || (S.clans[clan].str * (mode === 'attack' ? (aim === 'land' ? .7 : .5) : .62));
  if (clan && S.clans[clan].sick) theirs *= .8;
  const ratio = (mine * (0.8 + Math.random() * .4)) / (theirs * (0.8 + Math.random() * .4));
  const result = ratio >= 1.35 ? 'rout' : ratio >= 1 ? 'win' : ratio >= .75 ? 'lose' : 'routed';
  const dp = { rout: .02, win: .05, lose: .1, routed: .17 }[result];
  let deaths = 0; for (let i = 0; i < sent; i++) if (chance(dp)) deaths++;
  let saved = 0; while (deaths > 0 && S.herbs >= 2 && chance(.45)) { deaths--; saved++; S.herbs -= 2; }
  killCats(deaths, ['warriors']);
  let life = null;
  if (lead && chance({ rout: .03, win: .08, lose: .18, routed: .32 }[result])) life = loseLife('wounded in battle');
  if (clan) S.clans[clan].str = clamp(S.clans[clan].str - (result === 'rout' ? rnd(2, 3) : result === 'win' ? rnd(1, 2) : rnd(0, 1)), 6, 24);
  if (result === 'rout' || result === 'win') S.stats.won++; else S.stats.lost++;
  return { result, deaths, saved, life, won: result === 'rout' || result === 'win' };
}
function fightLine(f) {
  let s = '';
  if (f.deaths === 0 && f.saved === 0) s += ' Every warrior came home.';
  else {
    if (f.deaths) s += ` ${f.deaths === 1 ? 'One warrior' : f.deaths + ' warriors'} did not come home. Tonight the Clan sits vigil.`;
    if (f.saved) s += ` Willowmoth's cobwebs and marigold saved ${f.saved === 1 ? 'one more' : f.saved + ' more'} who would otherwise have died.`;
  }
  if (f.life === 'lost') s += ` You took a wound that StarClan would not let you keep: one of your lives went out of you on the battlefield. ${S.lives} remain.`;
  if (f.life === 'spared') s += ' A blow that should have killed you slid aside, as if a blue-grey shadow had leapt between.';
  return s;
}

function aiTurn() {
  OTHER_CLANS.forEach(id => { const c = S.clans[id]; c.str = clamp(c.str + rnd(-1, 1) + (S.season === 1 ? 1 : 0) - (S.season === 3 ? 1 : 0), 7, 22); c.sick = S.season === 3 && chance(.25); });
  if (S.year === 1 && S.season === 0) return;
  const hostile = OTHER_CLANS.filter(id => S.clans[id].att <= -3 && !S.allies.includes(id));
  for (const id of hostile) {
    let p = .3 + .1 * (-S.clans[id].att - 3) + (S.scent === 0 ? .15 : 0) - .05 * S.bless.scent - (F('deter') ? .15 : 0);
    if (chance(p)) { S.queue.push({ k: 'raided', v: { clan: id } }); flag('deter', false); return; }
  }
  flag('deter', false);
  const friends = OTHER_CLANS.filter(id => S.clans[id].att >= 3);
  if (friends.length && chance(.22)) S.queue.push({ k: 'gift', v: { clan: pick(friends) } });
  else {
    const wary = OTHER_CLANS.filter(id => S.clans[id].att <= -1 && !S.allies.includes(id));
    if (wary.length && S.scent === 0 && chance(.45)) S.queue.push({ k: 'trespass', v: { clan: pick(wary) } });
  }
}

/* ---------- The round of a season ---------- */
function startSeason() {
  S.actions = 2 - (F('mentoring') ? 1 : 0); flag('mentoring', false);
  S.queue.push({ k: 'season' });
  if (S.year === 3 && S.season === 3) { S.queue.push({ k: 'script', id: 'finale1' }); return; }
  aiTurn();
  const key = `${S.year}-${S.season}`;
  if (SCRIPT_AT[key]) S.queue.push({ k: 'script', id: SCRIPT_AT[key] });
  else { const id = drawEvent(); if (id) S.queue.push({ k: 'event', id }); }
  if (S.dark >= 3 && !S.used.dark1) { S.used.dark1 = 1; S.queue.push({ k: 'script', id: 'dark1' }); }
  else if (S.dark >= 6 && !S.used.dark2) { S.used.dark2 = 1; S.queue.push({ k: 'script', id: 'dark2' }); }
}
function drawEvent() {
  const pool = [];
  for (const id in EV) {
    const e = EV[id];
    if (S.used[id] && e.once !== false) continue;
    if (e.seasons && !e.seasons.includes(S.season)) continue;
    if (e.cond && !e.cond()) continue;
    pool.push([id, e.w || 1]);
  }
  if (!pool.length) return 'quiet';
  let tot = pool.reduce((a, b) => a + b[1], 0), r = Math.random() * tot;
  for (const [id, w] of pool) { r -= w; if (r <= 0) { S.used[id] = 1; return id; } }
  S.used[pool[0][0]] = 1; return pool[0][0];
}
function endSeason() {
  S.queue.push({ k: 'gathering' });
  S.queue.push({ k: 'resolve' });
  if (S.season === 3) S.queue.push({ k: 'turning' });
  S.queue.push({ k: 'advance' });
}
function advance() {
  S.season++;
  if (S.season > 3) { S.season = 0; S.year++; }
  startSeason();
}

function resolveSeason() {
  const lines = [], c = S.cats;
  const before = snap();
  // Hunting and eating
  const got = huntYield(), ate = upkeep();
  S.prey += got - ate;
  lines.push(`The daily patrols brought home <b>${got}</b> pieces of fresh-kill. The Clan ate <b>${ate}</b>.`);
  if (S.prey < 0) {
    const dead = killCats(Math.ceil(-S.prey / 9), ['elders', 'kits', 'apprentices', 'warriors']);
    S.prey = 0; add('mood', -2);
    lines.push(`There was not enough. <b>${dead === 1 ? 'One cat' : dead + ' cats'}</b> starved, the weakest first: elders who gave their share to the kits, and kits too small to bear the hunger.`);
    logSaga(`Hunger took ${dead} of the Clan.`);
  }
  S.prey = Math.floor(S.prey * (S.season === 3 ? .85 : .65));
  // Herbs
  const hg = Math.round([2, 3, 2, 0][S.season] * (1 + .25 * S.bless.herbs) + (F('catmint') ? 1 : 0));
  S.herbs = Math.floor((S.herbs + hg) * .88);
  // Births
  if (S.season <= 1 && c.queens > 0) {
    const born = Math.max(0, Math.round(c.queens * (1 + Math.random() * 1.2) * (.6 + .2 * S.bless.kits)));
    if (born) { addCats('kits', born); lines.push(`${born === 1 ? 'A kit was' : born + ' kits were'} born in the nursery. Rainpetal named ${born === 1 ? 'it' : 'the first'} ${kitPre()}kit.`); }
  }
  if (S.season === 0 && c.queens < 2 + Math.floor(S.bless.kits / 2) && c.warriors > 7) { c.warriors--; c.queens++; lines.push('A she-cat moved into the nursery, expecting kits.'); }
  if (S.season === 2 && c.queens > 1) { c.queens--; c.warriors++; lines.push('A queen whose kits were grown returned to the warriors\' den.'); }
  // Ceremonies
  let toApp = Math.floor(c.kits * .4); if (c.kits >= 2 && !toApp) toApp = 1;
  if (toApp) { c.kits -= toApp; c.apprentices += toApp; const n = kitPre(); lines.push(`Beneath the Highledge you named ${toApp === 1 ? 'an apprentice' : toApp + ' apprentices'}. ${n}kit became ${n}paw, and touched noses with ${pr('her', 'his')} new mentor.`); }
  let toWar = Math.min(c.apprentices, Math.floor(c.apprentices * .3) + S.trainBonus); S.trainBonus = 0;
  if (toWar) { c.apprentices -= toWar; c.warriors += toWar; S.stats.named += toWar; const names = Array.from({ length: Math.min(toWar, 3) }, warName); lines.push(`StarClan heard ${toWar === 1 ? 'a new warrior name' : toWar + ' new warrior names'} tonight: ${names.join(', ')}${toWar > 3 ? ' and others' : ''}. The Clan chanted ${toWar === 1 ? 'it' : 'them'} until the stars came out, and the new warriors sat silent vigil until dawn.`); }
  // Age and death
  if (S.season === 3 && c.warriors > 8 && chance(.5)) { c.warriors--; c.elders++; lines.push('An old warrior, stiff in every joint, moved to the elders\' den, and Speckleback made room grudgingly.'); }
  let eldDead = 0; for (let i = 0; i < c.elders; i++) if (chance(S.season === 3 ? .14 : .04)) eldDead++;
  if (eldDead) { killCats(eldDead, ['elders']); lines.push(`${eldDead === 1 ? 'An elder' : eldDead + ' elders'} went to StarClan in ${pr('her', 'his')} sleep. The Clan sat vigil, and at dawn the elders carried ${eldDead === 1 ? 'the body' : 'them'} out to be buried.`); }
  if (S.season === 3 && !F('coughHandled') && S.herbs < 3 && chance(.4 - .08 * S.bless.herbs)) { const d = killCats(1, ['kits', 'elders']); if (d) lines.push('With the herb store almost empty, a cough took one of the weakest.'); }
  flag('coughHandled', false);
  // Spirits and standing
  if (S.mood <= -4 && c.warriors > 4) { c.warriors--; lines.push('One warrior could not bear it any longer and took the path toward the Twoleg barns. Nobody called after them.'); logSaga('A warrior abandoned the Clan.'); }
  const base = isHeart('kindred') ? 1 : 0;
  if (S.mood > base + 1) add('mood', -1); else if (S.mood < base - 1) add('mood', 1);
  if (S.honour >= 6) add('favour', 1);
  if (S.dark >= 5) add('favour', -1);
  S.scent = Math.max(0, S.scent - (S.bless.scent >= 2 && S.season % 2 ? 0 : 1));
  if (c.warriors + c.apprentices < 3) S.queue.unshift({ k: 'ending', why: 'scattered' });
  return { lines, before };
}

/* ---------- Actions taken during a season ---------- */
function spend(n = 1) { if (S.actions < n) return false; S.actions -= n; return true; }

const ACTIONS = {
  hunt: { name: 'Send out a hunting patrol', cost: 1, tab: 'territory', art: 'forest',
    desc: () => `Hazelstride leads the Clan's best stalkers out at dawn. ${S.season === 3 ? 'In leaf-bare, every mouse is a victory.' : 'Prey will be stored as long as it keeps.'}`,
    go: () => { const n = patrolYield(); add('prey', n); return { title: 'The hunting patrol', text: pick([`Hazelstride brings them home at dusk, jaws full. <b>${n}</b> pieces of fresh-kill go onto the pile, and the kits watch it grow with enormous eyes.`, `The patrol works the Oakwood from dawn until the light goes. <b>${n}</b> pieces of fresh-kill: squirrel, vole, a fat wood pigeon that Hazelstride pretends was easy.`]) + (S.season === 3 ? ' In leaf-bare that is a feast.' : '') }; } },
  border: { name: 'Renew the scent markers', cost: 1, tab: 'territory', art: 'border',
    desc: () => `Walk every border and mark it fresh. Markers fade each season; ${S.scent === 0 ? 'right now they have faded away entirely' : 'right now they are ' + ['', 'thin', 'clear', 'strong'][S.scent]}.`,
    go: () => { S.scent = 3; add('honour', 0); let t = 'Your warriors walk the bounds from the WindClan stream to the ShadowClan marsh, marking every tree. Any cat who crosses now cannot claim they did not know.'; if (chance(.3)) { const id = pick(OTHER_CLANS.filter(x => x !== 'river')); t += ` At the edge of ${cn(id)}'s land you meet their patrol doing the same. Nobody says anything. Nobody has to.`; } return { title: 'Marking the borders', text: t }; } },
  herbs: { name: 'Send Willowmoth gathering herbs', cost: 1, tab: 'territory', art: 'forest',
    desc: () => `Willowmoth and an apprentice search the territory for herbs. ${S.season === 3 ? 'Little grows in leaf-bare.' : S.season === 1 ? 'Greenleaf is the richest time.' : ''}${F('catmint') ? ' The catmint at the Twoleg nest helps.' : ''}`,
    go: () => { const n = herbYield(); add('herbs', n); return { title: 'Gathering herbs', text: `Willowmoth returns with her jaws stuffed and her fur full of burrs: <b>${n}</b> bundles. Tansy for coughs, cobweb for bleeding, marigold for infection, poppy seed for pain. She lays them out in her den in the order she would need them in the dark.` }; } },
  explore: { name: 'Explore', cost: 1, tab: 'territory' },
  claim: { name: 'Claim with scent markers', cost: 1, tab: 'territory' },
  feast: { name: 'Share tongues over a feast', cost: 1, tab: 'camp', art: 'hollow',
    req: () => S.prey >= 8, why: 'Needs 8 fresh-kill.',
    desc: () => 'Spend 8 fresh-kill on an evening of eating and sharing tongues. The elders tell stories; the kits stay up too late.',
    go: () => { S.prey -= 8; add('mood', 2); return { title: 'A night of plenty', text: 'The Clan eats until even Rookfeather is too full to boast. Speckleback tells the one about the badger and the hedgehog, and the kits laugh so hard they get hiccups. For one night, nobody worries about anything.' }; } },
  train: { name: 'Push the apprentices\' training', cost: 1, tab: 'camp', art: 'forest',
    req: () => S.cats.apprentices >= 1, why: 'There are no apprentices.',
    desc: () => 'Battle moves at dawn, hunting drills at dusk. More apprentices will earn their warrior names at the end of this season.',
    go: () => { S.trainBonus += 2; return { title: 'Training hollow', text: `The training hollow rings with yowls. ${deputyName()} makes the apprentices practise the leap-and-hold until they can do it in their sleep, and then makes them do it again. Two of them, at least, will be ready by the season's end.` }; } },
  walls: { name: 'Weave the camp walls thicker', cost: 1, tab: 'camp', art: 'hollow',
    req: () => S.camp < 3, why: 'The walls are as strong as they can be.',
    desc: () => `Drag in brambles and thorn to close the gaps in the hollow's defences. Raiders will find the camp harder to take. Walls are ${['bare', 'patched', 'thick', 'a wall of thorns'][S.camp]}.`,
    go: () => { add('camp', 1); return { title: 'Bramble and thorn', text: 'Every warrior comes home scratched and grumbling, and the gap by the dirtplace tunnel is finally closed. The camp feels smaller and safer.' }; } },
  vigil: { name: 'Keep vigil at the Moonpool', cost: 1, tab: 'starclan', art: 'moonpool',
    desc: () => 'Walk the dimpled path to the Moonpool, sleep with your nose to the water, and ask StarClan for favour. Sometimes they answer.',
    go: () => vigilResult() },
};

function vigilResult() {
  let n = 2 + (isHeart('steadfast') ? 1 : 0) + (S.bless.dreams >= 2 ? 1 : 0);
  add('favour', n);
  const visits = [];
  if (S.dark >= 5) visits.push(['The stars stay distant tonight', 'You sleep with your nose to the water, and the stars do not come down. At the far edge of the pool, where nothing is reflected, something watches you sleep. You wake cold.']);
  else {
    visits.push(['Bluestar walks beside you', '"You will be tempted to carry everything yourself," the old leader says, padding beside you over water that bears her weight like stone. "I did. It nearly broke me, and it nearly broke my Clan. Let them help you carry it."']);
    visits.push(['Yellowfang is unimpressed', '"Hmph. You again." The ragged grey she-cat sniffs at you. "Your medicine cat is too soft on the elders and your fresh-kill pile is a disgrace. Fix the pile. Fix it before leaf-bare, if you have the sense of a beetle."']);
    visits.push(['Firestar on the stone', 'A flame-coloured tom sits on a rock in the middle of the pool, watching the stars move. He does not speak for a long time. Then: "I was a stranger once. Every Clan is made of strangers who decided not to be." When you look again, he is gone.']);
    visits.push(['Lionheart on the bank', 'The golden tom is sharpening his claws on the stones, as calmly as if he were alive. "Courage isn\'t not being afraid," he says, without looking up. "It\'s being afraid and staying where you are needed."']);
    visits.push(['Tallstar of WindClan', 'An old black-and-white tom with a very long tail regards you kindly. "I was WindClan\'s leader once, and I learned that an honest enemy is worth more than a false friend. Keep your borders clean and your word cleaner."']);
    visits.push(['Crookedstar of RiverClan', 'A huge pale tabby with a jaw bent sideways settles beside you. "The river taught me this: you cannot stop the water, but you can choose which way to swim. Choose early, little leader."']);
  }
  const v = pick(visits);
  return { title: 'Vigil at the Moonpool', art: 'moonpool', artOpts: { spirits: S.dark >= 5 ? 0 : 2 }, text: `<p>The path to the Moonpool is cold underfoot, each dimple in the stone made by paws that walked here before the Clans had names. You lie down at the water's edge and touch your nose to the stars.</p><p><b>${v[0]}.</b> ${v[1]}</p>` };
}
