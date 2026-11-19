import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import R from './roteiro.json';

/* ================= Tokens ================= */
// Luz e acento por série (paletas oficiais)
export const THEMES: Record<string, {accent: string; accent2: string; bg: string}> = {
  tutorial: {accent: '#92FF5F', accent2: '#B5FF8E', bg: '#070807'},
  engenharia: {accent: '#FF5100', accent2: '#FF7A3D', bg: '#060607'},
  inovacao: {accent: '#64DBE8', accent2: '#9BEAF2', bg: '#04141E'},
};
const ERR = '#FF7036';
// Escala tipográfica fixa
const TS = {hero: 132, title: 74, cap: 56, h2: 50, body: 38, small: 30, micro: 24};
// Curvas por tipo de elemento
const EZ = {
  morph: Easing.bezier(0.76, 0, 0.24, 1),
  camera: Easing.bezier(0.45, 0, 0.15, 1),
  word: Easing.out(Easing.quad),
  pop: Easing.out(Easing.back(1.7)),
  soft: Easing.bezier(0.16, 1, 0.3, 1),
};
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const tween = (f: number, a: number, b: number, from = 0, to = 1, ease = EZ.soft) =>
  interpolate(f, [a, b], [from, to], {...clamp, easing: ease});

type Box = {w: number; h: number; top: number};
type Scene = (typeof R.scenes)[number];
const SC = R.scenes as Scene[];
export const STARTS = SC.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? 0 : acc[i - 1] + SC[i - 1].dur], []);
export const TOTAL = SC.reduce((a, s) => a + s.dur, 0);

/* ================= Contexto ================= */
const Ctx = React.createContext({A: THEMES.tutorial.accent, A2: THEMES.tutorial.accent2});
const useT = () => React.useContext(Ctx);

const fontCss = `
@font-face{font-family:'IT';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'JB';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
@font-face{font-family:'SR';src:url('${staticFile('serif-italic.woff2')}');font-style:italic;}`;

const glass: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(44,48,44,0.94), rgba(19,22,19,0.97))',
  border: '1.5px solid rgba(255,255,255,0.085)',
  boxShadow: '0 60px 110px rgba(0,0,0,0.7), 0 10px 30px rgba(0,0,0,0.4), inset 0 1.5px 0 rgba(255,255,255,0.08)',
};

/* ================= Cenário ================= */
const Stage: React.FC<{lightY: number}> = ({lightY}) => {
  const f = useCurrentFrame();
  const {A} = useT();
  const rgb = hexRgb(A);
  const pulse = 0.88 + Math.sin(f / 22) * 0.07;
  const H = 1110, vx = 540, vy = 780;
  const rays = Array.from({length: 27}, (_, i) => 540 + (i - 13) * 170);
  const rows = Array.from({length: 12}, (_, i) => H + Math.pow(i / 11, 1.9) * 830);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 640px 780px at 50% ${lightY}px, rgba(${rgb},${0.085 * pulse}), transparent 70%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="0.14" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.2" />
          </linearGradient>
          <mask id="m"><rect x="0" y={H} width="1080" height={1920 - H} fill="url(#fade)" /></mask>
        </defs>
        <g mask="url(#m)" stroke={A} strokeOpacity={0.15} strokeWidth={1.3}>
          {rays.map((x) => <line key={x} x1={vx + (x - vx) * ((H - vy) / (1920 - vy))} y1={H} x2={x} y2={1920} />)}
          {rows.map((y) => <line key={y} x1={0} y1={y} x2={1080} y2={y} />)}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 80, right: 80, top: H - 75, height: 150, borderRadius: '50%',
        background: `radial-gradient(ellipse at center, rgba(${rgb},${0.24 * pulse}), transparent 70%)`, filter: 'blur(20px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: H, height: 1.5, background: `linear-gradient(90deg, transparent, rgba(${rgb},0.3), transparent)`}} />
    </AbsoluteFill>
  );
};
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',');

