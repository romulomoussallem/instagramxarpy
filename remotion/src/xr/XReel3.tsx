import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import R from './roteiro3.json';

/* =====================================================================
   Tokens de design
   - Grade de 8 pt: todo espaçamento em múltiplos de 8
   - Hierarquia em 3 níveis: foco (cartão), apoio (legenda), contexto (rótulos)
   - Contraste: texto secundário ≥ 4,5:1 sobre o fundo (WCAG AA)
   ===================================================================== */
export const THEMES: Record<string, {a: string; a2: string; bg: string}> = {
  tutorial: {a: '#92FF5F', a2: '#C2FFA3', bg: '#070807'},
  engenharia: {a: '#FF5100', a2: '#FF8A52', bg: '#060607'},
  inovacao: {a: '#64DBE8', a2: '#A6EEF5', bg: '#04141E'},
};
const ERR = '#FF7036';
const CLAUDE = '#D97757'; // cor da marca do Claude Code no terminal
const INK = '#0A0C0A';
const TXT = {hi: '#F4F5F4', mid: '#B4B9B4', lo: '#8E938E', dim: '#868B86'}; // todos ≥ 4,5:1 sobre o fundo e sobre o cartão
const TS = {title: 84, cap: 54, h1: 64, h2: 48, body: 36, small: 28, micro: 24};
const SP = (n: number) => n * 8;

// Curvas por papel
const EZ = {
  camera: Easing.bezier(0.45, 0, 0.15, 1),
  soft: Easing.bezier(0.16, 1, 0.3, 1),
  exit: Easing.bezier(0.55, 0, 1, 0.45),
};
const SPR = {
  card: {damping: 15, stiffness: 120, mass: 0.9},
  pop: {damping: 11, stiffness: 180, mass: 0.6},
  word: {damping: 14, stiffness: 260, mass: 0.5},
  heavy: {damping: 20, stiffness: 90, mass: 1.3},
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tw = (f: number, a: number, b: number, from = 0, to = 1, ease = EZ.soft) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: ease});
const sp = (f: number, delay: number, cfg = SPR.card) => spring({frame: f - delay, fps: 30, config: cfg});
const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');

/* Tempo em quadros de 30 fps, mesmo renderizando a 60 fps */
const useF = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (f * 30) / fps;
};

type Box = {w: number; h: number; top: number};
type Scene = (typeof R.scenes)[number] & {caption?: string; keys?: Record<string, string>; loopBox?: Box};
const SC = R.scenes as Scene[];
export const STARTS = SC.reduce<number[]>((acc, _s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SC[i - 1].dur], []);
export const TOTAL30 = SC.reduce((a, s) => a + s.dur, 0);
const sceneAt = (F: number) => {
  let i = 0;
  while (i < SC.length - 1 && F >= STARTS[i + 1]) i++;
  return {i, local: F - STARTS[i], s: SC[i]};
};

/* Eventos que fazem a luz reagir */
const EVENTS = SC.flatMap((s, i) => (s.sfx as [number, string, number][]).filter(([, n]) => n !== 'key').map(([fr, n]) => ({t: STARTS[i] + fr, n})));
const flashAt = (F: number) => {
  let v = 0, err = 0;
  for (const e of EVENTS) {
    const d = F - e.t;
    if (d >= 0 && d < 30) {
      const k = Math.exp(-d / 7);
      v = Math.max(v, k);
      if (e.n === 'error') err = Math.max(err, k);
    }
  }
  return {v, err};
};

const Ctx = React.createContext({A: THEMES.tutorial.a, A2: THEMES.tutorial.a2});
const useT = () => React.useContext(Ctx);

const fontCss = `
@font-face{font-family:'IT';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'JB';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
@font-face{font-family:'SR';src:url('${staticFile('serif-italic.woff2')}');font-style:italic;}
*{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;font-feature-settings:"ss01","cv11";}`;

/* =========================== Ícones vetoriais =========================== */
const Ico: React.FC<{n: 'check' | 'x' | 'down' | 'up' | 'enter' | 'bookmark' | 'dot'; s?: number; c?: string; w?: number; fill?: boolean}> = ({n, s = 24, c = '#fff', w = 2.4, fill}) => {
  const p: Record<string, string> = {
    check: 'M5 12.5l4.5 4.5L19 7.5', x: 'M6 6l12 12M18 6L6 18', down: 'M12 4v16M5 13l7 7 7-7', up: 'M12 20V4M5 11l7-7 7 7',
    enter: 'M19 5v7a3 3 0 01-3 3H6M10 11l-4 4 4 4', bookmark: 'M6 3h12v18l-6-4.5L6 21z', dot: '',
  };
  if (n === 'dot') return <svg width={s} height={s} viewBox="0 0 24 24"><circle cx={12} cy={12} r={6} fill={c} /></svg>;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{display: 'block'}}>
      <path d={p[n]} stroke={c} strokeWidth={w} fill={fill ? c : 'none'} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
