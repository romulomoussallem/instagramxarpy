import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import PW from './palavras.json';
import WORLD from '../news2/world.json';

/* Radar IA v3 · identidade XARPY (paleta principal) · 1080x1920 · 60 fps, tempos em quadros de 30 fps */
const BG = '#0F3B27', BG2 = '#0A2A1C', LIME = '#92FF5F', OR = '#FF7036', PAPER = '#F7F9F7', INK = '#0B1F15', TX = '#F7F9F7', MU = '#A7C2B2',
  CARD = '#0C3322', LN = '#215C40', ICE = '#BFF2F0';
const L = 60;
const fontCss = `
@font-face{font-family:'I';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'M';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
`;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SPR = {page: {damping: 22, stiffness: 120, mass: 1}, card: {damping: 15, stiffness: 140, mass: 0.8}, pop: {damping: 10, stiffness: 200, mass: 0.6},
  heavy: {damping: 18, stiffness: 90, mass: 1.1}, word: {damping: 14, stiffness: 260, mass: 0.5}};
const sp = (f: number, d: number, c = SPR.card) => spring({frame: f - d, fps: 30, config: c});
const tw = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.16, 1, 0.3, 1)) => interpolate(f, [a, b], [from, to], {...clamp, easing: e});
const rise = (s: number, y = 30): React.CSSProperties => ({opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * y}px)`});
const useF = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return (f * 30) / fps; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// uma tela por frase da narração
export const PAGES = [
  {id: 'capa', dur: 184}, {id: 'n1', dur: 163}, {id: 'n1d', dur: 201}, {id: 'n2', dur: 191}, {id: 'n2d', dur: 215},
  {id: 'n3', dur: 192}, {id: 'n3d', dur: 221}, {id: 'poll', dur: 129}, {id: 'share', dur: 169},
];
const TR = 16;
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
const posAt = (F: number) => PAGES.slice(1).reduce((p, _x, i) => p + sp(F, STARTS[i + 1] - TR, SPR.page), 0);
const NEWS_OF = [0, 1, 1, 2, 2, 3, 3, 0, 0];

/* ---------- legenda ---------- */
type PWd = [number, number, string];
const KEYS = new Set(['Três', 'Brasil', 'lista', 'GPT-6.2', 'Astra', 'Sol', '4x', 'Google', 'sozinhos', 'senhas', 'ninguém', 'chips', 'licença', '90', 'dias', '1, 2 ou 3', 'manda']);
const CHUNKS: PWd[][] = (() => {
  const segs: PWd[][] = []; let cur: PWd[] = [];
  (PW as PWd[]).forEach((w, i, arr) => { cur.push(w); const n = arr[i + 1]; if (!n || n[0] - w[1] > 0.2 || /[.?]$/.test(w[2])) { segs.push(cur); cur = []; } });
  const out: PWd[][] = [];
  segs.forEach((sg) => {
    const len = sg.map((x) => x[2]).join(' ').length;
    const n = Math.max(1, Math.ceil(len / 26)); const target = len / n;
    let c: PWd[] = [], acc = 0;
    sg.forEach((w, i) => {
      c.push(w); acc += w[2].length + 1;
      const glue = /^(E|um|uma|o|a|os|de|da|do|dos|em|e|com|para|que|é|na|no|Os|O|A|te|tem|mais|já)$/.test(w[2]);
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
  const end = idx < CHUNKS.length - 1 ? CHUNKS[idx + 1][0][0] - 0.08 : ch[ch.length - 1][1] + 1.4;
  if (t > end) return null;
  const inn = sp(F, (ch[0][0] - 0.08) * 30, SPR.word);
  return (
    <div style={{position: 'absolute', left: L, right: 150, top: 1388, fontFamily: 'I', fontWeight: 700, fontSize: 44, lineHeight: 1.25, letterSpacing: -0.4, ...rise(inn, 14)}}>
      {ch.map(([a, , w], i) => {
        const on = t >= a;
        const k = KEYS.has(w.replace(/[.,:?]$/g, ''));
        const pop = on ? sp(F, a * 30, SPR.word) : 0;
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.25em', color: on ? (k ? INK : TX) : '#5E7D6B', padding: k ? '0 8px' : 0, borderRadius: 6,
            backgroundImage: k ? `linear-gradient(${LIME},${LIME})` : 'none', backgroundRepeat: 'no-repeat',
            backgroundSize: `${k && on ? tw(F, a * 30, a * 30 + 6) * 100 : 0}% 100%`, transform: on ? `translateY(${(1 - pop) * 6}px)` : 'none'}}>{w}</span>
        );
      })}
    </div>
  );
};

/* ---------- peças ---------- */
const Bg: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const glows = ['146,255,95', '146,255,95', '146,255,95', '255,112,54', '255,112,54', '191,242,240', '191,242,240', '146,255,95', '146,255,95'];
  return (
    <>
      <AbsoluteFill style={{background: `linear-gradient(180deg, ${BG2} 0%, ${BG} 45%, ${BG2} 100%)`}} />
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(146,255,95,0.12) 1.6px, transparent 1.6px)', backgroundSize: '36px 36px', backgroundPosition: `${-pos * 60}px ${F * 0.15}px`,
        maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 72%, transparent 100%)'}} />
      {glows.map((c, i) => (
        <AbsoluteFill key={i} style={{opacity: Math.max(0, 1 - Math.abs(pos - i)), background: `radial-gradient(ellipse 950px 720px at 88% 96%, rgba(${c},0.16), transparent 70%), radial-gradient(ellipse 700px 520px at 0% 18%, rgba(146,255,95,0.07), transparent 70%)`}} />
      ))}
    </>
  );
};
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 24} stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#gr)" />
    </svg>
  );
};

const RadarIcon: React.FC<{F: number; s?: number}> = ({F, s = 36}) => (
  <svg width={s} height={s} viewBox="0 0 34 34">
    <circle cx={17} cy={17} r={15} fill="none" stroke={LIME} strokeWidth={2} /><circle cx={17} cy={17} r={8} fill="none" stroke={LIME} strokeOpacity={0.5} strokeWidth={2} />
    <g transform={`rotate(${F * 4} 17 17)`}><path d="M17 17 L32 17 A15 15 0 0 0 27.6 6.4 Z" fill={LIME} fillOpacity={0.85} /></g>
  </svg>
);

const Head: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const n = NEWS_OF[Math.round(pos)];
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 214, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'M', fontWeight: 700, fontSize: 24, letterSpacing: 3, color: MU, ...rise(sp(F, 2), 16)}}>
        <RadarIcon F={F} /><span style={{color: TX}}>RADAR IA</span><span>·</span><span style={{color: LIME}}>18.11.2026</span>
        <span style={{marginLeft: 10, opacity: n ? 1 : 0, color: TX}}>{n ? `· 0${n}/03` : ''}</span>
      </div>
      <Img src={staticFile('icone.png')} style={{position: 'absolute', right: L, top: 200, width: 72, transform: `scale(${sp(F, 4, SPR.pop)})`}} />
      <div style={{position: 'absolute', left: L, right: 150, top: 1484, height: 5, borderRadius: 3, background: 'rgba(247,249,247,0.14)'}}>
        <div style={{width: `${(F / TOTAL30) * 100}%`, height: '100%', borderRadius: 3, background: LIME}} />
      </div>
    </>
  );
};

// título em linhas que sobem por máscara; {a:true} pinta de lime
type Seg = {t: string; a?: boolean};
const Title: React.FC<{f: number; lines: Seg[][]; size?: number; top: number; d?: number}> = ({f, lines, size = 100, top, d = 0}) => (
  <div style={{position: 'absolute', left: L, right: 120, top}}>
    {lines.map((ln, i) => {
      const s = sp(f, d + 4 + i * 5, SPR.heavy);
      return (
        <div key={i} style={{overflow: 'hidden', paddingBottom: 6}}>
          <div style={{fontFamily: 'M', fontWeight: 800, fontSize: size, lineHeight: 1.02, letterSpacing: -size * 0.045, color: TX, transform: `translateY(${(1 - s) * 110}%)`}}>
            {ln.map((sg, j) => <span key={j} style={{color: sg.a ? LIME : TX}}>{sg.t}</span>)}
          </div>
        </div>
      );
    })}
  </div>
);

const Sticker: React.FC<{t: string; c?: string; r?: number; s?: number; style?: React.CSSProperties}> = ({t, c = OR, r = -4, s = 1, style}) => (
  <div style={{display: 'inline-block', background: c, color: c === OR ? '#fff' : INK, fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 2, padding: '8px 16px', borderRadius: 6,
    transform: `rotate(${r}deg) scale(${s})`, boxShadow: '0 8px 18px rgba(0,0,0,0.35)', whiteSpace: 'nowrap', ...style}}>{t}</div>
);

const Tape: React.FC<{x: number; y: number; r: number; o?: number}> = ({x, y, r, o = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 150, height: 44, background: 'rgba(236,240,226,0.75)', transform: `rotate(${r}deg)`, opacity: o, boxShadow: '0 2px 6px rgba(0,0,0,0.25)'}} />
);

// recorte da matéria (manchete reescrita, com veículo e data); hl = trecho com marca-texto
type ClipT = {n: string; outlet: string; pre: string; hl: string; post: string; sub?: string; cat: string};
const CLIPS: Record<string, ClipT> = {
  n1: {n: '01', outlet: 'OPENAI · 17 NOV', pre: 'OpenAI lança o GPT-6.2 em ', hl: 'duas versões', post: ': Astra e Sol', sub: 'Nova família chega com uma versão para tarefas pesadas e outra mais barata para o uso diário.', cat: 'LANÇAMENTO'},
  n2: {n: '02', outlet: 'GOOGLE THREAT INTELLIGENCE · 16 NOV', pre: 'Hackers já usam agentes de IA que ', hl: 'atacam sozinhos', post: '', sub: 'Relatório do Google descreve ataques em que o agente encontra falhas e age sem um operador humano.', cat: 'SEGURANÇA'},
  n3: {n: '03', outlet: 'REUTERS · 16 NOV', pre: 'EUA apertam regra de chips de IA e o ', hl: 'Brasil entra na lista', post: '', sub: 'Compra dos chips mais avançados passa a exigir licença do governo americano.', cat: 'REGULAÇÃO'},
};
const Clip: React.FC<{c: ClipT; w: number; size: number; hlP?: number; sub?: boolean; sticker?: number}> = ({c, w, size, hlP = 0, sub, sticker = 1}) => (
  <div style={{position: 'relative', width: w, background: PAPER, borderRadius: 4, padding: `${size * 0.5}px ${size * 0.66}px ${size * 0.6}px`, boxSizing: 'border-box', boxShadow: '0 30px 60px rgba(0,0,0,0.5)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'M', fontWeight: 700, fontSize: size * 0.4, letterSpacing: 2, color: '#5F6B64', borderBottom: '2px solid #0B1F1522', paddingBottom: size * 0.28}}>
      <span style={{background: INK, color: PAPER, padding: '2px 10px', borderRadius: 4}}>{c.n}</span>{c.outlet}
    </div>
    <div style={{fontFamily: 'I', fontWeight: 800, fontSize: size, lineHeight: 1.08, color: INK, marginTop: size * 0.3, letterSpacing: -size * 0.02}}>
      {c.pre}
      <span style={{backgroundImage: `linear-gradient(${LIME},${LIME})`, backgroundRepeat: 'no-repeat', backgroundSize: `${hlP * 100}% 88%`, backgroundPosition: '0 70%', padding: '0 4px', margin: '0 -4px'}}>{c.hl}</span>
      {c.post}
    </div>
    {sub && c.sub && <div style={{fontFamily: 'I', fontWeight: 500, fontSize: size * 0.5, lineHeight: 1.35, color: '#4A5650', marginTop: size * 0.32}}>{c.sub}</div>}
    <Sticker t={c.cat} r={5} s={sticker} style={{position: 'absolute', right: -16, top: -22}} />
  </div>
);

// selo da fonte que fica nas telas de dados
const SourceChip: React.FC<{f: number; c: ClipT; top?: number}> = ({f, c, top = 1236}) => {
  const s = sp(f, 6, SPR.card);
  return (
    <div style={{position: 'absolute', left: L, top, display: 'flex', alignItems: 'center', gap: 18, ...rise(s, 30)}}>
      <div style={{width: 250, background: PAPER, borderRadius: 4, padding: '10px 14px', transform: `rotate(${-2 * s}deg)`, boxShadow: '0 12px 26px rgba(0,0,0,0.45)'}}>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 12, letterSpacing: 1, color: '#5F6B64', whiteSpace: 'nowrap', overflow: 'hidden'}}>{c.outlet}</div>
        <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 17, lineHeight: 1.12, color: INK, marginTop: 4}}>{c.pre}{c.hl}{c.post}</div>
      </div>
      <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 19, color: MU, lineHeight: 1.4}}>FONTE<br /><span style={{color: TX}}>{c.outlet.split(' · ')[0]}</span></div>
    </div>
  );
};

/* ---------- telas ---------- */
const Capa: React.FC<{f: number}> = ({f}) => {
  const block = sp(f, 18, SPR.heavy);
  const focus = tw(f, 120, 136); // "o Brasil na lista"
  const clip = (i: number) => sp(f, 26 + i * 9, SPR.card);
  const data = [
    {k: 'n1', r: -4, x: 60, y: 790, w: 700},
    {k: 'n2', r: 3, x: 200, y: 950, w: 720},
    {k: 'n3', r: -2, x: 60, y: 1110, w: 800},
  ];
  return (
    <>
      <Title f={f} top={290} size={124} lines={[[{t: '3 notícias'}], [{t: 'de IA da'}], [{t: 'semana.', a: true}]]} />
      <div style={{position: 'absolute', left: 100, top: 750, width: 840, height: 560, background: LIME, borderRadius: 8, transform: `rotate(${3 * block}deg) scale(${0.9 + 0.1 * block})`, opacity: Math.min(1, block * 1.5), transformOrigin: 'center'}} />
      {data.map((d, i) => {
        const s = clip(i);
        const dim = i < 2 ? 1 - 0.35 * focus : 1;
        const c = CLIPS[d.k];
        return (
          <div key={d.k} style={{position: 'absolute', left: d.x, top: d.y, transform: `translateY(${(1 - s) * 260}px) rotate(${d.r + (1 - s) * 10 + (i === 2 ? -focus * 2 : 0)}deg) scale(${i === 2 ? 1 + focus * 0.04 : 1})`,
            opacity: Math.min(1, s * 1.5), filter: `brightness(${dim})`, zIndex: i}}>
            <Clip c={{...c, pre: i === 2 ? 'EUA apertam chips. ' : c.pre.replace(' que ', ' ').replace('o GPT-6.2 em ', 'o GPT-6.2'), hl: i === 2 ? 'Brasil na lista' : '', post: ''}} w={d.w} size={40} hlP={i === 2 ? tw(f, 128, 142) : 0} sticker={1} />
          </div>
        );
      })}
      <div style={{position: 'absolute', left: 520, top: 1262, zIndex: 5}}>
        <Sticker t="BRASIL NA LISTA" c={OR} r={-7} s={sp(f, 136, SPR.pop)} />
      </div>
    </>
  );
};

// tela do print: número vazado + recorte grande com fita + marca-texto
const PrintPage: React.FC<{f: number; k: string; hlAt: number; kicker: string}> = ({f, k, hlAt, kicker}) => {
  const c = CLIPS[k];
  const enter = sp(f, 6, SPR.heavy);
  return (
    <>
      <div style={{position: 'absolute', left: 48, top: 300, fontFamily: 'M', fontWeight: 800, fontSize: 300, lineHeight: 1, letterSpacing: -14, color: 'transparent',
        WebkitTextStroke: `3px ${LIME}66`, ...rise(sp(f, 0, SPR.heavy), 60)}}>{c.n}</div>
      <div style={{position: 'absolute', left: L, top: 650, display: 'flex', gap: 16, alignItems: 'center', ...rise(sp(f, 4), 20)}}>
        <Sticker t={kicker} c={LIME} r={-3} />
        <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 22, letterSpacing: 2, color: MU}}>O QUE SAIU</span>
      </div>
      <div style={{position: 'absolute', left: 60, top: 770, transform: `translateY(${(1 - enter) * 300}px) rotate(${-2 + (1 - enter) * -8}deg)`, opacity: Math.min(1, enter * 1.5)}}>
        <Clip c={c} w={880} size={60} hlP={tw(f, hlAt, hlAt + 14, 0, 1, Easing.bezier(0.6, 0, 0.2, 1))} sub sticker={sp(f, 22, SPR.pop)} />
        <Tape x={20} y={-22} r={-14} o={tw(f, 14, 18)} />
        <Tape x={740} y={-30} r={9} o={tw(f, 16, 20)} />
      </div>
    </>
  );
};

const Model: React.FC<{f: number; d: number; name: string; sub: string; inp: string; out: string; on: number; r: number}> = ({f, d, name, sub, inp, out, on, r}) => {
  const s = sp(f, d, SPR.card);
  return (
    <div style={{width: 430, height: 500, borderRadius: 26, padding: 34, boxSizing: 'border-box', transform: `translateY(${(1 - s) * 120}px) rotate(${r}deg) scale(${0.96 + 0.04 * on})`, opacity: Math.min(1, s * 1.5),
      background: interpolateColors(on, [0, 1], [CARD, LIME]), border: `2px solid ${interpolateColors(on, [0, 1], [LN, LIME])}`, color: interpolateColors(on, [0, 1], [TX, INK]),
      boxShadow: '0 30px 60px rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column'}}>
      <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, opacity: 0.7}}>GPT-6.2</div>
      <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 78, letterSpacing: -3, lineHeight: 1.05}}>{name}</div>
      <div style={{fontFamily: 'I', fontWeight: 600, fontSize: 28, opacity: 0.8, marginTop: 4}}>{sub}</div>
      <div style={{marginTop: 'auto', display: 'flex', gap: 34}}>
        {[['ENTRADA', inp], ['SAÍDA', out]].map(([l, v]) => (
          <div key={l}><div style={{fontFamily: 'M', fontWeight: 700, fontSize: 18, letterSpacing: 2, opacity: 0.65}}>{l}</div><div style={{fontFamily: 'I', fontWeight: 800, fontSize: 76, letterSpacing: -2}}>{v}</div></div>
        ))}
      </div>
      <div style={{fontFamily: 'M', fontSize: 16, opacity: 0.6, marginTop: 4}}>US$ por milhão de tokens</div>
    </div>
  );
};
const N1d: React.FC<{f: number}> = ({f}) => {
  const sol = tw(f, 66, 80);
  return (
    <>
      <Title f={f} top={290} size={96} lines={[[{t: 'Astra ou'}], [{t: 'Sol', a: true}, {t: '?'}]]} />
      <div style={{position: 'absolute', left: L, top: 560, display: 'flex', gap: 20}}>
        <Model f={f} d={8} name="Astra" sub="trabalho pesado" inp="$8" out="$40" on={0} r={-2.5 + sol * 0.5} />
        <Model f={f} d={60} name="Sol" sub="dia a dia" inp="$2" out="$10" on={sol} r={2} />
      </div>
      <div style={{position: 'absolute', left: 600, top: 520}}><Sticker t="4x MAIS BARATO" c={OR} r={-8} s={sp(f, 132, SPR.pop) * 1.25} /></div>
      <div style={{position: 'absolute', left: 340, right: 150, top: 1110, background: OR, borderRadius: 18, padding: '18px 24px', color: '#fff', ...rise(sp(f, 150), 26)}}>
        <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 17, letterSpacing: 2, opacity: 0.9}}>POR QUE IMPORTA</div>
        <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 29, lineHeight: 1.15, marginTop: 4}}>Agente rodando o dia todo ficou barato.</div>
      </div>
      <SourceChip f={f} c={CLIPS.n1} />
    </>
  );
};

const STEPS: [string, number][] = [['procura falhas em servidores', 8], ['corrige os próprios erros', 40], ['rouba senhas em massa', 92]];
const N2d: React.FC<{f: number}> = ({f}) => {
  const stamp = sp(f, 150, SPR.pop);
  return (
    <>
      <Title f={f} top={290} size={96} lines={[[{t: 'Ataque'}], [{t: 'sem humano', a: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, right: 120, top: 560, background: '#061A10', border: `2px solid ${LN}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 30px 60px rgba(0,0,0,0.45)', ...rise(sp(f, 4), 40)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 10, padding: '16px 22px', borderBottom: `2px solid ${LN}`, fontFamily: 'M', fontSize: 20, color: MU}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
          <span style={{marginLeft: 10}}>agente-invasor.log</span>
          <span style={{marginLeft: 'auto', color: OR, fontWeight: 800}}>● AO VIVO</span>
        </div>
        <div style={{padding: '18px 26px 26px'}}>
          {STEPS.map(([t, at], i) => {
            const s = sp(f, at, SPR.card);
            const n = Math.floor(tw(f, at, at + 20, 0, t.length, Easing.linear));
            return (
              <div key={t} style={{display: 'flex', alignItems: 'center', gap: 18, padding: '16px 0', borderBottom: i < 2 ? `1px dashed ${LN}` : 'none', opacity: Math.min(1, s * 2)}}>
                <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 22, color: MU}}>0{i + 1}</span>
                <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 34, color: TX, flex: 1}}>{t.slice(0, n)}<span style={{opacity: n < t.length && f % 16 < 8 ? 1 : 0, color: LIME}}>▌</span></span>
                <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 22, color: INK, background: LIME, padding: '4px 12px', borderRadius: 6, transform: `scale(${sp(f, at + 22, SPR.pop)})`}}>OK</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* operador vazio */}
      <div style={{position: 'absolute', left: L, top: 1000, display: 'flex', alignItems: 'center', gap: 22, ...rise(sp(f, 130), 24)}}>
        <div style={{width: 92, height: 92, borderRadius: 46, border: `3px dashed ${OR}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={50} height={50} viewBox="0 0 24 24"><circle cx={12} cy={8} r={4} fill="none" stroke={OR} strokeWidth={2} /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="none" stroke={OR} strokeWidth={2} /><path d="M3 3l18 18" stroke={OR} strokeWidth={2.4} /></svg>
        </div>
        <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 34, color: TX, lineHeight: 1.2}}>Operador humano<br /><span style={{color: OR}}>nenhum</span></div>
      </div>
      <div style={{position: 'absolute', left: 560, top: 1010, transform: `rotate(-8deg) scale(${stamp})`, opacity: Math.min(1, stamp * 2), border: `5px solid ${OR}`, color: OR, borderRadius: 10, padding: '10px 18px',
        fontFamily: 'M', fontWeight: 800, fontSize: 30, letterSpacing: 2, lineHeight: 1.1, textAlign: 'center'}}>SEM NINGUÉM<br />NO CONTROLE</div>
      <SourceChip f={f} c={CLIPS.n2} />
    </>
  );
};

const MAP_W = 960, MAP_S = MAP_W / 1010;
const PT: Record<string, [number, number]> = {us: [235, 300], br: [328, 500]};
const N3d: React.FC<{f: number}> = ({f}) => {
  const locs = (WORLD as {locations: {id: string; path: string}[]}).locations;
  const e = Easing.bezier(0.45, 0, 0.15, 1);
  const z = interpolate(f, [0, 20, 60], [1, 1, 1.75], {...clamp, easing: e});
  const ox = interpolate(f, [0, 20, 60], [505, 505, 300], {...clamp, easing: e});
  const oy = interpolate(f, [0, 20, 60], [333, 333, 410], {...clamp, easing: e});
  const H = 560;
  const tx = MAP_W / 2 - ox * MAP_S * z, ty = H / 2 - oy * MAP_S * z;
  const arc = tw(f, 18, 52, 0, 1, Easing.bezier(0.45, 0, 0.2, 1));
  const ping = ((f - 50) % 40) / 40;
  const days = Math.round(tw(f, 135, 165, 0, 90, Easing.out(Easing.cubic)));
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 290, width: MAP_W, height: H, borderRadius: 24, overflow: 'hidden', background: '#082517', border: `2px solid ${LN}`, ...rise(sp(f, 0), 30)}}>
        <svg width={MAP_W} height={H} viewBox={`0 0 ${MAP_W} ${H}`}>
          <g transform={`translate(${tx} ${ty}) scale(${MAP_S * z})`}>
            {locs.map((l) => (
              <path key={l.id} d={l.path} fill={l.id === 'br' ? LIME : l.id === 'us' ? ICE : '#164A31'} fillOpacity={l.id === 'br' ? 0.35 + 0.65 * tw(f, 48, 58) : 1} stroke={BG2} strokeWidth={0.6} />
            ))}
            <path d={`M${PT.us[0]} ${PT.us[1]} Q${290} ${360} ${PT.br[0]} ${PT.br[1]}`} fill="none" stroke={OR} strokeWidth={3} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - arc} strokeLinecap="round" />
            {f > 50 && <circle cx={PT.br[0]} cy={PT.br[1]} r={8 + ping * 30} fill="none" stroke={LIME} strokeWidth={3} opacity={1 - ping} />}
            <g transform={`translate(${PT.br[0] + 22} ${PT.br[1] + 6}) scale(${sp(f, 54, SPR.pop)})`}>
              <rect x={0} y={-16} width={86} height={30} rx={6} fill={LIME} /><text x={43} y={5} textAnchor="middle" fontFamily="M" fontWeight={800} fontSize={18} fill={INK}>BRASIL</text>
            </g>
            <g transform={`translate(${PT.us[0] - 40} ${PT.us[1] - 30}) scale(${sp(f, 14, SPR.pop)})`}>
              <rect x={0} y={-16} width={64} height={30} rx={6} fill={ICE} /><text x={32} y={5} textAnchor="middle" fontFamily="M" fontWeight={800} fontSize={18} fill={INK}>EUA</text>
            </g>
          </g>
        </svg>
      </div>
      {/* licença */}
      <div style={{position: 'absolute', left: L, top: 890, width: 550, background: PAPER, borderRadius: 6, padding: '24px 28px', boxShadow: '0 24px 50px rgba(0,0,0,0.45)',
        transform: `rotate(${-1.5}deg)`, ...rise(sp(f, 64, SPR.heavy), 60)}}>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 18, letterSpacing: 2, color: '#5F6B64'}}>LICENÇA DE EXPORTAÇÃO · EUA</div>
        <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 38, lineHeight: 1.1, color: INK, marginTop: 10}}>Chips de IA mais avançados</div>
        <div style={{position: 'absolute', right: -26, bottom: -26, transform: `rotate(-10deg) scale(${sp(f, 96, SPR.pop)})`, background: OR, color: '#fff', fontFamily: 'M', fontWeight: 800, fontSize: 26, letterSpacing: 2,
          padding: '10px 18px', borderRadius: 8, boxShadow: '0 10px 20px rgba(0,0,0,0.35)'}}>EXIGE LICENÇA</div>
      </div>
      {/* prazo */}
      <div style={{position: 'absolute', left: 650, top: 870, width: 270, height: 260, borderRadius: 24, background: LIME, color: INK, padding: 24, boxSizing: 'border-box', ...rise(sp(f, 128, SPR.heavy), 60)}}>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 18, letterSpacing: 2}}>QUEM JÁ OPERA</div>
        <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 120, letterSpacing: -6, lineHeight: 1}}>{days}</div>
        <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 32}}>dias</div>
      </div>
      <SourceChip f={f} c={CLIPS.n3} />
    </>
  );
};

const Poll: React.FC<{f: number}> = ({f}) => {
  const items: [string, string, number][] = [['1', 'OpenAI', 64], ['2', 'Google', 78], ['3', 'Brasil', 92]];
  return (
    <>
      <Title f={f} top={290} size={104} lines={[[{t: 'Qual delas'}], [{t: 'mais te '}, {t: 'afeta', a: true}, {t: '?'}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 600, display: 'flex', flexDirection: 'column', gap: 22}}>
        {items.map(([n, t, at], i) => {
          const s = sp(f, 14 + i * 6, SPR.card);
          const hit = tw(f, at, at + 8);
          return (
            <div key={n} style={{display: 'flex', alignItems: 'center', gap: 28, background: hit > 0.5 ? LIME : CARD, border: `2px solid ${hit > 0.5 ? LIME : LN}`, borderRadius: 22, padding: '22px 30px',
              transform: `translateX(${(1 - s) * -200}px) scale(${1 + 0.04 * Math.sin(hit * Math.PI)})`, opacity: Math.min(1, s * 1.5), color: hit > 0.5 ? INK : TX}}>
              <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 92, lineHeight: 1, width: 70}}>{n}</span>
              <div>
                <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 42}}>{t}</div>
                <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 1, opacity: 0.7}}>{CLIPS[`n${n}`].pre}{CLIPS[`n${n}`].hl}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, top: 1150, display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'I', fontWeight: 600, fontSize: 32, color: MU, ...rise(sp(f, 56), 20)}}>
        <svg width={40} height={40} viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z" fill="none" stroke={LIME} strokeWidth={2} strokeLinejoin="round" /></svg>
        Comente o número
      </div>
    </>
  );
};

const Share: React.FC<{f: number}> = ({f}) => {
  const plane = sp(f, 20, SPR.heavy);
  const fly = tw(f, 120, 150, 0, 1, Easing.in(Easing.cubic));
  return (
    <>
      <Title f={f} top={290} size={96} lines={[[{t: 'Manda para'}], [{t: 'quem ainda'}], [{t: 'não sabe', a: true}, {t: '.'}]]} />
      {/* conversa */}
      <div style={{position: 'absolute', left: L, right: 120, top: 690, background: CARD, border: `2px solid ${LN}`, borderRadius: 26, padding: 28, ...rise(sp(f, 10), 40)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 18, borderBottom: `2px solid ${LN}`}}>
          <div style={{width: 56, height: 56, borderRadius: 28, background: ICE, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'I', fontWeight: 800, fontSize: 26, color: INK}}>?</div>
          <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 30, color: TX}}>aquele amigo</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 24}}>
          <div style={{width: 520, background: PAPER, borderRadius: '22px 22px 6px 22px', padding: 16, transform: `scale(${sp(f, 40, SPR.pop)})`, transformOrigin: 'right bottom'}}>
            <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 14, letterSpacing: 1, color: '#5F6B64'}}>@XARPY_DEV · RADAR IA</div>
            <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 30, lineHeight: 1.12, color: INK, marginTop: 6}}>EUA apertam chips. <span style={{background: LIME, padding: '0 4px'}}>Brasil na lista.</span></div>
          </div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 10, fontFamily: 'M', fontSize: 18, color: MU, opacity: tw(f, 60, 70)}}>enviado ✓✓</div>
      </div>
      {/* botão enviar */}
      <div style={{position: 'absolute', left: L, top: 1150, display: 'flex', alignItems: 'center', gap: 22, ...rise(plane, 30)}}>
        <div style={{width: 104, height: 104, borderRadius: 52, background: LIME, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.06 * Math.sin(f / 5)})`}}>
          <svg width={54} height={54} viewBox="0 0 24 24" style={{transform: `translate(${fly * 60}px, ${-fly * 60}px)`, opacity: 1 - fly}}>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={INK} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 34, color: TX, lineHeight: 1.2}}>Toque em enviar<br /><span style={{color: MU, fontWeight: 600}}>e siga a @xarpy_dev</span></div>
      </div>
    </>
  );
};

