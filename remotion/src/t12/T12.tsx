import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import D from './dados.json';
import PW from './palavras.json';

/* Layout do carrossel (tools/gen_tut2.py) levado para 9:16 */
const G = '#92FF5F', INK = '#0F3B27', BG = '#F7F9F7', RED = '#FF7036';
const MUTE = '#5B6560', LINE = '#CFE0D2', SUB = '#2C3631';
const L = 80; // margem lateral do carrossel
const fontCss = `
@font-face{font-family:'I';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'M';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
*{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}`;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SPR = {
  page: {damping: 22, stiffness: 120, mass: 1},
  card: {damping: 15, stiffness: 140, mass: 0.8},
  pop: {damping: 10, stiffness: 200, mass: 0.6},
  word: {damping: 16, stiffness: 240, mass: 0.5},
};
const sp = (f: number, d: number, c = SPR.card) => spring({frame: f - d, fps: 30, config: c});
const tw = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.16, 1, 0.3, 1)) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: e});
const useF = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (f * 30) / fps;
};
const rise = (s: number, y = 36): React.CSSProperties => ({opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * y}px)`});

/* ---------------- Páginas e tempo ---------------- */
export const PAGES = [
  // durações medidas na narração: cada página começa 4 quadros antes da sua frase
  {id: 'capa', dur: 119}, {id: 'oque', dur: 177}, {id: 'instalar', dur: 164}, {id: 'cada', dur: 248},
  {id: 'teste', dur: 208}, {id: 'pros', dur: 204}, {id: 'salve', dur: 233}, // inclui o encerramento de marca (técnica 100)
];
const TR = 16; // duração da passagem de página
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
// posição contínua do "carrossel": 0 = capa, 1 = página 2...
const posAt = (F: number) => {
  let p = 0;
  for (let i = 1; i < PAGES.length; i++) p += sp(F, STARTS[i] - TR, SPR.page);
  return p;
};

/* ---------------- Peças fixas do layout ---------------- */
const Kick: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const idx = Math.round(Math.min(PAGES.length - 1, Math.max(0, pos)));
  const txt = idx === 0 ? `TUTORIAL ${D.n}` : `TUTORIAL ${D.n} · ${D.name.toUpperCase()}`;
  const s = sp(F, 0, SPR.card);
  return <div style={{position: 'absolute', left: L, top: 216, fontFamily: 'M', fontWeight: 700, fontSize: 26, letterSpacing: 3, color: MUTE, ...rise(s, 16)}}>{txt}</div>;
};
// contador 01/07 com dígitos que rolam
const Counter: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const s = sp(F, 2, SPR.card);
  const p = Math.max(0, Math.min(PAGES.length - 1, pos));
  return (
    <div style={{position: 'absolute', right: L, top: 216, fontFamily: 'M', fontSize: 26, color: '#7B847F', display: 'flex', ...rise(s, 16)}}>
      <span>0</span>
      <span style={{display: 'inline-block', height: 34, overflow: 'hidden', lineHeight: '34px'}}>
        <span style={{display: 'block', transform: `translateY(${-p * 34}px)`}}>
          {PAGES.map((_, i) => <div key={i}>{i + 1}</div>)}
        </span>
      </span>
      <span>/0{PAGES.length}</span>
    </div>
  );
};
const Brand: React.FC<{F: number}> = ({F}) => {
  const s = sp(F, 4, SPR.pop);
  return <Img src={staticFile('icone.png')} style={{position: 'absolute', right: L, top: 272, width: 84, transform: `scale(${s}) rotate(${(1 - s) * -90}deg)`}} />;
};
const Footer: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const s = sp(F, 6, SPR.card);
  const prog = (Math.max(0, Math.min(PAGES.length - 1, pos)) + 1) / PAGES.length;
  return (
    <div style={{position: 'absolute', left: L, right: L, top: 1484, height: 4, background: 'rgba(15,59,39,0.16)', borderRadius: 2, opacity: s}}>
      <div style={{width: `${prog * 100 * s}%`, height: '100%', background: INK, borderRadius: 2}} />
    </div>
  );
};

/* Legenda palavra por palavra, sincronizada com a narração */
const KEYS = new Set(['pronto', 'Anthropic', 'comandos', 'Word', 'Excel', 'PDFs', 'pedido', 'final', 'revisão', 'Salve', 'Factory']);
type PWd = [number, number, string];
const CHUNKS: PWd[][] = (() => {
  // separa nas pausas da fala e divide cada trecho em blocos equilibrados de até ~26 letras
  const segs: PWd[][] = []; let cur: PWd[] = [];
  (PW as PWd[]).forEach((w, i, arr) => {
    cur.push(w);
    const next = arr[i + 1];
    if (!next || next[0] - w[1] > 0.2) { segs.push(cur); cur = []; }
  });
  const out: PWd[][] = [];
  segs.forEach((sg) => {
    const len = sg.map((x) => x[2]).join(' ').length;
    const n = Math.max(1, Math.ceil(len / 26));
    const target = len / n;
    let c: PWd[] = [], acc = 0;
    sg.forEach((w, i) => {
      c.push(w); acc += w[2].length + 1;
      const glue = /^(Claude|Document|Theme|no|o|a|as|de|da|em|um|uma|e|com|para|é)$/.test(w[2]);
      if (acc >= target * 0.92 && !glue && sg.length - i - 1 >= 2) { out.push(c); c = []; acc = 0; }
    });
    if (c.length) out.push(c);
  });
  return out;
})();
const Caption: React.FC<{F: number}> = ({F}) => {
  const t = F / 30;
  let idx = -1;
  for (let i = 0; i < CHUNKS.length; i++) if (t >= CHUNKS[i][0][0] - 0.08) idx = i;
  if (idx < 0) return null;
  const ch = CHUNKS[idx];
  const end = idx < CHUNKS.length - 1 ? CHUNKS[idx + 1][0][0] - 0.08 : ch[ch.length - 1][1] + 0.8;
  if (t > end) return null;
  const inn = sp(F, (ch[0][0] - 0.08) * 30, SPR.word);
  return (
    <div style={{position: 'absolute', left: L, right: 150, top: 1392, textAlign: 'left', fontFamily: 'I', fontWeight: 650, fontSize: 44, lineHeight: 1.25,
      letterSpacing: -0.4, ...rise(inn, 14)}}>
      {ch.map(([a, , w], i) => {
        const on = t >= a;
        const core = w.replace(/[.,:]/g, '');
        const k = KEYS.has(core);
        const pop = on ? sp(F, a * 30, SPR.word) : 0;
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.25em', color: on ? INK : '#9AA49E',
            backgroundImage: k ? `linear-gradient(${G},${G})` : 'none', backgroundRepeat: 'no-repeat',
            backgroundSize: `${k && on ? tw(F, a * 30, a * 30 + 6) * 100 : 0}% 100%`, padding: k ? '0 8px' : 0, borderRadius: 6,
            transform: on ? `translateY(${(1 - pop) * 6}px)` : 'none'}}>{w}</span>
        );
      })}
    </div>
  );
};

/* Título com destaque: letras entram em cascata, faixa verde varre da esquerda */
type Seg = {t: string; hl?: boolean};
const Title: React.FC<{f: number; lines: Seg[][]; size?: number; top?: number}> = ({f, lines, size = 80, top = 288}) => {
  let k = 0;
  return (
    <div style={{position: 'absolute', left: L, right: 190, top, fontFamily: 'M', fontWeight: 800, fontSize: size, lineHeight: 1.12, letterSpacing: -2.5, color: INK}}>
      {lines.map((ln, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {ln.map((sg, si) => {
            const start = 2 + k * 0.7;
            const wipe = sg.hl ? tw(f, start - 2, start + 10) : 0;
            const chars = sg.t.split('').map((ch) => {
              const s = sp(f, 2 + k++ * 0.7, SPR.word);
              return <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 100}%)`, opacity: Math.min(1, s * 2)}}>{ch === ' ' ? ' ' : ch}</span>;
            });
            return (
              <span key={si} style={{position: 'relative', display: 'inline-block', padding: sg.hl ? '2px 18px 6px' : 0, margin: sg.hl ? '6px 0' : 0}}>
                {sg.hl && <span style={{position: 'absolute', inset: 0, background: G, transformOrigin: 'left', transform: `scaleX(${wipe})`}} />}
                <span style={{position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'top'}}>{chars}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* Robô do carrossel (mesmo SVG do gerador), com vida */
const Bot: React.FC<{f: number; scale: number; top: number}> = ({f, scale, top}) => {
  // 60 · primeiro o traço técnico, depois o volume preenchido; 51 · as peças se acoplam; 61 · respiração em repouso
  const draw = tw(f, 8, 30, 0, 1, Easing.bezier(0.65, 0, 0.35, 1));
  const fill = tw(f, 28, 38);
  const ant = sp(f, 34, SPR.pop);
  const legs = sp(f, 30, SPR.card);
  const blink = Math.floor(f / 9) % 2 === 0;
  const prompt = tw(f, 40, 46);
  const bob = Math.sin(f / 12) * 4 * fill;
  const dash = (p: number) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p});
  return (
    <svg style={{position: 'absolute', left: '50%', top, transform: `translateX(-50%) translateY(${bob}px)`, overflow: 'visible'}} width={330 * scale} height={300 * scale} viewBox="0 0 330 300">
      <g transform={`translate(0 ${(1 - ant) * -40})`} opacity={Math.min(1, ant * 2)}>
        <rect x="155" y="8" width="20" height="44" fill={INK} /><rect x="140" y="0" width="50" height="22" fill={G} stroke={INK} strokeWidth="5" />
      </g>
      <rect x="35" y="52" width="260" height="170" rx="6" fill={G} fillOpacity={fill} stroke={INK} strokeWidth="7" {...dash(draw)} />
      <rect x="8" y="100" width="27" height="70" fill={INK} opacity={fill} /><rect x="295" y="100" width="27" height="70" fill={INK} opacity={fill} />
      <rect x="80" y="95" width="170" height="80" rx="4" fill={INK} fillOpacity={fill} stroke={INK} strokeWidth="3" {...dash(draw)} />
      <path d="M112 118 L136 135 L112 152" stroke={G} strokeWidth="11" fill="none" strokeLinecap="square" opacity={prompt} />
      <rect x="160" y="140" width="56" height="12" fill={G} opacity={prompt * (blink ? 1 : 0)} />
      <g transform={`translate(0 ${(1 - legs) * -30})`} opacity={Math.min(1, legs * 2) * fill}>
        <rect x="75" y="222" width="34" height="62" fill={INK} /><rect x="221" y="222" width="34" height="62" fill={INK} />
        <rect x="140" y="222" width="50" height="40" fill={INK} />
      </g>
    </svg>
  );
};

