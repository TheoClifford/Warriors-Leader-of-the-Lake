import pathlib
src = pathlib.Path(__file__).parent / 'src'
t = (src / 'template.html').read_text()
css = (src / 'style.css').read_text()
js = '\n'.join((src / f).read_text() for f in ['art.js', 'data.js', 'engine.js', 'events.js', 'editor.js', 'ui.js'])
out = t.replace('/*STYLE*/', css).replace('/*SCRIPT*/', js)
d = pathlib.Path(__file__).parent / 'dist'; d.mkdir(exist_ok=True)
(d / 'index.html').write_text(out)
(d / 'game.js').write_text(js)
print(len(out), 'bytes')