const P1: React.FC<{f: number}> = ({f}) => <PrintPage f={f} k="n1" hlAt={112} kicker="LANÇAMENTO · OPENAI" />;
const P2: React.FC<{f: number}> = ({f}) => <PrintPage f={f} k="n2" hlAt={140} kicker="SEGURANÇA · GOOGLE" />;
const P3: React.FC<{f: number}> = ({f}) => <PrintPage f={f} k="n3" hlAt={128} kicker="REGULAÇÃO · EUA" />;
const PAGE_C: React.FC<{f: number}>[] = [Capa, P1, N1d, P2, N2d, P3, N3d, Poll, Share];

const Frame: React.FC = () => {
  const F = useF();
  const pos = posAt(F);
  return (
    <AbsoluteFill style={{background: BG, color: TX}}>
      <Bg F={F} pos={pos} />
      {PAGE_C.map((C, i) => {
        const x = (i - pos) * 1080;
        if (Math.abs(x) > 1100) return null;
        return <AbsoluteFill key={i} style={{transform: `translateX(${x}px)`}}><C f={Math.max(0, F - STARTS[i])} /></AbsoluteFill>;
      })}
      <Head F={F} pos={pos} />
      <Caption F={F} />
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 95% 78% at 50% 45%, transparent 62%, rgba(0,0,0,0.42) 100%)'}} />
      <Grain />
    </AbsoluteFill>
  );
};

export type R3Props = {safe?: boolean};
export const Radar3: React.FC<R3Props> = ({safe}) => (
  <AbsoluteFill style={{background: BG}}>
    <style>{fontCss}</style>
    <Frame />
    {safe && (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(255,0,80,0.28)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(255,0,80,0.28)'}} />
        <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(255,0,80,0.28)'}} />
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);