const Tag: React.FC<{t: string; s: number; style?: React.CSSProperties}> = ({t, s, style}) => (
  <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 32, background: INK, color: G, padding: '4px 16px', borderRadius: 8, display: 'inline-block',
    transform: `scale(${0.5 + 0.5 * s})`, opacity: Math.min(1, s * 2), ...style}}>{t}</span>
);
const Check: React.FC<{s: number; size?: number}> = ({s, size = 44}) => (
  <span style={{width: size, height: size, flex: 'none', background: s > 0.5 ? G : 'transparent', border: `3px solid ${INK}`, borderRadius: 8,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${0.7 + 0.3 * Math.min(1.1, s)})`}}>
    <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" stroke={INK} strokeWidth={3.6} fill="none" strokeLinecap="round" strokeLinejoin="round"
      strokeDasharray={30} strokeDashoffset={30 * (1 - Math.min(1, s))} /></svg>
  </span>
);
const Rule: React.FC<{p: number}> = ({p}) => <div style={{height: 2.5, background: LINE, transformOrigin: 'left', transform: `scaleX(${p})`}} />;

/* ---------------- Páginas (f = tempo local da página) ---------------- */
const Capa: React.FC<{f: number}> = ({f}) => {
  const fmts = ['docx', 'xlsx', 'pptx', 'pdf'];
  const pos = [[-300, -120], [300, -120], [-310, 150], [310, 150]];
  return (
    <>
      <Title f={f} size={86} lines={[[{t: `${D.name}:`}], [{t: 'como instalar', hl: true}], [{t: 'e usar'}]]} />
      <div style={{position: 'absolute', left: L, right: L, top: 650, fontFamily: 'M', fontSize: 34, fontWeight: 500, color: SUB, lineHeight: 1.45, ...rise(sp(f, 22))}}>
        <span style={{backgroundImage: `linear-gradient(${G},${G})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 92%',
          backgroundSize: `${tw(f, 28, 52) * 100}% 4px`, paddingBottom: 6}}>{D.sub}</span>
      </div>
      <Bot f={f} scale={1.25} top={880} />
      {fmts.map((t, i) => {
        const s = sp(f, 46 + i * 5, SPR.pop);
        const fl = Math.sin(f / 14 + i * 1.7) * 6;
        return <Tag key={t} t={t} s={s} style={{position: 'absolute', left: 540 + pos[i][0] - 50, top: 1060 + pos[i][1] + fl}} />;
      })}
    </>
  );
};

