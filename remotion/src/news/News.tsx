import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';

/* Formato "Radar IA": notícias do dia, paleta Inovação (Black Pearl, Turquoise Sea, Flush Orange) */
const BG = '#04141E', TQ = '#64DBE8', OR = '#FF6D04', TX = '#F2F7F8', MU = '#8FA6AE', LN = '#12303D', CARD = '#082331';
const L = 80, RR = 150;
const fontCss = `
@font-face{font-family:'I';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'M';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
*{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}`;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SPR = {page: {damping: 22, stiffness: 120, mass: 1}, card: {damping: 15, stiffness: 140, mass: 0.8}, pop: {damping: 10, stiffness: 200, mass: 0.6}, word: {damping: 16, stiffness: 240, mass: 0.5}};
const sp = (f: number, d: number, c = SPR.card) => spring({frame: f - d, fps: 30, config: c});
const tw = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.16, 1, 0.3, 1)) => interpolate(f, [a, b], [from, to], {...clamp, easing: e});
const rise = (s: number, y = 30): React.CSSProperties => ({opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * y}px)`});
const useF = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return (f * 30) / fps; };

export const PAGES = [{id: 'capa', dur: 150}, {id: 'n1', dur: 240}, {id: 'n2', dur: 240}, {id: 'n3', dur: 270}, {id: 'cta', dur: 150}];
const TR = 16;
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
const posAt = (F: number) => PAGES.slice(1).reduce((p, _x, i) => p + sp(F, STARTS[i + 1] - TR, SPR.page), 0);

/* ---------- peças fixas ---------- */
const Head: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const s = sp(F, 0);
  const p = Math.max(0, Math.min(PAGES.length - 1, pos));
  const live = Math.floor(F / 20) % 2 === 0;
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 216, display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'M', fontWeight: 700, fontSize: 26, letterSpacing: 3, color: MU, ...rise(s, 14)}}>
        <span style={{width: 14, height: 14, borderRadius: 7, background: OR, opacity: live ? 1 : 0.35}} />
        RADAR IA · <b style={{color: TQ}}>18.11.2026</b>
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

type Seg = {t: string; hl?: boolean; c?: string};
const Title: React.FC<{f: number; lines: Seg[][]; size?: number; top?: number; d?: number}> = ({f, lines, size = 68, top = 470, d = 0}) => {
  let k = 0;
  return (
    <div style={{position: 'absolute', left: L, right: RR, top, fontFamily: 'M', fontWeight: 800, fontSize: size, lineHeight: 1.14, letterSpacing: -2, color: TX}}>
      {lines.map((ln, li) => (
        <div key={li} style={{whiteSpace: 'nowrap'}}>
          {ln.map((sg, si) => {
            const start = d + 2 + k * 0.6;
            const wipe = sg.hl ? tw(f, start - 2, start + 10) : 0;
            const chars = sg.t.split('').map((ch) => {
              const s = sp(f, d + 2 + k++ * 0.6, SPR.word);
              return <span key={k} style={{display: 'inline-block', transform: `translateY(${(1 - s) * 100}%)`, opacity: Math.min(1, s * 2)}}>{ch === ' ' ? ' ' : ch}</span>;
            });
            return (
              <span key={si} style={{position: 'relative', display: 'inline-block', padding: sg.hl ? '2px 14px 6px' : 0, margin: sg.hl ? '4px 0' : 0, color: sg.hl ? BG : sg.c ?? TX}}>
                {sg.hl && <span style={{position: 'absolute', inset: 0, background: TQ, transformOrigin: 'left', transform: `scaleX(${wipe})`}} />}
                <span style={{position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'top'}}>{chars}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};

/* Selo da notícia: número grande, categoria e data */
const NewsTag: React.FC<{f: number; n: string; cat: string; date: string}> = ({f, n, cat, date}) => {
  const s = sp(f, 0, SPR.pop);
  return (
    <div style={{position: 'absolute', left: L, top: 300, display: 'flex', alignItems: 'flex-end', gap: 22}}>
      <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 150, lineHeight: 0.8, letterSpacing: -8, color: TQ, transform: `translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 2)}}>{n}</div>
      <div style={{paddingBottom: 6, ...rise(sp(f, 6), 16)}}>
        <div style={{display: 'inline-block', fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 2, color: BG, background: OR, padding: '5px 12px', borderRadius: 6}}>{cat}</div>
        <div style={{fontFamily: 'M', fontSize: 22, color: MU, marginTop: 10}}>{date}</div>
      </div>
    </div>
  );
};
const Why: React.FC<{f: number; d: number; top: number; t: string}> = ({f, d, top, t}) => (
  <div style={{position: 'absolute', left: L, right: RR, top, borderLeft: `5px solid ${OR}`, paddingLeft: 24, ...rise(sp(f, d), 20)}}>
    <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 2, color: OR}}>POR QUE IMPORTA</div>
    <div style={{fontFamily: 'I', fontWeight: 600, fontSize: 34, lineHeight: 1.3, color: TX, marginTop: 8}}>{t}</div>
  </div>
);
const Src: React.FC<{f: number; d: number; top: number; t: string}> = ({f, d, top, t}) => (
  <div style={{position: 'absolute', left: L, right: RR, top, fontFamily: 'M', fontSize: 22, color: MU, opacity: tw(f, d, d + 10)}}>Fonte: {t}</div>
);
// número grande que conta até o valor
const Stat: React.FC<{f: number; d: number; v: number; pre?: string; suf?: string; label: string; color?: string}> = ({f, d, v, pre = '', suf = '', label, color = TQ}) => {
  const s = sp(f, d);
  const n = Math.round(v * tw(f, d, d + 22));
  return (
    <div style={{flex: 1, background: CARD, border: `2px solid ${LN}`, borderRadius: 18, padding: '22px 24px', ...rise(s, 30)}}>
      <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 64, color, letterSpacing: -2, lineHeight: 1}}>{pre}{n}{suf}</div>
      <div style={{fontFamily: 'I', fontSize: 26, color: MU, marginTop: 10, lineHeight: 1.25}}>{label}</div>
    </div>
  );
};

