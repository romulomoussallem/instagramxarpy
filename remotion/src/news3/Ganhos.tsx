import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, interpolateColors, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import PW from './ganhos-palavras.json';

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
  {id: 'capa', dur: 214}, {id: 'w1', dur: 242}, {id: 'w2', dur: 282}, {id: 'w3', dur: 266}, {id: 'w4', dur: 358}, {id: 'w5', dur: 326}, {id: 'cta', dur: 256},
];
const TR = 16;
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
const posAt = (F: number) => PAGES.slice(1).reduce((p, _x, i) => p + sp(F, STARTS[i + 1] - TR, SPR.page), 0);
const NEWS_OF = [0, 1, 2, 3, 4, 5, 0];

/* ---------- legenda ---------- */
type PWd = [number, number, string];
const KEYS = new Set(['R$ 20 mil', 'conta', 'WhatsApp', 'Landing', 'Automação', 'Treinamento', 'micro-SaaS', 'R$ 485', 'R$ 1,3 milhão', '1 a 5', 'manda', 'texto']);
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
        <svg width={34} height={34} viewBox="0 0 34 34"><circle cx={17} cy={17} r={15} fill="none" stroke={INK} strokeWidth={2} /><text x={17} y={23} textAnchor="middle" fontFamily="M" fontWeight={800} fontSize={17} fill={INK}>R$</text></svg><span style={{color: TX}}>IA QUE PAGA</span><span>·</span><span>5 CAMINHOS</span>
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
type Way = {n: string; title: Seg[][]; tools: string[]; who: string[]; qty: number; unit: string; price: number; ref: string; refSrc: string; at: {who: number; calc: number; ref: number}};
const WAYS: Way[] = [
  {n: '01', title: [[{t: 'Atendente de IA'}], [{t: 'no '}, {t: 'WhatsApp', a: true}]], tools: ['ChatGPT', 'n8n'], who: ['clínicas', 'imobiliárias', 'oficinas'],
    qty: 10, unit: 'clientes', price: 2000, ref: 'Plataformas de atendimento com IA cobram de R$ 600 a R$ 3.900 por mês só pelo software.', refSrc: 'ZENVIA · TABELA DE PLANOS', at: {who: 80, calc: 136, ref: 200}},
  {n: '02', title: [[{t: 'Landing pages'}], [{t: 'com '}, {t: 'Claude Code', a: true}]], tools: ['Claude Code'], who: ['lançamentos', 'clínicas', 'advogados'],
    qty: 5, unit: 'páginas', price: 4000, ref: 'Landing page com formulário e integração: de R$ 2 mil a R$ 5 mil por projeto.', refSrc: 'FREELA SEM CRISE · TABELA 2026', at: {who: 50, calc: 184, ref: 88}},
  {n: '03', title: [[{t: 'Automação para'}], [{t: 'pequenas '}, {t: 'empresas', a: true}]], tools: ['ChatGPT', 'Claude Code'], who: ['planilhas', 'e-mail', 'atendimento'],
    qty: 4, unit: 'projetos', price: 5000, ref: 'Entregas de automação com IA saem de US$ 2.500 a US$ 15.000 lá fora.', refSrc: 'MEJBA.ME · PREÇOS 2026', at: {who: 92, calc: 197, ref: 150}},
  {n: '04', title: [[{t: 'Treinamento de'}], [{t: 'IA para '}, {t: 'equipes', a: true}]], tools: ['ChatGPT'], who: ['vendas', 'atendimento', 'gestão'],
    qty: 40, unit: 'alunos', price: 500, ref: 'Curso de vendas com ChatGPT da ADVB-PR: R$ 485 por pessoa.', refSrc: 'ADVB-PR · BEM PARANÁ', at: {who: 50, calc: 251, ref: 89}},
  {n: '05', title: [[{t: 'Micro-SaaS'}], [{t: 'com '}, {t: 'Claude Code', a: true}]], tools: ['Claude Code'], who: ['nicho pequeno', 'assinatura', 'recorrente'],
    qty: 400, unit: 'assinantes', price: 50, ref: 'Brasileiro com 8 micro-SaaS chegou a R$ 1,3 milhão por ano.', refSrc: 'NEWSLETTER MICRO-SAAS · ESTUDO DE CASO', at: {who: 60, calc: 99, ref: 182}},
];
const brl = (v: number) => 'R$ ' + Math.round(v).toLocaleString('pt-BR');

