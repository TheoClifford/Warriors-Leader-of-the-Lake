import asyncio, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path('/home/claude/game'); OUT = ROOT / 'test/shots'
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 1440, 'height': 880})
        pg = await ctx.new_page(); errs = []
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto((ROOT / 'dist/index.html').as_uri()); await pg.wait_for_timeout(800)
        await pg.click('#ed-fab'); await pg.wait_for_timeout(200)
        val = await pg.eval_on_selector('#ed-jump', "s => [...s.options].find(o => o.text === 'A collar at the border').value")
        await pg.select_option('#ed-jump', val); await pg.wait_for_timeout(500)
        # edit title and first option
        await pg.click('#panel h2.ptitle'); await pg.keyboard.press('Control+A'); await pg.keyboard.type('A collar at the stream'); await pg.keyboard.press('Enter')
        await pg.click('#panel [data-ed="opt:0"]'); await pg.keyboard.press('End'); await pg.keyboard.type(' He will need it.'); await pg.click('#panel .kicker, #panel .council .hint')
        await pg.wait_for_timeout(200)
        await pg.click('#ed-notes-btn'); await pg.fill('#ed-new', 'Rookfeather line feels too blunt. Check tone.'); await pg.click('#ed-add'); await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(OUT/'20-editor.png'))
        # re-render and verify
        r = await pg.evaluate("render(); [document.querySelector('#panel h2').textContent, document.querySelector('[data-ed=\"opt:0\"]').textContent, Object.keys(ED.edits).length, Object.keys(ED.notes).length]")
        print('after rerender:', r)
        # choose via pick button while editing, then leave editor
        await pg.click('#ed-x' if False else '#ed-drawer .ed-x')
        await pg.click('.ed-pick[data-opt="0"]'); await pg.wait_for_timeout(200)
        print('stage:', await pg.evaluate("S.scene && S.scene.stage"), 'chosen:', await pg.evaluate("S.scene && S.scene.chosen"))
        await pg.click('#ed-all-btn'); await pg.wait_for_timeout(200)
        await pg.screenshot(path=str(OUT/'21-all.png'))
        md = await pg.evaluate("(()=>{const g={};Object.entries(ED.edits).forEach(([i,e])=>{(g[e.screen]=g[e.screen]||{title:e.screenTitle,edits:[],notes:[]}).edits.push([i,e])});Object.entries(ED.notes).forEach(([i,n])=>{(g[n.screen]=g[n.screen]||{title:n.screenTitle,edits:[],notes:[]}).notes.push([i,n])});return edMarkdown(g,Object.keys(g))})()")
        print(md)
        # reload: local persistence
        await pg.reload(); await pg.wait_for_timeout(800)
        print('after reload:', await pg.evaluate("[Object.keys(ED.edits).length, Object.keys(ED.notes).length, document.querySelector('#ed-fab').textContent]"))
        print('errors', errs)
        await b.close()
asyncio.run(main())
