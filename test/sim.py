import asyncio, json, sys, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path('/home/claude/game')
SIM = r"""
(games) => {
  const real = { paintScene, startMotes };
  paintScene = () => {}; startMotes = () => {};
  const results = []; const errs = [];
  for (let g = 0; g < games; g++) {
    try {
      showCreate();
      const hearts = Object.keys(HEARTS);
      S.player.pelt = pick(Object.keys(PELTS)); S.player.pattern = pick(Object.keys(PATTERNS));
      S.scene = null; S.queue = [{ k: 'script', id: 'c1' }]; processQueue();
      let steps = 0, chosenHeart = hearts[g % hearts.length];
      const seen = {};
      while (!S.over && steps < 900) {
        steps++;
        const sc = S.scene;
        if (sc) {
          seen[(sc.it.k) + ':' + (sc.it.id || '')] = 1; if (sc.it.k === 'season' && S.season === 3 && sc.stage==='choose' && !sc._r) { sc._r=1; (S._lb = S._lb || []).push(S.prey + '/' + upkeep()); }
          if (sc.spec.special === 'turning' && sc.stage === 'choose') {
            const keys = Object.keys(BLESSINGS); let left = sc.v.pool;
            while (left > 0) { const k = pick(keys); if (sc.v.alloc[k] < 3) { sc.v.alloc[k]++; left--; } }
            S.bless = { ...sc.v.alloc }; S.favour = Math.floor(S.favour / 3); sc.stage = 'result'; sc.result = 'x'; continue;
          }
          if (sc.stage === 'choose') {
            let opts = sc.opts.filter(o => !o.dis);
            if (sc.it.id === 'c2') opts = sc.opts.filter(o => o.heartCard === chosenHeart);
            if (sc.it.k === 'walk' && Math.random() < .75) { const spec = buildSpec(sc.it, sc.v); const good = sc.opts.filter(o => { const st = LEGENDS[sc.v.id].steps[sc.v.step]; return st.options[sc.v.order[sc.v.step][o.i]].ok; }); if (good.length) opts = good; }
            if (!opts.length) throw new Error('No enabled options in ' + JSON.stringify(sc.it));
            choose(pick(opts).i);
          } else cont();
          continue;
        }
        // management: take random actions
        if (S.actions > 0 && Math.random() < .9) {
          const r = Math.random();
          const clan = pick(OTHER_CLANS);
          if (r < .25) doAction('hunt');
          else if (r < .32) doAction('herbs');
          else if (r < .38) doAction('border');
          else if (r < .45) { const z = Object.keys(S.zones).find(z => !S.zones[z].explored); if (z) doAction('explore', z); else doAction('vigil'); }
          else if (r < .5) { const z = Object.keys(S.zones).find(z => S.zones[z].explored && S.zones[z].owner !== 'thunder' && ZONES[z].contested); if (z) doAction('claim', z); else doAction('feast'); }
          else if (r < .58) doAction('envoy', clan);
          else if (r < .62) doAction('giftprey', clan);
          else if (r < .65) doAction('giftherbs', clan);
          else if (r < .68) doAction('ally', clan);
          else if (r < .72) doAction('raid', clan);
          else if (r < .76) doAction('vigil');
          else if (r < .82) { const l = LEGEND_ORDER.find(l => !S.legends.includes(l)); if (l) doAction('tale', { id: l }); else { const w = S.legends.find(l => !S.walked.includes(l)); if (w && S.actions >= 2 && S.favour >= 3) doAction('walk', w); else doAction('train'); } }
          else if (r < .86) { const w = S.legends.find(l => !S.walked.includes(l)); if (w && S.actions >= 2 && S.favour >= 3) doAction('walk', w); else doAction('walls'); }
          else if (r < .9) doAction('demand', clan);
          else doAction('feast');
          if (!S.scene && S.actions > 0 && Math.random() < .3) { endSeason(); processQueue(); }
          continue;
        }
        endSeason(); processQueue();
      }
      if (!S.over) throw new Error('Game did not end in ' + steps + ' steps; at ' + seasonLabel());
      const endScene = S.scene && S.scene.it.why;
      results.push({ heart: chosenHeart, end: endScene, year: S.year, season: S.season, lives: S.lives, cats: totalCats(), walked: S.walked.length, steps, seen: Object.keys(seen).length, prey: S.prey, lb: (S._lb||[]).join(' '), died: S.stats.died, born: S.stats.born });
    } catch (e) { errs.push({ g, msg: String(e && e.stack || e), at: S && S.scene && S.scene.it }); }
  }
  paintScene = real.paintScene; startMotes = real.startMotes;
  return { results, errs };
}
"""
async def main():
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 40
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        pg = await b.new_page(viewport={'width': 1400, 'height': 860})
        errors = []
        pg.on('pageerror', lambda e: errors.append(str(e)))
        pg.on('console', lambda m: errors.append('console:' + m.text) if m.type == 'error' else None)
        await pg.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        await pg.goto((ROOT / 'dist/index.html').as_uri())
        await pg.wait_for_timeout(500)
        res = await pg.evaluate(SIM, n)
        print('page errors:', errors[:5])
        print('sim errors:', len(res['errs']))
        for e in res['errs'][:6]: print(json.dumps(e)[:900])
        from collections import Counter
        r = res['results']
        print('endings:', Counter(x['end'] for x in r))
        print('by heart:', Counter((x['heart'], x['end']) for x in r))
        for x in r[:12]: print(x)
        await b.close()
asyncio.run(main())
