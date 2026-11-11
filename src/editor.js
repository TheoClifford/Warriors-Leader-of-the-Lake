/* =========================================================================
   EDITOR — rewrite game text in place, and pin notes to screens.
   Shared through the artifact's db when published; this browser otherwise.
   ========================================================================= */
const ED = { on: false, edits: {}, notes: {}, db: null, user: null, uid: null, names: {}, mode: 'local', orig: {}, drawer: null, ready: false };
const ED_LOCAL = 'warriors-lake-editor-v1';

function edHash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return 'e' + (h >>> 0).toString(36) + s.length.toString(36); }
function edLoadLocal() { try { const d = JSON.parse(localStorage.getItem(ED_LOCAL)); if (d) { ED.edits = d.edits || {}; ED.notes = d.notes || {}; } } catch (e) { } }
function edSaveLocal() { if (ED.mode !== 'local') return; try { localStorage.setItem(ED_LOCAL, JSON.stringify({ edits: ED.edits, notes: ED.notes })); } catch (e) { } }

/* ---------- Which screen are we on? ---------- */
function screenKey() {
  if (!S) return 'title';
  const sc = S.scene;
  if (!sc) return 'tab:' + S.tab;
  const it = sc.it, v = it.v || sc.v || {};
  if (it.k === 'result') return 'result:' + (sc.spec.title || '');
  if (it.k === 'walk') return `walk:${v.id}#${(v.step || 0) + 1}`;
  if (it.k === 'tale') return 'tale:' + v.id;
  if (it.k === 'explore') return 'explore:' + v.zone;
  if (it.id) return it.k + ':' + it.id;
  return it.k;
}
function screenTitle() {
  if (!S) return 'Title screen';
  if (!S.scene) { const t = TABS.find(t => t[0] === S.tab); return (t ? t[1] : S.tab) + ' (management)'; }
  return S.scene.spec.title || screenKey();
}

/* ---------- Overrides applied during render ---------- */
function ovr(field, original) {
  const key = screenKey();
  ED.orig[field] = original;
  const e = ED.edits[edHash(key + '|' + field + '|' + original)];
  return e ? e.text : original;
}

/* ---------- Store ---------- */
async function edPutEdit(field, original, text) {
  const key = screenKey(), id = edHash(key + '|' + field + '|' + original);
  if (text === original) return edDelEdit(id);
  const body = { screen: key, screenTitle: screenTitle(), field, original, text, by: ED.uid || '', at: new Date().toISOString() };
  ED.edits[id] = body; edSaveLocal(); edBar();
  if (ED.db) { try { await ED.db.collection('edits').doc(id).set(body); } catch (e) { edToast('Could not save to the shared store: ' + (e.code || e.message || e)); } }
}
async function edDelEdit(id) {
  delete ED.edits[id]; edSaveLocal(); edBar();
  if (ED.db) { try { await ED.db.collection('edits').doc(id).delete(); } catch (e) { } }
}
async function edAddNote(text) {
  const body = { screen: screenKey(), screenTitle: screenTitle(), text, resolved: false, by: ED.uid || '', at: new Date().toISOString() };
  let id = 'n' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  ED.notes[id] = body; edSaveLocal();
  if (ED.db) { try { await ED.db.collection('notes').doc(id).set(body); } catch (e) { edToast('Could not save the note to the shared store: ' + (e.code || e.message || e)); } }
}
async function edPatchNote(id, patch) {
  if (!ED.notes[id]) return;
  ED.notes[id] = { ...ED.notes[id], ...patch }; edSaveLocal();
  if (ED.db) { try { await ED.db.collection('notes').doc(id).set(ED.notes[id]); } catch (e) { } }
}
async function edDelNote(id) {
  delete ED.notes[id]; edSaveLocal();
  if (ED.db) { try { await ED.db.collection('notes').doc(id).delete(); } catch (e) { } }
}

async function edConnect() {
  edLoadLocal();
  try {
    if (!window.claude || !window.claude.use) return;
    const [db, user] = await Promise.all([window.claude.use('db'), window.claude.use('user')]);
    ED.user = user;
    if (user) { try { ED.uid = await user.id(); } catch (e) { } }
    if (!db) return;
    ED.db = db; ED.mode = 'shared'; ED.edits = {}; ED.notes = {};
    const sub = (col, target) => db.collection(col).onSnapshot(snap => {
      const next = {}; snap.docs.forEach(d => { if (d.exists) next[d.id] = d.data(); });
      ED[target] = next; edResolveNames(); if (S && $('#title').hidden) render(); else edBar();
    }, err => edToast('The shared editor store stopped responding (' + err.code + '). Reload the page to reconnect.'));
    sub('edits', 'edits'); sub('notes', 'notes');
  } catch (e) { }
}
async function edResolveNames() {
  if (!ED.user || !ED.user.profiles) return;
  const ids = [...new Set([...Object.values(ED.edits), ...Object.values(ED.notes)].map(x => x.by).filter(Boolean))];
  if (!ids.length) return;
  try { const ps = await ED.user.profiles(ids); ids.forEach(id => { ED.names[id] = (ps[id] && ps[id].name) || ''; }); } catch (e) { }
}
function who(id) { return (id && ED.names[id]) || (id ? 'Someone' : 'You'); }

