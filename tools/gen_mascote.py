"""Gera carrosséis com o mascote XARPY (1080x1350 JPEG).
Uso: python3 tools/gen_mascote.py spec.json saida_dir
spec.json: lista de slides {bg, fg, acc, tag, title (html), body, img, big(opcional)}
poses (img): comemorando, acenando, pensando, celular, notebook, apontando, apresentando, bracos
Cores: use a paleta de tools/paletas.json. Regras: mascote só em capa/CTA e poucos slides; nada de neon/brilho."""
import json, os, subprocess, sys
R = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = json.load(open(sys.argv[1])); out = sys.argv[2]; os.makedirs(out, exist_ok=True)
css = f"""
@font-face{{font-family:JB;src:url('file://{R}/tools/fonts/JetBrainsMono.ttf');font-weight:100 800}}
@font-face{{font-family:IT;src:url('file://{R}/tools/fonts/InterTight.ttf');font-weight:100 900}}
*{{margin:0;padding:0;box-sizing:border-box}}
body{{width:1080px;height:1350px;position:relative;overflow:hidden;font-family:IT}}
.tag{{position:absolute;left:80px;top:92px;font:700 26px JB;letter-spacing:3px}}
.ico{{position:absolute;right:80px;top:70px;width:84px;height:84px}}
h1{{position:absolute;left:80px;top:200px;font:800 92px/1.02 JB;letter-spacing:-3px}}
.hl{{display:inline-block;padding:0 14px;margin:8px 0 0 -14px;line-height:1.05}}
p{{position:absolute;left:80px;top:640px;width:470px;font:500 38px/1.3 IT}}
.char{{position:absolute;right:-30px;bottom:-60px;height:930px}}
.char.big{{bottom:-130px;height:880px}}
.foot{{position:absolute;left:80px;bottom:64px;display:flex;align-items:center;gap:14px;font:700 28px JB}}
.foot img{{width:46px;height:46px}}
.bar{{position:absolute;left:0;bottom:0;height:14px}}
"""
n = len(spec)
for i, s in enumerate(spec, 1):
    big = "big" if s.get("big") else ""
    html = f"""<html><head><meta charset=utf-8><style>{css}
body{{background:{s['bg']};color:{s['fg']}}} .tag{{color:{s['acc']}}} .hl{{background:{s['fg']};color:{s['bg']}}}
.bar{{background:{s['acc']};width:{int(1080*i/n)}px}}</style></head><body>
<div class=tag>{s['tag']}</div><img class=ico src='file://{R}/marca/icone.png'>
<h1>{s['title']}</h1><p>{s['body']}</p>
<img class='char {big}' src='file://{R}/marca/mascote/{s['img']}.png'>
<div class=foot><img src='file://{R}/marca/icone.png'>@xarpy_dev</div><div class=bar></div></body></html>"""
    h = f"{out}/s{i}.html"; open(h, "w").write(html)
    subprocess.run(["python3", f"{R}/tools/render.py", h, f"{out}/slide{i}.jpg", "1080", "1350"], check=True)