const OQue: React.FC<{f: number}> = ({f}) => {
  const words = D.what.split(' ');
  return (
    <>
      <Title f={f} size={76} lines={[[{t: 'O que é'}]]} />
      <div style={{position: 'absolute', left: L, right: L, top: 470, fontFamily: 'I', fontSize: 44, lineHeight: 1.34, fontWeight: 500, letterSpacing: -0.6, color: INK}}>
        {words.map((w, i) => {
          const s = sp(f, 10 + i * 1.3, SPR.word);
          return <span key={i} style={{display: 'inline-block', marginRight: '0.24em', ...rise(s, 18)}}>{w}</span>;
        })}
      </div>
      <div style={{position: 'absolute', left: L, right: 150, top: 940}}>
        {D.bullets.map((b, i) => {
          const d = 66 + i * 12;
          return (
            <div key={i}>
              <div style={{display: 'flex', gap: 22, alignItems: 'center', padding: '26px 0', fontFamily: 'I', fontSize: 36, fontWeight: 600, color: INK, lineHeight: 1.25, ...rise(sp(f, d), 24)}}>
                <Check s={sp(f, d + 6, SPR.pop)} />{b}
              </div>
              {i < D.bullets.length - 1 && <Rule p={tw(f, d + 4, d + 16)} />}
            </div>
          );
        })}
      </div>
    </>
  );
};

