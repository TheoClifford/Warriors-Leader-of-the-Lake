/* =========================================================================
   UI — scenes, the dens of the camp, creation, saving
   ========================================================================= */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SAVE_KEY = 'warriors-leader-of-the-lake-v1';
function lpr(id, she, he) { return CLANS[id].sex === 'she' ? she : he; }
CLANS.wind.sex = 'he'; CLANS.river.sex = 'she'; CLANS.shadow.sex = 'he'; CLANS.sky.sex = 'she';

function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { } }
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.v === 1 ? s : null; } catch (e) { return null; } }
function clearSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) { } }

/* ---------- Scene building ---------- */
function shuffleIdx(n) { const a = [...Array(n).keys()]; for (let i = n - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function onOpen(it, v) {
  if (it.k === 'event' && EV[it.id].vars) Object.assign(v, EV[it.id].vars());
  if (it.k === 'trespass') { v.lost = Math.min(S.prey, rnd(3, 6)); S.prey -= v.lost; }
  if (it.k === 'gift') v.what = pick(['prey', 'herbs', 'warning']);
  if (it.k === 'gathering') { v.clouded = (S.dark >= 5 || S.honour <= 1) && chance(.5); v.news = gatheringNews(); }
  if (it.k === 'resolve') v.res = resolveSeason();
  if (it.k === 'walk' && !v.order) v.order = LEGENDS[v.id].steps.map(st => shuffleIdx(st.options.length));
  if (it.k === 'turning') { v.pool = clamp(2 + Math.floor(S.favour / 2) + (isHeart('steadfast') ? 1 : 0), 2, 9); v.alloc = { prey: 0, kits: 0, claws: 0, herbs: 0, scent: 0, dreams: 0 }; }
  if (it.k === 'ending') { S.over = true; v.summary = endingSummary(it.why); }
}

function buildSpec(it, v) {
  switch (it.k) {
    case 'event': { const e = EV[it.id]; return { title: e.title, art: e.art, artOpts: e.artOpts, text: e.text(v), advice: e.advice ? e.advice(v) : {}, options: e.options(v), drop: true }; }
    case 'script': { const e = SCRIPT[it.id]; return { title: e.title, kicker: e.kicker, art: e.art, artOpts: e.artOpts, text: e.text(v), advice: e.advice ? e.advice(v) : {}, options: e.options(v), drop: true }; }
    case 'explore': { const e = EXPLORE[v.zone]; return { title: e.title, kicker: 'Exploring the territory', art: e.art, artOpts: e.artOpts, text: e.text(v), advice: e.advice ? e.advice(v) : {}, options: e.options(v), drop: true }; }
    case 'raid': return raidScene(v);
    case 'raided': return raidedScene(v);
    case 'gift': return giftSceneV(v);
    case 'trespass': return trespassSceneV(v);
    case 'gathering': return gatheringScene(v);
    case 'season': return seasonSpec();
    case 'resolve': return resolveSpec(v);
    case 'walk': return walkSpec(v);
    case 'tale': return taleSpec(v);
    case 'turning': return { title: 'The Turning of Silverpelt', kicker: 'The longest night', art: 'moonpool', artOpts: { spirits: 3 }, special: 'turning', text: P(`On the longest night of leaf-bare, when the year turns, ${leaderName()} and Willowmoth keep vigil at the Moonpool together, as ThunderClan's leaders and medicine cats always have. StarClan's favour, earned through the seasons, is asked for and given out, a little to each part of the Clan's life.`, `You have <b>${v.pool}</b> blessings to ask for. Choose where they fall. They hold until the next Turning.`), options: [] };
    case 'ending': return { title: v.summary.title, kicker: 'The tale the elders tell', art: v.summary.art, artOpts: v.summary.artOpts, text: v.summary.text, special: 'ending', options: [{ t: 'Begin a new saga', go: () => { clearSave(); showCreate(); return null; } }] };
    case 'create': return { title: 'Who will lead?', special: 'create', art: 'hollow', artOpts: { time: 'night', season: 3 }, options: [] };
  }
}
// Pure versions of gift/trespass built from stored vars
function giftSceneV(v) { const r = giftScene(v); return r; }
function trespassSceneV(v) {
  const id = v.clan;
  return {
    title: 'Scent where it should not be', art: 'border', artOpts: { clan: id },
    text: P(`Your markers have faded to nothing, and ${cn(id)} has noticed. The dawn patrol finds their scent deep in the Oakwood, and prey-bones where ThunderClan did not leave them: <b>${v.lost}</b> pieces' worth of prey, at least, gone into other bellies.`),
    advice: { oakfang: 'This is what happens when the borders aren\'t walked.', rookfeather: 'Track them. Make an example.' },
    options: [
      { t: 'Re-mark the borders at once.', go: () => { S.scent = 2; return P('Your warriors walk the bounds again, grumbling. It should never have come to this.'); } },
      { t: 'Raise it at the Gathering.', go: () => { flag('offence_' + id, 'hunting in ThunderClan\'s Oakwood'); return P('You will make it known under the full moon.'); } },
      { t: 'Track the trespassers and drive them out.', go: () => { const f = fight({ clan: id, sent: 4, mode: 'defend' }); rel(id, -1); return P(f.won ? `Your patrol catches them with their jaws full and chases them all the way home.${fightLine(f)}` : `The trespassers turn and fight, and there are more of them than you thought.${fightLine(f)}`); } },
    ],
  };
}

function seasonSpec() {
  const lines = SEASON_LINES[S.season];
  const omen = S.year === 3 && S.season === 3 ? '' : S.season === 3 ? 'Leaf-bare is the hungry season. Count the fresh-kill pile carefully.' : S.season === 2 ? 'Whatever the Clan stores now must last through leaf-bare.' : '';
  return {
    title: seasonLabel(), kicker: `${leaderName()}'s ${['first', 'second', 'third'][S.year - 1] || 'last'} year`, art: 'hollow',
    text: P(lines[(S.year + S.season) % 2], `The fresh-kill pile holds <b>${S.prey}</b> pieces. <b>${totalCats()}</b> cats sleep in the hollow. ${omen}`,
      S.year === 3 && S.season === 3 ? 'Something is wrong with the lake.' : `You have time for <b>${S.actions === 1 ? 'one undertaking' : 'two undertakings'}</b> this season. Choose them from the dens below; end the season when you are done.`),
    options: [{ t: S.year === 3 && S.season === 3 ? 'Go to the lake' : 'Begin the season', primary: true, go: () => null }],
  };
}
function resolveSpec(v) {
  return { title: `The end of ${seasonName().toLowerCase()}`, kicker: 'What the season brought', art: 'hollow', artOpts: { time: 'night' }, text: v.res.lines.map(l => `<p>${l}</p>`).join(''), options: [{ t: 'Continue', primary: true, go: () => null }], chipsFrom: v.res.before };
}
function walkSpec(v) {
  const L = LEGENDS[v.id], st = L.steps[v.step];
  const order = v.order[v.step];
  const opts = order.map(i => ({ ...st.options[i], idx: i }));
  return {
    title: L.name, kicker: `Spirit-walk, step ${v.step + 1} of ${L.steps.length}`, art: st.art, artOpts: { dream: true, pelt: S.player.pelt },
    text: P(st.text, v.wrong ? '<span class="quiet">The legend has already frayed once. Another misstep will tear it apart.</span>' : ''),
    options: opts.map(o => ({ t: o.t, hint: S.bless.dreams >= 2 && o.ok, go: () => walkChoose(v, o.ok) })),
  };
}
function walkChoose(v, ok) {
  const L = LEGENDS[v.id], st = L.steps[v.step];
  if (ok) {
    if (v.step + 1 >= L.steps.length) {
      S.walked.push(v.id); S.boons.push(L.boon.id); add('favour', 1);
      logSaga(`${leaderName()} walked the legend of ${L.name} and returned with ${L.boon.name}.`);
      return P(st.okText, `<b>${L.boon.name}.</b> ${L.boon.desc}`);
    }
    return { text: P(st.okText), queue: [{ k: 'walk', v: { ...v, step: v.step + 1 } }] };
  }
  const wrong = v.wrong + 1;
  if (wrong >= 2) {
    add('favour', -2);
    let t = st.failText + ' The walk tears apart, and you are flung back into your body by the Moonpool, freezing.';
    if (chance(.5 - .1 * S.bless.dreams)) { const l = loseLife(`lost on a spirit-walk of ${L.name}`); if (l === 'lost') t += ` Something of you stayed behind in the legend. One life is gone. ${S.lives} remain.`; }
    logSaga(`${leaderName()} failed to walk the legend of ${L.name}.`);
    return P(t, '<span class="quiet">You may try this walk again in a later season.</span>');
  }
  return { text: P(st.failText, 'You stumble, and the legend frays, but it holds. You go on.'), queue: [{ k: 'walk', v: { ...v, step: v.step + 1, wrong } }] };
}
function taleSpec(v) {
  const L = LEGENDS[v.id];
  return { title: L.name, kicker: 'In the elders\' den', art: 'den', artOpts: { elder: 'cream', kits: true }, text: P(`<em>${L.teller}</em>`, ...L.tale, `${Q(L.lesson)} Speckleback says at the end. ${Q('That\'s the bones of it. Remember the bones, and you can walk it.')}`), options: [{ t: 'Thank Speckleback', primary: true, go: () => null }], drop: true };
}

function endingSummary(why) {
  const n = leaderName(), h = S.player.heart;
  const ep = { valiant: 'the Lion-hearted', kindred: 'the Kindred', shrewd: 'the Clear-eyed', steadfast: 'the Steadfast', ambitious: 'the Hungry' }[h] || '';
  const T = { unity: 'Remembered among the stars', alone: 'The Clan endured', raid: 'Survived, and not forgiven', dominion: 'The starless crown', fallen: 'The ninth life', scattered: 'The hollow stands empty' }[why];
  const she = pr('she', 'he'), her = pr('her', 'his'), She = pr('She', 'He');
  const friends = OTHER_CLANS.filter(id => S.clans[id].att >= 2).map(cn);
  const deeds = [];
  if (S.walked.length) deeds.push(`${She} walked ${S.walked.length === 1 ? 'one of the old legends' : S.walked.length + ' of the old legends'} in the spirit-world and came back changed: ${S.walked.map(id => LEGENDS[id].name).join(', ')}.`);
  if (S.stats.won) deeds.push(`ThunderClan won ${S.stats.won} ${S.stats.won === 1 ? 'battle' : 'battles'} under ${her} leadership${S.stats.lost ? ` and lost ${S.stats.lost}` : ''}.`);
  if (S.stats.named) deeds.push(`${S.stats.named} warriors took their names beneath ${her} Highledge.`);
  if (S.zones.thornmarsh.owner === 'thunder') deeds.push('Thornmarsh was ThunderClan\'s in those days.');
  if (F('catmint')) deeds.push('It was in that time the catmint at the old Twoleg nest was found.');
  const intro = `<p>Many seasons later, in a hollow ${n} would not recognise, an old she-cat settles into the moss, and the kits stop wriggling. ${Q(`This is the tale of ${n} ${ep},`)} she says. ${Q(`Who took ${her} heart from ${HEARTS[h].patron === 'A voice with no stars' ? 'a place with no stars' : HEARTS[h].patron} at the Moonpool.`)}</p>`;
  const mid = deeds.length ? `<p>${deeds.join(' ')}</p>` : '';
  const close = {
    unity: `<p>${Q(`And when the lake forgot how to move, ${n} called the five Clans across the ice to the island, and they shared one heart, as Firestar had said. That is why, on the coldest night of every leaf-bare, we still meet on the island and share our prey. Look up. The bright one, just above the Great Oak. That's ${n}. The stars did not forget.`)}</p>`,
    alone: `<p>${Q(`When the lake froze, ${n} sealed the hollow and held it. ThunderClan lived. Some say the prophecy wanted more than that. ${friends.length ? `${friends.join(' and ')} remember ${her} kindly.` : 'The other Clans tell it differently.'}`)}</p>`,
    raid: `<p>${Q(`When the lake froze and the Clans starved, ${n} took what ThunderClan needed from the weakest. ThunderClan lived. In the other Clans they do not say ${her} name at all. Firestar said the stars would forget, and perhaps they have.`)}</p>`,
    dominion: `<p>${Q(`When the lake froze, every leader at the lake bowed to ${n}, and every Clan was fed. Nobody died that winter. Nobody was ever quite free again, either. Look up. You will not find ${n} there. ${She} walks somewhere else now.`)}</p>`,
    fallen: `<p>${Q(`${n} spent all nine lives before the great freeze came. The last went ${S.log.slice(-1)[0] ? 'as the saga says' : 'quietly'}. ThunderClan chose a new leader under the Highledge, and the new leader went to the Moonpool, and the stars told the prophecy again, to someone else.`)}</p>`,
    scattered: `<p>${Q(`In the end there were too few warriors to hold the borders. The last of ThunderClan scattered into the other Clans, and the hollow stood empty a long time. It is not a happy tale. We tell it so it does not happen again.`)}</p>`,
  }[why];
  const stats = `<div class="census" style="margin-top:16px">
    <div><div class="n">${Math.max(0, S.lives)}</div><div class="l">lives remaining</div></div>
    <div><div class="n">${totalCats()}</div><div class="l">cats in ThunderClan</div></div>
    <div><div class="n">${S.stats.named}</div><div class="l">warriors named</div></div>
    <div><div class="n">${S.stats.born}</div><div class="l">kits born</div></div>
    <div><div class="n">${S.stats.died}</div><div class="l">cats lost</div></div>
    <div><div class="n">${S.walked.length}</div><div class="l">legends walked</div></div>
    <div><div class="n">${friends.length}</div><div class="l">Clans that call you friend</div></div>
  </div>`;
  const art = { unity: 'gathering', alone: 'snow', raid: 'battle', dominion: 'darkforest', fallen: 'vigil', scattered: 'hollow' }[why];
  return { title: T, art, artOpts: why === 'unity' ? { season: 3 } : { dead: S.player.pelt, pelt: S.player.pelt, season: 3 }, text: intro + mid + close + stats };
}

/* ---------- Queue ---------- */
function snap() { return JSON.parse(JSON.stringify({ lives: S.lives, prey: S.prey, herbs: S.herbs, favour: S.favour, mood: S.mood, honour: S.honour, dark: S.dark, camp: S.camp, scent: S.scent, cats: S.cats, clans: S.clans, legends: S.legends, boons: S.boons, zones: S.zones, allies: S.allies, bless: S.bless })); }

function openScene(it) {
  const v = it.v ? JSON.parse(JSON.stringify(it.v)) : {};
  onOpen(it, v);
  const spec = buildSpec(it, v);
  const opts = [];
  (spec.options || []).forEach((o, i) => {
    if (o.h && o.h !== S.player.heart) return;
    const dis = o.req && !o.req();
    opts.push({ i, t: o.t, h: o.h, heartCard: o.heartCard, why2: o.why2, dis, why: dis ? o.why : '', odds: isHeart('shrewd') && o.odds ? Math.round(clamp(o.odds(), .05, .95) * 10) : null, primary: o.primary, hint: o.hint });
  });
  S.scene = { it, v, stage: 'choose', spec: { title: spec.title, kicker: spec.kicker, art: spec.art, artOpts: spec.artOpts, text: spec.text, advice: spec.advice || {}, special: spec.special, drop: spec.drop }, opts };
  if (spec.chipsFrom) S.scene.chips = chipsBetween(spec.chipsFrom, snap());
}
function processQueue() {
  while (!S.scene) {
    const it = S.queue.shift();
    if (!it) break;
    if (it.k === 'advance') { advance(); continue; }
    openScene(it);
  }
  save(); render();
}
function choose(i) {
  const sc = S.scene; if (!sc || sc.stage !== 'choose') return;
  const spec = buildSpec(sc.it, sc.v);
  const opt = spec.options[i]; if (!opt || (opt.req && !opt.req())) return;
  const before = snap();
  let r = opt.go();
  if (r === null || r === undefined) { if (S.scene === sc) S.scene = null; processQueue(); return; }
  if (typeof r === 'string') r = { text: r };
  if (r.queue) S.queue.unshift(...r.queue);
  sc.stage = 'result'; sc.result = r.text; sc.chosen = ovr('opt:' + i, opt.t);
  sc.chips = chipsBetween(before, snap());
  save(); render();
  const pnl = $('#panel'); const out = pnl.querySelector('.outcome'); if (out) out.scrollIntoView({ block: 'nearest' });
}
function cont() { S.scene = null; processQueue(); $('#panel').scrollTop = 0; }

function doAction(id, arg) {
  if (S.scene) return;
  const before = snap();
  let r = null, cost = 1, title = '', art = 'hollow', artOpts = {};
  const A = ACTIONS[id];
  if (A && A.go) { if (A.req && !A.req()) return; if (!spend(A.cost)) return; r = A.go(); art = r.art || A.art; artOpts = r.artOpts || {}; title = r.title || A.name; }
  else if (id === 'explore') { if (!spend(1)) return; S.queue.unshift({ k: 'explore', v: { zone: arg } }); processQueue(); return; }
  else if (id === 'claim') { if (!spend(1)) return; r = claimAction(arg); title = 'Pushing the markers'; art = 'border'; artOpts = { clan: ZONES[arg].contested }; }
  else if (id === 'raid') { if (!spend(1)) return; S.queue.unshift({ k: 'raid', v: { clan: arg } }); processQueue(); return; }
  else if (['envoy', 'giftprey', 'giftherbs', 'ally', 'demand'].includes(id)) { if (!spend(1)) return; r = clanAction(id, arg); if (!r) { S.actions++; return; } title = r.title; art = CLANS[arg].art; artOpts = { clan: arg }; }
  else if (id === 'walk') { if (!spend(2)) return; S.favour -= 3; S.queue.unshift({ k: 'walk', v: { id: arg, step: 0, wrong: 0 } }); processQueue(); return; }
  else if (id === 'tale') { if (arg.free) { S.queue.unshift({ k: 'tale', v: { id: arg.id } }); processQueue(); return; } if (!spend(1)) return; S.legends.push(arg.id); add('mood', 1); logSaga(`Speckleback told the legend of ${LEGENDS[arg.id].name}.`); S.queue.unshift({ k: 'tale', v: { id: arg.id } }); processQueue(); return; }
  if (!r) return;
  S.scene = { it: { k: 'result' }, v: {}, stage: 'result', spec: { title, art, artOpts, text: '', advice: {} }, opts: [], result: typeof r.text === 'string' ? (r.text.startsWith('<p') ? r.text : `<p>${r.text}</p>`) : '', chips: chipsBetween(before, snap()) };
  save(); render();
}
function claimAction(z) {
  const owner = S.zones[z].owner, ctd = ZONES[z].contested;
  const p = owner ? .3 + .05 * skill('claw') - (S.clans[owner].att < 0 ? .08 : 0) : .7;
  if (owner) rel(owner, -1); else rel(ctd, -1);
  if (chance(p)) { S.zones[z].owner = 'thunder'; logSaga(`ThunderClan's markers were pushed into ${ZONES[z].name}.`); return { text: `<p>Your warriors lay ThunderClan scent along the far edge of ${ZONES[z].name}, tree by tree, and stand guard over it until the markers have soaked into the bark. It is yours now, and ${cn(ctd)} knows it.</p>` }; }
  const f = fight({ clan: ctd, sent: 4, mode: 'attack', aim: 'land' });
  if (f.won) { S.zones[z].owner = 'thunder'; return { text: `<p>A ${cn(ctd)} patrol finds you halfway along the line, and there is a brief, vicious scuffle among the ${z === 'thornmarsh' ? 'blackthorn' : 'long grass'}. It ends with your markers still standing.${fightLine(f)}</p>` }; }
  return { text: `<p>A ${cn(ctd)} patrol was waiting. By the time you have fought your way clear, they have scrubbed out every marker you laid.${fightLine(f)}</p>` };
}
function clanAction(id, c) {
  const name = cn(c), L = ldr(c);
  if (id === 'envoy') {
    const p = .5 + .06 * skill('tongue') - (S.clans[c].att <= -3 ? .25 : 0) - (isHeart('ambitious') ? .1 : 0);
    const r = Math.random();
    if (r < p) { const g = 1 + (hasBoon('fire') ? 1 : 0); rel(c, g); return { title: `An envoy to ${name}`, text: `<p>Rainpetal goes, with two warriors and her best manners. ${L} receives her at the border and they talk until sun-high. She comes home with nothing promised and something changed.</p>` }; }
    if (r > .92) { rel(c, -1); return { title: `An envoy to ${name}`, text: `<p>The talks go badly. Somebody says something about whose ancestors stole whose territory, and the envoys come home with their fur bristling.</p>` }; }
    return { title: `An envoy to ${name}`, text: `<p>${L} hears your envoys out politely, and sends them home with exactly as much as they came with.</p>` };
  }
  if (id === 'giftprey') { if (S.prey < 8) return null; S.prey -= 8; const g = 1 + ((S.season === 3 || S.clans[c].sick) ? 1 : 0) + (isHeart('kindred') ? 1 : 0) + (hasBoon('fire') ? 1 : 0); rel(c, g); return { title: `A gift for ${name}`, text: `<p>Your warriors carry eight pieces of fresh-kill to the border stone and leave them there. ${S.season === 3 ? `In leaf-bare, that is a gift ${L} cannot pretend not to need.` : `${L} is surprised into gratitude.`}</p>` }; }
  if (id === 'giftherbs') { if (S.herbs < 4) return null; S.herbs -= 4; const g = 1 + (S.clans[c].sick ? 1 : 0) + (hasBoon('fire') ? 1 : 0); rel(c, g); add('favour', 1); return { title: `Herbs for ${name}`, text: `<p>Willowmoth carries four bundles to ${name}'s medicine cat. ${S.clans[c].sick ? 'There is sickness in their nursery, and the herbs arrive just in time.' : 'They are put by against leaf-bare, with thanks.'}</p>` }; }
  if (id === 'ally') {
    const p = .45 + .1 * (S.clans[c].att - 3) + (hasBoon('lion') ? .25 : 0) + .03 * S.honour - (isHeart('ambitious') ? .15 : 0);
    if (chance(p)) { S.allies.push(c); rel(c, 1); logSaga(`ThunderClan and ${name} swore alliance.`); return { title: `Alliance with ${name}`, text: `<p>You and ${L} meet alone on the island at half-moon and share tongues as leaders seldom do. When you part, ThunderClan and ${name} are allies: each will come when the other calls.</p>` }; }
    return { title: `Alliance with ${name}`, text: `<p>${L} listens, and thinks, and says: not yet. ${lpr(c, 'She', 'He')} wants to see more of ThunderClan before ${lpr(c, 'she', 'he')} binds ${lpr(c, 'her', 'his')} Clan to it.</p>` };
  }
  if (id === 'demand') {
    if (S.cats.warriors > S.clans[c].str * .8) { const g = rnd(6, 10); add('prey', g); rel(c, -2); add('dark', 1); add('honour', -1); return { title: `Tribute from ${name}`, text: `<p>You walk to the border with every warrior behind you and tell ${L} what ThunderClan expects. ${lpr(c, 'She', 'He')} counts your warriors, and counts ${lpr(c, 'her', 'his')} own, and sends <b>${g}</b> pieces of fresh-kill across the line without a word.</p>` }; }
    rel(c, -1); add('mood', -1); return { title: `Tribute from ${name}`, text: `<p>${L} laughs. ${name} has more warriors than you thought, and every one of them heard you.</p>` };
  }
}

/* ---------- Chips: what changed ---------- */
function chipsBetween(a, b) {
  const out = [];
  const num = (k, label, cls = '') => { const d = b[k] - a[k]; if (d) out.push([`${label} ${d > 0 ? '+' : '−'}${Math.abs(d)}`, cls || (d > 0 ? 'up' : 'down')]); };
  if (b.lives < a.lives) out.push([`A life lost: ${b.lives} remain`, 'down']);
  num('prey', 'Fresh-kill'); num('herbs', 'Herbs'); num('favour', 'StarClan\'s favour', 'star');
  if (b.mood !== a.mood) out.push([`Spirits ${b.mood > a.mood ? 'rise' : 'fall'}: ${moodWord(b.mood).toLowerCase()}`, b.mood > a.mood ? 'up' : 'down']);
  num('honour', 'Honour');
  if (b.dark > a.dark) out.push(['The starless dark draws nearer', 'down']); else if (b.dark < a.dark) out.push(['The dark recedes', 'star']);
  if (b.camp !== a.camp) out.push([b.camp > a.camp ? 'Camp walls stronger' : 'Camp walls damaged', b.camp > a.camp ? 'up' : 'down']);
  if (b.scent > a.scent) out.push(['Borders marked fresh', 'up']);
  const CN = { warriors: 'Warriors', apprentices: 'Apprentices', queens: 'Queens', kits: 'Kits', elders: 'Elders' };
  for (const k in CN) { const d = b.cats[k] - a.cats[k]; if (d) out.push([`${CN[k]} ${d > 0 ? '+' : '−'}${Math.abs(d)}`, d > 0 ? 'up' : 'down']); }
  for (const id of OTHER_CLANS) { const x = a.clans[id].att, y = b.clans[id].att; if (x !== y) out.push([`${cn(id)}: ${attWord(x).toLowerCase()} to ${attWord(y).toLowerCase()}`, y > x ? 'up' : 'down']); }
  b.legends.filter(l => !a.legends.includes(l)).forEach(l => out.push([`Legend learned: ${LEGENDS[l].name}`, 'star']));
  b.boons.filter(l => !a.boons.includes(l)).forEach(l => out.push([`Gift of StarClan: ${LEGENDS[l].boon.name}`, 'star']));
  b.allies.filter(l => !a.allies.includes(l)).forEach(l => out.push([`Allied with ${cn(l)}`, 'up']));
  for (const z in b.zones) { if (a.zones[z].owner !== b.zones[z].owner) { if (b.zones[z].owner === 'thunder') out.push([`${ZONES[z].short} claimed`, 'up']); else if (a.zones[z].owner === 'thunder') out.push([`${ZONES[z].short} lost`, 'down']); } else if (!a.zones[z].explored && b.zones[z].explored) out.push([`${ZONES[z].short} explored`, 'up']); }
  for (const k in b.bless) if (b.bless[k] !== a.bless[k]) out.push([`${BLESSINGS[k].name} ${b.bless[k] > a.bless[k] ? '+' : '−'}${Math.abs(b.bless[k] - a.bless[k])}`, 'star']);
  return out;
}

/* ---------- Rendering ---------- */
let ART_KEY = '';
function setArt(key, opts = {}, caption = null) {
  const art = $('#art');
  const o = { season: S ? S.season : 1, pelt: S ? S.player.pelt : 'grey', ...opts };
  const k = key + JSON.stringify(o);
  if (key === 'map') {
    if (ART_KEY !== k || !art.querySelector('.mapwrap')) { art.innerHTML = `<div class="mapwrap">${mapSVG(S)}</div>`; bindMap(); }
    ART_KEY = k;
  } else if (ART_KEY !== k || !art.querySelector('canvas.scene')) {
    art.innerHTML = '<canvas class="scene"></canvas><canvas class="motes"></canvas><div class="caption"></div>';
    paintScene(art.querySelector('canvas.scene'), key, o);
    startMotes(art.querySelector('canvas.motes'), ['moonpool', 'vigil', 'title'].includes(key) || o.dream);
    ART_KEY = k;
  }
  let cap = art.querySelector('.caption');
  if (!cap) { cap = document.createElement('div'); cap.className = 'caption'; art.appendChild(cap); }
  cap.style.display = caption ? '' : 'none';
  if (caption) cap.innerHTML = `<h1>${esc(caption.t)}</h1>${caption.w ? `<div class="where">${esc(caption.w)}</div>` : ''}`;
}
function bindMap() {
  document.querySelectorAll('.zone').forEach(el => {
    const sel = () => { S.zoneSel = el.dataset.zone; S.tab = 'territory'; save(); render(); };
    el.addEventListener('click', sel);
    el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sel(); } });
  });
}

