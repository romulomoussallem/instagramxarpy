import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

const BG = '#04141E', TQ = '#64DBE8', OR = '#FF6D04', PAPER = '#F4F1EA', INK = '#0B1418', MU = '#8FA3AA';
const FONTS = `
@font-face{font-family:'I';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'M';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
@font-face{font-family:'S';src:url('${staticFile('serif-italic.woff2')}');font-style:italic;}
`;

const Bg: React.FC<{accent?: string}> = ({accent = TQ}) => (
  <>
    <AbsoluteFill style={{background: BG}} />
    {/* malha de pontos */}
    <AbsoluteFill style={{backgroundImage: 'radial-gradient(rgba(100,219,232,0.13) 1.6px, transparent 1.6px)', backgroundSize: '36px 36px', maskImage: 'linear-gradient(180deg, transparent 0%, #000 25%, #000 70%, transparent 100%)'}} />
    <AbsoluteFill style={{background: `radial-gradient(ellipse 900px 700px at 85% 95%, ${accent}26, transparent 70%), radial-gradient(ellipse 700px 500px at 0% 20%, ${TQ}14, transparent 70%)`}} />
    <svg width={1080} height={1920} style={{position: 'absolute', inset: 0, opacity: 0.07, mixBlendMode: 'overlay'}}>
      <filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} /></filter>
      <rect width="100%" height="100%" filter="url(#g)" />
    </svg>
  </>
);

const Header: React.FC<{n: string}> = ({n}) => (
  <div style={{position: 'absolute', left: 60, right: 60, top: 210, display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'M', fontWeight: 700, fontSize: 24, letterSpacing: 3, color: MU}}>
    <svg width={34} height={34} viewBox="0 0 34 34"><circle cx={17} cy={17} r={15} fill="none" stroke={TQ} strokeWidth={2} /><circle cx={17} cy={17} r={8} fill="none" stroke={TQ} strokeOpacity={0.5} strokeWidth={2} /><path d="M17 17 L30 10 A15 15 0 0 1 32 17 Z" fill={TQ} /></svg>
    <span style={{color: '#fff'}}>RADAR IA</span><span>·</span><span style={{color: TQ}}>18.11.2026</span>
    <span style={{marginLeft: 'auto', fontSize: 26, color: '#fff'}}>{n}</span>
  </div>
);

const Tape: React.FC<{x: number; y: number; r: number}> = ({x, y, r}) => (
  <div style={{position: 'absolute', left: x, top: y, width: 150, height: 44, background: 'rgba(240,232,210,0.72)', transform: `rotate(${r}deg)`, boxShadow: '0 2px 6px rgba(0,0,0,0.25)'}} />
);

const Sticker: React.FC<{t: string; c?: string; r?: number; style?: React.CSSProperties}> = ({t, c = OR, r = -4, style}) => (
  <div style={{display: 'inline-block', background: c, color: c === OR ? '#fff' : INK, fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 2, padding: '8px 16px', borderRadius: 6, transform: `rotate(${r}deg)`, boxShadow: '0 6px 16px rgba(0,0,0,0.35)', ...style}}>{t}</div>
);

// recorte de jornal desenhado (marcador até chegar o print real)
const Clip: React.FC<{n: string; outlet: string; title: string; cat: string; w?: number; r: number; x: number; y: number; z?: number}> = ({n, outlet, title, cat, w = 780, r, x, y, z = 1}) => (
  <div style={{position: 'absolute', left: x, top: y, width: w, zIndex: z, transform: `rotate(${r}deg)`, background: PAPER, borderRadius: 4, padding: '24px 32px 28px', boxShadow: '0 30px 60px rgba(0,0,0,0.55), 0 2px 0 rgba(0,0,0,0.1)'}}>
    <div style={{display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'M', fontWeight: 700, fontSize: 19, letterSpacing: 2, color: '#6B7378', borderBottom: '2px solid #1112', paddingBottom: 14}}>
      <span style={{background: INK, color: PAPER, padding: '3px 10px', borderRadius: 4}}>{n}</span>{outlet}
    </div>
    <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 42, lineHeight: 1.06, color: INK, marginTop: 14, letterSpacing: -1}}>{title}</div>
    <Sticker t={cat} style={{position: 'absolute', right: -18, top: -22}} r={5} />
  </div>
);

