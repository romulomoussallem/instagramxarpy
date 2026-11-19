import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import PW from './r2-palavras.json';

/* Radar IA v3 · identidade XARPY (paleta principal) · 1080x1920 · 60 fps, tempos em quadros de 30 fps */
const BG = '#F7F9F7', BG2 = '#EEF3EF', LIME = '#92FF5F', OR = '#FF7036', PAPER = '#FFFFFF', INK = '#0F3B27', TX = '#0F3B27', MU = '#5B6560',
  CARD = '#FFFFFF', LN = '#CFE0D2', ICE = '#BFF2F0', DK = '#0F3B27';
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
  {id: 'capa', dur: 287}, {id: 'tools', dur: 117}, {id: 'mkt', dur: 102}, {id: 'semana', dur: 148}, {id: 'perguntas', dur: 390}, {id: 'auto', dur: 139}, {id: 'cta', dur: 179},
];
const TR = 16;
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
const posAt = (F: number) => PAGES.slice(1).reduce((p, _x, i) => p + sp(F, STARTS[i + 1] - TR, SPR.page), 0);
const NEWS_OF = [0, 0, 0, 0, 0, 0, 0];

/* ---------- legenda ---------- */
type PWd = [number, number, string];
const KEYS = new Set(['aplicar', 'quarto', 'começar', 'marketing', 'repetitiva', '3 perguntas', 'perguntas', 'jeito', 'conferir', 'automação', 'Manda']);
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
          <span key={i} style={{display: 'inline-block', marginRight: '0.25em', color: on ? INK : '#A3B1A8', padding: k ? '0 8px' : 0, borderRadius: 6,
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
      <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(15,59,39,0.10) 1.6px, transparent 1.6px)', backgroundSize: '36px 36px', backgroundPosition: `${-pos * 60}px ${F * 0.15}px`,
        maskImage: 'linear-gradient(180deg, transparent 0%, #000 22%, #000 72%, transparent 100%)'}} />
      {glows.map((c, i) => (
        <AbsoluteFill key={i} style={{opacity: Math.max(0, 1 - Math.abs(pos - i)), background: `radial-gradient(ellipse 950px 720px at 88% 96%, rgba(146,255,95,0.16), transparent 70%)`}} />
      ))}
    </>
  );
};
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.05, mixBlendMode: 'multiply', pointerEvents: 'none'}}>
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
        <span style={{color: TX}}>XARPY</span><span>·</span><span>DADOS REAIS</span>
        <span style={{marginLeft: 10, opacity: n ? 1 : 0, color: TX}}>{n ? `· 0${n}/05` : ''}</span>
      </div>
      <Img src={staticFile('icone.png')} style={{position: 'absolute', right: L, top: 200, width: 72, transform: `scale(${sp(F, 4, SPR.pop)})`}} />
      <div style={{position: 'absolute', left: L, right: 150, top: 1484, height: 5, borderRadius: 3, background: LN}}>
        <div style={{width: `${(F / TOTAL30) * 100}%`, height: '100%', borderRadius: 3, background: INK}} />
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
            {ln.map((sg, j) => <span key={j} style={sg.a ? {background: LIME, color: INK, padding: '0 0.12em', margin: '0 0.04em'} : {color: TX}}>{sg.t}</span>)}
          </div>
        </div>
      );
    })}
  </div>
);

const Sticker: React.FC<{t: string; c?: string; r?: number; s?: number; style?: React.CSSProperties}> = ({t, c = OR, r = -4, s = 1, style}) => (
  <div style={{display: 'inline-block', background: c, color: c === OR ? '#fff' : INK, fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 2, padding: '8px 16px', borderRadius: 6,
    transform: `rotate(${r}deg) scale(${s})`, boxShadow: `3px 3px 0 ${INK}`, whiteSpace: 'nowrap', ...style}}>{t}</div>
);