function render() {
  if (!S) return;
  const started = F('started');
  $('#band').hidden = !started; $('#tabs').hidden = !started;
  if (started) renderBand();
  renderTabs();
  if (S.scene) renderScene(); else renderManage();
  edAfterRender();
}

function renderBand() {
  const st = (k, n, l, warn) => `<div class="store${warn ? ' warn' : ''}" title="${esc(l)}">${icon(k)}<div><span class="n">${n}</span><span class="l">${l}</span></div></div>`;
  const paws = [0, 1].map(i => `<span style="color:${i < S.actions ? 'var(--silver)' : '#2c4442'}">${icon('paw')}</span>`).join('');
  $('#band').innerHTML = `
    <div class="season-block">${icon('moon', 'width="28" height="28" style="color:var(--silver)"')}<div><div class="season-name">${seasonLabel()}</div><div class="season-sub">${leaderName()} of ThunderClan, ${HEARTS[S.player.heart]?.name.toLowerCase() || ''}</div></div></div>
    <div class="lives">${livesSVG(S.lives)}<div class="lives-label"><b>${S.lives}</b> of nine<br>lives</div></div>
    <div class="stores">
      ${st('prey', S.prey, 'fresh-kill', S.prey < upkeep())}
      ${st('herbs', S.herbs, 'herbs', S.herbs < 3)}
      ${st('cats', totalCats(), 'cats')}
      ${st('favour', S.favour, 'StarClan\'s favour')}
      ${st('mood', moodWord(S.mood), 'spirits', S.mood <= -2)}
    </div>
    <div class="paws">${paws}<span class="l">${S.actions === 1 ? 'one undertaking left' : S.actions ? 'two undertakings left' : 'season spent'}</span></div>`;
}