/* ================= Microinterações ================= */
const Cursor: React.FC<{f: number; path: [number, number, number][]; clickAt?: number}> = ({f, path, clickAt}) => {
  const fr = path.map((p) => p[0]);
  const x = interpolate(f, fr, path.map((p) => p[1]), {...clamp, easing: EZ.camera});
  const y = interpolate(f, fr, path.map((p) => p[2]), {...clamp, easing: EZ.camera});
  const op = tween(f, fr[0], fr[0] + 6);
  const press = clickAt === undefined ? 0 : interpolate(f, [clickAt - 2, clickAt, clickAt + 5], [0, 1, 0], clamp);
  const ring = clickAt === undefined ? 0 : tween(f, clickAt, clickAt + 14);
  const {A} = useT();
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: op, zIndex: 20}}>
      {clickAt !== undefined && f >= clickAt && (
        <div style={{position: 'absolute', left: -40 * ring, top: -40 * ring, width: 80 * ring, height: 80 * ring, borderRadius: '50%',
          border: `3px solid ${A}`, opacity: 1 - ring}} />
      )}
      <svg width={46} height={56} viewBox="0 0 23 28" style={{transform: `scale(${1 - press * 0.15})`, transformOrigin: '0 0',
        filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.6))'}}>
        <path d="M1 1 L1 22 L6.5 16.8 L10.4 26 L14 24.4 L10.2 15.4 L17.5 15.4 Z" fill="#fff" stroke="#0A0C0A" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
const KeyCap: React.FC<{f: number; at: number; label: string; x: number; y: number}> = ({f, at, label, x, y}) => {
  const show = tween(f, at - 10, at - 2, 0, 1, EZ.pop);
  const press = interpolate(f, [at - 1, at + 1, at + 6], [0, 1, 0], clamp);
  const hide = tween(f, at + 14, at + 22);
  const {A} = useT();
  return (
    <div style={{position: 'absolute', left: x, top: y, opacity: show * (1 - hide), transform: `scale(${0.8 + 0.2 * show}) translateY(${press * 8}px)`}}>
      <div style={{padding: '18px 30px', borderRadius: 18, fontFamily: 'IT', fontWeight: 700, fontSize: TS.small, color: press > 0.3 ? '#0A0C0A' : '#fff',
        background: press > 0.3 ? A : 'linear-gradient(180deg,#3A3F3A,#232723)', border: '1.5px solid rgba(255,255,255,0.12)',
        boxShadow: `0 ${10 - press * 8}px 0 #0D0F0D, 0 20px 30px rgba(0,0,0,0.5)`}}>{label}</div>
    </div>
  );
};

/* ================= Conteúdo das cenas (coordenadas internas da caixa) ================= */
type CP = {f: number; d: number; box: Box};

const PromptC: React.FC<CP> = ({f}) => {
  const txt = 'faz a tela de login do app';
  const n = Math.floor(interpolate(f, [14, 48], [0, txt.length], clamp));
  const sent = f >= 52;
  const {A} = useT();
  return (
    <div style={{padding: '0 44px', height: '100%', display: 'flex', alignItems: 'center', gap: 24}}>
      <div style={{width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontFamily: 'JB', fontSize: TS.small, color: A}}>&gt;_</div>
      <div style={{fontFamily: 'JB', fontSize: TS.body, color: sent ? '#7C817C' : '#EDEFED', flex: 1}}>
        {txt.slice(0, n)}
        <span style={{display: 'inline-block', width: 4, height: 44, background: A, marginLeft: 4, verticalAlign: 'middle',
          opacity: !sent && Math.floor(f / 8) % 2 === 0 ? 1 : 0}} />
      </div>
      <div style={{width: 72, height: 72, borderRadius: 36, background: n === txt.length ? A : 'rgba(255,255,255,0.08)', display: 'flex',
        alignItems: 'center', justifyContent: 'center', transform: `scale(${1 - interpolate(f, [50, 52, 58], [0, 0.12, 0], clamp)})`}}>
        <svg width={30} height={30} viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7" stroke="#0A0C0A" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </div>
    </div>
  );
};