/* ---------- UI ---------- */
function edToast(msg) {
  let t = document.getElementById('ed-toast');
  if (!t) { t = document.createElement('div'); t.id = 'ed-toast'; document.body.appendChild(t); }
  t.textContent = msg; t.hidden = false; clearTimeout(t._h); t._h = setTimeout(() => t.hidden = true, 5000);
}
function notesHere() { const k = screenKey(); return Object.entries(ED.notes).filter(([, n]) => n.screen === k); }
function editsHere() { const k = screenKey(); return Object.entries(ED.edits).filter(([, e]) => e.screen === k); }

function edBar() {
  let fab = document.getElementById('ed-fab');
  if (!fab) { fab = document.createElement('button'); fab.id = 'ed-fab'; document.body.appendChild(fab); fab.onclick = () => edToggle(); }
  const open = notesHere().filter(([, n]) => !n.resolved).length;
  fab.innerHTML = ED.on ? 'Leave editor' : `Edit text and notes${open ? ` <span class="ed-dot">${open}</span>` : ''}`;
  fab.setAttribute('aria-pressed', ED.on);
  let bar = document.getElementById('ed-bar');
  if (!ED.on) { if (bar) bar.hidden = true; document.body.classList.remove('editing'); return; }
  document.body.classList.add('editing');
  if (!bar) { bar = document.createElement('div'); bar.id = 'ed-bar'; document.body.appendChild(bar); }
  bar.hidden = false;
  const nn = notesHere(), ne = editsHere();
  bar.innerHTML = `<div class="ed-where"><b>${esc(screenTitle())}</b> <span>${esc(screenKey())}</span></div>
    <div class="ed-tip">Click any outlined text to rewrite it. Changes save when you click away.</div>
    <div class="ed-btns">
      <button id="ed-notes-btn">Notes for this screen${nn.length ? ` (${nn.length})` : ''}</button>
      <select id="ed-jump" aria-label="Jump to a screen"><option value="">Jump to a screen…</option>${edJumpOptions()}</select>
      <button id="ed-all-btn">All edits and notes (${Object.keys(ED.edits).length + Object.keys(ED.notes).length})</button>
    </div>
    <div class="ed-mode">${ED.mode === 'shared' ? 'Saved to this page, shared with everyone who can edit it.' : 'Saved in this browser only. Use “All edits and notes” to copy them out.'}${ne.length ? ` ${ne.length} text ${ne.length === 1 ? 'change' : 'changes'} on this screen.` : ''}</div>`;
  $('#ed-notes-btn').onclick = () => edDrawer(ED.drawer === 'notes' ? null : 'notes');
  $('#ed-all-btn').onclick = () => edDrawer(ED.drawer === 'all' ? null : 'all');
  $('#ed-jump').onchange = e => { if (e.target.value) edJump(JSON.parse(e.target.value)); };
  if (ED.drawer) edDrawer(ED.drawer, true);
}
function edToggle() {
  ED.on = !ED.on; if (!ED.on) ED.drawer = null;
  const d = document.getElementById('ed-drawer'); if (d && !ED.on) d.hidden = true;
  if (S && $('#title').hidden) render(); else edBar();
}