const TABS = [['camp', 'Camp', 'camp', 'Camp'], ['territory', 'Territory', 'territory', 'Land'], ['clans', 'Clans', 'clans', 'Clans'], ['starclan', 'StarClan', 'starclan', 'Stars'], ['elders', 'Elders\' den', 'elders', 'Elders'], ['saga', 'Saga', 'saga', 'Saga']];
function renderTabs() {
  const busy = !!S.scene;
  $('#tabs').innerHTML = TABS.map(([id, n, ic, sh]) => `<button class="tab" role="tab" aria-selected="${!busy && S.tab === id}" ${busy ? 'disabled' : ''} data-tab="${id}" aria-label="${n}">${icon(ic)}<span class="long">${n}</span><span class="short">${sh}</span></button>`).join('') +
    `<button class="tab end${S.actions === 0 && !busy ? ' ready' : ''}" ${busy || S.over ? 'disabled' : ''} id="endbtn" aria-label="End the season">${icon('moon')}<span class="long">End the season</span><span class="short">End season</span></button>`;
  document.querySelectorAll('.tab[data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; save(); render(); $('#panel').scrollTop = 0; });
  const eb = $('#endbtn'); if (eb) eb.onclick = () => { if (S.scene || S.over) return; endSeason(); processQueue(); $('#panel').scrollTop = 0; };
}

function portrait(id, size = 54) {
  const c = COUNCIL[id];
  return catSVG({ pelt: c.pelt, pattern: c.pattern, eyes: c.eyes, seed: id });
}
function playerPortrait() { const p = S.player; return catSVG({ pelt: p.pelt, pattern: p.pattern, eyes: p.eyes, seed: 'player' + p.pre }); }

function editOpts(sc) {
  if (!ED.on || ['turning', 'ending', 'create'].includes(sc.spec.special)) return sc.opts;
  try {
    const spec = buildSpec(sc.it, sc.v);
    return (spec.options || []).map((o, i) => { const dis = o.req && !o.req(); return { i, t: o.t, h: o.h, heartCard: o.heartCard, dis, why: dis ? o.why : '', odds: isHeart('shrewd') && o.odds ? Math.round(clamp(o.odds(), .05, .95) * 10) : null, primary: o.primary, hint: o.hint }; });
  } catch (e) { return sc.opts; }
}
function renderScene() {
  const sc = S.scene, sp = sc.spec;
  if (sp.special === 'create') return renderCreate();
  ED.orig = {};
  const title = ovr('title', sp.title || '');
  setArt(sp.art || 'forest', sp.artOpts || {}, { t: title, w: sp.kicker || '' });
  const pnl = $('#panel');
  let h = '';
  if (sp.kicker) h += `<p class="kicker">${esc(sp.kicker)}</p>`;
  h += `<h2 class="ptitle" data-ed="title">${esc(title)}</h2>`;
  h += `<div class="prose${sp.drop && !ED.on ? ' drop' : ''}" data-ed="text" data-html="1">${ovr('text', sp.text || '')}</div>`;
  const adv = Object.keys(sp.advice || {}).filter(k => COUNCIL[k]);
  if (adv.length && sc.stage === 'choose') {
    h += `<div class="council"><p class="hint">Your council has something to say. Choose a cat to hear them.</p><div class="council-row">${adv.map(k => `<button class="adv" data-adv="${k}" aria-pressed="${sc.adv === k}"><span class="ring">${portrait(k)}</span><span class="nm">${COUNCIL[k].name}</span></button>`).join('')}</div>`;
    if (ED.on) h += adv.map(k => `<div class="bubble"><b>${COUNCIL[k].name}</b> <span class="role">${S.deputy === k ? 'Deputy' : COUNCIL[k].role}</span><br><span data-ed="adv:${k}">${esc(ovr('adv:' + k, sp.advice[k]))}</span></div>`).join('');
    else if (sc.adv && sp.advice[sc.adv]) h += `<div class="bubble"><b>${COUNCIL[sc.adv].name}</b> <span class="role">${S.deputy === sc.adv ? 'Deputy' : COUNCIL[sc.adv].role}</span><br>${esc(ovr('adv:' + sc.adv, sp.advice[sc.adv]))}</div>`;
    h += '</div>';
  }
  if (sp.special === 'turning' && sc.stage === 'choose') h += renderTurning(sc);
  else if (sc.stage === 'choose') {
    const tag = ED.on ? 'div' : 'button';
    h += '<div class="choices">' + editOpts(sc).map(o => {
      const pickBtn = ED.on ? `<button class="ed-pick" data-opt="${o.i}" ${o.dis ? 'disabled' : ''}>Choose</button>` : '';
      const attrs = ED.on ? '' : `data-opt="${o.i}" ${o.dis ? 'disabled' : ''}`;
      const label = esc(ovr('opt:' + o.i, o.t));
      if (o.heartCard) { const H = HEARTS[o.heartCard]; return `<${tag} class="choice heart" ${attrs} style="padding-left:46px"><span class="sig" style="color:${o.heartCard === 'ambitious' ? '#cf5a48' : 'var(--silver)'}">${sigil(H.sig, 'currentColor', 22)}</span><span class="hname">${H.name}</span><span style="font-family:var(--display);font-size:18px" data-ed="opt:${o.i}">${label}</span><span class="why">${esc(H.effect)}</span>${pickBtn}</${tag}>`; }
      const hs = o.h ? `<span class="sig" style="color:var(--silver)">${sigil(HEARTS[o.h].sig, 'currentColor', 22)}</span>` : '';
      const offHeart = ED.on && o.h && o.h !== S.player.heart ? ' <span class="why">Only shown to this heart. Visible here because the editor is on.</span>' : '';
      return `<${tag} class="choice${o.h ? ' heart' : ''}${o.primary ? ' primary' : ''}" ${attrs} ${o.h ? 'style="padding-left:46px"' : ''}>${hs}${o.h ? `<span class="hname">${HEARTS[o.h].patron === 'A voice with no stars' ? 'Your hunger' : HEARTS[o.h].patron + '\'s gift'}</span>` : ''}<span data-ed="opt:${o.i}">${label}</span>${o.odds != null ? ` <span class="odds">Yellowfang's eye: about ${o.odds} in 10</span>` : ''}${o.hint ? ' <span class="odds" style="color:var(--silver)">The stars brighten</span>' : ''}${o.dis && o.why ? `<span class="why">${esc(o.why)}</span>` : ''}${offHeart}${pickBtn}</${tag}>`;
    }).join('') + '</div>';
    if (sc.chips && sc.chips.length) h += `<div class="chips">${sc.chips.map(([t, c]) => `<span class="chip ${c}">${esc(t)}</span>`).join('')}</div>`;
  } else {
    h += `<div class="outcome">${sc.chosen ? `<p class="quiet">${esc(sc.chosen)}</p>` : ''}<div class="prose" data-ed="result" data-html="1">${ovr('result', sc.result || '')}</div>`;
    if (sc.chips && sc.chips.length) h += `<div class="chips">${sc.chips.map(([t, c]) => `<span class="chip ${c}">${esc(t)}</span>`).join('')}</div>`;
    h += `<div class="choices"><button class="choice primary" id="contbtn">Continue</button></div></div>`;
  }
  if (sp.special === 'ending') h += '<h3 class="section-h">The saga, season by season</h3>' + renderSagaList();
  pnl.innerHTML = h;
  pnl.querySelectorAll('[data-opt]').forEach(b => b.onclick = e => { if (e.target.closest('[contenteditable="true"]')) return; choose(+b.dataset.opt); });
  pnl.querySelectorAll('[data-adv]').forEach(b => b.onclick = () => { sc.adv = sc.adv === b.dataset.adv ? null : b.dataset.adv; save(); renderScene(); edAfterRender(); });
  const cb = $('#contbtn'); if (cb) { cb.onclick = cont; }
  if (sp.special === 'turning') bindTurning(sc);
}

function renderTurning(sc) {
  const used = Object.values(sc.v.alloc).reduce((a, b) => a + b, 0), left = sc.v.pool - used;
  let h = `<p class="pool">${left === 1 ? 'One blessing' : left + ' blessings'} left to give</p><div class="blessings">`;
  for (const k in BLESSINGS) {
    const n = sc.v.alloc[k];
    h += `<div class="bless"><div class="bn">${BLESSINGS[k].name}</div><div class="bd">${BLESSINGS[k].desc} Last year: ${S.bless[k]}.</div><div class="ctl"><button data-b="${k}" data-d="-1" aria-label="Fewer for ${BLESSINGS[k].name}" ${n <= 0 ? 'disabled' : ''}>−</button><span class="pips">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span><button data-b="${k}" data-d="1" aria-label="More for ${BLESSINGS[k].name}" ${n >= 3 || left <= 0 ? 'disabled' : ''}>+</button></div></div>`;
  }
  h += `</div><div class="choices"><button class="choice primary" id="sealbtn">${left > 0 ? `Seal the blessings (${left} left unasked)` : 'Seal the blessings'}</button></div>`;
  return h;
}
function bindTurning(sc) {
  document.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const k = b.dataset.b, d = +b.dataset.d; const used = Object.values(sc.v.alloc).reduce((a, c) => a + c, 0); const n = sc.v.alloc[k] + d; if (n < 0 || n > 3 || (d > 0 && used >= sc.v.pool)) return; sc.v.alloc[k] = n; save(); renderScene(); });
  const s = $('#sealbtn'); if (s) s.onclick = () => {
    const before = snap();
    S.bless = { ...sc.v.alloc }; if (isHeart('valiant')) S.bless.claws = Math.max(S.bless.claws, 1);
    if (F('darkTrained')) S.bless.claws = Math.min(3, S.bless.claws + 1);
    S.favour = Math.floor(S.favour / 3);
    logSaga(`At the Turning of Silverpelt, StarClan's blessings fell on ${Object.keys(S.bless).filter(k => S.bless[k]).map(k => BLESSINGS[k].name.toLowerCase()).join(', ') || 'nothing at all'}.`);
    sc.stage = 'result'; sc.result = P('The stars in the pool flare, one by one, as each blessing is given. When you walk home along the dimpled path, the year has turned.'); sc.chips = chipsBetween(before, snap());
    save(); renderScene();
  };
}

