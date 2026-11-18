import os, subprocess, sys, json

F = "/home/claude/fonts"
G = "#92FF5F"; INK = "#0F3B27"; BG = "#F7F9F7"; RED = "#FF7036"
W, H = 1080, 1350
T = 7

CSS = f"""
@font-face {{ font-family:I; src:url('file://{F}/InterTight.ttf'); font-weight:100 900; }}
@font-face {{ font-family:M; src:url('file://{F}/JetBrainsMono.ttf'); font-weight:100 900; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:{W}px; height:{H}px; background:{BG}; color:{INK}; font-family:I; position:relative; overflow:hidden; }}
.pg {{ position:absolute; right:80px; top:84px; font-family:M; font-size:24px; color:#7b847f; }}
.brandmark {{ position:absolute; right:80px; top:140px; width:78px; height:78px; background:none; display:block; }}
.kick {{ position:absolute; left:80px; top:84px; font-family:M; font-weight:700; font-size:24px; letter-spacing:3px; color:#5b6560; }}
.title {{ position:absolute; left:80px; right:190px; top:150px; font-family:M; font-weight:800; font-size:80px; line-height:1.1; letter-spacing:-2.5px; }}
.hl {{ display:inline-block; background:{G}; color:{INK}; padding:2px 18px 6px; margin:6px 0; }}
.sub {{ font-family:M; font-size:31px; font-weight:500; margin-top:34px; color:#2c3631; line-height:1.4; text-decoration:underline; text-decoration-color:{G}; text-decoration-thickness:4px; text-underline-offset:8px; }}
.foot {{ position:absolute; left:80px; right:80px; bottom:70px; display:flex; justify-content:space-between; align-items:center; font-size:24px; }}
.foot .who {{ display:flex; align-items:center; gap:12px; font-family:M; font-weight:600; }}
.foot .who i {{ width:44px; height:44px; background:none; display:block; }}
.pill {{ border:2.5px solid {INK}; border-radius:10px; padding:8px 18px; font-family:M; font-weight:700; font-size:22px; display:flex; gap:10px; align-items:center; }}
.rule {{ position:absolute; left:80px; right:80px; bottom:150px; height:3px; background:{INK}; opacity:.85; }}
.bot {{ position:absolute; left:50%; transform:translateX(-50%); }}
.h {{ position:absolute; left:80px; right:190px; top:150px; font-family:M; font-weight:800; font-size:70px; line-height:1.1; letter-spacing:-2px; }}
.p {{ position:absolute; left:80px; right:80px; top:400px; font-size:42px; line-height:1.32; font-weight:500; letter-spacing:-.6px; }}
.bl {{ position:absolute; left:80px; right:80px; top:790px; }}
.bl div {{ display:flex; gap:20px; align-items:center; padding:20px 0; border-bottom:2.5px solid #cfe0d2; font-size:34px; font-weight:600; }}
.bl div:last-child {{ border-bottom:0; }}
.bl span {{ width:40px; height:40px; flex:none; background:{G}; border:3px solid {INK}; border-radius:8px; }}
.cd {{ background:{INK}; color:#E9EFEB; border-radius:16px; padding:26px 30px; font-family:M; font-size:25px; line-height:1.6; overflow-wrap:anywhere; }}
.cd .g {{ color:{G}; }} .cd .c {{ color:#8a958f; }}
.step {{ position:absolute; left:80px; right:80px; }}
.step b {{ display:block; font-family:M; font-size:24px; letter-spacing:3px; color:#5b6560; margin-bottom:14px; }}
.rows {{ position:absolute; left:80px; right:80px; top:360px; }}
.rows > div {{ display:flex; flex-direction:column; gap:12px; padding:30px 0; border-bottom:2.5px solid #cfe0d2; }}
.rows > div:last-child {{ border-bottom:0; }}
.rows code {{ font-family:M; font-weight:800; font-size:30px; background:{INK}; color:{G}; padding:4px 14px; align-self:flex-start; border-radius:6px; }}
.rows p {{ font-size:37px; font-weight:500; line-height:1.3; }}
.prompt {{ position:absolute; left:80px; right:80px; top:430px; font-size:36px; overflow-wrap:normal; padding:40px 44px; line-height:1.55; }}
.box {{ position:absolute; left:80px; right:80px; background:#fff; border:3px solid {INK}; border-radius:20px; padding:26px 32px; box-shadow:8px 8px 0 {INK}; }}
.box h3 {{ font-family:M; font-size:26px; letter-spacing:3px; margin-bottom:8px; display:flex; align-items:center; gap:12px; }}
.box h3 i {{ font-style:normal; width:38px; height:38px; border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:26px; border:3px solid {INK}; }}
.box li {{ list-style:none; font-size:31px; font-weight:500; line-height:1.3; padding:9px 0; }}
.list {{ position:absolute; left:80px; right:80px; font-size:36px; line-height:1.3; }}
.list > div {{ display:flex; gap:22px; align-items:center; padding:20px 0; border-bottom:2.5px solid #cfe0d2; }}
.list > div:last-child {{ border-bottom:0; }}
.list > div > span {{ font-family:M; font-weight:800; background:{G}; padding:2px 12px; font-size:30px; }}
.next {{ position:absolute; left:80px; right:80px; top:1030px; font-family:M; font-weight:700; font-size:28px; line-height:1.4; }}
.next span {{ background:{INK}; color:{G}; padding:2px 10px; }}
"""