function edJumpOptions() {
  const o = [];
  const add = (group, items) => { o.push(`<optgroup label="${esc(group)}">` + items.map(([label, item]) => `<option value='${esc(JSON.stringify(item)).replace(/'/g, '&#39;')}'>${esc(label)}</option>`).join('') + '</optgroup>'); };
  add('Opening', [['The path to the Moonpool', { k: 'script', id: 'c1' }], ['Nine cats out of the stars (hearts)', { k: 'script', id: 'c2' }], ['The ninth life', { k: 'script', id: 'c3' }], ['Waking', { k: 'script', id: 'c4' }], ['Naming the deputy', { k: 'script', id: 'deputy' }]]);
  add('Events', Object.keys(EV).map(id => [EV[id].title, { k: 'event', id }]));
  add('Story beats', [['Willowmoth\'s reading', { k: 'script', id: 'prophecy' }], ['The star that did not go out', { k: 'script', id: 'omen' }], ['Ice at the lake\'s edge', { k: 'script', id: 'firstice' }], ['Dark Forest: first dream', { k: 'script', id: 'dark1' }], ['Dark Forest: the price', { k: 'script', id: 'dark2' }], ['Finale', { k: 'script', id: 'finale1' }], ['Finale, second choice', { k: 'script', id: 'finale2' }]]);
  add('Exploration', Object.keys(EXPLORE).map(z => [EXPLORE[z].title, { k: 'explore', v: { zone: z } }]));
  add('Legends: tales', LEGEND_ORDER.map(id => [LEGENDS[id].name, { k: 'tale', v: { id } }]));
  add('Legends: spirit-walks', LEGEND_ORDER.flatMap(id => LEGENDS[id].steps.map((_, i) => [`${LEGENDS[id].name}, step ${i + 1}`, { k: 'walk', v: { id, step: i, wrong: 0 } }])));
  add('Recurring', [['Season opening', { k: 'season' }], ['The Gathering', { k: 'gathering' }], ['Raid planning (ShadowClan)', { k: 'raid', v: { clan: 'shadow' } }], ['Raided (WindClan)', { k: 'raided', v: { clan: 'wind' } }], ['Gift from a friend (RiverClan)', { k: 'gift', v: { clan: 'river' } }], ['Trespass (ShadowClan)', { k: 'trespass', v: { clan: 'shadow' } }], ['The Turning of Silverpelt', { k: 'turning' }]]);
  add('Endings', ['unity', 'alone', 'raid', 'dominion', 'fallen', 'scattered'].map(w => [w, { k: 'ending', why: w }]));
  return o.join('');
}
function edJump(item) {
  $('#title').hidden = true;
  if (!S || !F('started')) {
    S = freshState(); S.player.heart = 'kindred'; S.deputy = 'oakfang'; S.flags.started = true;
    logSaga('A test saga, started from the editor.');
  }
  S.over = false;
  if (item.k === 'tale' && !S.legends.includes(item.v.id)) S.legends.push(item.v.id);
  S.scene = null; S.queue = [item]; processQueue();
  $('#panel').scrollTop = 0;
}