const Tool: React.FC<{t: string; s: number}> = ({t, s}) => (
  <div style={{display: 'inline-flex', alignItems: 'center', gap: 10, background: PAPER, color: INK, border: `2px solid ${INK}`, borderRadius: 30, padding: '6px 16px 6px 8px', fontFamily: 'I', fontWeight: 800, fontSize: 26,
    transform: `scale(${s})`, boxShadow: `3px 3px 0 ${INK}`}}>
    <span style={{width: 30, height: 30, borderRadius: 15, background: t === 'Claude Code' ? OR : t === 'ChatGPT' ? INK : LIME, color: t === 'n8n' ? INK : '#fff', fontFamily: 'M', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {t === 'Claude Code' ? '>_' : t === 'ChatGPT' ? 'AI' : 'n8'}
    </span>{t}
  </div>
);

const Capa: React.FC<{f: number}> = ({f}) => {
  const v = tw(f, 10, 70, 0, 20000, Easing.out(Easing.cubic));
  const names = ['Atendente de IA no WhatsApp', 'Landing pages com Claude Code', 'Automação para pequenas empresas', 'Treinamento de IA para equipes', 'Micro-SaaS com Claude Code'];
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 290, fontFamily: 'M', fontWeight: 800, fontSize: 160, letterSpacing: -10, lineHeight: 1.05, color: INK, background: LIME, padding: '0 18px', display: 'inline-block', ...rise(sp(f, 4, SPR.heavy), 60)}}>
        {brl(v).replace(',00', '')}
      </div>
      <Title f={f} top={480} size={74} d={8} lines={[[{t: 'por mês com'}], [{t: 'Claude Code'}], [{t: 'e ChatGPT.'}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 790, display: 'flex', flexDirection: 'column', gap: 12}}>
        {names.map((t, i) => {
          const s = sp(f, 40 + i * 7, SPR.card);
          return (
            <div key={t} style={{display: 'flex', alignItems: 'center', gap: 20, background: CARD, border: `2px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, borderRadius: 10, padding: '14px 22px',
              transform: `translateX(${(1 - s) * -220}px) rotate(${(i % 2 ? 0.6 : -0.6) * s}deg)`, opacity: Math.min(1, s * 1.5)}}>
              <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 26, color: INK, background: LIME, padding: '2px 8px', borderRadius: 4}}>0{i + 1}</span>
              <span style={{fontFamily: 'I', fontWeight: 700, fontSize: 32, color: TX}}>{t}</span>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: 500, top: 690}}><Sticker t="CONTA DE MERCADO" c={OR} r={-6} s={sp(f, 162, SPR.pop) * 1.15} /></div>
    </>
  );
};

const WayPage: React.FC<{f: number; w: Way}> = ({f, w}) => {
  const total = w.qty * w.price;
  const c = w.at.calc;
  const qn = Math.round(tw(f, c, c + 24, 0, w.qty, Easing.out(Easing.cubic)));
  const val = tw(f, c + 28, c + 60, 0, total, Easing.out(Easing.cubic));
  const fill = tw(f, c + 28, c + 60, 0, total / 20000, Easing.out(Easing.cubic));
  return (
    <>
      <div style={{position: 'absolute', left: 48, top: 286, fontFamily: 'M', fontWeight: 800, fontSize: 220, lineHeight: 1, letterSpacing: -10, color: INK, ...rise(sp(f, 0, SPR.heavy), 50)}}>{w.n}</div>
      <div style={{position: 'absolute', left: 360, top: 330, display: 'flex', flexWrap: 'wrap', gap: 12, width: 560}}>
        {w.tools.map((t, i) => <Tool key={t} t={t} s={sp(f, 14 + i * 6, SPR.pop)} />)}
      </div>
      <Title f={f} top={520} size={80} d={2} lines={w.title} />
      <div style={{position: 'absolute', left: L, top: 720, display: 'flex', gap: 12, alignItems: 'center'}}>
        <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, color: MU, opacity: tw(f, w.at.who - 6, w.at.who)}}>PARA</span>
        {w.who.map((t, i) => {
          const s = sp(f, w.at.who + i * 5, SPR.pop);
          return <span key={t} style={{fontFamily: 'I', fontWeight: 700, fontSize: 26, color: TX, border: `2px solid ${INK}`, borderRadius: 30, padding: '6px 16px', background: '#fff', transform: `scale(${s})`, display: 'inline-block'}}>{t}</span>;
        })}
      </div>
      {/* calculadora */}
      <div style={{position: 'absolute', left: L, right: 150, top: 800, background: DK, borderRadius: 18, padding: '24px 28px', boxShadow: `6px 6px 0 ${LIME}`, ...rise(sp(f, c - 10, SPR.card), 50)}}>
        <div style={{display: 'flex', alignItems: 'baseline', gap: 16, fontFamily: 'M', fontWeight: 800, color: '#F7F9F7'}}>
          <span style={{fontSize: 64, letterSpacing: -3}}>{qn}</span><span style={{fontSize: 24, color: '#A7C2B2', fontWeight: 700}}>{w.unit}</span>
          <span style={{fontSize: 44, color: '#A7C2B2', margin: '0 6px'}}>×</span>
          <span style={{fontSize: 64, letterSpacing: -3, opacity: tw(f, c + 10, c + 18)}}>{brl(w.price)}</span>
        </div>
        <div style={{height: 2, background: '#215C40', margin: '14px 0'}} />
        <div style={{display: 'flex', alignItems: 'center', gap: 18}}>
          <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 92, letterSpacing: -5, color: LIME, lineHeight: 1}}>{brl(val)}</span>
          <span style={{fontFamily: 'I', fontWeight: 700, fontSize: 28, color: '#A7C2B2'}}>por mês</span>
        </div>
        <div style={{position: 'relative', height: 16, borderRadius: 8, background: '#215C40', marginTop: 18, overflow: 'hidden'}}>
          <div style={{width: `${fill * 100}%`, height: '100%', background: LIME, borderRadius: 8}} />
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'M', fontSize: 16, color: '#A7C2B2', marginTop: 6}}><span>R$ 0</span><span>META R$ 20 MIL</span></div>
      </div>
      {/* referência de mercado */}
      <div style={{position: 'absolute', left: L, top: 1196, width: 760, background: PAPER, border: `2px solid ${INK}`, borderRadius: 6, padding: '14px 20px', transform: `rotate(${-1.2}deg)`, boxShadow: `4px 4px 0 ${INK}`, ...rise(sp(f, w.at.ref, SPR.heavy), 40)}}>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 15, letterSpacing: 2, color: MU}}>REFERÊNCIA · {w.refSrc}</div>
        <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 26, lineHeight: 1.15, color: INK, marginTop: 4}}>{w.ref}</div>
      </div>
      <Tape x={L + 680} y={1182} r={12} o={tw(f, w.at.ref + 8, w.at.ref + 12)} />
    </>
  );
};

const Cta: React.FC<{f: number}> = ({f}) => {
  const plane = sp(f, 88, SPR.heavy);
  return (
    <>
      <Title f={f} top={290} size={92} lines={[[{t: 'Qual você'}], [{t: 'começa '}, {t: 'amanhã', a: true}, {t: '?'}]]} />
      <div style={{position: 'absolute', left: L, right: 150, top: 530, display: 'flex', flexDirection: 'column', gap: 12}}>
        {WAYS.map((w, i) => {
          const s = sp(f, 12 + i * 6, SPR.card);
          const hit = tw(f, 56 + i * 6, 62 + i * 6);
          return (
            <div key={w.n} style={{display: 'flex', alignItems: 'center', gap: 22, background: hit > 0.5 ? LIME : CARD, border: `2px solid ${INK}`, boxShadow: `4px 4px 0 ${INK}`, borderRadius: 10, padding: '12px 22px',
              color: INK, transform: `translateX(${(1 - s) * -200}px)`, opacity: Math.min(1, s * 1.5)}}>
              <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 52, lineHeight: 1, width: 40}}>{i + 1}</span>
              <span style={{fontFamily: 'I', fontWeight: 800, fontSize: 30}}>{w.title.map((l) => l.map((x) => x.t).join('')).join(' ')}</span>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, top: 1150, display: 'flex', alignItems: 'center', gap: 22, ...rise(plane, 30)}}>
        <div style={{width: 96, height: 96, borderRadius: 48, background: LIME, border: `3px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${1 + 0.06 * Math.sin(f / 5)})`}}>
          <svg width={50} height={50} viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={INK} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" /></svg>
        </div>
        <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 32, color: TX, lineHeight: 1.2}}>Manda para quem acha<br /><span style={{color: MU, fontWeight: 600}}>que IA só escreve texto</span></div>
      </div>
    </>
  );
};

const PAGE_C: React.FC<{f: number}>[] = [Capa, ...WAYS.map((w) => {
  const P: React.FC<{f: number}> = ({f}) => <WayPage f={f} w={w} />;
  return P;
}), Cta];

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

export type GProps = {safe?: boolean};
export const Ganhos: React.FC<GProps> = ({safe}) => (
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