def bot(scale=1.0, top=760):
    s = scale
    return f"""<svg class="bot" style="top:{top}px" width="{int(330*s)}" height="{int(300*s)}" viewBox="0 0 330 300">
  <rect x="155" y="8" width="20" height="44" fill="{INK}"/><rect x="140" y="0" width="50" height="22" fill="{G}" stroke="{INK}" stroke-width="5"/>
  <rect x="35" y="52" width="260" height="170" rx="6" fill="{G}" stroke="{INK}" stroke-width="7"/>
  <rect x="8" y="100" width="27" height="70" fill="{INK}"/><rect x="295" y="100" width="27" height="70" fill="{INK}"/>
  <rect x="80" y="95" width="170" height="80" rx="4" fill="{INK}"/>
  <path d="M112 118 L136 135 L112 152" stroke="{G}" stroke-width="11" fill="none" stroke-linecap="square"/>
  <rect x="160" y="140" width="56" height="12" fill="{G}"/>
  <rect x="75" y="222" width="34" height="62" fill="{INK}"/><rect x="221" y="222" width="34" height="62" fill="{INK}"/>
  <rect x="140" y="222" width="50" height="40" fill="{INK}"/>
</svg>"""

ARROW = '<div class="pill">Arrasta <svg width="26" height="14" viewBox="0 0 26 14"><path d="M0 7H24M18 1L24 7L18 13" stroke="#0F3B27" stroke-width="2.6" fill="none"/></svg></div>'

MAS = "file:///home/claude/instagramxarpy/marca/mascote/"
def mas(pose, h, right, bottom):
    return f'<img src="{MAS}{pose}.png" style="position:absolute;right:{right}px;bottom:{bottom}px;height:{h}px">'
def cover_art(d):
    return ('<style>.sub{max-width:520px}</style>' + mas(d.get("pose","apontando"), 640, 20, 150)) if d.get("mascote") else bot(1.0, 820)

def chrome(n, kick, inner, foot_right=ARROW):
    mark = '<img class="brandmark" src="file:///home/claude/brand/icone.png">'
    who = '<div class="who"><img src="file:///home/claude/brand/icone.png" style="width:44px;height:44px">@xarpy_dev</div>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="kick">{kick}</div><div class="pg">{n:02d}/{T:02d}</div>{mark}{inner}
<div class="rule"></div><div class="foot">{who}{foot_right}</div></body></html>"""

def code(lines):
    out = []
    for l in lines:
        out.append(f'<span class="c">{l}</span>' if l.startswith("#") else f'<span class="g">&gt;</span> {l}')
    return '<div class="cd">' + "<br>".join(out) + "</div>"

def build(d, out):
    os.makedirs(out, exist_ok=True)
    k = f"TUTORIAL {d['n']} · {d['name'].upper()}"
    s = []
    s.append(chrome(1, f"TUTORIAL {d['n']}",
        f'<div class="title">{d["name"]}:<br><span class="hl">como instalar</span><br>e usar'
        f'<div class="sub">{d["sub"]}</div></div>' + cover_art(d)))
    s.append(chrome(2, k, f'<div class="h">O que é</div><div class="p">{d["what"]}</div>'
        '<div class="bl">' + "".join(f"<div><span></span>{b}</div>" for b in d["bullets"]) + '</div>'))
    inst = f'<div class="h">Como<br><span class="hl">instalar</span></div>'
    inst += f'<div class="step" style="top:440px"><b>NO CLAUDE CODE</b>{code(d["install"])}</div>'
    if d.get("alt"):
        inst += f'<div class="step" style="top:{d.get("alt_top", 760)}px"><b>{d["alt_label"]}</b>{code(d["alt"])}</div>'
    s.append(chrome(3, k, inst))
    s.append(chrome(4, k, f'<div class="h">{d.get("use_title", "Como usar")}</div><div class="rows">' +
        "".join(f"<div><code>{a}</code><p>{b}</p></div>" for a, b in d["use"]) + "</div>"))
    s.append(chrome(5, k, '<div class="h">Teste agora<br><span class="hl">com este pedido</span></div>'
        f'<div class="cd prompt"><span class="c"># cole no Claude Code</span><br>{d["prompt"]}</div>'))
    s.append(chrome(6, k, '<div class="h">Prós e<br>contras</div>'
        '<div class="box" style="top:420px"><h3><i style="background:#92FF5F">✓</i>PRÓS</h3><ul>' +
        "".join(f"<li>{p}</li>" for p in d["pros"]) + '</ul></div>'
        '<div class="box" style="top:800px"><h3><i style="background:#fff">✕</i>CONTRAS</h3><ul>' +
        "".join(f"<li>{c}</li>" for c in d["cons"]) + '</ul></div>'))
    nxt = f'Próximo tutorial: <span>{d["next"]}</span>' if d.get("next") else "Esse é o último deste lote. Salve todos."
    s.append(chrome(7, k, '<div class="h">Salve este<br><span class="hl">tutorial</span></div>'
        '<div class="list" style="top:450px"><div><span>01</span>Salve para usar no próximo projeto</div>'
        '<div><span>02</span>Mande para quem programa com você</div>'
        '<div><span>03</span>Siga a @xarpy_dev para a série completa</div></div>'
        f'<div class="next">{nxt}</div>' + ('<style>.list{right:360px!important}.list>div{font-size:32px}</style>' + mas("acenando", 460, 10, 150) if d.get("mascote") else ""), foot_right='<div class="pill">Salvar</div>'))
    for i, h in enumerate(s, 1):
        p = f"{out}/slide{i}.html"; open(p, "w").write(h)
        subprocess.run([sys.executable, "-I", "/home/claude/render.py", p, f"{out}/slide{i}.jpg", str(W), str(H)], check=True)

if __name__ == "__main__":
    data = json.load(open("/home/claude/carrossel/tutoriais2.json"))
    only = sys.argv[1:]
    for d in data:
        if only and d["n"] not in only: continue
        build(d, f"/home/claude/carrossel/tut2/{d['n']}-{d['slug']}")
        print("ok", d["n"])