const CODE = [
  ['k', 'export default function'], ['f', '  Login() {'], ['v', '  const [user, setUser]'], ['s', "  = useState('')"],
  ['k', '  return ('], ['t', '    <form className="card">'], ['t', '      <input name="email" />'], ['t', '      <input type="pwd" />'],
  ['t', '      <Button>Entrar</Button>'], ['t', '    </form>'], ['k', '  )'], ['f', '}'], ['k', 'import { Button }'], ['s', "  from './ui'"],
];
const CodeC: React.FC<CP> = ({f}) => {
  const {A} = useT();
  const col: Record<string, string> = {k: '#C792EA', f: '#82AAFF', v: '#EDEFED', s: '#C3E88D', t: '#89DDFF'};
  const scroll = tween(f, 20, 60, 0, 1) * 300;
  const err = tween(f, 62, 76, 0, 1, EZ.pop);
  const shake = f >= 62 && f < 76 ? Math.sin(f * 2.4) * (76 - f) * 0.8 : 0;
  return (
    <div style={{position: 'relative', height: '100%', transform: `translateX(${shake}px)`}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '22px 30px', borderBottom: '1.5px solid rgba(255,255,255,0.06)'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        <div style={{fontFamily: 'JB', fontSize: TS.micro, color: '#6B706B', marginLeft: 14}}>Login.tsx</div>
        <div style={{marginLeft: 'auto', fontFamily: 'JB', fontSize: TS.micro, color: A, opacity: f < 62 ? 1 : 0.3}}>escrevendo…</div>
      </div>
      <div style={{position: 'absolute', top: 90, left: 0, right: 0, bottom: 0, overflow: 'hidden'}}>
        <div style={{padding: '10px 34px', transform: `translateY(${-scroll}px)`}}>
          {CODE.map(([c, l], i) => (
            <div key={i} style={{fontFamily: 'JB', fontSize: 31, lineHeight: 1.65, color: col[c], whiteSpace: 'pre',
              opacity: tween(f, 2 + i * 3.4, 6 + i * 3.4) * (1 - err * 0.55)}}>
              <span style={{color: '#4A4F4A', marginRight: 22}}>{String(i + 1).padStart(2, ' ')}</span>{l}
            </div>
          ))}
        </div>
      </div>
      <div style={{position: 'absolute', left: 30, right: 30, bottom: 30, transform: `translateY(${(1 - err) * 160}px)`, opacity: err,
        background: 'linear-gradient(180deg, #3A1C12, #26130D)', border: `1.5px solid ${ERR}`, borderRadius: 22, padding: '24px 28px',
        display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 20px 40px rgba(0,0,0,0.6)'}}>
        <div style={{width: 52, height: 52, borderRadius: 26, background: ERR, color: '#1A0B05', fontFamily: 'IT', fontWeight: 800, fontSize: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✕</div>
        <div style={{flex: 1}}>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 34, color: '#fff'}}>Não era essa tela</div>
          <div style={{fontFamily: 'IT', fontWeight: 500, fontSize: TS.micro, color: '#D7A898', marginTop: 4}}>Faltou login com Google e o layout errou</div>
        </div>
        <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: TS.micro, color: ERR, border: `1.5px solid ${ERR}`, borderRadius: 12, padding: '10px 18px'}}>Refazer</div>
      </div>
    </div>
  );
};

const ProductC: React.FC<CP> = ({f}) => {
  const {A, A2} = useT();
  return (
    <div style={{padding: 54}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
        <div style={{width: 132, height: 132, borderRadius: 32, background: `linear-gradient(160deg, ${A2}, ${A})`, display: 'flex',
          alignItems: 'center', justifyContent: 'center', fontFamily: 'IT', fontWeight: 800, fontSize: 58, color: '#0A0C0A',
          transform: `scale(${tween(f, 10, 26, 0.6, 1, EZ.pop)}) rotate(${tween(f, 10, 26, -12, 0, EZ.pop)}deg)`,
          boxShadow: `0 0 50px rgba(${hexRgb(A)},0.3)`}}>SP</div>
        <div>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 64, color: '#fff', letterSpacing: -1.2}}>Superpowers</div>
          <div style={{fontFamily: 'JB', fontSize: TS.micro, color: '#7C817C', marginTop: 6}}>skill · Claude Code</div>
        </div>
      </div>
      <div style={{fontFamily: 'IT', fontWeight: 500, fontSize: TS.body, color: '#AEB3AE', marginTop: 34, opacity: tween(f, 16, 28)}}>Método de trabalho para o seu agente</div>
      <div style={{display: 'inline-block', marginTop: 30, border: `2px solid rgba(${hexRgb(A)},0.55)`, borderRadius: 999, padding: '12px 28px',
        fontFamily: 'IT', fontWeight: 700, fontSize: TS.small, color: A, background: `rgba(${hexRgb(A)},0.07)`, opacity: tween(f, 24, 36),
        transform: `translateY(${tween(f, 24, 36, 14, 0)}px)`}}>Open source · github.com/obra/superpowers</div>
    </div>
  );
};