// Indicador de atividade no estilo do Claude Code
const Spinner: React.FC<{f: number; s?: number}> = ({f, s = 28}) => (
  <svg width={s} height={s} viewBox="0 0 24 24" style={{transform: `rotate(${f * 9}deg)`, display: 'block'}}>
    {Array.from({length: 6}).map((_, i) => (
      <line key={i} x1={12} y1={3} x2={12} y2={21} stroke={CLAUDE} strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${i * 30} 12 12)`} />
    ))}
  </svg>
);

/* =========================== Cenário com paralaxe =========================== */
const Stage: React.FC<{lightY: number; cam: {z: number; y: number}; flash: {v: number; err: number}}> = ({lightY, cam, flash}) => {
  const F = useF();
  const {A} = useT();
  const col = flash.err > 0.05 ? ERR : A;
  const pulse = 0.9 + Math.sin(F / 22) * 0.06 + flash.v * 0.7;
  const H = 1128, vx = 540, vy = 790;
  const rays = Array.from({length: 29}, (_, i) => 540 + (i - 14) * 168);
  const rows = Array.from({length: 13}, (_, i) => H + Math.pow(i / 12, 1.85) * 820);
  // paralaxe: o fundo se move menos que os cartões
  const par = `translateY(${(cam.y - 864) * -0.08}px) scale(${1 + (cam.z - 1) * 0.3})`;
  return (
    <AbsoluteFill style={{transform: par, transformOrigin: '540px 900px'}}>
      <div style={{position: 'absolute', inset: -120, background: `radial-gradient(ellipse 640px 800px at 50% ${lightY + 120}px, rgba(${rgb(col)},${0.085 * pulse}), transparent 70%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.14" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.18" />
          </linearGradient>
          <mask id="m"><rect x="0" y={H} width="1080" height={1920 - H} fill="url(#fade)" /></mask>
        </defs>
        <g mask="url(#m)" stroke={A} strokeOpacity={0.14} strokeWidth={1.2}>
          {rays.map((x) => <line key={x} x1={vx + (x - vx) * ((H - vy) / (1920 - vy))} y1={H} x2={x} y2={1920} />)}
          {rows.map((y, i) => <line key={i} x1={0} y1={y + ((F * 0.6) % 1)} x2={1080} y2={y + ((F * 0.6) % 1)} />)}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 64, right: 64, top: H - 80, height: 160, borderRadius: '50%',
        background: `radial-gradient(ellipse at center, rgba(${rgb(col)},${0.22 * pulse}), transparent 70%)`, filter: 'blur(20px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: H, height: 1.5, background: `linear-gradient(90deg, transparent, rgba(${rgb(col)},${0.28 + flash.v * 0.3}), transparent)`}} />
    </AbsoluteFill>
  );
};

/* =========================== Superfície de vidro com luz de borda =========================== */
const Glass: React.FC<{r?: number; style?: React.CSSProperties; children?: React.ReactNode; tint?: string; hot?: number}> = ({r = 32, style, children, tint, hot = 0}) => {
  const {A} = useT();
  const t = tint ?? A;
  return (
    <div style={{position: 'relative', borderRadius: r, padding: 1.5,
      background: `linear-gradient(172deg, rgba(${rgb(t)},${0.34 + hot * 0.4}) 0%, rgba(255,255,255,0.10) 28%, rgba(255,255,255,0.04) 70%, rgba(255,255,255,0.07) 100%)`,
      boxShadow: `0 64px 120px rgba(0,0,0,0.72), 0 16px 32px rgba(0,0,0,0.45), 0 0 ${80 * hot}px rgba(${rgb(t)},${0.25 * hot})`, ...style}}>
      <div style={{position: 'relative', borderRadius: r - 1.5, height: '100%', overflow: 'hidden',
        background: 'linear-gradient(180deg, rgba(40,44,40,0.97) 0%, rgba(22,25,22,0.98) 55%, rgba(17,19,17,0.99) 100%)'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 1.5, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)'}} />
        {children}
      </div>
    </div>
  );
};

/* =========================== Microinterações =========================== */
const Cursor: React.FC<{f: number; path: [number, number, number][]; clickAt?: number}> = ({f, path, clickAt}) => {
  const {A} = useT();
  const fr = path.map((p) => p[0]);
  const x = interpolate(f, fr, path.map((p) => p[1]), {...clamp, easing: EZ.camera});
  const y = interpolate(f, fr, path.map((p) => p[2]), {...clamp, easing: EZ.camera});
  const op = tw(f, fr[0], fr[0] + 5);
  // antecipação: o cursor recua 2 px antes do clique
  const pre = clickAt === undefined ? 0 : interpolate(f, [clickAt - 5, clickAt - 1, clickAt], [0, -3, 0], clamp);
  const press = clickAt === undefined ? 0 : interpolate(f, [clickAt - 1, clickAt, clickAt + 6], [0, 1, 0], clamp);
  const ring = clickAt === undefined ? 0 : tw(f, clickAt, clickAt + 16);
  return (
    <div style={{position: 'absolute', left: x, top: y + pre, opacity: op, zIndex: 30, pointerEvents: 'none'}}>
      {clickAt !== undefined && f >= clickAt && (
        <div style={{position: 'absolute', left: -48 * ring, top: -48 * ring, width: 96 * ring, height: 96 * ring, borderRadius: '50%',
          border: `2.5px solid ${A}`, opacity: (1 - ring) * 0.9}} />
      )}
      <svg width={44} height={54} viewBox="0 0 23 28" style={{transform: `scale(${1 - press * 0.14})`, transformOrigin: '2px 2px',
        filter: 'drop-shadow(0 8px 12px rgba(0,0,0,0.55))'}}>
        <path d="M1.5 1.5 L1.5 22 L6.8 17 L10.6 25.8 L14 24.3 L10.3 15.6 L17.4 15.6 Z" fill="#fff" stroke={INK} strokeWidth="1.5" strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* Peças da janela do Claude Code */
const WinBar: React.FC<{title: string; right?: React.ReactNode}> = ({title, right}) => (
  <div style={{display: 'flex', alignItems: 'center', gap: SP(1.5), height: SP(8), padding: `0 ${SP(3)}px`, borderBottom: '1.5px solid rgba(255,255,255,0.06)'}}>
    {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />)}
    <div style={{fontFamily: 'JB', fontSize: TS.micro, color: TXT.lo, marginLeft: SP(2)}}>{title}</div>
    <div style={{marginLeft: 'auto'}}>{right}</div>
  </div>
);
const ClaudeHead: React.FC = () => (
  <div style={{display: 'flex', alignItems: 'center', gap: SP(1.5), fontFamily: 'JB', fontSize: TS.micro, color: CLAUDE}}>
    <svg width={22} height={22} viewBox="0 0 24 24">{Array.from({length: 6}).map((_, i) => (
      <line key={i} x1={12} y1={3} x2={12} y2={21} stroke={CLAUDE} strokeWidth={2.6} strokeLinecap="round" transform={`rotate(${i * 30} 12 12)`} />))}</svg>
    Claude Code
  </div>
);
const InputBox: React.FC<{f: number; text: string; from: number; to: number; sentAt: number; placeholder?: string}> = ({f, text, from, to, sentAt, placeholder}) => {
  const {A} = useT();
  const n = Math.floor(interpolate(f, [from, to], [0, text.length], clamp));
  const sent = f >= sentAt;
  const typing = f >= from && !sent;
  const focus = tw(f, from - 6, from);
  return (
    <div style={{border: `1.5px solid ${focus > 0.5 && !sent ? `rgba(${rgb(A)},0.55)` : 'rgba(255,255,255,0.16)'}`, borderRadius: SP(2), padding: `${SP(2.5)}px ${SP(3)}px`,
      fontFamily: 'JB', fontSize: TS.body, color: TXT.hi, display: 'flex', alignItems: 'center', minHeight: SP(10),
      boxShadow: focus > 0.5 && !sent ? `0 0 0 4px rgba(${rgb(A)},0.08)` : 'none'}}>
      <span style={{color: A, marginRight: SP(2)}}>&gt;</span>
      {n === 0 || sent ? <span style={{color: TXT.dim}}>{placeholder ?? ''}</span> : <span style={{whiteSpace: 'pre'}}>{text.slice(0, n)}</span>}
      {!sent && <span style={{display: 'inline-block', width: 3, height: 40, background: A, marginLeft: 4, opacity: typing && Math.floor(f / 7) % 2 === 0 ? 1 : typing ? 0 : 1}} />}
    </div>
  );
};

/* =========================== Conteúdos (coordenadas internas da caixa) =========================== */
type CP = {f: number; d: number; box: Box};
const useIn = (f: number, delay: number, cfg = SPR.card) => {
  const s = sp(f, delay, cfg);
  return {opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * 32}px)`, filter: `blur(${Math.max(0, 1 - s) * 8}px)`} as React.CSSProperties;
};

const PromptC: React.FC<CP> = ({f}) => {
  const sent = f >= 56;
  const thinking = tw(f, 58, 64);
  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <WinBar title="claude — ~/meu-app" />
      <div style={{padding: SP(4), display: 'flex', flexDirection: 'column', gap: SP(3), flex: 1}}>
        <div style={useIn(f, 2)}><ClaudeHead /></div>
        {sent && (
          <div style={{display: 'flex', alignItems: 'center', gap: SP(2), opacity: thinking, transform: `translateY(${(1 - thinking) * 12}px)`}}>
            <Spinner f={f} /><span style={{fontFamily: 'JB', fontSize: TS.small, color: CLAUDE}}>Pensando…</span>
          </div>
        )}
        <div style={{...useIn(f, 5), marginTop: 'auto'}}>
          <InputBox f={f} text="faz a tela de login do app" from={18} to={50} sentAt={56} placeholder="Pergunte qualquer coisa…" />
        </div>
      </div>
    </div>
  );
};

const CODE: [string, string][] = [
  ['k', 'export default function Login() {'], ['v', '  const [email, setEmail] = useState("")'], ['k', '  return ('],
  ['t', '    <form className="card">'], ['t', '      <input name="email" />'], ['t', '      <input type="password" />'],
  ['t', '      <Button>Entrar</Button>'], ['t', '    </form>'], ['k', '  )'], ['k', '}'],
];
const CodeC: React.FC<CP> = ({f}) => {
  const {A} = useT();
  const col: Record<string, string> = {k: '#C792EA', v: '#E6E8E6', s: '#C3E88D', t: '#89DDFF'};
  const err = sp(f, 62, SPR.pop);
  // tremor amortecido e mais lento, para o desfoque de movimento não gerar cópias
  const shake = f >= 62 && f < 82 ? Math.sin((f - 62) * 1.3) * Math.exp(-(f - 62) / 6) * 10 : 0;
  const lines = Math.floor(tw(f, 14, 54, 0, CODE.length, Easing.linear));
  return (
    <div style={{position: 'relative', height: '100%', transform: `translateX(${shake}px)`}}>
      <WinBar title="claude — ~/meu-app" right={f < 62 ? <div style={{display: 'flex', alignItems: 'center', gap: SP(1)}}><Spinner f={f} s={22} /><span style={{fontFamily: 'JB', fontSize: TS.micro, color: CLAUDE}}>Escrevendo…</span></div> : null} />
      <div style={{padding: `${SP(3)}px ${SP(4)}px`}}>
        <div style={{fontFamily: 'JB', fontSize: TS.micro, color: TXT.dim, ...useIn(f, 0)}}>&gt; faz a tela de login do app</div>
        <div style={{display: 'flex', alignItems: 'center', gap: SP(1.5), marginTop: SP(2), fontFamily: 'JB', fontSize: TS.small, color: TXT.hi, ...useIn(f, 4)}}>
          <Ico n="dot" s={20} c={A} />Write<span style={{color: TXT.lo}}>(src/Login.tsx)</span>
        </div>
        <div style={{marginTop: SP(2), marginLeft: SP(4), borderLeft: '1.5px solid rgba(255,255,255,0.1)', paddingLeft: SP(2.5)}}>
          {CODE.map(([c, l], i) => (
            <div key={i} style={{fontFamily: 'JB', fontSize: 26, lineHeight: 1.6, color: col[c], whiteSpace: 'pre',
              opacity: (i < lines ? 1 : 0) * (1 - err * 0.5), transform: `translateX(${i < lines ? 0 : -8}px)`}}>
              <span style={{color: '#5C615C', marginRight: SP(2.5)}}>{String(i + 1).padStart(2, ' ')}</span>{l}
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: SP(3), right: SP(3), bottom: SP(3), transform: `translateY(${(1 - err) * 140}px) scale(${0.96 + 0.04 * err})`, opacity: Math.min(1, err * 1.4)}}>
        <Glass r={20} tint={ERR} hot={0.6}>
          <div style={{display: 'flex', alignItems: 'center', gap: SP(2.5), padding: `${SP(2.5)}px ${SP(3)}px`, background: 'rgba(255,112,54,0.08)'}}>
            <div style={{width: SP(6.5), height: SP(6.5), borderRadius: SP(4), background: ERR, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0}}>
              <Ico n="x" s={28} c={INK} w={3.2} />
            </div>
            <div style={{flex: 1}}>
              <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 34, color: '#fff'}}>Não era essa tela</div>
              <div style={{fontFamily: 'IT', fontWeight: 500, fontSize: TS.micro, color: '#E3B7A6', marginTop: 4}}>Faltou o login com Google e o layout errou</div>
            </div>
            <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: TS.micro, color: ERR, border: `1.5px solid ${ERR}`, borderRadius: SP(1.5), padding: `${SP(1.25)}px ${SP(2.25)}px`}}>Refazer</div>
          </div>
        </Glass>
      </div>
    </div>
  );
};

const SPIcon: React.FC<{s: number}> = ({s}) => {
  const {A, A2} = useT();
  return (
    <div style={{width: s, height: s, borderRadius: s * 0.24, background: `linear-gradient(155deg, ${A2}, ${A})`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontFamily: 'IT', fontWeight: 800, fontSize: s * 0.42, letterSpacing: -s * 0.01, color: INK,
      boxShadow: `inset 0 ${s * 0.02}px 0 rgba(255,255,255,0.5), 0 ${s * 0.12}px ${s * 0.3}px rgba(${rgb(A)},0.28)`}}>SP</div>
  );
};
const ProductC: React.FC<CP> = ({f, d}) => {
  const {A} = useT();
  const icon = sp(f, 8, SPR.pop);
  const hideIcon = f > d - 6; // o ícone sai voando para a cena seguinte (elemento compartilhado)
  return (
    <div style={{padding: SP(7)}}>
      <div style={{display: 'flex', alignItems: 'center', gap: SP(4)}}>
        <div style={{transform: `scale(${0.4 + 0.6 * icon}) rotate(${(1 - icon) * -18}deg)`, opacity: hideIcon ? 0 : Math.min(1, icon * 2)}}><SPIcon s={136} /></div>
        <div>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: TS.h1, color: TXT.hi, letterSpacing: -1.4, ...useIn(f, 12)}}>Superpowers</div>
          <div style={{fontFamily: 'JB', fontSize: TS.micro, color: TXT.lo, marginTop: SP(1), letterSpacing: 1, ...useIn(f, 15)}}>SKILL · CLAUDE CODE</div>
        </div>
      </div>
      <div style={{fontFamily: 'IT', fontWeight: 500, fontSize: TS.body, color: TXT.mid, marginTop: SP(5), ...useIn(f, 18)}}>Método de trabalho para o seu agente</div>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: SP(1.5), marginTop: SP(4), border: `1.5px solid rgba(${rgb(A)},0.5)`, borderRadius: 999,
        padding: `${SP(1.5)}px ${SP(3)}px`, fontFamily: 'IT', fontWeight: 600, fontSize: TS.micro, color: A, background: `rgba(${rgb(A)},0.07)`, ...useIn(f, 22)}}>
        <svg width={24} height={24} viewBox="0 0 24 24"><path fill={A} d="M12 1.5a10.5 10.5 0 00-3.3 20.46c.52.1.72-.23.72-.5v-1.86c-2.92.64-3.54-1.24-3.54-1.24-.48-1.21-1.17-1.54-1.17-1.54-.95-.65.08-.64.08-.64 1.05.08 1.6 1.08 1.6 1.08.94 1.6 2.46 1.14 3.06.87.1-.68.37-1.14.66-1.4-2.33-.27-4.78-1.17-4.78-5.18 0-1.15.41-2.08 1.08-2.82-.1-.27-.47-1.33.1-2.78 0 0 .88-.28 2.88 1.07a10 10 0 015.24 0c2-1.35 2.88-1.07 2.88-1.07.57 1.45.21 2.51.1 2.78.68.74 1.08 1.67 1.08 2.82 0 4.02-2.45 4.9-4.79 5.16.38.33.71.97.71 1.96v2.9c0 .28.19.61.73.5A10.5 10.5 0 0012 1.5z" /></svg>
        Open source · obra/superpowers
      </div>
    </div>
  );
};

const TerminalC: React.FC<CP> = ({f}) => {
  const {A} = useT();
  const cmd = '/plugin install superpowers@claude-plugins-official';
  const running = f >= 64 && f < 76;
  const done = f >= 76;
  const ok = sp(f, 76, SPR.pop);
  const badge = tw(f, 12, 16);
  const n = Math.floor(interpolate(f, [16, 58], [0, cmd.length], clamp));
  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column'}}>
      <WinBar title="claude — ~/meu-app" right={<div style={{opacity: badge}}><SPIcon s={44} /></div>} />
      <div style={{padding: SP(4), display: 'flex', flexDirection: 'column', gap: SP(3), flex: 1}}>
        <div style={useIn(f, 2)}><ClaudeHead /></div>
        <div style={{border: `1.5px solid ${f < 64 ? `rgba(${rgb(A)},0.55)` : 'rgba(255,255,255,0.16)'}`, borderRadius: SP(2), padding: `${SP(2.5)}px ${SP(3)}px`,
          fontFamily: 'JB', fontSize: 33, lineHeight: 1.5, color: TXT.hi, whiteSpace: 'pre', ...useIn(f, 5)}}>
          <span style={{color: A}}>&gt; </span>{cmd.slice(0, Math.min(n, 15))}{n > 15 ? '\n  ' + cmd.slice(16, n) : ''}
          {f < 64 && <span style={{display: 'inline-block', width: 3, height: 38, background: A, verticalAlign: 'middle', marginLeft: 4, opacity: Math.floor(f / 7) % 2 === 0 ? 1 : 0}} />}
        </div>
        <div style={{height: SP(5), display: 'flex', alignItems: 'center', gap: SP(1.5), fontFamily: 'JB', fontSize: TS.small}}>
          {running && <><Spinner f={f} /><span style={{color: CLAUDE}}>Instalando…</span></>}
          {done && (
            <div style={{display: 'flex', alignItems: 'center', gap: SP(1.5), opacity: Math.min(1, ok * 1.5), transform: `translateX(${(1 - ok) * -16}px)`}}>
              <div style={{width: SP(4), height: SP(4), borderRadius: SP(2), background: A, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${ok})`}}>
                <Ico n="check" s={22} c={INK} w={3.4} />
              </div>
              <span style={{color: A}}>Plugin instalado: superpowers</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FlowC: React.FC<CP> = ({f}) => {
  const {A, A2} = useT();
  const steps = ['Entende o pedido', 'Escreve o plano', 'Desenvolve com testes', 'Revisa e entrega'];
  const active = f < 22 ? -1 : Math.min(3, Math.floor((f - 22) / 22));
  return (
    <div style={{height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      {steps.map((s, i) => {
        const e = sp(f, 2 + i * 3, SPR.card);
        const on = i <= active, cur = i === active;
        const hit = cur ? sp(f, 22 + i * 22, SPR.pop) : 1;
        const bump = cur ? 1 + (1 - hit) * -0.04 + Math.max(0, Math.sin(Math.min(1, hit) * Math.PI)) * 0.04 : 1;
        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <div style={{width: 3, height: SP(5), background: 'rgba(255,255,255,0.12)', position: 'relative', opacity: Math.min(1, e * 1.5)}}>
                <div style={{position: 'absolute', left: 0, top: 0, width: 3, background: A, height: `${tw(f, 22 + (i - 1) * 22, 34 + (i - 1) * 22) * 100}%`, boxShadow: `0 0 12px ${A}`}} />
              </div>
            )}
            <div style={{opacity: Math.min(1, e * 1.5), transform: `translateY(${(1 - e) * 48}px) scale(${bump})`, filter: `blur(${Math.max(0, 1 - e) * 10}px)`}}>
              <Glass r={24} hot={cur ? 0.9 : on ? 0.25 : 0} style={{width: 640}}>
                <div style={{display: 'flex', alignItems: 'center', gap: SP(2.5), padding: `${SP(3.5)}px ${SP(4)}px`,
                  background: cur ? `linear-gradient(155deg, ${A2}, ${A})` : 'transparent'}}>
                  <div style={{fontFamily: 'JB', fontSize: TS.micro, color: cur ? INK : on ? A : TXT.dim, width: SP(5)}}>0{i + 1}</div>
                  <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 40, color: cur ? INK : on ? TXT.hi : TXT.lo, flex: 1}}>{s}</div>
                  {on && !cur && <Ico n="check" s={30} c={A} w={3} />}
                </div>
              </Glass>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CompareC: React.FC<CP> = ({f}) => {
  const {A, A2} = useT();
  const ok = f >= 52;
  const press = interpolate(f, [51, 52, 58], [0, 1, 0], clamp);
  const okS = sp(f, 52, SPR.pop);
  const strike = tw(f, 30, 42);
  return (
    <div style={{padding: SP(6), position: 'relative', height: '100%'}}>
      <div style={useIn(f, 4)}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: SP(1), fontFamily: 'JB', fontWeight: 700, fontSize: TS.micro, letterSpacing: 2, color: ERR,
          border: `1.5px solid ${ERR}`, borderRadius: SP(1.25), padding: `${SP(0.75)}px ${SP(1.75)}px`}}><Ico n="x" s={18} c={ERR} w={3} />SEM A SKILL</div>
        <div style={{position: 'relative', display: 'inline-block', fontFamily: 'IT', fontWeight: 700, fontSize: TS.h2, color: TXT.lo, marginTop: SP(2)}}>
          Código no chute, refaz várias vezes
          <div style={{position: 'absolute', left: 0, top: '54%', height: 3, width: `${strike * 100}%`, background: ERR, borderRadius: 2}} />
        </div>
      </div>
      <div style={{height: 1.5, background: 'rgba(255,255,255,0.08)', margin: `${SP(4.5)}px 0`, transformOrigin: 'left', transform: `scaleX(${tw(f, 18, 30)})`}} />
      <div style={useIn(f, 24)}>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: SP(1), fontFamily: 'JB', fontWeight: 700, fontSize: TS.micro, letterSpacing: 2, color: A,
          border: `1.5px solid ${A}`, borderRadius: SP(1.25), padding: `${SP(0.75)}px ${SP(1.75)}px`}}><Ico n="check" s={18} c={A} w={3} />COM SUPERPOWERS</div>
        <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: TS.h2, color: TXT.hi, marginTop: SP(2)}}>Plano aprovado antes do código</div>
        <div style={{display: 'inline-flex', alignItems: 'center', gap: SP(1.5), marginTop: SP(3.5), padding: `${SP(2)}px ${SP(4)}px`, borderRadius: SP(2),
          fontFamily: 'IT', fontWeight: 700, fontSize: TS.small, transform: `scale(${1 - press * 0.07 + (ok ? (1 - okS) * -0.03 : 0)})`,
          background: ok ? `linear-gradient(155deg, ${A2}, ${A})` : 'rgba(255,255,255,0.07)', color: ok ? INK : TXT.hi,
          border: ok ? '1.5px solid transparent' : '1.5px solid rgba(255,255,255,0.16)', boxShadow: ok ? `0 0 ${40 * okS}px rgba(${rgb(A)},0.35)` : 'none'}}>
          {ok && <div style={{transform: `scale(${okS})`}}><Ico n="check" s={26} c={INK} w={3.4} /></div>}
          {ok ? 'Plano aprovado' : 'Aprovar plano'}
        </div>
      </div>
      <Cursor f={f} path={[[30, 820, 560], [48, 210, 488], [70, 250, 520]]} clickAt={52} />
    </div>
  );
};