/* ============ Quadro A · capa ============ */
export const DirA: React.FC = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <style>{FONTS}</style>
    <Bg accent={OR} />
    <Header n="01/05" />
    <div style={{position: 'absolute', left: 60, top: 290, fontFamily: 'I', fontWeight: 800, fontSize: 132, lineHeight: 0.95, letterSpacing: -4, color: '#fff'}}>
      3 notícias<br />de IA que<br /><span style={{fontFamily: 'S', fontStyle: 'italic', fontWeight: 400, color: TQ, letterSpacing: -2, fontSize: 150}}>importam hoje.</span>
    </div>
    {/* bloco de cor por trás dos recortes */}
    <div style={{position: 'absolute', left: 110, top: 820, width: 920, height: 640, background: TQ, borderRadius: 8, transform: 'rotate(3deg)'}} />
    <div style={{position: 'absolute', left: 150, top: 1420, fontFamily: 'M', fontWeight: 800, fontSize: 22, letterSpacing: 3, color: INK, transform: 'rotate(3deg)'}}>EDIÇÃO DE QUARTA · 3 FATOS · 60 SEGUNDOS</div>
    <Clip n="01" outlet="OPENAI · 17 NOV" title="OpenAI lança o GPT-6.2" cat="LANÇAMENTO" r={-4} x={60} y={880} w={700} z={1} />
    <Clip n="02" outlet="GOOGLE · 16 NOV" title="Hackers já usam agentes de IA" cat="SEGURANÇA" r={3} x={230} y={1065} w={720} z={2} />
    <Clip n="03" outlet="REUTERS · 16 NOV" title="EUA apertam chips. Brasil na lista" cat="REGULAÇÃO" r={-2} x={60} y={1240} w={800} z={3} />
  </AbsoluteFill>
);

/* ============ Quadro B · print da matéria ============ */
export const DirB: React.FC = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <style>{FONTS}</style>
    <Bg />
    <Header n="02/05" />
    <div style={{position: 'absolute', left: 60, top: 300, display: 'flex', gap: 14, alignItems: 'center'}}>
      <Sticker t="01 · MERCADO" r={-3} />
      <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 22, letterSpacing: 2, color: MU}}>O QUE SAIU · 18 NOV</span>
    </div>
    {/* número gigante */}
    <div style={{position: 'absolute', left: 44, top: 360, fontFamily: 'I', fontWeight: 800, fontSize: 380, lineHeight: 1, letterSpacing: -18, color: TQ}}>56<span style={{fontSize: 220, letterSpacing: -6}}>%</span></div>
    <div style={{position: 'absolute', left: 640, top: 460, width: 360, fontFamily: 'I', fontWeight: 600, fontSize: 36, lineHeight: 1.18, color: '#fff'}}>
      do gasto com IA nos cartões corporativos foi para o <span style={{fontFamily: 'S', fontStyle: 'italic', fontWeight: 400, color: TQ, fontSize: 42}}>Claude.</span>
    </div>
    {/* print grande, com fita */}
    <div style={{position: 'absolute', left: 50, top: 790, width: 980, transform: 'rotate(-2deg)', boxShadow: '0 36px 70px rgba(0,0,0,0.6)', background: '#fff', padding: 18, borderRadius: 4}}>
      <div style={{position: 'relative'}}>
        <Img src={staticFile('print-clara.png')} style={{width: 944, display: 'block'}} />
        <div style={{position: 'absolute', left: 884 * 0.755, top: 30 * 0.755, width: 140 * 0.755, height: 76 * 0.755, background: 'rgba(100,219,232,0.55)', mixBlendMode: 'multiply'}} />
      </div>
      <div style={{fontFamily: 'M', fontSize: 17, color: '#7A8287', marginTop: 10, letterSpacing: 1}}>PRINT DA MATÉRIA · FONTE: CLARA</div>
    </div>
    <Tape x={70} y={772} r={-14} />
    <Tape x={880} y={760} r={9} />
    {/* barra comparativa */}
    <div style={{position: 'absolute', left: 60, top: 1140, width: 880, background: '#0A2330', border: '1px solid #1C4352', borderRadius: 20, padding: '26px 30px'}}>
      <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, color: MU}}><span>FATIA DO GASTO COM IA</span><span>CARTÕES CORPORATIVOS</span></div>
      <div style={{display: 'flex', height: 64, marginTop: 18, borderRadius: 10, overflow: 'hidden'}}>
        <div style={{width: '56%', background: TQ, display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'I', fontWeight: 800, fontSize: 30, color: INK}}>Claude 56%</div>
        <div style={{flex: 1, background: 'repeating-linear-gradient(135deg, #1C4352 0 10px, #133443 10px 20px)', display: 'flex', alignItems: 'center', paddingLeft: 20, fontFamily: 'I', fontWeight: 700, fontSize: 26, color: '#C9D6DA'}}>demais 44%</div>
      </div>
    </div>
  </AbsoluteFill>
);