const TerminalC: React.FC<CP> = ({f}) => {
  const {A} = useT();
  const cmd = '/plugin install superpowers@claude-plugins-official';
  const n = Math.floor(interpolate(f, [12, 56], [0, cmd.length], clamp));
  const done = f >= 70;
  return (
    <div style={{height: '100%'}}>
      <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '22px 28px', borderBottom: '1.5px solid rgba(255,255,255,0.06)'}}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
        <div style={{fontFamily: 'JB', fontSize: TS.micro, color: '#6B706B', marginLeft: 14}}>claude code</div>
      </div>
      <div style={{padding: '30px 36px', fontFamily: 'JB', fontSize: TS.body, lineHeight: 1.5, color: '#EDEFED', whiteSpace: 'pre'}}>
        <span style={{color: A}}>&gt; </span>{cmd.slice(0, Math.min(n, 15))}{n > 15 ? '\n  ' + cmd.slice(16, n) : ''}
        {!done && <span style={{display: 'inline-block', width: 18, height: 40, background: A, verticalAlign: 'middle', marginLeft: 4,
          opacity: Math.floor(f / 8) % 2 === 0 ? 1 : 0}} />}
        {done && <div style={{color: A, fontSize: TS.small, marginTop: 10, opacity: tween(f, 70, 78), transform: `translateX(${tween(f, 70, 78, -16, 0)}px)`}}>✓ Plugin instalado</div>}
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
        const e = tween(f, 4 + i * 5, 20 + i * 5);
        const on = i <= active, cur = i === active;
        const pop = cur ? interpolate(f - (22 + i * 22), [0, 4, 10], [1, 1.06, 1], clamp) : 1;
        return (
          <React.Fragment key={s}>
            {i > 0 && (
              <div style={{width: 3, height: 40, background: 'rgba(255,255,255,0.12)', position: 'relative', opacity: e}}>
                <div style={{position: 'absolute', left: 0, top: 0, width: 3, background: A, height: `${tween(f, 22 + (i - 1) * 22, 34 + (i - 1) * 22) * 100}%`}} />
              </div>
            )}
            <div style={{...glass, width: 620, padding: '30px 0', textAlign: 'center', borderRadius: 26, fontFamily: 'IT', fontWeight: 700, fontSize: 42,
              opacity: e, transform: `translateY(${(1 - e) * 40}px) scale(${pop})`, filter: `blur(${(1 - e) * 10}px)`,
              color: cur ? '#0A0C0A' : on ? '#fff' : '#8A8F8A',
              background: cur ? `linear-gradient(160deg, ${A2}, ${A})` : glass.background,
              border: cur ? '1.5px solid transparent' : on ? `1.5px solid rgba(${hexRgb(A)},0.45)` : glass.border,
              boxShadow: cur ? `0 0 70px rgba(${hexRgb(A)},0.3), 0 40px 80px rgba(0,0,0,0.6)` : glass.boxShadow}}>
              <span style={{fontFamily: 'JB', fontSize: TS.micro, opacity: 0.6, marginRight: 16}}>0{i + 1}</span>{s}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const CompareC: React.FC<CP> = ({f}) => {
  const {A} = useT();
  const a = tween(f, 6, 22), b = tween(f, 26, 42);
  const press = interpolate(f, [48, 50, 56], [0, 1, 0], clamp);
  const ok = f >= 50;
  const row = (p: number): React.CSSProperties => ({opacity: p, transform: `translateY(${(1 - p) * 40}px)`, filter: `blur(${(1 - p) * 10}px)`});
  return (
    <div style={{padding: 46, position: 'relative', height: '100%'}}>
      <div style={row(a)}>
        <div style={{display: 'inline-block', fontFamily: 'JB', fontWeight: 700, fontSize: TS.micro, letterSpacing: 3, color: ERR,
          border: `1.5px solid ${ERR}`, borderRadius: 10, padding: '6px 14px'}}>✕ SEM A SKILL</div>
        <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: TS.h2, color: '#9A9F9A', marginTop: 16, textDecoration: f > 30 ? 'line-through' : 'none',
          textDecorationColor: ERR}}>Código no chute, refaz várias vezes</div>
      </div>
      <div style={{height: 1.5, background: 'rgba(255,255,255,0.08)', margin: '36px 0'}} />
      <div style={row(b)}>
        <div style={{display: 'inline-block', fontFamily: 'JB', fontWeight: 700, fontSize: TS.micro, letterSpacing: 3, color: A,
          border: `1.5px solid ${A}`, borderRadius: 10, padding: '6px 14px'}}>✓ COM SUPERPOWERS</div>
        <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: TS.h2, color: '#fff', marginTop: 16}}>Plano aprovado antes do código</div>
        <div style={{display: 'inline-block', marginTop: 26, padding: '16px 32px', borderRadius: 16, fontFamily: 'IT', fontWeight: 700, fontSize: TS.small,
          background: ok ? A : 'rgba(255,255,255,0.08)', color: ok ? '#0A0C0A' : '#fff', transform: `scale(${1 - press * 0.08})`,
          border: '1.5px solid rgba(255,255,255,0.1)'}}>{ok ? 'Plano aprovado ✓' : 'Aprovar plano'}</div>
      </div>
      <Cursor f={f} path={[[30, 780, 520], [46, 200, 470], [62, 230, 500]]} clickAt={50} />
    </div>
  );
};