const CtaC: React.FC<CP> = ({f, d}) => {
  const {A, A2} = useT();
  const press = interpolate(f, [33, 34, 40], [0, 1, 0], clamp);
  const saved = f >= 34;
  const sv = sp(f, 34, SPR.pop);
  const btn = sp(f, 6, SPR.pop);
  const out = tw(f, d - 22, d - 12, 0, 1, EZ.exit);
  return (
    <div style={{padding: `${SP(7)}px ${SP(6)}px`, textAlign: 'center', opacity: 1 - out, filter: `blur(${out * 10}px)`, position: 'relative', height: '100%'}}>
      <div style={{fontFamily: 'JB', fontWeight: 500, fontSize: TS.micro, letterSpacing: 3, color: TXT.lo, ...useIn(f, 2)}}>{R.episodio}</div>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: SP(2.5), marginTop: SP(4), padding: `${SP(1.5)}px ${SP(6)}px ${SP(1.5)}px ${SP(5)}px`, borderRadius: SP(3),
        background: saved ? `linear-gradient(155deg, ${A2}, ${A})` : `rgba(${rgb(A)},0.06)`, border: saved ? '2px solid transparent' : `2px solid ${A}`,
        boxShadow: saved ? `0 0 ${70 * sv}px rgba(${rgb(A)},0.35)` : 'none',
        transform: `scale(${(0.7 + 0.3 * btn) * (1 - press * 0.07)})`, opacity: Math.min(1, btn * 2)}}>
        <div style={{transform: `scale(${saved ? 0.8 + 0.2 * sv : 1})`}}><Ico n="bookmark" s={68} c={saved ? INK : A} w={2.4} fill={saved} /></div>
        <div style={{fontFamily: 'IT', fontWeight: 800, fontSize: 112, letterSpacing: -3, color: saved ? INK : A, lineHeight: 1.1}}>{saved ? 'SALVO' : 'SALVA'}</div>
      </div>
      <div style={{fontFamily: 'IT', fontWeight: 600, fontSize: TS.body, color: TXT.mid, marginTop: SP(4.5), ...useIn(f, 14)}}>e segue para a próxima skill</div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: SP(2), marginTop: SP(4), ...useIn(f, 18)}}>
        <Img src={staticFile('icone.png')} style={{width: SP(7.5)}} />
        <div style={{fontFamily: 'JB', fontWeight: 700, fontSize: 38, color: TXT.hi}}>@xarpy_dev</div>
      </div>
      <Cursor f={f} path={[[12, 780, 520], [30, 450, 212], [50, 500, 262]]} clickAt={34} />
    </div>
  );
};