/* Assinatura do formato: radar com um ponto por notícia (o terceiro em laranja) */
const Radar: React.FC<{f: number; cx: number; cy: number; r: number}> = ({f, cx, cy, r}) => {
  const a = (f * 3) % 360;
  const blips: [number, number, string, number][] = [[-0.55, -0.35, TQ, 70], [0.45, -0.5, TQ, 82], [0.3, 0.45, OR, 96]];
  return (
    <svg style={{position: 'absolute', left: cx - r, top: cy - r, opacity: tw(f, 20, 40)}} width={r * 2} height={r * 2} viewBox={`${-r} ${-r} ${r * 2} ${r * 2}`}>
      <defs>
        <linearGradient id="sw" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor={TQ} stopOpacity="0" /><stop offset="1" stopColor={TQ} stopOpacity="0.28" /></linearGradient>
      </defs>
      {[1, 0.66, 0.33].map((k) => <circle key={k} r={r * k - 2} fill="none" stroke={LN} strokeWidth={3} />)}
      <line x1={-r} y1={0} x2={r} y2={0} stroke={LN} strokeWidth={3} /><line x1={0} y1={-r} x2={0} y2={r} stroke={LN} strokeWidth={3} />
      <path d={`M0 0 L${r} 0 A${r} ${r} 0 0 0 ${r * Math.cos(-0.7)} ${r * Math.sin(-0.7)} Z`} fill="url(#sw)" transform={`rotate(${a})`} />
      {blips.map(([x, y, c, d], i) => {
        const s = sp(f, d, SPR.pop);
        const ping = ((f - d) % 45) / 45;
        return (
          <g key={i} transform={`translate(${x * r} ${y * r})`} opacity={Math.min(1, s * 2)}>
            {f > d && <circle r={10 + ping * 26} fill="none" stroke={c} strokeWidth={3} opacity={1 - ping} />}
            <circle r={11 * s} fill={c} />
          </g>
        );
      })}
    </svg>
  );
};

/* ---------- 1 · capa: as 3 manchetes, a terceira trancada ---------- */
const Capa: React.FC<{f: number}> = ({f}) => {
  const items: [string, string, boolean][] = [['01', 'OpenAI lança dois modelos mais baratos', false], ['02', 'Hackers já atacam com agentes de IA', false], ['03', 'A regra nova que envolve o Brasil', true]];
  return (
    <>
      <Title f={f} size={84} top={330} lines={[[{t: '3 notícias'}], [{t: 'de IA de '}, {t: 'hoje', hl: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, right: RR, top: 640, fontFamily: 'I', fontWeight: 600, fontSize: 40, color: OR, ...rise(sp(f, 26), 18)}}>A terceira envolve o Brasil.</div>
      <div style={{position: 'absolute', left: L, right: RR, top: 760}}>
        {items.map(([n, t, lock], i) => {
          const s = sp(f, 40 + i * 8);
          return (
            <div key={n} style={{display: 'grid', gridTemplateColumns: '84px 1fr', alignItems: 'center', padding: '26px 0', borderBottom: i < 2 ? `2px solid ${LN}` : 'none', ...rise(s, 26)}}>
              <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 40, color: lock ? OR : TQ}}>{n}</span>
              <span style={{fontFamily: 'I', fontWeight: 600, fontSize: 36, color: TX, filter: lock ? `blur(${7 - tw(f, 120, 140) * 7}px)` : 'none'}}>{t}</span>
            </div>
          );
        })}
      </div>
      <Radar f={f} cx={540} cy={1232} r={136} />
    </>
  );
};