const Terminal: React.FC<{f: number; lines: string[]; from: number; perChar: number; top: number; comment?: string; wrap?: boolean; size?: number}> = ({f, lines, from, perChar, top, comment, wrap, size = 30}) => {
  const box = sp(f, from - 10, SPR.card);
  let t = from;
  const blink = Math.floor(f / 8) % 2 === 0;
  let lastActive = -1;
  const rendered = lines.map((ln, i) => {
    const n = Math.floor(interpolate(f, [t, t + ln.length * perChar], [0, ln.length], clamp));
    const done = n >= ln.length;
    if (n > 0) lastActive = i;
    t += ln.length * perChar + 8;
    return {ln, n, done};
  });
  return (
    <div style={{position: 'absolute', left: L, right: L, top, background: INK, borderRadius: 18, padding: '34px 38px', fontFamily: 'M', fontSize: size, lineHeight: 1.65,
      color: '#E9EFEB', transform: `translateY(${(1 - box) * 60}px) scale(${0.94 + 0.06 * box})`, opacity: Math.min(1, box * 1.6), transformOrigin: 'top center'}}>
      {comment && <div style={{color: '#8A958F'}}>{comment}</div>}
      {rendered.map(({ln, n}, i) => (
        <div key={i} style={{whiteSpace: wrap ? 'normal' : 'pre', overflowWrap: 'anywhere', minHeight: size * 1.65}}>
          {!wrap && <span style={{color: G}}>&gt; </span>}{ln.slice(0, n)}
          {i === Math.max(0, lastActive) && <span style={{display: 'inline-block', width: size * 0.55, height: size * 1.1, background: G, verticalAlign: 'middle', marginLeft: 3, opacity: blink ? 1 : 0}} />}
        </div>
      ))}
    </div>
  );
};