const CONTENT: Record<string, React.FC<CP>> = {prompt: PromptC, code: CodeC, product: ProductC, terminal: TerminalC, flow: FlowC, compare: CompareC, cta: CtaC};

/* =========================== Caixa que se transforma (mola com antecipação) =========================== */
const boxAt = (F: number) => {
  const {i, local, s} = sceneAt(F);
  const prev: Box = i > 0 ? SC[i - 1].box : s.box;
  const t = i > 0 ? sp(local, 0, SPR.card) : 1; // mola: passa um pouco do alvo e assenta
  let box: Box = {w: lerp(prev.w, s.box.w, t), h: lerp(prev.h, s.box.h, t), top: lerp(prev.top, s.box.top, t)};
  if (s.loopBox) {
    const u = interpolate(local, [s.dur - 16, s.dur], [0, 1], {...clamp, easing: Easing.bezier(0.76, 0, 0.24, 1)});
    box = {w: lerp(box.w, s.loopBox.w, u), h: lerp(box.h, s.loopBox.h, u), top: lerp(box.top, s.loopBox.top, u)};
  }
  const g = (k: number) => (SC[k]?.type === 'flow' ? 1 : 0);
  const ghost = i > 0 ? lerp(g(i - 1), g(i), Math.min(1, t)) : g(i);
  // antecipação: a caixa recua levemente nos 4 quadros antes de mudar
  const pre = i < SC.length - 1 ? interpolate(local, [s.dur - 5, s.dur], [0, 1], clamp) : 0;
  return {box, i, local, ghost, pre, s};
};