/* ---------- Management (the dens) ---------- */
function actBtn(id, name, desc, cost, dis, why, arg = '') {
  return `<button class="act" data-act="${id}" data-arg="${esc(arg)}" ${dis ? 'disabled' : ''}><span class="an">${esc(name)}</span><span class="ac">${cost === 0 ? 'free' : cost === 2 ? 'both undertakings' : 'one undertaking'}</span><span class="ad">${desc}${dis && why ? ` <i>${esc(why)}</i>` : ''}</span></button>`;
}
function stdAct(id) { const A = ACTIONS[id]; const dis = S.actions < A.cost || (A.req && !A.req()); return actBtn(id, A.name, A.desc(), A.cost, dis, S.actions < A.cost ? 'No time left this season.' : (A.req && !A.req() ? A.why : '')); }

function renderManage() {
  const t = S.tab, pnl = $('#panel');
  let h = '';
  const noTime = S.actions <= 0;
  if (t === 'camp') {
    setArt('hollow', {}, { t: 'The Stone Hollow', w: `ThunderClan's camp, ${seasonName().toLowerCase()}` });
    const c = S.cats;
    h += `<p class="kicker">ThunderClan</p><h2 class="ptitle">The camp</h2>`;
    h += `<div class="census"><div><div class="n">${c.warriors}</div><div class="l">warriors</div></div><div><div class="n">${c.apprentices}</div><div class="l">apprentices</div></div><div><div class="n">${c.queens}</div><div class="l">queens</div></div><div><div class="n">${c.kits}</div><div class="l">kits</div></div><div><div class="n">${c.elders}</div><div class="l">elders</div></div><div><div class="n">${upkeep()}</div><div class="l">fresh-kill eaten each season</div></div></div>`;
    h += `<p style="margin-top:14px">The Clan's spirits are <b>${moodWord(S.mood).toLowerCase()}</b>. Its honour among the Clans is <b>${['shameful', 'shameful', 'poor', 'poor', 'middling', 'good', 'good', 'high', 'high', 'shining', 'shining'][S.honour]}</b>. The camp walls are <b>${['bare', 'patched', 'thick', 'a wall of thorns'][S.camp]}</b>.</p>`;
    h += `<h3 class="section-h">Undertakings</h3><div class="acts">${stdAct('feast')}${stdAct('train')}${stdAct('walls')}</div>`;
    h += `<h3 class="section-h">Your council</h3><div class="acts">`;
    h += `<div class="act" style="cursor:default;grid-template-columns:54px 1fr"><span class="ring" style="width:54px;height:54px;border-radius:50%;overflow:hidden;border:1.5px solid var(--silver-deep);grid-row:span 2">${playerPortrait()}</span><span class="an">${leaderName()} <span class="quiet" style="font-size:14px">Leader</span></span><span class="ad" style="grid-column:2">${HEARTS[S.player.heart].name}. ${esc(HEARTS[S.player.heart].effect)}</span></div>`;
    for (const id in COUNCIL) { const co = COUNCIL[id]; const sk = Object.entries(co.skills).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k, v]) => `${SKILL_NAMES[k]} ${v}`).join(', '); h += `<div class="act" style="cursor:default;grid-template-columns:54px 1fr"><span class="ring" style="width:54px;height:54px;border-radius:50%;overflow:hidden;border:1.5px solid var(--edge);grid-row:span 2">${portrait(id)}</span><span class="an">${co.name} <span class="quiet" style="font-size:14px">${S.deputy === id ? 'Deputy' : co.role}</span></span><span class="ad" style="grid-column:2">${esc(co.bio)} <i>${sk}.</i></span></div>`; }
    h += '</div>';
  }
  if (t === 'territory') {
    setArt('map', { z: JSON.stringify(S.zones), sel: S.zoneSel });
    h += `<p class="kicker">ThunderClan territory</p><h2 class="ptitle">The forest</h2>`;
    const z = S.zoneSel;
    if (z) {
      const zd = ZONES[z], zs = S.zones[z];
      h += `<div class="legend-card known"><h3>${zs.explored ? zd.name : 'Unexplored ground'}</h3><div class="st">${zs.owner === 'thunder' ? 'ThunderClan land' : zs.owner ? `Held by ${cn(zs.owner)}` : zs.explored ? 'Unclaimed' : 'Nobody has walked here in living memory'}</div><p style="margin:.5em 0 0">${zs.explored ? zd.desc : 'Beyond the last scent marker, the forest goes on. Somebody should find out what is there.'}</p>${zs.explored ? `<p class="quiet" style="margin:.3em 0 0">Prey ${'●'.repeat(zd.prey)}${'○'.repeat(3 - Math.min(3, zd.prey))}, herbs ${'●'.repeat(Math.min(3, zd.herbs))}${'○'.repeat(3 - Math.min(3, zd.herbs))}</p>` : ''}<div class="btns">`;
      if (!zs.explored) h += `<button class="mini" data-act="explore" data-arg="${z}" ${noTime ? 'disabled' : ''}>Explore it (one undertaking)</button>`;
      if (zs.explored && zs.owner !== 'thunder' && zd.contested) h += `<button class="mini" data-act="claim" data-arg="${z}" ${noTime ? 'disabled' : ''}>Push our markers into it (one undertaking)</button>`;
      if (zs.explored && zs.owner && zs.owner !== 'thunder') h += `<button class="mini" data-act="raid" data-arg="${zs.owner}" ${noTime ? 'disabled' : ''}>Plan a raid on ${cn(zs.owner)}</button>`;
      h += `<button class="mini" id="zclose">Close</button></div></div>`;
    } else h += `<p class="quiet">Choose a part of the map to see it, explore it, or claim it. Unexplored ground is marked with a question.</p>`;
    h += `<p>ThunderClan holds <b>${Object.values(S.zones).filter(x => x.owner === 'thunder').length}</b> of the forest's nine parts. The borders are <b>${['unmarked: the scent has faded away', 'thinly marked', 'clearly marked', 'strongly marked'][S.scent]}</b>.</p>`;
    h += `<h3 class="section-h">Undertakings</h3><div class="acts">${stdAct('hunt')}${stdAct('herbs')}${stdAct('border')}</div>`;
  }
  if (t === 'clans') {
    setArt('lake', { time: 'dusk' }, { t: 'The five Clans', w: 'Around the lake' });
    h += `<p class="kicker">Neighbours</p><h2 class="ptitle">The Clans of the lake</h2>`;
    for (const id of OTHER_CLANS) {
      const c = S.clans[id], C = CLANS[id], a = c.att;
      const bar = Array.from({ length: 10 }, (_, i) => { const v = i - 5; const on = a < 0 ? (v >= a && v < 0) : (v >= 0 && v < a); return `<i class="${on ? 'on ' + (a < 0 ? 'neg' : 'pos') : ''}"></i>`; }).join('');
      const intel = F('intel_' + id) ? ` About ${c.str} warriors${c.sick ? ', sickness in the nursery' : ''}.` : '';
      h += `<div class="clan-card"><svg class="glyph" viewBox="0 0 40 40" fill="none" stroke="var(--silver)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${SIGILS[C.glyph]}</svg><div class="cn">${C.name} <span class="att quiet" style="font-size:15px">${attWord(a)}${S.allies.includes(id) ? ', allied' : ''}</span></div><div class="cl">${esc(C.who)} ${esc(C.way)}${intel}<div class="attbar" aria-label="Relations: ${attWord(a)}">${bar}</div></div><div class="btns">
        <button class="mini" data-act="envoy" data-arg="${id}" ${noTime ? 'disabled' : ''}>Send an envoy</button>
        <button class="mini" data-act="giftprey" data-arg="${id}" ${noTime || S.prey < 8 ? 'disabled' : ''}>Gift 8 fresh-kill</button>
        <button class="mini" data-act="giftherbs" data-arg="${id}" ${noTime || S.herbs < 4 ? 'disabled' : ''}>Share 4 herbs</button>
        ${a >= 3 && !S.allies.includes(id) ? `<button class="mini" data-act="ally" data-arg="${id}" ${noTime ? 'disabled' : ''}>Propose alliance</button>` : ''}
        ${isHeart('ambitious') || S.dark >= 3 ? `<button class="mini" data-act="demand" data-arg="${id}" ${noTime ? 'disabled' : ''}>Demand tribute</button>` : ''}
        <button class="mini" data-act="raid" data-arg="${id}" ${noTime ? 'disabled' : ''}>Plan a raid</button></div></div>`;
    }
    h += `<p class="quiet">Every undertaking here takes one of your two for the season. Clans that trust you may be asked for alliance; allies will not raid you, and will answer when you call.</p>`;
  }
  if (t === 'starclan') {
    setArt('moonpool', { spirits: S.dark >= 5 ? 0 : 3 }, { t: 'The Moonpool', w: 'Where StarClan comes down to the water' });
    h += `<p class="kicker">StarClan</p><h2 class="ptitle">Silverpelt</h2>`;
    h += `<p>StarClan's favour stands at <b>${S.favour}</b>. ${S.dark >= 5 ? 'Your dreams have grown starless, and something waits at the edge of them.' : S.dark >= 3 ? 'Some nights your dreams have no stars in them.' : 'Your dreams are clear, and full of stars.'}</p>`;
    h += `<h3 class="section-h">Undertakings</h3><div class="acts">${stdAct('vigil')}`;
    LEGEND_ORDER.forEach(id => {
      const L = LEGENDS[id], known = S.legends.includes(id), walked = S.walked.includes(id);
      if (!known) return;
      const dis = walked || S.actions < 2 || S.favour < 3;
      h += actBtn('walk', `Walk the legend: ${L.name}`, walked ? `Walked. You carry ${L.boon.name}.` : `Re-live the legend in the spirit-world, step by step. Choose as the legend went, and you will come back with a gift: ${L.boon.desc} Costs 3 of StarClan's favour. A failed walk can cost a life.`, 2, dis, walked ? '' : S.actions < 2 ? 'Needs both undertakings for the season.' : S.favour < 3 ? 'Needs 3 of StarClan\'s favour.' : '', id);
    });
    if (!S.legends.length) h += `<p class="quiet">You know no legends well enough to walk them yet. The elders keep them.</p>`;
    h += `</div><h3 class="section-h">This year's blessings</h3><div class="blessings">`;
    for (const k in BLESSINGS) h += `<div class="bless"><div class="bn">${BLESSINGS[k].name}</div><div class="bd">${BLESSINGS[k].desc}</div><div class="ctl"><span class="pips">${[0, 1, 2].map(i => `<i class="${i < S.bless[k] ? 'on' : ''}"></i>`).join('')}</span></div></div>`;
    h += `</div>`;
    if (S.boons.length) h += `<h3 class="section-h">Gifts from the legends</h3>` + S.boons.map(b => `<div class="lore-entry"><h4>${LEGENDS[b].boon.name}</h4><p>${LEGENDS[b].boon.desc}</p></div>`).join('');
  }
  if (t === 'elders') {
    setArt('den', { elder: 'cream', kits: true }, { t: 'The elders\' den', w: 'Where the old tales are kept' });
    h += `<p class="kicker">Speckleback's den</p><h2 class="ptitle">The legends</h2>`;
    h += `<p>Every legend the Clan remembers can be walked in the spirit-world, but only by a leader who knows how it goes. Ask the elders to tell you the old stories.</p>`;
    LEGEND_ORDER.forEach(id => {
      const L = LEGENDS[id], known = S.legends.includes(id);
      h += `<div class="legend-card${known ? ' known' : ''}"><h3>${L.name}</h3><div class="st">${known ? (S.walked.includes(id) ? 'Known, and walked' : 'Known') : 'Not yet heard'}</div><div class="btns">${known ? `<button class="mini" data-act="tale" data-arg="${id}" data-free="1">Hear it again (free)</button>` : `<button class="mini" data-act="tale" data-arg="${id}" ${noTime ? 'disabled' : ''}>Ask Speckleback to tell it (one undertaking)</button>`}</div></div>`;
    });
    ED.orig = {}; h += `<h3 class="section-h">The ways of the Clans</h3>` + LORE.map((l, i) => `<div class="lore-entry"><h4 data-ed="lore:${i}:h">${esc(ovr('lore:' + i + ':h', l.h))}</h4><p data-ed="lore:${i}:p">${esc(ovr('lore:' + i + ':p', l.p))}</p></div>`).join('');
  }
  if (t === 'saga') {
    setArt('gathering', {}, { t: 'The saga', w: `The tale of ${leaderName()}` });
    h += `<p class="kicker">As the elders will tell it</p><h2 class="ptitle">The saga of ${leaderName()}</h2>` + renderSagaList();
    h += `<h3 class="section-h">The prophecy</h3><p class="prose"><em>When the lake forgets to move, five must share one heart, or the stars will forget your names.</em></p>`;
    h += `<div class="btns" style="margin-top:22px"><button class="mini" id="restart">Abandon this saga and begin again</button></div>`;
  }
  pnl.innerHTML = h;
  pnl.querySelectorAll('[data-act]').forEach(b => b.onclick = () => { const a = b.dataset.act, arg = b.dataset.arg; if (a === 'tale') doAction('tale', { id: arg, free: !!b.dataset.free }); else doAction(a, arg); });
  const zc = $('#zclose'); if (zc) zc.onclick = () => { S.zoneSel = null; render(); };
  const rs = $('#restart'); if (rs) rs.onclick = () => { if (rs.dataset.sure) { clearSave(); showCreate(); } else { rs.dataset.sure = 1; rs.textContent = 'Are you sure? Choose again to abandon this saga'; } };
}
function renderSagaList() {
  if (!S.log.length) return '<p class="quiet">Nothing has happened yet that the elders would bother to tell.</p>';
  const groups = [];
  S.log.forEach(e => { const k = e.y + '-' + e.s; let g = groups[groups.length - 1]; if (!g || g.k !== k) { g = { k, y: e.y, s: e.s, items: [] }; groups.push(g); } g.items.push(e.t); });
  return groups.map(g => `<div class="saga-season"><h4>${SEASONS[g.s]} of the ${YEARS[g.y - 1] || 'last'} year</h4>${g.items.map(t => `<p>${esc(t)}</p>`).join('')}</div>`).join('');
}