const Instalar: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} size={76} lines={[[{t: 'Como'}], [{t: 'instalar', hl: true}]]} />
    <div style={{position: 'absolute', left: L, top: 556, fontFamily: 'M', fontSize: 26, letterSpacing: 3, color: MUTE, ...rise(sp(f, 12), 16)}}>NO CLAUDE CODE</div>
    <Terminal f={f} lines={D.install.map((c) => c.replace('/plugin install ', '/plugin install\n  '))} from={22} perChar={0.6} top={604} size={31} />
    <div style={{position: 'absolute', left: L, top: 960, fontFamily: 'M', fontSize: 26, letterSpacing: 3, color: MUTE, ...rise(sp(f, TAG_IN - 4), 16)}}>4 SKILLS DISPONÍVEIS</div>
  </>
);

/* 12 · Elemento compartilhado: os 4 selos nascem na página 3 e viram os títulos da lista da página 4 */
const TAG_IN = 100; // quadro local da página 3 em que os selos aparecem ("as quatro já ficam disponíveis")
const ROW = (i: number) => 500 + i * 214; // topo de cada item da página 4
const DESC_AT = [44, 104, 138, 190]; // quadros locais da página 4 sincronizados com a fala (Word, Excel, apresentações, PDFs)
const SkillTags: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  if (pos < 1.2 || pos > 4.2) return null;
  const t3 = STARTS[2], t4 = STARTS[3];
  const fmts = D.use.map((u) => u[0]);
  return (
    <>
      {fmts.map((t, i) => {
        const born = sp(F, t3 + TAG_IN + i * 4, SPR.pop);
        const u = sp(F, t4 - TR + i * 2, SPR.page); // viagem com cascata de 2 quadros
        const a = {x: L + i * 168, y: 1008, fs: 38, w: 150};
        const b = {x: L, y: ROW(i) + 24, fs: 32, w: 124};
        const lx = (p: number, q: number) => p + (q - p) * u;
        const out = Math.max(0, pos - 3) * -1080; // sai junto com a página 4
        const enter = Math.min(0, pos - 2) * -1080; // entra junto com a página 3
        // 98 · foco: o selo citado pela voz fica pleno, os outros recuam
        const local4 = F - t4;
        const act = DESC_AT.filter((d) => local4 >= d).length - 1;
        const allDone = local4 > DESC_AT[3] + 40;
        const dim = pos > 2.5 && !allDone && act >= 0 && act !== i ? 0.4 : 1;
        const arc = Math.sin(Math.min(1, u) * Math.PI) * -26 * (i % 2 ? 1 : -1);
        return (
          <div key={t} style={{position: 'absolute', left: lx(a.x, b.x) + out + enter + arc * 0.4, top: lx(a.y, b.y) + arc, width: lx(a.w, b.w), textAlign: 'center',
            fontFamily: 'M', fontWeight: 800, fontSize: lx(a.fs, b.fs), background: INK, color: G, padding: '6px 0', borderRadius: 8,
            opacity: Math.min(1, born * 2) * dim, transform: `scale(${0.5 + 0.5 * born})`}}>{t}</div>
        );
      })}
    </>
  );
};

const Cada: React.FC<{f: number}> = ({f}) => {
  const act = DESC_AT.filter((d) => f >= d).length - 1;
  const allDone = f > DESC_AT[3] + 40;
  return (
    <>
      <Title f={f} size={76} lines={[[{t: 'O que cada'}], [{t: 'uma faz'}]]} />
      {D.use.map(([t, d], i) => {
        const dl = DESC_AT[i];
        const focus = !allDone && act >= 0 && act !== i ? 0.4 : 1;
        return (
          <div key={t}>
            <div style={{position: 'absolute', left: L, right: 150, top: ROW(i) + 24 + 56 + 10, fontFamily: 'I', fontSize: 37, fontWeight: 500, lineHeight: 1.26, color: INK,
              ...rise(sp(f, dl), 22), opacity: Math.min(1, sp(f, dl) * 1.6) * focus}}>{d}</div>
            {i < D.use.length - 1 && <div style={{position: 'absolute', left: L, right: 150, top: ROW(i + 1) + 4}}><Rule p={tw(f, dl + 6, dl + 20)} /></div>}
          </div>
        );
      })}
    </>
  );
};