const CtaC: React.FC<CP> = ({f, d}) => {
  const {A, A2} = useT();
  const press = interpolate(f, [30, 32, 38], [0, 1, 0], clamp);
  const saved = f >= 32;
  const out = tween(f, d - 22, d - 12);
  return (
    <div style={{padding: '54px 50px', textAlign: 'center', opacity: 1 - out, filter: `blur(${out * 10}px)`, position: 'relative', height: '100%'}}>
      <div style={{fontFamily: 'JB', fontWeight: 500, fontSize: TS.small, letterSpacing: 2, color: '#8A8F8A'}}>TUTORIAL 01 DE 11</div>
      <div style={{display: 'inline-flex', alignItems: 'center', gap: 20, marginTop: 30, padding: '10px 50px', borderRadius: 24,
        background: saved ? `linear-gradient(160deg, ${A2}, ${A})` : 'rgba(255,255,255,0.07)', border: saved ? 'none' : `2px solid ${A}`,
        transform: `scale(${(1 - press * 0.07) * tween(f, 6, 18, 0.85, 1, EZ.pop)})`}}>
        <svg width={64} height={78} viewBox="0 0 24 30"><path d="M3 2h18v26l-9-6-9 6z" fill={saved ? '#0A0C0A' : 'none'} stroke={saved ? '#0A0C0A' : A} strokeWidth={2.4} strokeLinejoin="round" /></svg>
        <div style={{fontFamily: 'IT', fontWeight: 800, fontSize: 110, letterSpacing: -2, color: saved ? '#0A0C0A' : A}}>{saved ? 'SALVO' : 'SALVA'}</div>
      </div>
      <div style={{fontFamily: 'IT', fontWeight: 600, fontSize: TS.body, color: '#E8EAE8', marginTop: 34, opacity: tween(f, 14, 26)}}>e segue para a próxima skill</div>
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 30, opacity: tween(f, 20, 32)}}>
        <Img src={staticFile('icone.png')} style={{width: 60}} />
        <div style={{fontFamily: 'JB', fontWeight: 700, fontSize: 38, color: '#fff'}}>@xarpy_dev</div>
      </div>
      <Cursor f={f} path={[[10, 760, 500], [28, 420, 190], [44, 470, 240]]} clickAt={32} />
    </div>
  );
};