/* ============ Quadro C · dados da notícia ============ */
const Model: React.FC<{name: string; sub: string; inp: string; out: string; hot?: boolean; r: number}> = ({name, sub, inp, out, hot, r}) => (
  <div style={{width: 430, height: 470, borderRadius: 26, padding: 34, boxSizing: 'border-box', transform: `rotate(${r}deg)`, background: hot ? TQ : '#0A2330', border: hot ? 'none' : '1px solid #1C4352', color: hot ? INK : '#fff', boxShadow: '0 30px 60px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'}}>
    <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 20, letterSpacing: 2, opacity: 0.7}}>GPT-6.2</div>
    <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 76, letterSpacing: -2, lineHeight: 1}}>{name}</div>
    <div style={{fontFamily: 'I', fontWeight: 500, fontSize: 26, opacity: 0.75, marginTop: 6}}>{sub}</div>
    <div style={{marginTop: 'auto', display: 'flex', gap: 30}}>
      {[['ENTRADA', inp], ['SAÍDA', out]].map(([l, v]) => (
        <div key={l}><div style={{fontFamily: 'M', fontWeight: 700, fontSize: 18, letterSpacing: 2, opacity: 0.6}}>{l}</div><div style={{fontFamily: 'I', fontWeight: 800, fontSize: 70, letterSpacing: -2}}>{v}</div></div>
      ))}
    </div>
    <div style={{fontFamily: 'M', fontSize: 16, opacity: 0.55, marginTop: 4}}>US$ por milhão de tokens</div>
  </div>
);

export const DirC: React.FC = () => (
  <AbsoluteFill style={{overflow: 'hidden'}}>
    <style>{FONTS}</style>
    <Bg />
    <Header n="02/05" />
    <div style={{position: 'absolute', left: 60, top: 300}}><Sticker t="01 · LANÇAMENTO" r={-3} /></div>
    <div style={{position: 'absolute', left: 60, top: 380, fontFamily: 'I', fontWeight: 800, fontSize: 112, lineHeight: 0.98, letterSpacing: -4, color: '#fff'}}>
      OpenAI lança<br />o GPT-6.2 em<br /><span style={{fontFamily: 'S', fontStyle: 'italic', fontWeight: 400, color: TQ, fontSize: 128}}>duas versões.</span>
    </div>
    <div style={{position: 'absolute', left: 60, top: 760, display: 'flex', gap: 20}}>
      <Model name="Astra" sub="trabalho pesado" inp="$8" out="$40" r={-3} />
      <Model name="Sol" sub="dia a dia" inp="$2" out="$10" hot r={2} />
    </div>
    <Sticker t="4x MAIS BARATO" c={OR} r={-8} style={{position: 'absolute', left: 560, top: 730}} />
    {/* rodapé: selo da fonte + por que importa */}
    <div style={{position: 'absolute', left: 60, top: 1280, width: 880, display: 'flex', gap: 20, alignItems: 'stretch'}}>
      <div style={{width: 230, background: PAPER, borderRadius: 6, padding: 14, transform: 'rotate(-2deg)', boxShadow: '0 14px 30px rgba(0,0,0,0.5)'}}>
        <div style={{fontFamily: 'M', fontSize: 13, color: '#6B7378', letterSpacing: 1}}>OPENAI · 17 NOV</div>
        <div style={{fontFamily: 'I', fontWeight: 800, fontSize: 21, lineHeight: 1.1, color: INK, marginTop: 6}}>GPT-6.2 chega em duas versões</div>
      </div>
      <div style={{flex: 1, background: OR, borderRadius: 18, padding: '18px 24px', color: '#fff'}}>
        <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 18, letterSpacing: 2, opacity: 0.85}}>POR QUE IMPORTA</div>
        <div style={{fontFamily: 'I', fontWeight: 700, fontSize: 30, lineHeight: 1.15, marginTop: 6}}>Com o Sol, deixar um agente rodando o dia todo fica viável.</div>
      </div>
    </div>
  </AbsoluteFill>
);