/* ---------- Creation ---------- */
function showCreate() {
  $('#title').hidden = true;
  S = freshState();
  S.scene = { it: { k: 'create' }, v: {}, stage: 'choose', spec: { special: 'create', title: 'Who will lead?' }, opts: [] };
  save(); render();
}
function renderCreate() {
  const p = S.player;
  setArt('hollow', { time: 'night', season: 3, pelt: p.pelt }, { t: 'Who will lead?', w: 'The Stone Hollow, the last night of leaf-bare' });
  const seg = (field, map, swatch) => `<div class="seg" role="group">${Object.keys(map).map(k => `<button aria-pressed="${p[field] === k}" data-f="${field}" data-v="${k}">${swatch ? `<span class="sw" style="background:${swatch(k)}"></span>` : ''}${typeof map[k] === 'string' ? map[k] : map[k].n}</button>`).join('')}</div>`;
  const pre = p.custom || p.pre;
  $('#panel').innerHTML = `
    <p class="kicker">ThunderClan, the last night of leaf-bare</p>
    <h2 class="ptitle">Who will lead?</h2>
    <div class="prose drop"><p>Beechstar is dead. The old leader lost the last of her lives to the cough that came with the snow, and ThunderClan buried her at dawn. You were her deputy. Tonight you must walk to the Moonpool and ask StarClan for nine lives.</p><p>But first: who are you?</p></div>
    <div style="display:flex;gap:18px;align-items:center;margin:16px 0 6px"><span style="width:110px;height:110px;border-radius:50%;overflow:hidden;border:1.5px solid var(--silver-deep);flex:none;display:block">${playerPortrait()}</span>
      <div><div class="bigname">${esc(pre + p.suf)}<small>Deputy of ThunderClan. StarClan will name you ${esc(pre)}star.</small></div></div></div>
    <div class="create-grid">
      <div class="field"><span class="flabel">Your warrior name</span><div class="namebox">
        <select id="f-pre" aria-label="First part of your name">${PLAYER_PRE.map(n => `<option ${n === p.pre && !p.custom ? 'selected' : ''}>${n}</option>`).join('')}<option value="__custom" ${p.custom ? 'selected' : ''}>Your own…</option></select>
        <input type="text" id="f-custom" aria-label="Your own first part" placeholder="e.g. Quill" maxlength="10" value="${esc(p.custom)}" ${p.custom ? '' : 'hidden'}>
        <select id="f-suf" aria-label="Second part of your name">${NAME_SUF.map(n => `<option ${n === p.suf ? 'selected' : ''}>${n}</option>`).join('')}</select></div></div>
      <div class="field"><span class="flabel">You are</span>${seg('sex', { she: 'a she-cat', tom: 'a tom' })}</div>
      <div class="field"><span class="flabel">Pelt</span>${seg('pelt', PELTS, k => PELTS[k].b)}</div>
      <div class="field"><span class="flabel">Markings</span>${seg('pattern', PATTERNS)}</div>
      <div class="field"><span class="flabel">Eyes</span>${seg('eyes', { green: 'Green', amber: 'Amber', blue: 'Blue', yellow: 'Yellow', copper: 'Copper' }, k => EYES[k])}</div>
    </div>
    <p class="quiet" style="margin-top:18px">Your heart, the kind of leader you will be, is chosen at the Moonpool.</p>
    <div class="choices"><button class="choice primary" id="gobtn">Walk to the Moonpool</button></div>`;
  document.querySelectorAll('[data-f]').forEach(b => b.onclick = () => { p[b.dataset.f] = b.dataset.v; save(); renderCreate(); });
  $('#f-pre').onchange = e => { if (e.target.value === '__custom') { p.custom = p.custom || 'Quill'; } else { p.pre = e.target.value; p.custom = ''; } save(); renderCreate(); };
  const ci = $('#f-custom'); if (ci) ci.onchange = e => { const v = e.target.value.replace(/[^A-Za-z]/g, '').slice(0, 10); p.custom = v ? v[0].toUpperCase() + v.slice(1).toLowerCase() : ''; if (!p.custom) p.pre = PLAYER_PRE[0]; save(); renderCreate(); };
  $('#f-suf').onchange = e => { p.suf = e.target.value; save(); renderCreate(); };
  $('#gobtn').onclick = () => { S.scene = null; S.queue = [{ k: 'script', id: 'c1' }]; processQueue(); };
}