const Teste: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} size={76} lines={[[{t: 'Teste agora'}], [{t: 'com este pedido', hl: true}]]} />
    <Terminal f={f} lines={[D.prompt]} from={52} perChar={0.9} top={600} comment="# cole no Claude Code" wrap size={38} />
    <div style={{position: 'absolute', left: L, right: 150, top: 1060, ...rise(sp(f, 150), 20)}}>
      <div style={{fontFamily: 'M', fontSize: 26, letterSpacing: 3, color: MUTE, marginBottom: 22}}>O QUE VOCÊ RECEBE</div>
      <div style={{display: 'flex', gap: 22}}>
        {[['pdf', 'propostas.pdf'], ['xlsx', 'valores.xlsx']].map(([t, n], i) => {
          const s = sp(f, 156 + i * 6, SPR.pop);
          return (
            <div key={n} style={{display: 'flex', alignItems: 'center', gap: 16, background: '#fff', border: `3px solid ${INK}`, borderRadius: 16, padding: '18px 22px',
              boxShadow: `${6 * s}px ${6 * s}px 0 ${INK}`, transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2)}}>
              <Tag t={t} s={1} style={{fontSize: 26, padding: '2px 10px'}} />
              <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 28, color: INK}}>{n}</span>
            </div>
          );
        })}
      </div>
    </div>
  </>
);

const Box: React.FC<{f: number; d: number; top: number; kind: 'pro' | 'con'; items: string[]}> = ({f, d, top, kind, items}) => {
  const s = sp(f, d, SPR.card);
  const sh = 10 * Math.min(1, s);
  return (
    <div style={{position: 'absolute', left: L, right: 150, top, background: '#fff', border: `3px solid ${INK}`, borderRadius: 20, padding: '30px 36px',
      boxShadow: `${sh}px ${sh}px 0 ${INK}`, transform: `translate(${(1 - s) * -10}px, ${(1 - s) * 60}px)`, opacity: Math.min(1, s * 1.6)}}>
      <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 28, letterSpacing: 3, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, color: INK}}>
        {kind === 'pro' ? <Check s={sp(f, d + 6, SPR.pop)} size={42} /> : (
          <span style={{width: 42, height: 42, border: `3px solid ${INK}`, borderRadius: 8, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            background: sp(f, d + 6, SPR.pop) > 0.5 ? RED : 'transparent'}}>
            <svg width={24} height={24} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke={INK} strokeWidth={3.6} strokeLinecap="round" /></svg>
          </span>
        )}
        {kind === 'pro' ? 'PRÓS' : 'CONTRAS'}
      </div>
      {items.map((it, i) => (
        <div key={i} style={{fontFamily: 'I', fontSize: 32, fontWeight: 500, lineHeight: 1.28, padding: '8px 0', color: INK, ...rise(sp(f, d + 10 + i * 6), 18)}}>{it}</div>
      ))}
    </div>
  );
};
const Pros: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} size={76} lines={[[{t: 'Prós e'}], [{t: 'contras'}]]} />
    <div style={{opacity: 1 - 0.5 * tw(f, 84, 96)}}><Box f={f} d={14} top={510} kind="pro" items={D.pros} /></div>
    <Box f={f} d={88} top={900} kind="con" items={D.cons} />
  </>
);