/* ---------- 2 · OpenAI GPT-6.2 ---------- */
const N1: React.FC<{f: number}> = ({f}) => (
  <>
    <NewsTag f={f} n="01" cat="LANÇAMENTO" date="17 nov · OpenAI" />
    <Title f={f} d={8} lines={[[{t: 'OpenAI lança'}], [{t: 'GPT-6.2', hl: true}, {t: ': Astra'}], [{t: 'e Sol.'}]]} />
    <div style={{position: 'absolute', left: L, right: RR, top: 740, background: CARD, border: `2px solid ${LN}`, borderRadius: 18, overflow: 'hidden', ...rise(sp(f, 40), 30)}}>
      <div style={{display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', padding: '16px 26px', fontFamily: 'M', fontSize: 21, letterSpacing: 1, color: MU, borderBottom: `2px solid ${LN}`}}>
        <span>US$ / 1M TOKENS</span><span>ENTRADA</span><span>SAÍDA</span>
      </div>
      {[['Astra', 'para o trabalho pesado', 8, 40], ['Sol', 'para o dia a dia', 2, 10]].map(([m, d, a, b], i) => (
        <div key={m as string} style={{display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', alignItems: 'center', padding: '20px 26px', borderBottom: i === 0 ? `2px solid ${LN}` : 'none', ...rise(sp(f, 48 + i * 8), 16)}}>
          <span><b style={{fontFamily: 'M', fontSize: 34, color: TX}}>{m}</b><br /><span style={{fontFamily: 'I', fontSize: 22, color: MU}}>{d}</span></span>
          <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 40, color: TQ}}>${Math.round((a as number) * tw(f, 52 + i * 8, 72 + i * 8))}</span>
          <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 40, color: TQ}}>${Math.round((b as number) * tw(f, 52 + i * 8, 72 + i * 8))}</span>
        </div>
      ))}
    </div>
    <Why f={f} d={110} top={1050} t="Astra é o primeiro modelo público da OpenAI no nível alto para acelerar a própria pesquisa de IA." />
    <Src f={f} d={120} top={1290} t="OpenAI · system card do GPT-6.2" />
  </>
);

/* ---------- 3 · Google: ataques com agentes ---------- */
const N2: React.FC<{f: number}> = ({f}) => (
  <>
    <NewsTag f={f} n="02" cat="SEGURANÇA" date="16 nov · Google" />
    <Title f={f} d={8} lines={[[{t: 'Hackers já'}], [{t: 'atacam com'}], [{t: 'agentes de IA', hl: true}, {t: '.'}]]} />
    <div style={{position: 'absolute', left: L, right: RR, top: 740, display: 'flex', gap: 16}}>
      <Stat f={f} d={44} v={6} suf="h" label="para um agente roubar milhares de credenciais" />
      <Stat f={f} d={58} v={6} suf=" meses" label="prazo previsto para ataques 100% autônomos" color={OR} />
    </div>
    <Why f={f} d={110} top={1050} t="O tempo entre a correção de uma falha e o ataque está encolhendo. Atualizar sistemas virou urgente." />
    <Src f={f} d={120} top={1290} t="Google Threat Intelligence Group e Mandiant" />
  </>
);

/* ---------- 4 · EUA: regra de chips com o Brasil na lista ---------- */
const N3: React.FC<{f: number}> = ({f}) => {
  const paises = ['Singapura', 'Tailândia', 'Malásia', 'Indonésia', 'Brasil'];
  return (
    <>
      <NewsTag f={f} n="03" cat="REGULAÇÃO" date="16 nov · EUA" />
      <Title f={f} d={8} lines={[[{t: 'EUA apertam a'}], [{t: 'regra dos chips.'}], [{t: 'O Brasil', hl: true}, {t: ' está'}], [{t: 'na lista.'}]]} size={64} />
      <div style={{position: 'absolute', left: L, right: RR, top: 820, ...rise(sp(f, 50), 20)}}>
        <div style={{fontFamily: 'M', fontSize: 22, letterSpacing: 2, color: MU, marginBottom: 16}}>LICENÇA DOS EUA PARA OS CHIPS MAIS AVANÇADOS</div>
        <div style={{display: 'flex', flexWrap: 'wrap', gap: 12}}>
          {paises.map((p, i) => {
            const br = p === 'Brasil';
            const s = sp(f, 58 + i * 6, SPR.pop);
            return (
              <span key={p} style={{fontFamily: 'M', fontWeight: 800, fontSize: br ? 34 : 28, padding: '10px 18px', borderRadius: 10, transform: `scale(${0.6 + 0.4 * s})`, opacity: Math.min(1, s * 2),
                background: br ? OR : CARD, color: br ? BG : TX, border: `2px solid ${br ? OR : LN}`}}>{p}</span>
            );
          })}
        </div>
      </div>
      <Why f={f} d={130} top={1040} t="Data centers no mundo todo precisam de licença para vender computação a empresas chinesas. Quem já opera tem 90 dias." />
      <Src f={f} d={140} top={1290} t="Departamento de Comércio dos EUA, via Reuters" />
    </>
  );
};

