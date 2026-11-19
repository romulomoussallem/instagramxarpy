import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import WORLD from './world.json';

/* Radar IA v2: cada notícia é explicada por um componente que funciona na tela.
   Paleta Inovação: Black Pearl, Turquoise Sea, Flush Orange. */
const BG = '#04141E', TQ = '#64DBE8', OR = '#FF6D04', TX = '#F2F7F8', MU = '#8FA6AE', LN = '#14323F', CARD = '#071F2B', CARD2 = '#0A2734', RED = '#FF4D3D';
const L = 80, RR = 150;
const fontCss = `
@font-face{font-family:'I';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'M';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
*{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}`;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SPR = {page: {damping: 22, stiffness: 120, mass: 1}, card: {damping: 15, stiffness: 140, mass: 0.8}, pop: {damping: 10, stiffness: 200, mass: 0.6},
  word: {damping: 16, stiffness: 240, mass: 0.5}, heavy: {damping: 18, stiffness: 90, mass: 1.2}, stamp: {damping: 9, stiffness: 260, mass: 0.7}};
const sp = (f: number, d: number, c = SPR.card) => spring({frame: f - d, fps: 30, config: c});
const tw = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.16, 1, 0.3, 1)) => interpolate(f, [a, b], [from, to], {...clamp, easing: e});
const rise = (s: number, y = 30): React.CSSProperties => ({opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * y}px)`});
const useF = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return (f * 30) / fps; };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const PAGES = [{id: 'capa', dur: 180}, {id: 'openai', dur: 342}, {id: 'google', dur: 327}, {id: 'brasil', dur: 357}, {id: 'cta', dur: 165}];
const TR = 16;
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
const posAt = (F: number) => PAGES.slice(1).reduce((p, _x, i) => p + sp(F, STARTS[i + 1] - TR, SPR.page), 0);

/* =================== Radar (componente-assinatura) =================== */
const BLIPS: {a: number; r: number; c: string; label: string; lock?: boolean}[] = [
  {a: 222, r: 0.62, c: TQ, label: 'OpenAI'}, {a: 318, r: 0.48, c: TQ, label: 'Google'}, {a: 105, r: 0.7, c: OR, label: 'Brasil', lock: true},
];
const Radar: React.FC<{F: number; size: number; detail: boolean; t: number}> = ({F, size, detail, t}) => {
  const r = size / 2;
  const sweep = (F * 4.2) % 360; // graus
  const id = `rd${Math.round(size)}`;
  return (
    <svg width={size} height={size} viewBox={`${-r} ${-r} ${size} ${size}`} style={{overflow: 'visible', display: 'block'}}>
      <defs>
        <radialGradient id={`${id}d`} cx="0" cy="0" r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0C2E3C" /><stop offset="0.85" stopColor="#071D27" /><stop offset="1" stopColor="#04141C" />
        </radialGradient>
        <linearGradient id={`${id}s`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={r * Math.cos(-0.9)} y2={r * Math.sin(-0.9)}>
          <stop offset="0" stopColor={TQ} stopOpacity="0.32" /><stop offset="1" stopColor={TQ} stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}w`} cx="0" cy="0" r={r} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={TQ} stopOpacity="0.05" /><stop offset="1" stopColor={TQ} stopOpacity="0.28" />
        </radialGradient>
      </defs>
      <circle r={r} fill={`url(#${id}d)`} />
      <circle r={r - 1.5} fill="none" stroke="#1C4352" strokeWidth={3} />
      {size > 200 && Array.from({length: 72}).map((_, i) => (
        <line key={i} x1={r - (i % 6 === 0 ? 22 : 10)} y1={0} x2={r - 4} y2={0} stroke={TQ} strokeOpacity={i % 6 === 0 ? 0.45 : 0.18} strokeWidth={i % 6 === 0 ? 3 : 2} transform={`rotate(${i * 5})`} />
      ))}
      {size > 200 && [0, 90, 180, 270].map((g) => (
        <text key={g} x={Math.cos((g * Math.PI) / 180) * (r - 44)} y={Math.sin((g * Math.PI) / 180) * (r - 44) + 7} textAnchor="middle" fontFamily="M" fontSize={18} fill={TQ} fillOpacity={0.5}>{(g + 90) % 360}°</text>
      ))}
      {[0.25, 0.5, 0.75].map((k) => <circle key={k} r={r * k} fill="none" stroke={TQ} strokeOpacity={0.14} strokeWidth={Math.max(1.5, size / 300)} />)}
      <line x1={-r} y1={0} x2={r} y2={0} stroke={TQ} strokeOpacity={0.08} strokeWidth={2} /><line x1={0} y1={-r} x2={0} y2={r} stroke={TQ} strokeOpacity={0.08} strokeWidth={2} />
      {/* rastro da varredura: fatia com degradê, borda frontal nítida */}
      <g transform={`rotate(${sweep})`}>
        <path d={`M0 0 L${r} 0 A${r} ${r} 0 0 0 ${r * Math.cos(-0.9)} ${r * Math.sin(-0.9)} Z`} fill={`url(#${id}w)`} opacity={0.9} />
        <line x1={0} y1={0} x2={r} y2={0} stroke={TQ} strokeWidth={Math.max(2, size / 160)} strokeLinecap="round" />
      </g>
      {/* pontos: acendem quando a varredura passa e apagam devagar */}
      {BLIPS.map((b, i) => {
        const since = ((sweep - b.a) % 360 + 360) % 360; // graus desde a última passagem
        const glow = Math.exp(-since / 70);
        const born = detail ? sp(t, 30 + i * 22, SPR.pop) : 1;
        const x = Math.cos((b.a * Math.PI) / 180) * r * b.r, y = Math.sin((b.a * Math.PI) / 180) * r * b.r;
        const ping = since / 120;
        return (
          <g key={i} transform={`translate(${x} ${y})`} opacity={born}>
            {ping < 1 && <circle r={(size / 40) * (1 + ping * 2.4)} fill="none" stroke={b.c} strokeWidth={Math.max(1.5, size / 220)} opacity={(1 - ping) * 0.8} />}
            <circle r={(size / 70) * (0.75 + 0.5 * glow)} fill={b.c} opacity={0.45 + 0.55 * glow} />
          </g>
        );
      })}
      <circle r={size / 52} fill={TQ} />
      <circle r={size / 30} fill="none" stroke={TQ} strokeOpacity={0.35} strokeWidth={2} />
    </svg>
  );
};
// rótulos ligados aos pontos (só na capa)
const BlipLabels: React.FC<{t: number; cx: number; cy: number; r: number}> = ({t, cx, cy, r}) => (
  <>
    {BLIPS.map((b, i) => {
      const s = sp(t, 40 + i * 22, SPR.pop);
      const x = cx + Math.cos((b.a * Math.PI) / 180) * r * b.r, y = cy + Math.sin((b.a * Math.PI) / 180) * r * b.r;
      const right = x < cx;
      const reveal = b.lock ? tw(t, 124, 144) : 1;
      return (
        <div key={i} style={{position: 'absolute', top: y - 26, ...(right ? {right: 1080 - x + 26} : {left: x + 26}), transform: `scale(${s})`,
          transformOrigin: right ? 'right center' : 'left center', opacity: Math.min(1, s * 2), display: 'flex', alignItems: 'center', gap: 10,
          background: CARD2, border: `2px solid ${b.c}`, borderRadius: 12, padding: '10px 18px', fontFamily: 'M', fontWeight: 800, fontSize: 30, color: TX, boxShadow: '0 12px 30px rgba(0,0,0,0.5)'}}>
          <span style={{color: b.c}}>0{i + 1}</span>
          {b.lock && reveal < 1 && <svg width={22} height={22} viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" fill={OR} /><path d="M8 11V8a4 4 0 018 0v3" stroke={OR} strokeWidth="2.6" fill="none" /></svg>}
          <span style={{filter: `blur(${(1 - reveal) * 8}px)`}}>{b.label}</span>
        </div>
      );
    })}
  </>
);

/* =================== Print da matéria (fonte visual) =================== */
// Cada notícia abre com o print da manchete. Sem a foto da matéria (direitos), só manchete e subtítulo, com crédito.
type PrintData = {src?: string; w: number; h: number; hl?: [number, number, number, number]; outlet: string; date: string; label: string};
const PRINTS: Record<string, PrintData> = {
  openai: {w: 1250, h: 300, outlet: 'OpenAI', date: '17 NOV', label: 'GPT-6.2 Astra e Sol'},
  google: {w: 1250, h: 300, outlet: 'Google Threat Intelligence', date: '16 NOV', label: 'Agentes de IA em ataques'},
  brasil: {w: 1250, h: 300, outlet: 'Reuters', date: '16 NOV', label: 'Regra de chips nos EUA'},
  clara: {src: 'print-clara.png', w: 1250, h: 300, hl: [884, 30, 140, 76], outlet: 'Exemplo enviado', date: '18 NOV', label: 'Claude passa o ChatGPT'},
};
const PRINT_DUR = 72; // quadros em que o print fica em destaque antes do componente
const PrintCard: React.FC<{d: PrintData; t: number; width: number}> = ({d, t, width}) => {
  const k = width / d.w;
  const hlP = tw(t, 26, 40, 0, 1, Easing.bezier(0.6, 0, 0.2, 1));
  return (
    <div style={{position: 'relative', width, height: d.h * k, background: '#fff', overflow: 'hidden', borderRadius: 4}}>
      {d.src ? <Img src={staticFile(d.src)} style={{width, height: d.h * k, display: 'block'}} /> : (
        // marcador de posição: o print real entra aqui
        <div style={{padding: 26 * k * 1.8, height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 12 * k * 1.8}}>
          {[0.92, 0.78, 0.4].map((w, i) => <div key={i} style={{height: 30 * k * 1.8, width: `${w * 100}%`, background: '#D9DEE0', borderRadius: 4}} />)}
          <div style={{marginTop: 'auto', fontFamily: 'M', fontWeight: 700, fontSize: 30 * k * 1.8, color: '#7A8A90', letterSpacing: 1}}>PRINT DA MATÉRIA · {d.outlet.toUpperCase()}</div>
        </div>
      )}
      {d.src && d.hl && (
        <div style={{position: 'absolute', left: d.hl[0] * k, top: d.hl[1] * k, width: d.hl[2] * k * hlP, height: d.hl[3] * k, background: 'rgba(100,219,232,0.45)', mixBlendMode: 'multiply'}} />
      )}
    </div>
  );
};
// fase A: o print chega inclinado, o marcador passa na frase-chave; fase B: o print encolhe e vira o selo da fonte
const PrintLayer: React.FC<{F: number; pos: number; demo?: boolean}> = ({F, pos, demo}) => {
  const idx = [1, 2, 3].find((i) => Math.abs(pos - i) < 0.6);
  if (!idx) return null;
  const key = demo && idx === 1 ? 'clara' : PAGES[idx].id;
  const d = PRINTS[key];
  const t = F - STARTS[idx];
  const xoff = (idx - pos) * 1080;
  const enter = sp(t, 0, SPR.heavy);
  const dock = sp(t, PRINT_DUR - 8, SPR.heavy);
  const W0 = 940, W1 = 250;
  const w = lerp(W0, W1, dock);
  const h = d.h * (w / d.w);
  const x = lerp(70, L, dock) + xoff, y = lerp(700, 1324, dock);
  const rot = lerp(-2.2, 0, dock);
  return (
    <>
      <div style={{position: 'absolute', left: 70 + xoff, top: 620, fontFamily: 'M', fontWeight: 800, fontSize: 24, letterSpacing: 3, color: OR, opacity: (1 - dock) * Math.min(1, enter * 2)}}>
        O QUE SAIU · <span style={{color: MU}}>{d.outlet.toUpperCase()} · {d.date}</span>
      </div>
      <div style={{position: 'absolute', left: 64 + xoff, top: 300, fontFamily: 'M', fontWeight: 800, fontSize: 260, lineHeight: 1, color: 'transparent', WebkitTextStroke: `2px ${TQ}55`, opacity: (1 - dock) * Math.min(1, enter * 2), transform: `translateY(${(1 - enter) * 40}px)`}}>0{idx}</div>
      <div style={{position: 'absolute', left: 70 + xoff, top: y + h + 40, width: 940, fontFamily: 'I', fontWeight: 600, fontSize: 38, lineHeight: 1.25, color: '#E8F3F5', opacity: (1 - dock) * tw(t, 30, 42)}}>
        {d.label}<span style={{color: MU}}> · o que isso muda pra você</span>
      </div>
      <div style={{position: 'absolute', left: x, top: y, transform: `translateY(${(1 - enter) * 120}px) rotate(${rot + (1 - enter) * -6}deg)`, opacity: Math.min(1, enter * 1.6),
        boxShadow: `0 ${lerp(40, 10, dock)}px ${lerp(80, 20, dock)}px rgba(0,0,0,0.55)`, transformOrigin: 'left top'}}>
        <PrintCard d={d} t={t} width={w} />
      </div>
      <div style={{position: 'absolute', left: L + W1 + 20 + xoff, top: 1324, fontFamily: 'M', fontSize: 20, color: MU, lineHeight: 1.35, opacity: tw(t, PRINT_DUR + 6, PRINT_DUR + 16)}}>
        {d.outlet}<br /><span style={{color: TQ}}>✓ confirmado em 2 fontes</span>
      </div>
    </>
  );
};

/* =================== peças fixas =================== */
const Head: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const s = sp(F, 0);
  const p = Math.max(0, Math.min(PAGES.length - 1, pos));
  const mini = tw(pos, 0.55, 1); // o radar pequeno aparece quando o grande já encolheu
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 206, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'M', fontWeight: 700, fontSize: 26, letterSpacing: 3, color: MU, ...rise(s, 14)}}>
        <div style={{width: 48, height: 48, opacity: mini, transform: `scale(${0.5 + 0.5 * mini})`}}><Radar F={F} size={48} detail={false} t={0} /></div>
        <span style={{transform: `translateX(${(1 - mini) * -62}px)`, display: 'inline-block'}}>RADAR IA · <b style={{color: TQ}}>18.11.2026</b></span>
      </div>
      <div style={{position: 'absolute', right: L, top: 216, fontFamily: 'M', fontSize: 26, color: MU, display: 'flex', ...rise(s, 14)}}>
        <span>0</span>
        <span style={{display: 'inline-block', height: 34, overflow: 'hidden', lineHeight: '34px'}}>
          <span style={{display: 'block', transform: `translateY(${-p * 34}px)`}}>{PAGES.map((_, i) => <div key={i}>{i + 1}</div>)}</span>
        </span>
        <span>/0{PAGES.length}</span>
      </div>
      <Img src={staticFile('icone.png')} style={{position: 'absolute', right: L, top: 272, width: 84, transform: `scale(${sp(F, 4, SPR.pop)})`}} />
      <div style={{position: 'absolute', left: L, right: L, top: 1484, height: 4, background: LN, borderRadius: 2}}>
        <div style={{width: `${((p + 1) / PAGES.length) * 100 * s}%`, height: '100%', background: TQ, borderRadius: 2}} />
      </div>
    </>
  );
};
type Seg = {t: string; a?: boolean};
// título curto, com a palavra-chave em cor
const Headline: React.FC<{f: number; lines: Seg[][]; size?: number; top?: number}> = ({f, lines, size = 80, top = 300}) => {
  let k = 0;
  return (
    <div style={{position: 'absolute', left: L, right: 190, top, fontFamily: 'M', fontWeight: 800, fontSize: size, lineHeight: 1.1, letterSpacing: -2.4, color: TX}}>
      {lines.map((ln, li) => (
        <div key={li} style={{whiteSpace: 'nowrap', overflow: 'hidden', paddingBottom: 4}}>
          {ln.map((sg, si) => (
            <span key={si} style={{color: sg.a ? TQ : TX}}>
              {sg.t.split('').map((ch) => {
                const s = sp(f, 2 + k++ * 0.55, SPR.word);
                return <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 105}%)`}}>{ch === ' ' ? ' ' : ch}</span>;
              })}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};
const Kicker: React.FC<{f: number; n: string; cat: string; date: string; top?: number}> = ({f, n, cat, date, top = 300}) => (
  <div style={{position: 'absolute', left: L, top, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'M', fontWeight: 700, fontSize: 22, letterSpacing: 2, ...rise(sp(f, 0), 12)}}>
    <span style={{color: BG, background: TQ, padding: '4px 10px', borderRadius: 6, fontWeight: 800}}>{n}</span>
    <svg width={26} height={26} viewBox="0 0 24 24">{cat === 'LANÇAMENTO' ? <path d="M12 2l2.6 6.6L21 9l-5 4.4L17.6 21 12 17.3 6.4 21 8 13.4 3 9l6.4-.4z" fill={OR} /> :
      cat === 'SEGURANÇA' ? <path d="M12 2l8 3v6c0 5-3.4 9.2-8 11-4.6-1.8-8-6-8-11V5z" fill={OR} /> : <path d="M6 2h9l5 5v15H6z M14 2v6h6" fill={OR} />}</svg>
    <span style={{color: OR}}>{cat}</span><span style={{color: MU}}>· {date}</span>
  </div>
);
const Win: React.FC<{title: string; right?: React.ReactNode; children: React.ReactNode; style?: React.CSSProperties}> = ({title, right, children, style}) => (
  <div style={{background: CARD, border: `2px solid ${LN}`, borderRadius: 22, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.5)', ...style}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 10, height: 52, padding: '0 22px', borderBottom: `2px solid ${LN}`}}>
      {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 13, height: 13, borderRadius: 7, background: c, opacity: 0.85}} />)}
      <div style={{fontFamily: 'M', fontSize: 21, color: MU, marginLeft: 12}}>{title}</div>
      <div style={{marginLeft: 'auto'}}>{right}</div>
    </div>
    {children}
  </div>
);
const Src: React.FC<{f: number; d: number; top: number; t: string}> = () => null; // a fonte agora é o selo do print
const Check: React.FC<{p: number; c?: string; s?: number}> = ({p, c = TQ, s = 30}) => (
  <svg width={s} height={s} viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill={p > 0 ? c : 'none'} stroke={c} strokeWidth="2" opacity={0.25 + 0.75 * Math.min(1, p * 2)} />
    <path d="M7 12.5l3.2 3.2L17 9" stroke={BG} strokeWidth="2.8" fill="none" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /></svg>
);
const Spin: React.FC<{f: number; c?: string}> = ({f, c = TQ}) => (
  <svg width={26} height={26} viewBox="0 0 24 24" style={{transform: `rotate(${f * 14}deg)`}}><circle cx="12" cy="12" r="9" fill="none" stroke={c} strokeOpacity="0.25" strokeWidth="3" />
    <path d="M12 3a9 9 0 019 9" stroke={c} strokeWidth="3" fill="none" strokeLinecap="round" /></svg>
);

/* =================== 1 · capa =================== */
const RCX = 540, RCY = 930, RSZ = 600;
const Capa: React.FC<{f: number}> = ({f}) => (
  <>
    <Headline f={f} size={86} top={300} lines={[[{t: '3 notícias'}], [{t: 'de IA de '}, {t: 'hoje', a: true}, {t: '.'}]]} />
    <div style={{position: 'absolute', left: 0, right: 0, top: 1260, textAlign: 'center', fontFamily: 'I', fontWeight: 650, fontSize: 40, color: OR, ...rise(sp(f, 96), 18)}}>
      A terceira envolve o Brasil.
    </div>
  </>
);
// o radar grande vive fora das páginas para poder encolher até o cabeçalho (elemento compartilhado)
const BigRadar: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  if (pos > 1) return null;
  const u = sp(F, STARTS[1] - TR - 4, SPR.heavy);
  const intro = sp(F, 6, SPR.heavy);
  const size = lerp(RSZ, 48, u) * (0.6 + 0.4 * intro);
  const cx = lerp(RCX, L + 24, u), cy = lerp(RCY, 206 + 24, u);
  return (
    <div style={{position: 'absolute', left: cx - size / 2, top: cy - size / 2, width: size, height: size, opacity: Math.min(1, intro * 1.5) * (1 - tw(u, 0.85, 1))}}>
      <Radar F={F} size={size} detail t={F} />
    </div>
  );
};

/* =================== 2 · OpenAI: dois modelos e a escala de risco =================== */
const LEVELS = ['BAIXO', 'MÉDIO', 'ALTO', 'CRÍTICO'];
const Meter: React.FC<{f: number; d: number; label: string; to: number; c: string}> = ({f, d, label, to, c}) => {
  const p = tw(f, d, d + 34, 0, to, Easing.bezier(0.3, 0, 0.1, 1));
  const lit = Math.floor(p + 0.001);
  return (
    <div style={{marginBottom: 26, ...rise(sp(f, d - 6), 18)}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'I', fontWeight: 600, fontSize: 28, color: TX, marginBottom: 12}}>
        <span>{label}</span><span style={{fontFamily: 'M', fontWeight: 800, color: c, opacity: tw(f, d + 30, d + 38)}}>{LEVELS[to]}</span>
      </div>
      <div style={{position: 'relative', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6}}>
        {LEVELS.map((lv, i) => (
          <div key={lv} style={{height: 22, borderRadius: 6, background: i <= lit ? (i >= 2 ? c : '#2B5A68') : LN, transition: 'none'}} />
        ))}
        <div style={{position: 'absolute', top: -8, left: `calc(${((p + 0.5) / 4) * 100}% - 3px)`, width: 6, height: 38, borderRadius: 3, background: TX, boxShadow: '0 0 0 3px rgba(4,20,30,0.9)'}} />
      </div>
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginTop: 8}}>
        {LEVELS.map((lv) => <span key={lv} style={{fontFamily: 'M', fontSize: 17, color: MU, letterSpacing: 1}}>{lv}</span>)}
      </div>
    </div>
  );
};
const Model: React.FC<{f: number; d: number; name: string; desc: string; inp: number; out: number; act: number}> = ({f, d, name, desc, inp, out, act}) => {
  const s = sp(f, d, SPR.card);
  const k = tw(f, d + 8, d + 30);
  return (
    <div style={{flex: 1, background: CARD2, border: `2px solid ${act > 0.5 ? TQ : LN}`, borderRadius: 18, padding: '22px 24px', perspective: 800,
      transform: `perspective(900px) rotateY(${(1 - s) * 70}deg) scale(${0.96 + 0.04 * act})`, opacity: Math.min(1, s * 1.8), transformOrigin: 'left center'}}>
      <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 40, color: TX, letterSpacing: -1}}>{name}</div>
      <div style={{fontFamily: 'I', fontSize: 24, color: MU, marginTop: 2}}>{desc}</div>
      <div style={{display: 'flex', gap: 22, marginTop: 20}}>
        {[['ENTRADA', inp], ['SAÍDA', out]].map(([l, v]) => (
          <div key={l as string}>
            <div style={{fontFamily: 'M', fontSize: 17, color: MU, letterSpacing: 1}}>{l}</div>
            <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 46, color: TQ, letterSpacing: -1}}>${Math.round((v as number) * k)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
const OpenAI: React.FC<{f: number}> = ({f}) => {
  const act = tw(f, 70, 80) - tw(f, 96, 106); // o Astra acende quando a fala cita, depois o Sol
  return (
    <>
      <Kicker f={f} n="01" cat="LANÇAMENTO" date="17 NOV" />
      <Headline f={f} top={350} lines={[[{t: 'OpenAI lança'}], [{t: 'o '}, {t: 'GPT-6.2', a: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, right: RR, top: 560}}>
        <div style={{fontFamily: 'M', fontSize: 20, letterSpacing: 2, color: MU, marginBottom: 14, opacity: tw(f, 20, 30)}}>US$ POR MILHÃO DE TOKENS</div>
        <div style={{display: 'flex', gap: 16}}>
          <Model f={f} d={24} name="Astra" desc="trabalho pesado" inp={8} out={40} act={act} />
          <Model f={f} d={34} name="Sol" desc="dia a dia" inp={2} out={10} act={tw(f, 96, 106)} />
        </div>
      </div>
      <div style={{position: 'absolute', left: L, right: RR, top: 930, ...rise(sp(f, 120), 30)}}>
        <Win title="escala de risco · system card" right={<span style={{fontFamily: 'M', fontSize: 18, color: OR, fontWeight: 800, letterSpacing: 1}}>ASTRA</span>}>
          <div style={{padding: '26px 28px 4px'}}>
            <Meter f={f} d={132} label="Acelerar a própria pesquisa de IA" to={2} c={OR} />
            <Meter f={f} d={158} label="Cibersegurança" to={3} c={RED} />
          </div>
        </Win>
      </div>
      <Src f={f} d={200} top={1338} t="OpenAI · system card do GPT-6.2" />
    </>
  );
};

/* =================== 3 · Google: agente invasor e o relógio de 6 horas =================== */
const STEPS = ['Varre servidores atrás de falhas', 'Corrige os próprios erros', 'Troca de IP para não ser bloqueado', 'Coleta credenciais em massa'];
const Google: React.FC<{f: number}> = ({f}) => {
  const hours = tw(f, 40, 150, 0, 6, Easing.linear);
  const ang = (hours / 12) * 360;
  return (
    <>
      <Kicker f={f} n="02" cat="SEGURANÇA" date="16 NOV" />
      <Headline f={f} top={350} lines={[[{t: 'Hackers já usam'}], [{t: 'agentes', a: true}, {t: ' de IA.'}]]} />
      <div style={{position: 'absolute', left: L, right: RR, top: 560, display: 'flex', gap: 16}}>
        <Win title="agente invasor · log" style={{flex: 1.55, ...rise(sp(f, 20), 30)}} right={<span style={{display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'M', fontSize: 18, color: RED, fontWeight: 800}}>
          <span style={{width: 10, height: 10, borderRadius: 5, background: RED, opacity: Math.floor(f / 10) % 2 ? 1 : 0.3}} />SEM HUMANO</span>}>
          <div style={{padding: '18px 22px'}}>
            {STEPS.map((s, i) => {
              const a = 44 + i * 26;
              const done = f > a + 20;
              const on = f > a;
              return (
                <div key={s} style={{display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: i < 3 ? `2px solid ${LN}` : 'none', opacity: on ? 1 : 0.25}}>
                  {done ? <Check p={tw(f, a + 20, a + 28)} c={RED} s={28} /> : on ? <Spin f={f} c={RED} /> : <div style={{width: 26, height: 26, borderRadius: 13, border: `2px solid ${LN}`}} />}
                  <span style={{fontFamily: 'I', fontWeight: 600, fontSize: 25, color: TX, lineHeight: 1.2}}>{s}</span>
                </div>
              );
            })}
          </div>
        </Win>
        {/* relógio: 6 horas */}
        <div style={{flex: 1, background: CARD, border: `2px solid ${LN}`, borderRadius: 22, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', ...rise(sp(f, 30), 30)}}>
          <svg width={200} height={200} viewBox="-100 -100 200 200">
            <circle r={88} fill="none" stroke={LN} strokeWidth={14} />
            <circle r={88} fill="none" stroke={RED} strokeWidth={14} strokeLinecap="round" pathLength={360} strokeDasharray={`${ang} 360`} transform="rotate(-90)" />
            {Array.from({length: 12}).map((_, i) => <line key={i} x1={0} y1={-66} x2={0} y2={-74} stroke={MU} strokeWidth={3} transform={`rotate(${i * 30})`} />)}
            <line x1={0} y1={0} x2={0} y2={-56} stroke={TX} strokeWidth={6} strokeLinecap="round" transform={`rotate(${ang})`} />
            <circle r={8} fill={TX} />
          </svg>
          <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 60, color: TX, marginTop: 6, letterSpacing: -2}}>{Math.floor(hours)}h</div>
          <div style={{fontFamily: 'I', fontSize: 22, color: MU, textAlign: 'center', padding: '0 16px', lineHeight: 1.25}}>milhares de credenciais roubadas</div>
        </div>
      </div>
      {/* linha do tempo: 6 meses */}
      <div style={{position: 'absolute', left: L, right: RR, top: 1050, ...rise(sp(f, 150), 24)}}>
        <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'M', fontSize: 20, color: MU, letterSpacing: 1, marginBottom: 14}}><span>HOJE</span><span style={{color: OR}}>+6 MESES</span></div>
        <div style={{position: 'relative', height: 14, background: LN, borderRadius: 7}}>
          <div style={{width: `${tw(f, 160, 200) * 100}%`, height: '100%', background: `linear-gradient(90deg, ${TQ}, ${OR})`, borderRadius: 7}} />
          {Array.from({length: 7}).map((_, i) => <div key={i} style={{position: 'absolute', left: `${(i / 6) * 100}%`, top: -6, width: 3, height: 26, background: BG, marginLeft: -1.5}} />)}
          <div style={{position: 'absolute', right: -10, top: -12, width: 38, height: 38, borderRadius: 19, background: OR, transform: `scale(${sp(f, 198, SPR.pop)})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            <svg width={20} height={20} viewBox="0 0 24 24"><path d="M12 3l10 18H2z" fill={BG} /><rect x="11" y="9" width="2" height="6" fill={OR} /><rect x="11" y="17" width="2" height="2" fill={OR} /></svg>
          </div>
        </div>
        <div style={{fontFamily: 'I', fontWeight: 600, fontSize: 30, color: TX, marginTop: 22, opacity: tw(f, 196, 206)}}>Previsão do Google: ataques <span style={{color: OR}}>100% autônomos</span></div>
      </div>
      <Src f={f} d={210} top={1338} t="Google Threat Intelligence Group e Mandiant" />
    </>
  );
};

/* =================== 4 · Brasil: mapa com os arcos da regra =================== */
const MAP_W = 920, MAP_S = MAP_W / 1010;
const PT: Record<string, [number, number]> = {us: [235, 300], sg: [766, 459], th: [760, 426], my: [782, 451], id: [806, 470], br: [328, 500]};
const DEST = ['sg', 'th', 'my', 'id', 'br'];
const NAMES: Record<string, string> = {sg: 'Singapura', th: 'Tailândia', my: 'Malásia', id: 'Indonésia', br: 'Brasil'};
const Brasil: React.FC<{f: number}> = ({f}) => {
  const locs = (WORLD as {locations: {id: string; path: string}[]}).locations;
  const brAt = 128;
  return (
    <>
      <Kicker f={f} n="03" cat="REGULAÇÃO" date="16 NOV" />
      <Headline f={f} top={350} lines={[[{t: 'EUA apertam a'}], [{t: 'regra dos '}, {t: 'chips', a: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, top: 550, width: MAP_W, height: 666 * MAP_S, borderRadius: 22, overflow: 'hidden', background: '#05182233', ...rise(sp(f, 16), 24)}}>
        <svg width={MAP_W} height={666 * MAP_S} viewBox="0 0 1010 666" style={{transformOrigin: '0 0', transform: (() => {
          const e = Easing.bezier(0.45, 0, 0.15, 1);
          const z = interpolate(f, [0, 56, 96, 112, 140, 220], [1, 1, 2.1, 2.1, 1.6, 1.6], {...clamp, easing: e});
          const ox = interpolate(f, [0, 56, 96, 112, 140], [505, 505, 790, 790, 360], {...clamp, easing: e});
          const oy = interpolate(f, [0, 56, 96, 112, 140], [333, 333, 445, 445, 440], {...clamp, easing: e});
          const tx = MAP_W / 2 - ox * MAP_S * z, ty = (666 * MAP_S) / 2 - oy * MAP_S * z;
          return `translate(${tx}px, ${ty}px) scale(${z})`;
        })()}}>
          {locs.map((l) => {
            const isDest = DEST.includes(l.id);
            const d = DEST.indexOf(l.id);
            const at = l.id === 'br' ? brAt : 60 + d * 12;
            const on = isDest ? tw(f, at + 10, at + 18) : 0;
            const fill = l.id === 'us' ? TQ : isDest ? (l.id === 'br' ? OR : TQ) : '#0E2F3D';
            return <path key={l.id} d={l.path} fill={l.id === 'us' || isDest ? fill : fill} fillOpacity={l.id === 'us' ? 0.9 : isDest ? 0.25 + 0.75 * on : 1} stroke={BG} strokeWidth={0.6} />;
          })}
          {DEST.map((k, i) => {
            const [x1, y1] = PT.us, [x2, y2] = PT[k];
            const mx = (x1 + x2) / 2, my = Math.min(y1, y2) - (k === 'br' ? 40 : 170);
            const at = k === 'br' ? brAt - 20 : 50 + i * 12;
            const p = tw(f, at, at + 22, 0, 1, Easing.bezier(0.45, 0, 0.2, 1));
            return <path key={k} d={`M${x1} ${y1} Q${mx} ${my} ${x2} ${y2}`} fill="none" stroke={k === 'br' ? OR : TQ} strokeWidth={k === 'br' ? 3.4 : 2.2} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} strokeLinecap="round" />;
          })}
          {(() => {
            const ping = ((f - brAt - 10) % 40) / 40;
            return f > brAt + 10 ? <circle cx={PT.br[0]} cy={PT.br[1]} r={10 + ping * 34} fill="none" stroke={OR} strokeWidth={3} opacity={1 - ping} /> : null;
          })()}
          <g transform={`translate(${PT.br[0] + 18} ${PT.br[1] - 12}) scale(${sp(f, brAt + 12, SPR.pop)})`}>
            <rect x={0} y={-16} width={84} height={30} rx={6} fill={OR} /><text x={42} y={5} textAnchor="middle" fontFamily="M" fontWeight={800} fontSize={18} fill={BG}>BRASIL</text>
          </g>
          {DEST.filter((k) => k !== 'br').map((k, i) => (
            <text key={k} x={PT[k][0] + 10} y={PT[k][1] - 8 - i * 0} fontFamily="M" fontWeight={700} fontSize={9} fill={TQ} opacity={tw(f, 70 + i * 12, 80 + i * 12) * (1 - tw(f, 112, 124))}>{NAMES[k]}</text>
          ))}
          <text x={PT.us[0] - 20} y={PT.us[1] - 40} fontFamily="M" fontWeight={800} fontSize={22} fill={TQ} opacity={tw(f, 30, 40)}>EUA</text>
        </svg>

      </div>
      {/* licença carimbada */}
      <div style={{position: 'absolute', left: L, right: RR, top: 1030, ...rise(sp(f, 150), 30)}}>
        <Win title="licença de exportação · EUA">
          <div style={{padding: '18px 26px'}}>
            {[['Chips de IA mais avançados', 'exige licença'], ['Data centers que vendem computação à China', 'exige licença'], ['Quem já opera', '90 dias']].map(([a, b], i) => (
              <div key={a} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < 2 ? `2px solid ${LN}` : 'none', ...rise(sp(f, 160 + i * 8), 12)}}>
                <span style={{fontFamily: 'I', fontWeight: 600, fontSize: 24, color: TX}}>{a}</span>
                <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 22, color: i === 2 ? OR : TQ}}>{b}</span>
              </div>
            ))}
          </div>
        </Win>
        {(() => {
          const s = sp(f, 200, SPR.stamp);
          return (
            <div style={{position: 'absolute', right: 16, top: -40, transform: `rotate(-8deg) scale(${lerp(1.8, 1, Math.min(1, s))})`, opacity: Math.min(1, s * 3),
              border: `4px solid ${OR}`, color: OR, fontFamily: 'M', fontWeight: 800, fontSize: 26, letterSpacing: 2, padding: '6px 14px', borderRadius: 8, background: 'rgba(4,20,30,0.92)'}}>
              BRASIL NA LISTA
            </div>
          );
        })()}
      </div>
      <Src f={f} d={220} top={1338} t="Departamento de Comércio dos EUA, via Reuters · mapa CC BY 4.0, V. Cazanave" />
    </>
  );
};

/* =================== 5 · CTA =================== */
const Cta: React.FC<{f: number}> = ({f}) => {
  const bm = tw(f, 40, 50);
  const fx = interpolate(f, [64, 76, 77, 92], [0, 80, -80, 0], {...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1)});
  const fo = interpolate(f, [64, 74, 78, 90], [1, 0, 0, 1], clamp);
  return (
    <>
      <Headline f={f} size={72} top={330} lines={[[{t: 'Qual delas'}], [{t: 'mais te '}, {t: 'pega', a: true}, {t: '?'}]]} />
      <div style={{position: 'absolute', left: L, right: RR, top: 540, display: 'flex', gap: 14}}>
        {['OpenAI', 'Google', 'Brasil'].map((n, i) => {
          const s = sp(f, 18 + i * 6, SPR.pop);
          return (
            <div key={n} style={{flex: 1, borderRadius: 18, background: CARD, border: `2px solid ${i === 2 ? OR : LN}`, padding: '20px 0', textAlign: 'center',
              transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2)}}>
              <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 70, color: i === 2 ? OR : TQ, lineHeight: 1}}>{i + 1}</div>
              <div style={{fontFamily: 'M', fontSize: 20, color: MU, marginTop: 8}}>{n}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, right: RR, top: 740, fontFamily: 'I', fontSize: 30, color: MU, ...rise(sp(f, 30), 14)}}>Responde com o número nos comentários.</div>
      <div style={{position: 'absolute', left: L, right: RR, top: 850, display: 'flex', gap: 16}}>
        {[0, 1].map((k) => {
          const s = sp(f, 36 + k * 10, SPR.card);
          return (
            <div key={k} style={{flex: 1, background: CARD, border: `2px solid ${LN}`, borderRadius: 22, padding: '30px 26px', ...rise(s, 30)}}>
              <div style={{width: 96, height: 96, borderRadius: 48, background: k ? TQ : 'transparent', border: `3px solid ${TQ}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                {k === 0 ? (
                  <svg width={46} height={46} viewBox="0 0 24 24" style={{transform: `scale(${1 + Math.sin(Math.min(1, bm) * Math.PI) * 0.18})`}}>
                    <path d="M6 3h12v18l-6-4.5L6 21z" fill={bm > 0.5 ? TQ : 'none'} stroke={TQ} strokeWidth="2.2" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width={46} height={46} viewBox="0 0 24 24" style={{transform: `translate(${fx}px, ${-fx}px)`, opacity: fo}}>
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={BG} strokeWidth="2.4" fill="none" strokeLinejoin="round" strokeLinecap="round" />
                  </svg>
                )}
              </div>
              <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 32, color: TX, marginTop: 20}}>{k ? 'Manda' : 'Salva'}</div>
              <div style={{fontFamily: 'I', fontSize: 24, color: MU, marginTop: 4, lineHeight: 1.25}}>{k ? 'para quem precisa ficar por dentro' : 'para consultar depois'}</div>
            </div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, right: RR, top: 1190, display: 'flex', alignItems: 'center', gap: 16, ...rise(sp(f, 60), 16)}}>
        <Img src={staticFile('icone.png')} style={{width: 60}} />
        <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 36, color: TX}}>@xarpy_dev</div>
        <div style={{fontFamily: 'I', fontSize: 26, color: MU}}>· o radar de IA</div>
      </div>
    </>
  );
};

const PAGE_C: React.FC<{f: number}>[] = [Capa, OpenAI, Google, Brasil, Cta];

const Frame: React.FC<{demo?: boolean}> = ({demo}) => {
  const F = useF();
  const pos = posAt(F);
  return (
    <AbsoluteFill style={{background: BG, color: TX}}>
      {(() => {
        const cols = ['100,219,232', '100,219,232', '255,77,61', '255,109,4', '100,219,232'];
        return cols.map((c, i) => (
          <div key={i} style={{position: 'absolute', inset: 0, opacity: Math.max(0, 1 - Math.abs(pos - i)), background: `radial-gradient(ellipse 1100px 720px at 50% 108%, rgba(${c},0.13), transparent 70%)`}} />
        ));
      })()}
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 800px 600px at 0% 0%, rgba(100,219,232,0.05), transparent 70%)'}} />
      {PAGE_C.map((C, i) => {
        const x = (i - pos) * 1080;
        if (Math.abs(x) > 1100) return null;
        const delay = i >= 1 && i <= 3 ? PRINT_DUR : 0;
        return <AbsoluteFill key={i} style={{transform: `translateX(${x}px)`}}><C f={Math.max(0, F - STARTS[i] - delay)} /></AbsoluteFill>;
      })}
      <BigRadar F={F} pos={pos} />
      <PrintLayer F={F} pos={pos} demo={demo} />
      {pos < 1 && <AbsoluteFill style={{transform: `translateX(${-pos * 1080}px)`, opacity: 1 - tw(F, STARTS[1] - TR - 8, STARTS[1] - TR)}}><BlipLabels t={F} cx={RCX} cy={RCY} r={RSZ / 2} /></AbsoluteFill>}
      <Head F={F} pos={pos} />
    </AbsoluteFill>
  );
};

const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.06, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={f % 24} stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#gr)" />
    </svg>
  );
};

export type R2Props = {blur?: boolean; samples?: number; safe?: boolean; demo?: boolean};
export const Radar2: React.FC<R2Props> = ({blur = false, samples = 3, safe, demo}) => (
  <AbsoluteFill style={{background: BG}}>
    <style>{fontCss}</style>
    {blur ? <CameraMotionBlur shutterAngle={180} samples={samples}><Frame demo={demo} /></CameraMotionBlur> : <Frame demo={demo} />}
    <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 90% 75% at 50% 45%, transparent 60%, rgba(0,0,0,0.5) 100%)'}} />
    <Grain />
    {safe && (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(255,0,80,0.28)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(255,0,80,0.28)'}} />
        <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(255,0,80,0.28)'}} />
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);