function edDrawer(which, keep) {
  ED.drawer = which;
  let d = document.getElementById('ed-drawer');
  if (!which) { if (d) d.hidden = true; return; }
  if (!d) { d = document.createElement('aside'); d.id = 'ed-drawer'; document.body.appendChild(d); }
  d.hidden = false;
  if (which === 'notes') {
    const ns = notesHere().sort((a, b) => a[1].at < b[1].at ? -1 : 1);
    d.innerHTML = `<div class="ed-dh"><h3>Notes: ${esc(screenTitle())}</h3><button class="ed-x" aria-label="Close notes">Close</button></div>
      ${ns.length ? ns.map(([id, n]) => `<div class="ed-note${n.resolved ? ' done' : ''}"><p>${esc(n.text)}</p><div class="ed-meta">${esc(who(n.by))}, ${new Date(n.at).toLocaleString()}</div><div class="ed-na"><button data-res="${id}">${n.resolved ? 'Reopen' : 'Mark done'}</button><button data-del="${id}">Delete</button></div></div>`).join('') : '<p class="quiet">No notes on this screen yet.</p>'}
      <label for="ed-new" class="ed-lab">Add a note for the next edit pass</label>
      <textarea id="ed-new" rows="4" placeholder="e.g. Speckleback's line here is too modern. Check the canon on Graystripe."></textarea>
      <button id="ed-add" class="ed-primary">Add note</button>`;
    d.querySelector('#ed-add').onclick = async () => { const t = d.querySelector('#ed-new').value.trim(); if (!t) return; await edAddNote(t); edBar(); edDrawer('notes'); };
  } else {
    const groups = {};
    Object.entries(ED.edits).forEach(([id, e]) => { (groups[e.screen] = groups[e.screen] || { title: e.screenTitle, edits: [], notes: [] }).edits.push([id, e]); });
    Object.entries(ED.notes).forEach(([id, n]) => { (groups[n.screen] = groups[n.screen] || { title: n.screenTitle, edits: [], notes: [] }).notes.push([id, n]); });
    const keys = Object.keys(groups).sort();
    d.innerHTML = `<div class="ed-dh"><h3>All edits and notes</h3><button class="ed-x" aria-label="Close">Close</button></div>
      <div class="ed-na" style="margin-bottom:12px"><button id="ed-copy-md" class="ed-primary">Copy as Markdown</button><button id="ed-copy-json">Copy as JSON</button></div>
      <textarea id="ed-out" rows="6" hidden readonly aria-label="Exported edits"></textarea>
      ${keys.length ? keys.map(k => { const g = groups[k]; return `<div class="ed-group"><h4>${esc(g.title)} <span>${esc(k)}</span></h4>
        ${g.edits.map(([id, e]) => `<div class="ed-edit"><div class="ed-field">${esc(e.field)}</div><div class="ed-old">${esc(strip(e.original))}</div><div class="ed-new">${esc(strip(e.text))}</div><div class="ed-meta">${esc(who(e.by))}, ${new Date(e.at).toLocaleString()}</div><div class="ed-na"><button data-revert="${id}">Revert</button></div></div>`).join('')}
        ${g.notes.map(([id, n]) => `<div class="ed-note${n.resolved ? ' done' : ''}"><p>${esc(n.text)}</p><div class="ed-meta">${esc(who(n.by))}, ${new Date(n.at).toLocaleString()}</div><div class="ed-na"><button data-res="${id}">${n.resolved ? 'Reopen' : 'Mark done'}</button><button data-del="${id}">Delete</button></div></div>`).join('')}</div>`; }).join('') : '<p class="quiet">Nothing yet. Turn on the editor and click any text in a scene.</p>'}`;
    const copy = async (txt) => { const out = d.querySelector('#ed-out'); try { await navigator.clipboard.writeText(txt); edToast('Copied.'); out.hidden = true; } catch (e) { out.hidden = false; out.value = txt; out.select(); edToast('Copy was blocked here. The text is selected below: copy it by hand.'); } };
    d.querySelector('#ed-copy-md').onclick = () => copy(edMarkdown(groups, keys));
    d.querySelector('#ed-copy-json').onclick = () => copy(JSON.stringify({ edits: Object.values(ED.edits), notes: Object.values(ED.notes) }, null, 2));
  }
  d.querySelector('.ed-x').onclick = () => edDrawer(null);
  d.querySelectorAll('[data-res]').forEach(b => b.onclick = async () => { await edPatchNote(b.dataset.res, { resolved: !ED.notes[b.dataset.res].resolved }); edBar(); edDrawer(which); });
  d.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { await edDelNote(b.dataset.del); edBar(); edDrawer(which); });
  d.querySelectorAll('[data-revert]').forEach(b => b.onclick = async () => { await edDelEdit(b.dataset.revert); render(); edDrawer(which); });
}
function strip(h) { const t = document.createElement('div'); t.innerHTML = h; return t.textContent; }
function edMarkdown(groups, keys) {
  let md = '# Leader of the Lake: edit pass\n\n';
  keys.forEach(k => {
    const g = groups[k]; md += `## ${g.title} (\`${k}\`)\n\n`;
    g.edits.forEach(([, e]) => { md += `- **Text change** (${e.field}), ${who(e.by)}\n  - Was: ${strip(e.original).replace(/\n+/g, ' ')}\n  - Now: ${strip(e.text).replace(/\n+/g, ' ')}\n`; });
    g.notes.forEach(([, n]) => { md += `- ${n.resolved ? '~~' : ''}**Note**, ${who(n.by)}: ${n.text.replace(/\n+/g, ' ')}${n.resolved ? '~~' : ''}\n`; });
    md += '\n';
  });
  return md;
}

/* After each render: make marked text editable */
function sanitizeHTML(html) {
  const t = document.createElement('div'); t.innerHTML = html;
  t.querySelectorAll('*').forEach(el => {
    if (!['P', 'B', 'EM', 'I', 'SPAN', 'BR', 'STRONG'].includes(el.tagName)) { el.replaceWith(...el.childNodes); return; }
    [...el.attributes].forEach(a => { if (!(a.name === 'class' && el.tagName === 'SPAN')) el.removeAttribute(a.name); });
  });
  return t.innerHTML.trim();
}
function edAfterRender() {
  edBar();
  if (!ED.on) return;
  document.querySelectorAll('#panel [data-ed]').forEach(el => {
    const field = el.dataset.ed, isHTML = !!el.dataset.html;
    if (!(field in ED.orig)) return;
    el.contentEditable = 'true'; el.spellcheck = true;
    el.addEventListener('keydown', e => { if (!isHTML && e.key === 'Enter') { e.preventDefault(); el.blur(); } e.stopPropagation(); });
    el.addEventListener('click', e => e.stopPropagation());
    el.addEventListener('blur', () => {
      const original = ED.orig[field];
      const text = isHTML ? sanitizeHTML(el.innerHTML) : el.textContent.trim();
      const current = ED.edits[edHash(screenKey() + '|' + field + '|' + original)];
      if (text === (current ? current.text : original)) return;
      edPutEdit(field, original, text);
    });
  });
}