const Tape: React.FC<{x: number; y: number; r: number; o?: number}> = ({x, y, r, o = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 150, height: 44, background: 'rgba(146,255,95,0.55)', transform: `rotate(${r}deg)`, opacity: o, boxShadow: '0 2px 6px rgba(0,0,0,0.25)'}} />
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
const SrcTag: React.FC<{f: number; d: number; t: string; top?: number}> = ({f, d, t, top = 1236}) => (
  <div style={{position: 'absolute', left: L, top, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'M', fontWeight: 700, fontSize: 19, letterSpacing: 2, color: MU, ...rise(sp(f, d), 20)}}>
    <span style={{width: 10, height: 10, borderRadius: 5, background: LIME}} />FONTE · {t}
  </div>
);

// 1 · capa: a frase do dono, o dado e 1 em cada 4
const Capa: React.FC<{f: number}> = ({f}) => {
  const people = sp(f, 200, SPR.card);
  const hi = tw(f, 219, 232);
  const pct = Math.round(tw(f, 60, 110, 0, 23, Easing.out(Easing.cubic)));
  return (
    <>
      {/* gancho visível desde o primeiro quadro */}
      <div style={{position: 'absolute', left: L, top: 290, width: 860, background: PAPER, color: INK, borderRadius: '28px 28px 28px 6px', padding: '30px 36px',
        border: `3px solid ${INK}`, boxShadow: `8px 8px 0 ${INK}`, transform: `rotate(${-1.5 + Math.sin(f / 40) * 0.3}deg)`}}>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, color: MU}}>RESPOSTA MAIS CITADA PELOS MEIs</div>
        <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 76, lineHeight: 1.04, letterSpacing: -2, marginTop: 8}}>
          “Não sei como <span style={{background: LIME, padding: '0 8px'}}>aplicar</span> no meu negócio.”
        </div>
      </div>
      <div style={{position: 'absolute', left: L, top: 690, display: 'flex', alignItems: 'flex-end', gap: 24, ...rise(sp(f, 50, SPR.heavy), 40)}}>
        <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 190, lineHeight: 1, letterSpacing: -10, color: INK, background: LIME, padding: '0 16px'}}>{pct}%</span>
        <span style={{fontFamily: 'I', fontWeight: 700, fontSize: 34, lineHeight: 1.2, color: TX, paddingBottom: 14, width: 420}}>a dificuldade mais citada pelos MEIs com IA</span>
      </div>
      <div style={{position: 'absolute', left: L, top: 950, display: 'flex', gap: 22, alignItems: 'center', opacity: Math.min(1, people * 1.5)}}>
        {[0, 1, 2, 3].map((i) => {
          const s = sp(f, 200 + i * 5, SPR.pop);
          const on = i === 0;
          const c = on ? interpolateColors(hi, [0, 1], ['#9FB1A6', OR]) : '#C9D6CC';
          return (
            <svg key={i} width={110} height={150} viewBox="0 0 24 33" style={{transform: `scale(${s})`}}>
              <circle cx={12} cy={7} r={6} fill={c} /><path d="M1 32c0-8 5-14 11-14s11 6 11 14z" fill={c} />
            </svg>
          );
        })}
        <span style={{fontFamily: 'I', fontWeight: 800, fontSize: 44, color: TX, marginLeft: 10, ...rise(sp(f, 222), 20)}}>quase <span style={{color: OR}}>1 em 4</span></span>
      </div>
      <SrcTag f={f} d={70} t="SEBRAE · FGV IBRE · DEZ/2025" top={1150} />
    </>
  );
};