/* ---------- 5 · CTA: comentário + compartilhamento ---------- */
const Cta: React.FC<{f: number}> = ({f}) => {
  const fx = interpolate(f, [50, 62, 63, 78], [0, 70, -70, 0], {...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1)});
  const fo = interpolate(f, [50, 60, 64, 76], [1, 0, 0, 1], clamp);
  return (
    <>
      <Title f={f} size={72} top={330} lines={[[{t: 'Qual delas'}], [{t: 'mais te '}, {t: 'pega', hl: true}, {t: '?'}]]} />
      <div style={{position: 'absolute', left: L, right: RR, top: 560, display: 'flex', gap: 16}}>
        {['1', '2', '3'].map((n, i) => {
          const s = sp(f, 24 + i * 6, SPR.pop);
          return (
            <div key={n} style={{flex: 1, height: 150, borderRadius: 18, background: CARD, border: `2px solid ${i === 2 ? OR : LN}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'M', fontWeight: 800, fontSize: 80, color: i === 2 ? OR : TQ, transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2)}}>{n}</div>
          );
        })}
      </div>
      <div style={{position: 'absolute', left: L, right: RR, top: 740, fontFamily: 'I', fontSize: 32, color: MU, ...rise(sp(f, 40), 16)}}>Responde com o número nos comentários.</div>
      <div style={{position: 'absolute', left: L, top: 860, display: 'flex', alignItems: 'center', gap: 22, ...rise(sp(f, 44), 20)}}>
        <div style={{width: 112, height: 112, borderRadius: 56, background: TQ, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
          <svg width={56} height={56} viewBox="0 0 24 24" style={{transform: `translate(${fx}px, ${-fx}px)`, opacity: fo}}>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={BG} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{fontFamily: 'I', fontSize: 36, fontWeight: 600, color: TX, lineHeight: 1.25}}>Manda para quem<br /><span style={{color: MU, fontWeight: 500}}>precisa ficar por dentro</span></div>
      </div>
      <div style={{position: 'absolute', left: L, right: RR, top: 1060, display: 'flex', alignItems: 'center', gap: 16, ...rise(sp(f, 56), 16)}}>
        <Img src={staticFile('icone.png')} style={{width: 64}} />
        <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 38, color: TX}}>@xarpy_dev</div>
        <div style={{fontFamily: 'I', fontSize: 28, color: MU}}>· o radar de IA</div>
      </div>
    </>
  );
};

const PAGE_C: React.FC<{f: number}>[] = [Capa, N1, N2, N3, Cta];

const Frame: React.FC = () => {
  const F = useF();
  const pos = posAt(F);
  return (
    <AbsoluteFill style={{background: BG, color: TX}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 900px 700px at 0% 0%, rgba(100,219,232,0.07), transparent 70%)'}} />
      {PAGE_C.map((C, i) => {
        const x = (i - pos) * 1080;
        if (Math.abs(x) > 1100) return null;
        return <AbsoluteFill key={i} style={{transform: `translateX(${x}px)`}}><C f={Math.max(0, F - STARTS[i])} /></AbsoluteFill>;
      })}
      <Head F={F} pos={pos} />
    </AbsoluteFill>
  );
};

export type NewsProps = {blur?: boolean; samples?: number; safe?: boolean};
export const News: React.FC<NewsProps> = ({blur = false, samples = 3, safe}) => (
  <AbsoluteFill style={{background: BG}}>
    <style>{fontCss}</style>
    {blur ? <CameraMotionBlur shutterAngle={180} samples={samples}><Frame /></CameraMotionBlur> : <Frame />}
    {safe && (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(255,0,80,0.28)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(255,0,80,0.28)'}} />
        <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(255,0,80,0.28)'}} />
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);
