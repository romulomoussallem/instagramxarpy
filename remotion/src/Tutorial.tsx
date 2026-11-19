import React from 'react';
import {AbsoluteFill, Audio, Easing, Img, interpolate, Sequence, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

const L = '#92FF5F'; // Signal Lime
const BG = '#070807';
const fonts = `
@font-face{font-family:'IT';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'JB';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
@font-face{font-family:'SR';src:url('${staticFile('serif-italic.woff2')}');font-style:italic;}`;

const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;

/* ---------- Cenário fixo: foco de luz, horizonte e piso em perspectiva ---------- */
const Stage: React.FC = () => {
  const f = useCurrentFrame();
  const pulse = 0.85 + Math.sin(f / 20) * 0.08;
  const H = 1080; // horizonte
  const vx = 540, vy = 760; // ponto de fuga
  const rays = Array.from({length: 27}, (_, i) => 540 + (i - 13) * 170);
  const rows = Array.from({length: 11}, (_, i) => H + Math.pow(i / 10, 1.9) * 860);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: `radial-gradient(ellipse 620px 760px at 50% 26%, rgba(146,255,95,${0.075 * pulse}), transparent 70%)`}} />
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <defs>
          <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0" />
            <stop offset="0.12" stopColor="#fff" stopOpacity="1" />
            <stop offset="1" stopColor="#fff" stopOpacity="0.25" />
          </linearGradient>
          <mask id="m"><rect x="0" y={H} width="1080" height={1920 - H} fill="url(#fade)" /></mask>
        </defs>
        <g mask="url(#m)" stroke={L} strokeOpacity={0.16} strokeWidth={1.4}>
          {rays.map((x) => <line key={x} x1={vx + (x - vx) * ((H - vy) / (1920 - vy))} y1={H} x2={x} y2={1920} />)}
          {rows.map((y) => <line key={y} x1={0} y1={y} x2={1080} y2={y} />)}
        </g>
      </svg>
      <div style={{position: 'absolute', left: 90, right: 90, top: H - 70, height: 140, borderRadius: '50%',
        background: `radial-gradient(ellipse at center, rgba(146,255,95,${0.22 * pulse}), transparent 70%)`, filter: 'blur(18px)'}} />
      <div style={{position: 'absolute', left: 0, right: 0, top: H, height: 1, background: `linear-gradient(90deg, transparent, rgba(146,255,95,0.25), transparent)`}} />
    </AbsoluteFill>
  );
};

/* ---------- Entrada e saída com desfoque ---------- */
const useEnter = (delay = 0, outAt = 1e9) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: f - delay, fps, config: {damping: 19, stiffness: 150, mass: 0.9}});
  const o = interpolate(f, [outAt, outAt + 9], [0, 1], clamp);
  return {
    opacity: Math.min(1, s * 1.4) * (1 - o),
    transform: `translateY(${(1 - s) * 70 - o * 20}px) scale(${0.9 + 0.1 * s - o * 0.04})`,
    filter: `blur(${(1 - s) * 16 + o * 12}px)`,
  } as React.CSSProperties;
};

const card: React.CSSProperties = {
  background: 'linear-gradient(180deg, rgba(42,46,42,0.92), rgba(20,23,20,0.95))',
  border: '1.5px solid rgba(255,255,255,0.08)', borderRadius: 34,
  boxShadow: '0 50px 90px rgba(0,0,0,0.65), inset 0 1.5px 0 rgba(255,255,255,0.07)',
};

/* ---------- Legenda palavra por palavra ---------- */
type W = {t: string; k?: 'box' | 'pill'};
const Caption: React.FC<{words: W2[]; start: number; end: number; outAt: number}> = ({words, start, end, outAt}) => {
  const f = useCurrentFrame();
  const step = (end - start) / words.length;
  const st = useEnter(start - 4, outAt);
  return (
    <div style={{position: 'absolute', top: 1300, left: 70, right: 70, textAlign: 'center', fontFamily: 'IT', fontWeight: 700,
      fontSize: 58, lineHeight: 1.35, letterSpacing: -0.5, ...st}}>
      {words.map((w, i) => {
        const on = f >= start + i * step;
        const pop = interpolate(f - (start + i * step), [0, 6], [0.85, 1], clamp);
        const base: React.CSSProperties = {display: 'inline-block', marginRight: 14, color: on ? '#F4F5F4' : '#4B4F4B', transition: 'none'};
        if (w.k === 'box') return (
          <React.Fragment key={i}><span style={{...base, fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: 66, color: on ? L : '#4B4F4B',
            border: `2px solid ${on ? L : '#3A3E3A'}`, borderRadius: 12, padding: '0 14px', lineHeight: 1.05, transform: `scale(${on ? pop : 1})`}}>{w.t}</span>{w.p && <span style={{...base, marginLeft: -12}}>{w.p}</span>}</React.Fragment>
        );
        if (w.k === 'pill') return (
          <React.Fragment key={i}><span style={{...base, fontFamily: 'SR', fontStyle: 'italic', fontWeight: 400, fontSize: 66, color: on ? '#0A0C0A' : '#4B4F4B',
            background: on ? L : 'transparent', border: on ? 'none' : '2px solid #3A3E3A', borderRadius: 12, padding: '0 16px', lineHeight: 1.05,
            transform: `scale(${on ? pop : 1})`}}>{w.t}</span>{w.p && <span style={{...base, marginLeft: -12}}>{w.p}</span>}</React.Fragment>
        );
        return <span key={i} style={base}>{w.t}</span>;
      })}
    </div>
  );
};
type W2 = W & {p?: string};
const words = (s: string, keys: Record<string, 'box' | 'pill'> = {}): W2[] => s.split(' ').map((t) => {
  const core = t.replace(/[.,]/g, ''); const k = keys[core];
  return k ? {t: core, k, p: t.slice(core.length)} : {t};
});

