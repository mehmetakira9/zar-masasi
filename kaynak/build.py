"""Kaynakları internetsiz, tek HTML dosyasında birleştirir: python build.py"""
from pathlib import Path
ROOT = Path(__file__).resolve().parent
html = (ROOT / 'index.html').read_text(encoding='utf-8')
css = (ROOT / 'styles.css').read_text(encoding='utf-8')
core = (ROOT / 'core.js').read_text(encoding='utf-8')
app = (ROOT / 'app.js').read_text(encoding='utf-8')
html = html.replace('<link rel="stylesheet" href="styles.css">', '<style>\n' + css + '\n</style>')
html = html.replace('<script src="core.js"></script>', '<script>\n' + core + '\n</script>')
html = html.replace('<script src="app.js"></script>', '<script>\n' + app + '\n</script>')
destination = ROOT.parent / 'Bugun-Ne-Oynasam.html'
destination.write_text(html, encoding='utf-8')
print(destination)