const CONTENT: Record<string, React.FC<CP>> = {prompt: PromptC, code: CodeC, product: ProductC, terminal: TerminalC, flow: FlowC, compare: CompareC, cta: CtaC};

/* ================= Caixa que se transforma entre cenas ================= */
const boxAt = (F: number): {box: Box; i: number; local: number; ghost: number} => {
  let i = 0;
  while (i < SC.length - 1 && F >= STARTS[i + 1]) i++;
  const s = SC[i], local = F - STARTS[i];
  const prev: Box = i > 0 ? SC[i - 1].box : s.box;
  const t = interpolate(local, [0, 13], [0, 1], {...clamp, easing: EZ.morph});
  let box: Box = {w: lerp(prev.w, s.box.w, t), h: lerp(prev.h, s.box.h, t), top: lerp(prev.top, s.box.top, t)};
  const lb = (s as {loopBox?: Box}).loopBox;
  if (lb) {
    const u = interpolate(local, [s.dur - 16, s.dur], [0, 1], {...clamp, easing: EZ.morph});
    box = {w: lerp(box.w, lb.w, u), h: lerp(box.h, lb.h, u), top: lerp(box.top, lb.top, u)};
  }
  // No fluxo, a caixa vira só um contêiner e os blocos aparecem soltos
  const g = (k: number) => (SC[k]?.type === 'flow' ? 1 : 0);
  const ghost = lerp(g(i - 1), g(i), t);
  return {box, i, local, ghost};
};

const Shell: React.FC = () => {
  const F = useCurrentFrame();
  const {box, i, local, ghost} = boxAt(F);
  const s = SC[i];
  const C = CONTENT[s.type];
  const isFirst = i === 0;
  const enter = isFirst ? tween(local, 0, 10) : tween(local, 6, 14);
  const exit = i < SC.length - 1 ? tween(local, s.dur - 5, s.dur) : 0;
  const shellIn = 1; // a caixa já começa na tela: o último quadro volta para ela e o vídeo fecha o loop
  return (
    <div style={{position: 'absolute', left: 540 - box.w / 2, top: box.top, width: box.w, height: box.h,
      transform: `translateY(${(1 - shellIn) * 80}px) scale(${0.9 + 0.1 * shellIn})`, opacity: Math.min(1, shellIn * 1.5)}}>
      <div style={{...glass, position: 'absolute', inset: 0, borderRadius: 34, opacity: 1 - ghost}} />
      <div style={{position: 'absolute', inset: 0, borderRadius: 34, overflow: ghost > 0.5 ? 'visible' : 'hidden',
        opacity: enter * (1 - exit), filter: `blur(${(1 - enter) * 12 + exit * 10}px)`, transform: `translateY(${(1 - enter) * 24}px)`}}>
        <C f={local} d={s.dur} box={s.box} />
      </div>
    </div>
  );
};

/* ================= Câmera ================= */
const camAt = (F: number) => {
  let i = 0;
  while (i < SC.length - 1 && F >= STARTS[i + 1]) i++;
  const k = SC[i].cam as number[][];
  const local = F - STARTS[i];
  const fr = k.map((p) => p[0]);
  return {
    z: interpolate(local, fr, k.map((p) => p[1]), {...clamp, easing: EZ.camera}),
    y: interpolate(local, fr, k.map((p) => p[2]), {...clamp, easing: EZ.camera}),
  };
};

