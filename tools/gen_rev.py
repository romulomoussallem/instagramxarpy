"""Gera o carrossel "Engenharia Reversa" (7 slides, 1080x1350) a partir de um JSON.

Uso: python3 tools/gen_rev.py engenharia-reversa/NN-slug/dados.json
Saída: slide1.jpg ... slide7.jpg na mesma pasta do JSON.

Campos do JSON (texto em português, HTML simples permitido):
  n             "02"  (número da série)
  cover         título da capa; use <span class="hl">..</span> (verde) ou <span class="ho">..</span> (laranja)
  cover_sub     frase abaixo do título da capa
  name          nome do prompt (ex.: "extract_wisdom")
  desc          1 frase: o que o prompt faz
  original      lista de linhas do prompt original resumido; linhas que começam com "#" viram título laranja,
                linhas que começam com "(" viram comentário cinza. Trechos curtos, em inglês, como no original.
  pieces        lista de 3 objetos {tag, title, code, bullets:[[negrito, resto], [negrito, resto]]}
                code: trecho curto do original; destaque com <mark>..</mark>
  skeleton      lista de linhas do esqueleto em português, mesmo esquema de "#" do original
  cta           título do slide final (pode usar <span class="ho">)
  source        "Fonte: dono/repo · arquivo · licença X"
"""
import os, sys, json, subprocess, html

HERE = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(HERE, "fonts"); ICON = "file://" + os.path.join(HERE, "icone.png")
W, H, T = 1080, 1350, 7
# Paleta "obscuro" (tools/paletas.json)
G = "#FAFAFA"; OR = "#FF5100"; BG = "#060607"; TX = "#FAFAFA"; MU = "#77777c"; LN = "#1c1c1f"

CSS = f"""
@font-face {{ font-family:I; src:url('file://{FONTS}/InterTight.ttf'); font-weight:100 900; }}
@font-face {{ font-family:M; src:url('file://{FONTS}/JetBrainsMono.ttf'); font-weight:100 900; }}
* {{ margin:0; padding:0; box-sizing:border-box; }}
body {{ width:{W}px; height:{H}px; background:{BG}; color:{TX}; font-family:I; position:relative; overflow:hidden;
  background-image:radial-gradient(900px 600px at 85% 0%, rgba(255,81,0,.14), transparent 60%), radial-gradient(700px 500px at 0% 100%, rgba(255,81,0,.05), transparent 60%); }}
.kick {{ position:absolute; left:80px; top:84px; font-family:M; font-weight:700; font-size:24px; letter-spacing:3px; color:{MU}; }}
.kick b {{ color:{OR}; }}
.pg {{ position:absolute; right:80px; top:84px; font-family:M; font-size:24px; color:{MU}; }}
.mark {{ position:absolute; right:80px; top:140px; width:78px; height:78px; }}
.h {{ position:absolute; left:80px; right:190px; top:150px; font-family:M; font-weight:800; font-size:70px; line-height:1.1; letter-spacing:-2px; }}
.hl {{ display:inline-block; background:{OR}; color:{BG}; padding:2px 16px 6px; margin:4px 0; }}
.ho {{ color:{OR}; }}
.p {{ font-size:36px; line-height:1.38; font-weight:500; color:#cfd6d2; }}
.cd {{ background:#000; border:2px solid {LN}; border-radius:18px; padding:30px 34px; font-family:M; font-size:25px; line-height:1.6; color:#cfd6d2; overflow-wrap:anywhere; }}
.cd .t {{ color:{OR}; font-weight:800; }} .cd .c {{ color:#4f5a55; }} .cd mark {{ background:rgba(255,81,0,.18); color:{OR}; padding:0 4px; }}
.tag {{ display:inline-block; font-family:M; font-weight:800; font-size:22px; letter-spacing:2px; color:{BG}; background:{OR}; padding:6px 14px; border-radius:6px; }}
.list > div {{ display:grid; grid-template-columns:56px 1fr; gap:18px; padding:20px 0; border-bottom:2px solid {LN}; }}
.list > div:last-child {{ border-bottom:0; }}
.list em {{ font-style:normal; font-family:M; font-weight:800; font-size:30px; color:{OR}; }}
.list p {{ font-size:31px; line-height:1.33; }}
.list p b {{ color:#fff; }}
.foot {{ position:absolute; left:80px; right:80px; bottom:70px; display:flex; justify-content:space-between; align-items:center; font-family:M; font-size:24px; font-weight:600; }}
.foot .who {{ display:flex; align-items:center; gap:12px; }}
.pill {{ border:2.5px solid {OR}; color:{OR}; border-radius:10px; padding:8px 18px; font-weight:700; font-size:22px; }}
.rule {{ position:absolute; left:80px; right:80px; bottom:150px; height:2px; background:{LN}; }}
.src {{ position:absolute; left:80px; right:80px; font-family:M; font-size:20px; color:{MU}; }}
"""