const Shell: React.FC = () => {
  const F = useF();
  const {box, i, local, ghost, pre, s} = boxAt(F);
  const C = CONTENT[s.type];
  const enter = i === 0 ? tw(local, 0, 8) : tw(local, 5, 13);
  const exit = i < SC.length - 1 ? tw(local, s.dur - 5, s.dur, 0, 1, EZ.exit) : 0;
  const left = 540 - box.w / 2;
  const fl = flashAt(F);
  return (
    <>
      {/* sombra de contato e reflexo no piso */}
      <div style={{position: 'absolute', left: left + box.w * 0.12, width: box.w * 0.76, top: box.top + box.h + 24, height: 56, borderRadius: '50%',
        background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.75), transparent 70%)', filter: 'blur(14px)', opacity: 1 - ghost}} />
      <div style={{position: 'absolute', left: left + 24, width: box.w - 48, top: box.top + box.h + 12, height: 120, borderRadius: 32,
        background: 'linear-gradient(180deg, rgba(60,66,60,0.16), transparent)', filter: 'blur(6px)', opacity: 1 - ghost}} />
      <div style={{position: 'absolute', left, top: box.top, width: box.w, height: box.h, transform: `scale(${1 - pre * 0.015})`}}>
        <div style={{position: 'absolute', inset: 0, opacity: 1 - ghost}}>
          <Glass r={32} style={{height: '100%'}} hot={fl.v * 0.5} tint={fl.err > 0.05 ? ERR : undefined} />
        </div>
        <div style={{position: 'absolute', inset: 0, borderRadius: 32, overflow: ghost > 0.5 ? 'visible' : 'hidden',
          opacity: enter * (1 - exit), filter: `blur(${(1 - enter) * 10 + exit * 8}px)`, transform: `translateY(${(1 - enter) * 16 - exit * 8}px)`}}>
          <C f={local} d={s.dur} box={s.box} />
        </div>
      </div>
      <Carry F={F} />
    </>
  );
};