/* ================= Legenda e título ================= */
type Wd = {t: string; k?: string; p?: string; br?: boolean};
const parse = (cap: string, keys: Record<string, string>): Wd[] => {
  const out: Wd[] = [];
  cap.split('|').forEach((line, li) => {
    line.trim().split(' ').forEach((t, wi) => {
      const core = t.replace(/[.,?!…]/g, '').replace(/\*/g, '');
      const k = keys[core];
      out.push({t: k ? core : t.replace(/\*/g, ''), k, p: k ? t.replace(/\*/g, '').slice(core.length) : undefined, br: li > 0 && wi === 0});
    });
  });
  return out;
};
const Caption: React.FC<{text: string; keys: Record<string, string>; local: number; dur: number; last: boolean}> = ({text, keys, local, dur, last}) => {
  const {A} = useT();
  const ws = parse(text, keys);
  const a = 6, b = dur - 24, step = (b - a) / ws.length;
  const inn = tween(local, 0, 10);
  const out = last ? tween(local, dur - 10, dur - 2) : tween(local, dur - 8, dur);
  const dim = '#474B47';
  return (
    <div style={{position: 'absolute', top: 1190, left: 80, right: 150, textAlign: 'center', fontFamily: 'IT', fontWeight: 700, fontSize: TS.cap,
      lineHeight: 1.32, letterSpacing: -0.3, opacity: inn * (1 - out), filter: `blur(${(1 - inn) * 8 + out * 8}px)`,
      transform: `translateY(${(1 - inn) * 20}px)`}}>
      {ws.map((w, i) => {
        const at = a + i * step;
        const on = local >= at;
        const pop = interpolate(local - at, [0, 5], [0.8, 1], {...clamp, easing: EZ.pop});
        const base: React.CSSProperties = {display: 'inline-block', marginRight: 14, color: on ? '#F4F5F4' : dim};
        const kStyle: React.CSSProperties = {...base, fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: TS.cap + 10, lineHeight: 1.02,
          borderRadius: 12, padding: '0 14px', transform: `scale(${on ? pop : 1})`, marginRight: w.p ? 0 : 14,
          ...(w.k === 'pill'
            ? {color: on ? '#0A0C0A' : dim, background: on ? A : 'transparent', border: `2px solid ${on ? A : '#353935'}`}
            : {color: on ? A : dim, border: `2px solid ${on ? A : '#353935'}`})};
        return (
          <React.Fragment key={i}>
            {w.br && <br />}
            {w.k ? <><span style={kStyle}>{w.t}</span>{w.p && <span style={{...base, marginRight: 14}}>{w.p}</span>}</> : <span style={base}>{w.t}</span>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

const HookTitle: React.FC<{title: string; local: number; dur: number}> = ({title, local, dur}) => {
  const {A} = useT();
  const lines = title.split('|');
  const out = tween(local, dur - 10, dur);
  return (
    <div style={{position: 'absolute', top: 250, left: 70, right: 70, textAlign: 'center', fontFamily: 'IT', fontWeight: 800, fontSize: TS.title,
      lineHeight: 1.12, letterSpacing: -0.6, color: '#fff', opacity: 1 - out, filter: `blur(${out * 12}px)`}}>
      {lines.map((ln, li) => (
        <div key={li} style={{overflow: 'hidden', paddingBottom: 6}}>
          <div style={{transform: `translateY(${tween(local, li * 5, 16 + li * 5, 110, 0, EZ.soft)}%)`}}>
            {ln.split(/(\*[^*]+\*)/).map((p, k) => p.startsWith('*')
              ? <span key={k} style={{fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: TS.title + 14, color: A}}>{p.slice(1, -1)}</span>
              : <span key={k}>{p}</span>)}
          </div>
        </div>
      ))}
      <div style={{fontSize: 52, color: A, marginTop: 14, opacity: tween(local, 20, 30), transform: `translateY(${Math.sin(local / 6) * 6}px)`}}>↓</div>
    </div>
  );
};

/* ================= Grão e área segura ================= */
const Grain: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.075, mixBlendMode: 'overlay', pointerEvents: 'none'}}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={f % 30} stitchTiles="stitch" /></filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  );
};
export const SafeZone: React.FC = () => (
  <AbsoluteFill style={{pointerEvents: 'none'}}>
    <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(255,0,80,0.28)'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(255,0,80,0.28)'}} />
    <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(255,0,80,0.28)'}} />
  </AbsoluteFill>
);

/* ================= Composição ================= */
export type XProps = {hook: 'A' | 'B' | 'C'; safe?: boolean; blur?: boolean};

const Frame: React.FC<{hook: 'A' | 'B' | 'C'}> = ({hook}) => {
  const F = useCurrentFrame();
  const {box, i, local} = boxAt(F);
  const s = SC[i];
  const cam = camAt(F);
  const h = R.hooks[hook];
  const cap = s.id === 'hook' ? h.caption : (s as {caption?: string}).caption ?? '';
  const keys = (s.id === 'hook' ? h.keys : (s as {keys?: Record<string, string>}).keys ?? {}) as Record<string, string>;
  return (
    <AbsoluteFill>
      <Stage lightY={box.top + box.h / 2 - 260} />
      <AbsoluteFill style={{transformOrigin: `540px ${cam.y}px`, transform: `scale(${cam.z})`}}>
        <Shell />
        {s.type === 'prompt' && <KeyCap f={local} at={52} label="Enter ⏎" x={760} y={box.top + box.h + 40} />}
        {s.type === 'terminal' && <KeyCap f={local} at={64} label="Enter ⏎" x={780} y={box.top + box.h + 40} />}
      </AbsoluteFill>
      {s.id === 'hook' && <HookTitle title={h.title} local={local} dur={s.dur} />}
      <Caption key={i} text={cap} keys={keys} local={local} dur={s.dur} last={i === SC.length - 1} />
    </AbsoluteFill>
  );
};

export const XReel: React.FC<XProps> = ({hook, safe, blur = true}) => {
  const t = THEMES[R.serie] ?? THEMES.tutorial;
  return (
    <Ctx.Provider value={{A: t.accent, A2: t.accent2}}>
      <AbsoluteFill style={{background: t.bg, overflow: 'hidden'}}>
        <style>{fontCss}</style>
        {blur ? (
          <CameraMotionBlur shutterAngle={160} samples={4}>
            <Frame hook={hook} />
          </CameraMotionBlur>
        ) : <Frame hook={hook} />}
        <div style={{position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
        <Grain />
        {safe && <SafeZone />}
      </AbsoluteFill>
    </Ctx.Provider>
  );
};

/* ================= Capa ================= */
export const Capa: React.FC<{hook: 'A' | 'B' | 'C'}> = ({hook}) => {
  const t = THEMES[R.serie] ?? THEMES.tutorial;
  const h = R.hooks[hook];
  return (
    <Ctx.Provider value={{A: t.accent, A2: t.accent2}}>
      <AbsoluteFill style={{background: t.bg}}>
        <style>{fontCss}</style>
        <Stage lightY={560} />
        <div style={{position: 'absolute', top: 330, left: 60, right: 60, textAlign: 'center'}}>
          <div style={{fontFamily: 'JB', fontSize: TS.small, letterSpacing: 6, color: t.accent}}>TUTORIAL 01 · CLAUDE CODE</div>
          <div style={{fontFamily: 'IT', fontWeight: 800, fontSize: 92, lineHeight: 1.08, letterSpacing: -1, color: '#fff', marginTop: 34}}>
            {h.title.split('|').map((ln, i) => (
              <div key={i}>{ln.split(/(\*[^*]+\*)/).map((p, k) => p.startsWith('*')
                ? <span key={k} style={{fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: 108, color: t.accent}}>{p.slice(1, -1)}</span>
                : <span key={k}>{p}</span>)}</div>
            ))}
          </div>
        </div>
        <div style={{position: 'absolute', top: 820, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
          <div style={{...glass, borderRadius: 34, padding: '36px 70px'}}>
            <div style={{fontFamily: 'SR', fontStyle: 'italic', fontSize: 130, color: t.accent, lineHeight: 1}}>Superpowers</div>
          </div>
        </div>
        <div style={{position: 'absolute', bottom: 470, left: 0, right: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16}}>
          <Img src={staticFile('icone.png')} style={{width: 60}} />
          <div style={{fontFamily: 'JB', fontWeight: 700, fontSize: 38, color: '#fff'}}>@xarpy_dev</div>
        </div>
        <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.6) 100%)'}} />
        <Grain />
      </AbsoluteFill>
    </Ctx.Provider>
  );
};