const Center: React.FC<{children: React.ReactNode; top?: number}> = ({children, top = 560}) => (
  <div style={{position: 'absolute', top, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>{children}</div>
);

/* ---------- Cenas ---------- */
const S1: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const ring = interpolate(f, [6, 40], [0, 1], {...clamp, easing: Easing.out(Easing.cubic)});
  const t = useEnter(0, d - 9);
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', top: 210, left: 80, right: 80, textAlign: 'center', fontFamily: 'IT', fontWeight: 800,
        fontSize: 76, lineHeight: 1.12, color: '#fff', letterSpacing: -0.4, ...t}}>
        O Claude Code agora<br /><span style={{color: L}}>planeja</span> antes de codar
        <div style={{fontSize: 56, color: L, marginTop: 18}}>↓</div>
      </div>
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: interpolate(f, [d - 9, d], [1, 0], clamp)}}>
        <circle cx={540} cy={830} r={300} fill="none" stroke={L} strokeOpacity={0.35} strokeWidth={2}
          strokeDasharray={2 * Math.PI * 300} strokeDashoffset={(1 - ring) * 2 * Math.PI * 300} transform="rotate(-90 540 830)" />
      </svg>
      <Center top={700}>
        <div style={{...card, padding: '40px 70px', ...useEnter(8, d - 9)}}>
          <div style={{fontFamily: 'SR', fontStyle: 'italic', fontSize: 132, color: L, lineHeight: 1}}>Superpowers</div>
        </div>
      </Center>
    </AbsoluteFill>
  );
};

const S2: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <Center top={600}>
      <div style={{...card, width: 800, padding: 54, ...useEnter(0, d - 9)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 34}}>
          <div style={{width: 128, height: 128, borderRadius: 30, background: `linear-gradient(160deg, #B5FF8E, ${L})`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', fontFamily: 'IT', fontWeight: 800, fontSize: 56, color: '#0A0C0A',
            boxShadow: '0 0 40px rgba(146,255,95,0.25)'}}>SP</div>
          <div style={{fontFamily: 'IT', fontWeight: 700, fontSize: 62, color: '#fff', letterSpacing: -1}}>Superpowers</div>
        </div>
        <div style={{fontFamily: 'IT', fontWeight: 500, fontSize: 38, color: '#A9AEA9', marginTop: 30}}>Método de trabalho para o seu agente</div>
        <div style={{display: 'inline-block', marginTop: 34, border: `2px solid rgba(146,255,95,0.55)`, borderRadius: 999, padding: '12px 28px',
          fontFamily: 'IT', fontWeight: 700, fontSize: 32, color: L, background: 'rgba(146,255,95,0.07)',
          opacity: interpolate(f, [14, 24], [0, 1], clamp)}}>Open source · obra/superpowers</div>
      </div>
    </Center>
  );
};

const S3: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const cmd = '/plugin install superpowers@claude-plugins-official';
  const n = Math.floor(interpolate(f, [14, 58], [0, cmd.length], clamp));
  const cursor = Math.floor(f / 8) % 2 === 0;
  return (
    <Center top={700}>
      <div style={{...card, width: 940, borderRadius: 26, overflow: 'hidden', ...useEnter(0, d - 9)}}>
        <div style={{display: 'flex', alignItems: 'center', gap: 12, padding: '20px 26px', borderBottom: '1.5px solid rgba(255,255,255,0.06)'}}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{width: 16, height: 16, borderRadius: 8, background: c}} />)}
          <div style={{fontFamily: 'JB', fontSize: 24, color: '#6B706B', marginLeft: 14}}>claude code</div>
        </div>
        <div style={{padding: '40px 36px', fontFamily: 'JB', fontSize: 38, lineHeight: 1.5, color: '#E8EAE8', whiteSpace: 'pre'}}>
          <span style={{color: L}}>&gt; </span>{cmd.slice(0, Math.min(n, 15))}{n > 15 ? '\n  ' + cmd.slice(16, n) : ''}
          <span style={{display: 'inline-block', width: 16, height: 34, background: L, verticalAlign: 'middle', marginLeft: 3, opacity: cursor ? 1 : 0}} />
        </div>
      </div>
    </Center>
  );
};