/* Elemento compartilhado: o ícone do produto voa até a barra do terminal */
const Carry: React.FC<{F: number}> = ({F}) => {
  const ti = SC.findIndex((s) => s.type === 'terminal');
  const pi = SC.findIndex((s) => s.type === 'product');
  if (ti < 0 || pi !== ti - 1) return null;
  const t0 = STARTS[ti];
  if (F < t0 - 6 || F > t0 + 16) return null;
  const p = SC[pi].box, q = SC[ti].box;
  const from = {x: 540 - p.w / 2 + 1.5 + SP(7), y: p.top + 1.5 + SP(7), s: 136};
  const to = {x: 540 + q.w / 2 - 1.5 - SP(3) - 44, y: q.top + 1.5 + (SP(8) - 44) / 2, s: 44};
  const u = F < t0 ? 0 : sp(F - t0, 0, SPR.heavy);
  const arc = Math.sin(Math.min(1, u) * Math.PI) * -60;
  return (
    <div style={{position: 'absolute', left: lerp(from.x, to.x, u), top: lerp(from.y, to.y, u) + arc, zIndex: 40}}>
      <SPIcon s={lerp(from.s, to.s, u)} />
    </div>
  );
};

/* =========================== Câmera =========================== */
const camAt = (F: number) => {
  const {i, local} = sceneAt(F);
  const k = SC[i].cam as number[][];
  const fr = k.map((p) => p[0]);
  return {
    z: interpolate(local, fr, k.map((p) => p[1]), {...clamp, easing: EZ.camera}),
    y: interpolate(local, fr, k.map((p) => p[2]), {...clamp, easing: EZ.camera}),
  };
};