const Salve: React.FC<{f: number}> = ({f}) => {
  const items = ['Salve para usar no próximo projeto', 'Mande para quem programa com você', 'Siga a @xarpy_dev para a série completa'];
  return (
    <>
      <Title f={f} size={76} lines={[[{t: 'Salve este'}], [{t: 'tutorial', hl: true}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 560}}>
        {items.map((t, i) => {
          const d = 18 + i * 12;
          return (
            <div key={i}>
              <div style={{display: 'flex', gap: 24, alignItems: 'center', padding: '26px 0', fontFamily: 'I', fontSize: 38, fontWeight: 500, color: INK, ...rise(sp(f, d), 24)}}>
                <span style={{fontFamily: 'M', fontWeight: 800, background: G, padding: '2px 14px', fontSize: 32, transform: `scale(${0.6 + 0.4 * sp(f, d + 2, SPR.pop)})`}}>0{i + 1}</span>{t}
              </div>
              {i < items.length - 1 && <Rule p={tw(f, d + 4, d + 16)} />}
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, right: L, top: 1150, fontFamily: 'M', fontWeight: 700, fontSize: 32, color: INK, ...rise(sp(f, 96), 20)}}>
        Próximo tutorial: <span style={{background: INK, color: G, padding: '2px 12px'}}>{D.next}</span>
      </div>
    </>
  );
};

const OUTRO = 170; // quadro local da página 7 em que começa o encerramento
const Outro: React.FC<{F: number}> = ({F}) => {
  const f = F - STARTS[6] - OUTRO;
  if (f < 0) return null;
  const veil = tw(f, 0, 14);
  const iris = tw(f, 6, 24, 0, 1, Easing.bezier(0.65, 0, 0.35, 1)); // 16 · íris sobre o símbolo oficial, sem alterar a geometria
  const mark = sp(f, 8, SPR.card);
  const handle = sp(f, 18, SPR.card);
  const next = sp(f, 26, SPR.card);
  return (
    <AbsoluteFill style={{background: `rgba(247,249,247,${veil})`}}>
      <div style={{position: 'absolute', left: 540 - 110, top: 640, width: 220, height: 220, clipPath: `circle(${iris * 72}% at 50% 50%)`,
        transform: `scale(${0.85 + 0.15 * mark})`}}>
        <Img src={staticFile('icone.png')} style={{width: 220, height: 220}} />
      </div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 912, textAlign: 'center', fontFamily: 'M', fontWeight: 800, fontSize: 64, letterSpacing: -1.5, color: INK, ...rise(handle, 24)}}>@xarpy_dev</div>
      <div style={{position: 'absolute', left: 0, right: 0, top: 1010, textAlign: 'center', ...rise(next, 18)}}>
        <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 32, color: INK}}>Próximo: </span>
        <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 32, background: INK, color: G, padding: '2px 12px'}}>{D.next}</span>
      </div>
    </AbsoluteFill>
  );
};

const PAGE_C: React.FC<{f: number}>[] = [Capa, OQue, Instalar, Cada, Teste, Pros, Salve];

/* ---------------- Composição ---------------- */
const Frame: React.FC = () => {
  const F = useF();
  const pos = posAt(F);
  return (
    <AbsoluteFill style={{background: BG, color: INK}}>
      {PAGE_C.map((C, i) => {
        const x = (i - pos) * 1080;
        if (Math.abs(x) > 1100) return null;
        return (
          <AbsoluteFill key={i} style={{transform: `translateX(${x}px)`}}>
            <C f={Math.max(0, F - STARTS[i])} />
          </AbsoluteFill>
        );
      })}
      <Kick F={F} pos={pos} />
      <Counter F={F} pos={pos} />
      <Brand F={F} />
      <SkillTags F={F} pos={pos} />
      <Footer F={F} pos={pos} />
      <Caption F={F} />
      <Outro F={F} />
    </AbsoluteFill>
  );
};

export type T12Props = {blur?: boolean; samples?: number; safe?: boolean};
export const T12: React.FC<T12Props> = ({blur = false, samples = 3, safe}) => (
  <AbsoluteFill style={{background: BG}}>
    <style>{fontCss}</style>
    {blur ? <CameraMotionBlur shutterAngle={180} samples={samples}><Frame /></CameraMotionBlur> : <Frame />}
    {safe && (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(255,0,80,0.25)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(255,0,80,0.25)'}} />
        <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(255,0,80,0.25)'}} />
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);