const S4: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  const steps = ['Entende o pedido', 'Escreve o plano', 'Desenvolve com testes', 'Revisa e entrega'];
  const active = Math.min(3, Math.floor(interpolate(f, [10, 88], [0, 4], clamp)));
  const out = useEnter(-30, d - 9);
  return (
    <div style={{position: 'absolute', top: 470, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', ...out, transform: undefined, filter: out.filter}}>
      {steps.map((s, i) => {
        const e = useEnter(i * 7);
        const on = i <= active;
        const cur = i === active;
        return (
          <React.Fragment key={s}>
            {i > 0 && <div style={{width: 2, height: 34, background: on ? L : 'rgba(255,255,255,0.12)', opacity: e.opacity}} />}
            <div style={{...card, ...e, width: 600, padding: '30px 0', textAlign: 'center', borderRadius: 24, fontFamily: 'IT', fontWeight: 700, fontSize: 40,
              color: cur ? '#0A0C0A' : on ? '#fff' : '#8A8F8A',
              background: cur ? `linear-gradient(160deg, #B5FF8E, ${L})` : card.background,
              border: cur ? 'none' : on ? `1.5px solid rgba(146,255,95,0.45)` : card.border,
              boxShadow: cur ? '0 0 60px rgba(146,255,95,0.28), 0 40px 80px rgba(0,0,0,0.6)' : card.boxShadow}}>{s}</div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

const S5: React.FC<{d: number}> = ({d}) => {
  const f = useCurrentFrame();
  return (
    <Center top={600}>
      <div style={{...card, width: 820, padding: '54px 50px', textAlign: 'center', ...useEnter(0)}}>
        <div style={{fontFamily: 'IT', fontWeight: 600, fontSize: 40, color: '#A9AEA9'}}>Tutorial 01 de 11</div>
        <div style={{display: 'inline-block', marginTop: 22, background: `linear-gradient(160deg, #B5FF8E, ${L})`, color: '#0A0C0A',
          fontFamily: 'IT', fontWeight: 800, fontSize: 104, letterSpacing: -2, padding: '6px 44px', borderRadius: 22,
          transform: `scale(${interpolate(f, [10, 20], [0.85, 1], {...clamp, easing: Easing.out(Easing.back(2))})})`}}>SALVA</div>
        <div style={{fontFamily: 'IT', fontWeight: 600, fontSize: 38, color: '#E8EAE8', marginTop: 26}}>e segue para ver a próxima skill</div>
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 34}}>
          <Img src={staticFile('icone.png')} style={{width: 58}} />
          <div style={{fontFamily: 'JB', fontWeight: 700, fontSize: 36, color: '#fff'}}>@xarpy_dev</div>
        </div>
      </div>
    </Center>
  );
};


const Sfx: React.FC = () => {
  const starts = [0, 96, 174, 258, 372];
  const keys = Array.from({length: 22}, (_, i) => 174 + 14 + i * 2);
  const steps = [268, 288, 307, 327];
  return (
    <>
      <Audio src={staticFile('pad.wav')} volume={0.5} />
      {starts.map((s) => <Sequence key={'w' + s} from={Math.max(0, s - 3)} durationInFrames={20}><Audio src={staticFile('whoosh.wav')} volume={0.6} /></Sequence>)}
      {keys.map((k) => <Sequence key={'k' + k} from={k} durationInFrames={3}><Audio src={staticFile('key.wav')} volume={0.5} /></Sequence>)}
      {steps.map((k) => <Sequence key={'s' + k} from={k} durationInFrames={4}><Audio src={staticFile('click.wav')} volume={0.6} /></Sequence>)}
      <Sequence from={382} durationInFrames={16}><Audio src={staticFile('chime.wav')} volume={0.5} /></Sequence>
    </>
  );
};

/* ---------- Linha do tempo ---------- */
export const SCENES = [
  {C: S1, d: 96, cap: words('Agora o Claude Code planeja antes de programar.', {planeja: 'box'})},
  {C: S2, d: 78, cap: words('O nome disso é Superpowers.', {Superpowers: 'box'})},
  {C: S3, d: 84, cap: words('Você instala com um comando.', {comando: 'pill'})},
  {C: S4, d: 114, cap: words('Ele entende, planeja, testa e revisa antes de entregar.', {revisa: 'pill'})},
  {C: S5, d: 78, cap: words('Salva e segue para a próxima skill.', {Salva: 'pill'})},
];
export const TUT_FRAMES = SCENES.reduce((a, s) => a + s.d, 0);

export const Tutorial: React.FC = () => {
  const f = useCurrentFrame();
  let from = 0;
  return (
    <AbsoluteFill style={{background: BG, overflow: 'hidden'}}>
      <style>{fonts}</style>
      <Stage />
      <Sfx />
      <AbsoluteFill style={{transform: `scale(${1 + f * 0.00009})`}}>
        {SCENES.map(({C, d, cap}, i) => {
          const s = (
            <Sequence key={i} from={from} durationInFrames={d}>
              <C d={d} />
              <Caption words={cap} start={8} end={d - 22} outAt={i === SCENES.length - 1 ? 1e9 : d - 9} />
            </Sequence>
          );
          from += d;
          return s;
        })}
      </AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.55) 100%)'}} />
    </AbsoluteFill>
  );
};