/* ---------- Title ---------- */
function showTitle() {
  const t = $('#title'); t.hidden = false;
  const saved = loadSave();
  t.innerHTML = `<canvas class="scene"></canvas><canvas class="motes"></canvas><div class="inner">
    <p class="series">Warriors</p>
    <h1>Leader of the Lake</h1>
    <p class="tag">Take nine lives from StarClan and lead ThunderClan through three years of seasons, rivals and omens. Hunt, bargain and fight, keep the Code or bend it, and walk the old legends in the spirit-world. The stars have a prophecy for you. They will not explain it.</p>
    <div class="tbtns">${saved && !saved.over && saved.flags && saved.flags.started ? `<button class="tbtn" id="t-cont">Continue the saga of ${esc((saved.player.custom || saved.player.pre) + 'star')}</button><button class="tbtn ghost" id="t-new">Begin a new saga</button>` : `<button class="tbtn" id="t-new">Begin a new saga</button>`}</div>
    <p class="credit">A playable prototype. Progress is kept in this browser.</p></div>`;
  paintScene(t.querySelector('canvas.scene'), 'title', { season: 2 });
  startMotes(t.querySelector('canvas.motes'), true);
  edBar();
  $('#t-new').onclick = () => { t.hidden = true; showCreate(); };
  const c = $('#t-cont'); if (c) c.onclick = () => { S = saved; t.hidden = true; ART_KEY = ''; render(); };
}

/* ---------- Boot ---------- */
let resizeT = 0;
window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(() => { ART_KEY = ''; if (S && $('#title').hidden) render(); else if (!$('#title').hidden) showTitle(); }, 180); });

function start(data) {
  if (data && data.v === 1 && data.flags) { S = data; $('#title').hidden = true; ART_KEY = ''; render(); }
  else showTitle();
}
window.claude?.hot?.snapshot?.(() => S);
edConnect().then(() => edBar());
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});