/* =========================== Legenda (apoio) e título (foco do gancho) =========================== */
type Wd = {t: string; k?: string; p?: string; br?: boolean};
const parse = (cap: string, keys: Record<string, string>): Wd[] => {
  const out: Wd[] = [];
  cap.split('|').forEach((line, li) => {
    line.trim().split(' ').forEach((t, wi) => {
      const core = t.replace(/[.,?!…]/g, '');
      const k = keys[core];
      out.push({t: k ? core : t, k, p: k ? t.slice(core.length) : undefined, br: li > 0 && wi === 0});
    });
  });
  return out;
};
const Caption: React.FC<{text: string; keys: Record<string, string>; local: number; dur: number; last: boolean}> = ({text, keys, local, dur, last}) => {
  const {A} = useT();
  if (!text) return null;
  const ws = parse(text, keys);
  const a = 4, b = dur - 26, step = (b - a) / ws.length;
  const inn = sp(local, 0, SPR.card);
  const out = last ? tw(local, dur - 10, dur - 2, 0, 1, EZ.exit) : tw(local, dur - 6, dur, 0, 1, EZ.exit);
  return (
    <div style={{position: 'absolute', top: 1232, left: 144, right: 144, textAlign: 'center', fontFamily: 'IT', fontWeight: 650, fontSize: TS.cap,
      lineHeight: 1.3, letterSpacing: -0.4, opacity: Math.min(1, inn * 1.5) * (1 - out), filter: `blur(${Math.max(0, 1 - inn) * 8 + out * 8}px)`,
      transform: `translateY(${(1 - inn) * 24}px)`}}>
      {ws.map((w, i) => {
        const at = a + i * step;
        const on = local >= at;
        const pop = on ? sp(local, at, SPR.word) : 0;
        const base: React.CSSProperties = {display: 'inline-block', marginRight: '0.26em', color: on ? TXT.hi : TXT.dim,
          transform: on ? `translateY(${(1 - pop) * 6}px)` : 'none'};
        const kStyle: React.CSSProperties = {...base, fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: TS.cap + 10, lineHeight: 1.02,
          borderRadius: SP(1.5), padding: `0 ${SP(1.75)}px`, transform: `scale(${on ? 0.86 + 0.14 * pop : 1})`, marginRight: w.p ? 0 : '0.26em',
          ...(w.k === 'pill'
            ? {color: on ? INK : TXT.dim, background: on ? A : 'transparent', border: `2px solid ${on ? A : '#3C403C'}`}
            : {color: on ? A : TXT.dim, border: `2px solid ${on ? A : '#3C403C'}`})};
        return (
          <React.Fragment key={i}>
            {w.br && <br />}
            {w.k ? <><span style={kStyle}>{w.t}</span>{w.p && <span style={{...base, marginRight: '0.26em'}}>{w.p}</span>}</> : <span style={base}>{w.t}</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

/* Texto cinético: letras entram por máscara, em cascata, com o espaçamento assentando */
const KineticTitle: React.FC<{title: string; local: number; dur: number; cam: {z: number}}> = ({title, local, dur, cam}) => {
  const {A} = useT();
  const lines = title.split('|');
  const out = tw(local, dur - 8, dur, 0, 1, EZ.exit);
  let idx = 0;
  return (
    <div style={{position: 'absolute', top: 232, left: 96, right: 96, textAlign: 'center', fontFamily: 'IT', fontWeight: 800, fontSize: TS.title,
      lineHeight: 1.1, color: TXT.hi, opacity: 1 - out, filter: `blur(${out * 12}px)`, transform: `translateY(${-out * 24}px) scale(${1 + (cam.z - 1) * 0.5})`,
      transformOrigin: '540px 0'}}>
      {lines.map((ln, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {ln.split(/(\*[^*]+\*)/).filter(Boolean).map((part, k) => {
            const serif = part.startsWith('*');
            const txt = serif ? part.slice(1, -1) : part;
            if (serif) {
              const d = 6 + idx * 0.9; idx += txt.length;
              const s = sp(local, d + 6, SPR.pop);
              return (
                <span key={k} style={{display: 'inline-block', fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: TS.title + 16, color: A,
                  transform: `scale(${0.6 + 0.4 * s}) translateY(${(1 - s) * 30}px)`, opacity: Math.min(1, s * 1.6), padding: '0 0.04em'}}>{txt}</span>
              );
            }
            return txt.split(' ').map((w, wi, arr) => (
              <span key={`${k}-${wi}`} style={{display: 'inline-block', overflow: 'hidden', verticalAlign: 'top', paddingBottom: 6}}>
                {w.split('').map((ch, ci) => {
                  const d = 2 + idx * 0.9; idx++;
                  const s = sp(local, d, SPR.word);
                  return <span key={ci} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 105}%)`, letterSpacing: `${(1 - s) * 0.06 - 0.015}em`}}>{ch}</span>;
                })}
                {wi < arr.length - 1 && <span style={{display: 'inline-block', width: '0.26em'}} />}
              </span>
            ));
          })}
        </div>
      ))}
      <div style={{display: 'flex', justifyContent: 'center', marginTop: SP(2), opacity: tw(local, 26, 34), transform: `translateY(${Math.sin(local / 6) * 6}px)`}}>
        <Ico n="down" s={48} c={A} w={2.6} />
      </div>
    </div>
  );
};

/* =========================== Área segura (auditoria) =========================== */
export const SafeZone: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(255,0,80,0.3)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(255,0,80,0.3)'}} />
    <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(255,0,80,0.3)'}} />
  </AbsoluteFill>
);

/* =========================== Composição =========================== */
export type X3Props = {hook: 'A' | 'B' | 'C'; safe?: boolean; blur?: boolean; samples?: number};

const Frame: React.FC<{hook: 'A' | 'B' | 'C'}> = ({hook}) => {
  const F = useF();
  const {box, i, local, s} = boxAt(F);
  const cam = camAt(F);
  const fl = flashAt(F);
  const drift = Math.sin(F / 40) * 4;
  return (
    <AbsoluteFill>
      <Stage lightY={box.top + box.h / 2 - 280} cam={cam} flash={fl} />
      <AbsoluteFill style={{transformOrigin: `540px ${cam.y}px`, transform: `translateX(${drift}px) scale(${cam.z})`}}>
        <Shell />
      </AbsoluteFill>
      {s.id === 'hook' && <KineticTitle title={R.hooks[hook].title} local={local} dur={s.dur} cam={cam} />}
      <Caption key={i} text={s.caption ?? ''} keys={s.keys ?? {}} local={local} dur={s.dur} last={i === SC.length - 1} />
    </AbsoluteFill>
  );
};

export const XReel3: React.FC<X3Props> = ({hook, safe, blur = true, samples = 3}) => {
  const t = THEMES[R.serie] ?? THEMES.tutorial;
  return (
    <Ctx.Provider value={{A: t.a, A2: t.a2}}>
      <AbsoluteFill style={{background: t.bg, overflow: 'hidden'}}>
        <style>{fontCss}</style>
        {blur ? <CameraMotionBlur shutterAngle={180} samples={samples}><Frame hook={hook} /></CameraMotionBlur> : <Frame hook={hook} />}
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.62) 100%)'}} />
        {safe && <SafeZone />}
      </AbsoluteFill>
    </Ctx.Provider>
  );
};

/* =========================== Capa =========================== */
export const Capa3: React.FC<{hook: 'A' | 'B' | 'C'}> = ({hook}) => {
  const t = THEMES[R.serie] ?? THEMES.tutorial;
  const h = R.hooks[hook];
  return (
    <Ctx.Provider value={{A: t.a, A2: t.a2}}>
      <AbsoluteFill style={{background: t.bg}}>
        <style>{fontCss}</style>
        <Stage lightY={600} cam={{z: 1, y: 864}} flash={{v: 0, err: 0}} />
        {/* recorte 3:4 do grid: y de 240 a 1680 */}
        <div style={{position: 'absolute', top: 400, left: 96, right: 96, textAlign: 'center'}}>
          <div style={{fontFamily: 'JB', fontSize: TS.small, letterSpacing: 6, color: t.a}}>TUTORIAL 01 · CLAUDE CODE</div>
          <div style={{fontFamily: 'IT', fontWeight: 800, fontSize: 96, lineHeight: 1.06, letterSpacing: -1.6, color: TXT.hi, marginTop: SP(4)}}>
            {h.title.split('|').map((ln, i) => (
              <div key={i} style={{whiteSpace: 'nowrap'}}>{ln.split(/(\*[^*]+\*)/).map((p, k) => p.startsWith('*')
                ? <span key={k} style={{fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: 112, color: t.a}}>{p.slice(1, -1)}</span>
                : <span key={k}>{p}</span>)}</div>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', top: 880, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <Glass r={32} hot={0.4}>
            <div style={{display: 'flex', alignItems: 'center', gap: SP(4), padding: `${SP(5)}px ${SP(7)}px`}}>
              <SPIcon s={120} />
              <div style={{fontFamily: 'SR', fontStyle: 'italic', fontSize: 120, color: t.a, lineHeight: 1}}>Superpowers</div>
            </div>
          </Glass>
        </div>
        <div style={{position: 'absolute', top: 1200, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: SP(2)}}>
          <Img src={staticFile('icone.png')} style={{width: SP(7.5)}} />
          <div style={{fontFamily: 'JB', fontWeight: 700, fontSize: 38, color: TXT.hi}}>@xarpy_dev</div>
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 85% 70% at 50% 45%, transparent 55%, rgba(0,0,0,0.62) 100%)'}} />
      </AbsoluteFill>
    </Ctx.Provider>
  );
};