// 2 · ferramenta sobra, falta o começo
const TOOLS = ['ChatGPT', 'Claude', 'Gemini', 'Copilot', 'Meta AI', 'Perplexity', 'Canva IA', 'n8n', 'Zapier', 'Notion IA', 'Manus', 'Grok'];
const Tools: React.FC<{f: number}> = ({f}) => {
  const pin = sp(f, 44, SPR.pop);
  return (
    <>
      <Title f={f} top={290} size={92} lines={[[{t: 'Não falta'}], [{t: 'ferramenta.'}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 540, display: 'flex', flexWrap: 'wrap', gap: 14}}>
        {TOOLS.map((t, i) => {
          const s = sp(f, 2 + i * 2.5, SPR.pop);
          return <span key={t} style={{fontFamily: 'I', fontWeight: 700, fontSize: 32, color: TX, background: CARD, border: `2px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, borderRadius: 40, padding: '10px 24px',
            transform: `scale(${s}) rotate(${(i % 3 - 1) * 2}deg)`, opacity: 1 - 0.55 * tw(f, 40, 52), display: 'inline-block'}}>{t}</span>;
        })}
      </div>
      <div style={{position: 'absolute', left: L, top: 900, display: 'flex', alignItems: 'center', gap: 22, transform: `scale(${pin})`, transformOrigin: 'left center'}}>
        <svg width={90} height={110} viewBox="0 0 24 30"><path d="M12 29s10-10 10-17A10 10 0 0 0 2 12c0 7 10 17 10 17z" fill={OR} /><circle cx={12} cy={12} r={4} fill={PAPER} /></svg>
        <div>
          <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 3, color: OR}}>FALTA</div>
          <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 62, letterSpacing: -2, color: TX, lineHeight: 1}}>por onde <span style={{background: LIME, color: INK, padding: '0 10px'}}>começar</span></div>
        </div>
      </div>
    </>
  );
};

// 3 · marketing domina
const Mkt: React.FC<{f: number}> = ({f}) => {
  const v = tw(f, 20, 60, 0, 74, Easing.out(Easing.cubic));
  return (
    <>
      <Title f={f} top={290} size={84} lines={[[{t: 'A maioria usa'}], [{t: 'só para '}, {t: 'marketing', a: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 560, background: DK, borderRadius: 18, padding: '30px 32px', boxShadow: `6px 6px 0 ${LIME}`, ...rise(sp(f, 10), 40)}}>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, color: '#A7C2B2'}}>PRINCIPAL USO DA IA ENTRE MEIs</div>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16, marginTop: 12}}>
          <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 150, letterSpacing: -8, lineHeight: 1, color: LIME}}>{Math.round(v)}%</span>
          <span style={{fontFamily: 'I', fontWeight: 700, fontSize: 34, color: '#F7F9F7'}}>marketing e divulgação</span>
        </div>
        <div style={{height: 26, borderRadius: 13, background: '#215C40', marginTop: 20, overflow: 'hidden'}}>
          <div style={{width: `${v}%`, height: '100%', background: LIME, borderRadius: 13}} />
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: 16, marginTop: 22, opacity: tw(f, 40, 50)}}>
          <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, color: '#A7C2B2', width: 200}}>MICRO E PEQUENAS</span>
          <div style={{flex: 1, height: 18, borderRadius: 9, background: '#215C40', overflow: 'hidden'}}><div style={{width: `${tw(f, 44, 76, 0, 59, Easing.out(Easing.cubic))}%`, height: '100%', background: '#CFF1D2'}} /></div>
          <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 30, color: '#F7F9F7'}}>59%</span>
        </div>
        <div style={{display: 'flex', gap: 14, marginTop: 24, opacity: tw(f, 60, 72)}}>
          {['atendimento', 'financeiro', 'operação'].map((t) => (
            <span key={t} style={{fontFamily: 'I', fontWeight: 600, fontSize: 26, color: '#A7C2B2', border: `2px dashed #3C7A5A`, borderRadius: 30, padding: '6px 18px'}}>{t}?</span>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: L, top: 1020, fontFamily: 'I', fontWeight: 700, fontSize: 34, color: TX, ...rise(sp(f, 74), 20)}}>E a operação continua <span style={{background: OR, color: '#fff', padding: '0 8px'}}>igual</span>.</div>
      <SrcTag f={f} d={30} t="SEBRAE · FGV IBRE · DEZ/2025" top={1100} />
    </>
  );
};

// 4 · a semana repetida
const DAYS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX'];
const Semana: React.FC<{f: number}> = ({f}) => {
  const rep = tw(f, 60, 80);
  return (
    <>
      <Title f={f} top={290} size={80} lines={[[{t: 'O ganho está na'}], [{t: 'tarefa '}, {t: 'repetitiva', a: true}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 540, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12}}>
        {DAYS.map((d, i) => (
          <div key={d} style={{...rise(sp(f, 4 + i * 3), 40)}}>
            <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 22, color: MU, textAlign: 'center', marginBottom: 10}}>{d}</div>
            {[0, 1, 2, 3].map((r) => {
              const isRep = r === 1;
              const on = isRep ? rep : 0;
              return (
                <div key={r} style={{height: r === 1 ? 92 : 64, marginBottom: 10, borderRadius: 12, background: isRep ? interpolateColors(on, [0, 1], [CARD, OR]) : CARD,
                  border: `2px solid ${isRep ? interpolateColors(on, [0, 1], [INK, OR]) : LN}`, boxShadow: isRep ? `3px 3px 0 ${INK}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'I', fontWeight: 800, fontSize: 18, color: '#fff', opacity: isRep ? 1 : 0.6, transform: `scale(${isRep ? 1 + 0.05 * Math.sin(on * Math.PI) : 1})`}}>
                  {isRep && on > 0.5 ? 'mesma tarefa' : ''}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: L, top: 1010, fontFamily: 'I', fontWeight: 700, fontSize: 36, color: TX, ...rise(sp(f, 96), 24)}}>
        É ela que toma a sua <span style={{background: LIME, padding: '0 8px'}}>semana</span>.
      </div>
    </>
  );
};

// 5 · as três perguntas (checklist que acende com a fala)
const QS: [string, number, number][] = [['Eu faço isso toda semana?', 91, 167], ['Eu faço sempre do mesmo jeito?', 184, 270], ['O resultado é fácil de conferir?', 287, 372]];
const Perguntas: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} top={290} size={92} lines={[[{t: 'Faça '}, {t: '3 perguntas', a: true}]]} />
    <div style={{position: 'absolute', left: L, top: 410, fontFamily: 'I', fontWeight: 600, fontSize: 32, color: MU, ...rise(sp(f, 20), 16)}}>para achar a sua primeira automação</div>
    <div style={{position: 'absolute', left: L, right: 150, top: 500, display: 'flex', flexDirection: 'column', gap: 20}}>
      {QS.map(([q, at, ok], i) => {
        const s = sp(f, at - 6, SPR.card);
        const chk = sp(f, ok, SPR.pop);
        const act = f >= at && f < ok + 20;
        return (
          <div key={q} style={{display: 'flex', alignItems: 'center', gap: 24, background: chk > 0.5 ? '#EFFFE6' : CARD, border: `2px solid ${act || chk > 0.5 ? INK : LN}`, boxShadow: act || chk > 0.5 ? `4px 4px 0 ${INK}` : 'none', borderRadius: 14,
            padding: '26px 28px', opacity: 0.25 + 0.75 * Math.min(1, s * 1.5), transform: `translateX(${(1 - s) * -40}px)`}}>
            <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 30, color: chk > 0.5 ? INK : MU, background: chk > 0.5 ? LIME : 'transparent', border: `2px solid ${chk > 0.5 ? INK : LN}`,
              width: 64, height: 64, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              {chk > 0.5 ? <svg width={36} height={36} viewBox="0 0 24 24" style={{transform: `scale(${chk})`}}><path d="M4 12.5l5 5L20 6.5" fill="none" stroke={INK} strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" /></svg> : i + 1}
            </span>
            <span style={{fontFamily: 'I', fontWeight: 800, fontSize: 40, lineHeight: 1.15, color: TX}}>{q}</span>
            <span style={{marginLeft: 'auto', fontFamily: 'M', fontWeight: 800, fontSize: 24, color: INK, background: LIME, padding: '4px 10px', borderRadius: 6, opacity: chk}}>SIM</span>
          </div>
        );
      })}
    </div>
  </>
);

// 6 · três sim = primeira automação
const Auto: React.FC<{f: number}> = ({f}) => {
  const stamp = sp(f, 62, SPR.pop);
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 290, display: 'flex', gap: 16}}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{fontFamily: 'M', fontWeight: 800, fontSize: 34, color: INK, background: LIME, border: `2px solid ${INK}`, boxShadow: `3px 3px 0 ${INK}`, borderRadius: 10, padding: '10px 20px', transform: `scale(${sp(f, 6 + i * 6, SPR.pop)})`, display: 'inline-block'}}>SIM</span>
        ))}
      </div>
      <Title f={f} top={400} size={88} d={20} lines={[[{t: 'Essa é a sua'}], [{t: 'primeira', a: true}], [{t: 'automação.', a: true}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 760, display: 'flex', flexDirection: 'column', gap: 12}}>
        {['responder orçamento no WhatsApp', 'emitir a nota do mês', 'lembrar o cliente do pagamento'].map((t, i) => (
          <div key={t} style={{display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'I', fontWeight: 700, fontSize: 32, color: TX, background: CARD, border: `2px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, borderRadius: 10, padding: '14px 20px', ...rise(sp(f, 74 + i * 8), 24)}}>
            <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 20, color: INK, background: LIME, padding: '2px 8px', borderRadius: 4}}>EX.</span>{t}
          </div>
        ))}
      </div>
      <div style={{position: 'absolute', left: 560, top: 300, transform: `rotate(-8deg) scale(${stamp})`, opacity: Math.min(1, stamp * 2), background: OR, color: '#fff', borderRadius: 8, boxShadow: `3px 3px 0 ${INK}`,
        padding: '10px 18px', fontFamily: 'M', fontWeight: 800, fontSize: 28, letterSpacing: 2}}>COMECE POR ELA</div>
    </>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  const fly = tw(f, 120, 150, 0, 1, Easing.in(Easing.cubic));
  return (
    <>
      <Title f={f} top={290} size={88} lines={[[{t: 'Manda para'}], [{t: 'quem não sabe'}], [{t: 'por onde', a: true}, {t: ' '}, {t: 'começar', a: true}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 690, background: CARD, border: `2px solid ${INK}`, boxShadow: `6px 6px 0 ${INK}`, borderRadius: 18, padding: 26, ...rise(sp(f, 10), 40)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: `2px solid ${LN}`}}>
          <div style={{width: 54, height: 54, borderRadius: 27, background: '#CFF1D2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'I', fontWeight: 800, fontSize: 24, color: INK}}>?</div>
          <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 30, color: TX}}>amigo com negócio</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-start', marginTop: 20}}>
          <div style={{background: '#EEF3EF', color: TX, borderRadius: '22px 22px 22px 6px', padding: '14px 20px', fontFamily: 'I', fontWeight: 600, fontSize: 28, ...rise(sp(f, 24), 16)}}>não sei por onde começar com IA 😩</div>
        </div>
        <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 14}}>
          <div style={{background: LIME, color: INK, borderRadius: '22px 22px 6px 22px', padding: '14px 20px', fontFamily: 'I', fontWeight: 800, fontSize: 28, transform: `scale(${sp(f, 56, SPR.pop)})`, transformOrigin: 'right bottom'}}>faz essas 3 perguntas 👇</div>
        </div>
      </div>
      <div style={{position: 'absolute', left: L, top: 1150, display: 'flex', alignItems: 'center', gap: 22, ...rise(sp(f, 80), 30)}}>
        <div style={{width: 100, height: 100, borderRadius: 50, background: LIME, border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.06 * Math.sin(f / 5)})`}}>
          <svg width={52} height={52} viewBox="0 0 24 24" style={{transform: `translate(${fly * 60}px, ${-fly * 60}px)`, opacity: 1 - fly}}><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={INK} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" /></svg>
        </div>
        <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 34, color: TX, lineHeight: 1.2}}>Toque em enviar<br /><span style={{color: MU, fontWeight: 600}}>e siga a @xarpy_dev</span></div>
      </div>
    </>
  );
};

const PAGE_C: React.FC<{f: number}>[] = [Capa, Tools, Mkt, Semana, Perguntas, Auto, Cta];

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
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 95% 78% at 50% 45%, transparent 70%, rgba(15,59,39,0.06) 100%)'}} />
      <Grain />
    </AbsoluteFill>
  );
};

export type R2Props = {safe?: boolean};
export const Reel2: React.FC<R2Props> = ({safe}) => (
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