def evilbot(scale, left, top):
    w, h = int(330 * scale), int(300 * scale)
    return f"""<svg style="position:absolute;left:{left}px;top:{top}px;filter:drop-shadow(0 0 40px rgba(255,81,0,.45))" width="{w}" height="{h}" viewBox="0 0 330 300">
  <path d="M120 52 L104 6 L148 40 Z" fill="#000" stroke="{OR}" stroke-width="5"/><path d="M210 52 L226 6 L182 40 Z" fill="#000" stroke="{OR}" stroke-width="5"/>
  <rect x="35" y="52" width="260" height="170" rx="6" fill="{OR}" stroke="#000" stroke-width="7"/>
  <rect x="8" y="100" width="27" height="70" fill="#000"/><rect x="295" y="100" width="27" height="70" fill="#000"/>
  <rect x="80" y="95" width="170" height="85" rx="4" fill="#000"/>
  <path d="M98 112 L150 132" stroke="{G}" stroke-width="9" stroke-linecap="square"/><path d="M232 112 L180 132" stroke="{G}" stroke-width="9" stroke-linecap="square"/>
  <path d="M106 140 L146 146 L106 156 Z" fill="{OR}"/><path d="M224 140 L184 146 L224 156 Z" fill="{OR}"/>
  <path d="M136 168 L150 162 L165 168 L180 162 L194 168" stroke="{G}" stroke-width="6" fill="none"/>
  <rect x="75" y="222" width="34" height="62" fill="#000" stroke="{OR}" stroke-width="3"/><rect x="221" y="222" width="34" height="62" fill="#000" stroke="{OR}" stroke-width="3"/>
  <rect x="140" y="222" width="50" height="40" fill="#000" stroke="{OR}" stroke-width="3"/>
</svg>"""

def lines(ls):
    out = []
    for l in ls:
        if l.startswith("#"): out.append(f'<span class="t">{l}</span>')
        elif l.startswith("("): out.append(f'<span class="c">{l}</span>')
        elif l == "": out.append("")
        else: out.append(l)
    return "<br>".join(out)

def page(n, d, inner, right='<div class="pill">Arrasta →</div>'):
    kick = f'ENGENHARIA REVERSA · <b>PROMPT {d["n"]}</b>'
    return f"""<!doctype html><html><head><meta charset="utf-8"><style>{CSS}</style></head><body>
<div class="kick">{kick}</div><div class="pg">{n:02d}/{T:02d}</div><img class="mark" src="{ICON}">{inner}
<div class="rule"></div><div class="foot"><div class="who"><img src="{ICON}" style="width:44px;height:44px">@xarpy_dev</div>{right}</div></body></html>"""

def build(d, out):
    S = []
    S.append(page(1, d, f'<div class="h" style="font-size:72px;top:190px">{d["cover"]}</div>'
        f'<div class="p" style="position:absolute;left:80px;right:420px;top:720px">{d["cover_sub"]}</div>' + evilbot(1.05, 660, 700)))
    S.append(page(2, d, '<div class="h">O prompt<br><span class="ho">original</span></div>'
        f'<div class="p" style="position:absolute;left:80px;right:80px;top:350px"><b>{html.escape(d["name"])}</b>: {d["desc"]}</div>'
        f'<div class="cd" style="position:absolute;left:80px;right:80px;top:580px">{lines(d["original"])}</div>'
        f'<div class="src" style="top:1135px">{d["source"]}</div>'))
    for i, pc in enumerate(d["pieces"]):
        S.append(page(3 + i, d, f'<div class="h"><span class="tag">{pc["tag"]}</span><br>{pc["title"]}</div>'
            f'<div class="cd" style="position:absolute;left:80px;right:80px;top:470px">{pc["code"]}</div>'
            '<div class="list" style="position:absolute;left:80px;right:80px;top:820px">' +
            "".join(f'<div><em>→</em><p><b>{a}</b> {b}</p></div>' for a, b in pc["bullets"]) + '</div>'))
    S.append(page(6, d, '<div class="h">O esqueleto<br>para <span class="hl">copiar</span></div>'
        f'<div class="cd" style="position:absolute;left:80px;right:80px;top:380px;font-size:27px">{lines(d["skeleton"])}</div>'))
    S.append(page(7, d, f'<div class="h" style="font-size:66px;top:190px">{d["cta"]}</div>'
        '<div class="list" style="position:absolute;left:80px;right:500px;top:620px">'
        '<div><em>01</em><p>Salve o esqueleto</p></div><div><em>02</em><p>Comente qual prompt desmontar no próximo</p></div><div><em>03</em><p>Siga a @xarpy_dev</p></div></div>'
        + evilbot(0.95, 670, 690) + f'<div class="src" style="top:1135px">{d["source"]}</div>', right='<div class="pill">Salvar</div>'))
    for i, h in enumerate(S, 1):
        p = os.path.join(out, f"slide{i}.html"); open(p, "w").write(h)
        subprocess.run([sys.executable, os.path.join(HERE, "render.py"), p, os.path.join(out, f"slide{i}.jpg"), str(W), str(H)], check=True)
        os.remove(p)

if __name__ == "__main__":
    j = os.path.abspath(sys.argv[1]); build(json.load(open(j)), os.path.dirname(j)); print("ok")
