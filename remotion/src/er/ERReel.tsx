import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {CameraMotionBlur} from '@remotion/motion-blur';
import PW from './palavras.json';

/* Layout da série Engenharia Reversa (tools/gen_rev.py) em 9:16 */
const OR = '#FF5100', BG = '#060607', TX = '#FAFAFA', MU = '#8A8A90', LN = '#1C1C1F', CD = '#CFD6D2';
const L = 80, RR = 150; // margem esquerda; margem direita longe dos botões do Instagram
const fontCss = `
@font-face{font-family:'I';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
@font-face{font-family:'M';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
*{-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision;}`;
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const SPR = {page: {damping: 22, stiffness: 120, mass: 1}, card: {damping: 15, stiffness: 140, mass: 0.8}, pop: {damping: 10, stiffness: 200, mass: 0.6}, word: {damping: 16, stiffness: 240, mass: 0.5}};
const sp = (f: number, d: number, c = SPR.card) => spring({frame: f - d, fps: 30, config: c});
const tw = (f: number, a: number, b: number, from = 0, to = 1, e = Easing.bezier(0.16, 1, 0.3, 1)) => interpolate(f, [a, b], [from, to], {...clamp, easing: e});
const rise = (s: number, y = 32): React.CSSProperties => ({opacity: Math.min(1, s * 1.6), transform: `translateY(${(1 - s) * y}px)`});
const useF = () => { const f = useCurrentFrame(); const {fps} = useVideoConfig(); return (f * 30) / fps; };

/* ---------- páginas (durações provisórias; serão medidas na narração) ---------- */
export const PAGES = [
  // medidas na narração: cada tela começa 4 quadros antes da sua frase
  {id: 'gancho', dur: 156}, {id: 'prova', dur: 232}, {id: 'estrutura', dur: 166}, {id: 'papel', dur: 126},
  {id: 'passos', dur: 149}, {id: 'regras', dur: 150}, {id: 'formato', dur: 129}, {id: 'esqueleto', dur: 89}, {id: 'cta', dur: 153},
];
const TR = 16;
export const STARTS = PAGES.reduce<number[]>((a, _p, i) => [...a, i === 0 ? 0 : a[i - 1] + PAGES[i - 1].dur], []);
export const TOTAL30 = PAGES.reduce((a, p) => a + p.dur, 0);
const posAt = (F: number) => PAGES.slice(1).reduce((p, _x, i) => p + sp(F, STARTS[i + 1] - TR, SPR.page), 0);

/* ---------- legenda palavra por palavra (narração) ---------- */
type PWd = [number, number, string];
const KEYS = new Set(['parágrafo', 'prioridade', 'dez', 'repete', 'cinco', 'papel', 'passos', 'regras', 'formato', 'exemplo', 'números', 'nunca', 'esqueleto', 'print', 'manda']);
const CHUNKS: PWd[][] = (() => {
  const segs: PWd[][] = []; let cur: PWd[] = [];
  (PW as PWd[]).forEach((w, i, arr) => { cur.push(w); const n = arr[i + 1]; if (!n || n[0] - w[1] > 0.2) { segs.push(cur); cur = []; } });
  const out: PWd[][] = [];
  segs.forEach((sg) => {
    const len = sg.map((x) => x[2]).join(' ').length;
    const n = Math.max(1, Math.ceil(len / 26)); const target = len / n;
    let c: PWd[] = [], acc = 0;
    sg.forEach((w, i) => {
      c.push(w); acc += w[2].length + 1;
      const glue = /^(Nós|um|uma|o|a|de|da|do|em|e|com|para|que|é|Por)$/.test(w[2]);
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
  const end = idx < CHUNKS.length - 1 ? CHUNKS[idx + 1][0][0] - 0.08 : ch[ch.length - 1][1] + 1.2;
  if (t > end) return null;
  const inn = sp(F, (ch[0][0] - 0.08) * 30, SPR.word);
  return (
    <div style={{position: 'absolute', left: L, right: RR, top: 1392, fontFamily: 'I', fontWeight: 650, fontSize: 44, lineHeight: 1.25, letterSpacing: -0.4, ...rise(inn, 14)}}>
      {ch.map(([a, , w], i) => {
        const on = t >= a;
        const k = KEYS.has(w.replace(/[.,:]/g, ''));
        const pop = on ? sp(F, a * 30, SPR.word) : 0;
        return (
          <span key={i} style={{display: 'inline-block', marginRight: '0.25em', color: on ? (k ? BG : TX) : '#55555B', padding: k ? '0 8px' : 0, borderRadius: 6,
            backgroundImage: k ? `linear-gradient(${OR},${OR})` : 'none', backgroundRepeat: 'no-repeat',
            backgroundSize: `${k && on ? tw(F, a * 30, a * 30 + 6) * 100 : 0}% 100%`, transform: on ? `translateY(${(1 - pop) * 6}px)` : 'none'}}>{w}</span>
        );
      })}
    </div>
  );
};

/* ---------- peças fixas ---------- */
const Head: React.FC<{F: number; pos: number}> = ({F, pos}) => {
  const s = sp(F, 0);
  const p = Math.max(0, Math.min(PAGES.length - 1, pos));
  return (
    <>
      <div style={{position: 'absolute', left: L, top: 216, fontFamily: 'M', fontWeight: 700, fontSize: 26, letterSpacing: 3, color: MU, ...rise(s, 14)}}>
        ENGENHARIA REVERSA · <b style={{color: OR}}>ESPECIAL</b>
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
        <div style={{width: `${((p + 1) / PAGES.length) * 100 * s}%`, height: '100%', background: OR, borderRadius: 2}} />
      </div>
    </>
  );
};

type Seg = {t: string; hl?: boolean; o?: boolean};
const Title: React.FC<{f: number; lines: Seg[][]; size?: number; top?: number; right?: number}> = ({f, lines, size = 76, top = 300, right = 190}) => {
  let k = 0;
  return (
    <div style={{position: 'absolute', left: L, right, top, fontFamily: 'M', fontWeight: 800, fontSize: size, lineHeight: 1.12, letterSpacing: -2.2, color: TX}}>
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
              <span key={si} style={{position: 'relative', display: 'inline-block', padding: sg.hl ? '2px 16px 6px' : 0, margin: sg.hl ? '4px 0' : 0, color: sg.hl ? BG : sg.o ? OR : TX}}>
                {sg.hl && <span style={{position: 'absolute', inset: 0, background: OR, transformOrigin: 'left', transform: `scaleX(${wipe})`}} />}
                <span style={{position: 'relative', display: 'inline-block', overflow: 'hidden', verticalAlign: 'top'}}>{chars}</span>
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
};
const PTag: React.FC<{f: number; t: string; top?: number}> = ({f, t, top = 356}) => (
  <div style={{position: 'absolute', left: L, top: top - 56, fontFamily: 'M', fontWeight: 800, fontSize: 24, letterSpacing: 2, color: BG, background: OR, padding: '6px 14px',
    borderRadius: 6, transform: `scale(${sp(f, 0, SPR.pop)})`, transformOrigin: 'left center'}}>{t}</div>
);
// trecho real do prompt, com marcações em laranja
const Code: React.FC<{f: number; d: number; top: number; lines: (string | [string, boolean])[][]; size?: number; src?: string}> = ({f, d, top, lines, size = 28, src}) => {
  const s = sp(f, d);
  return (
    <div style={{position: 'absolute', left: L, right: RR, top, ...rise(s, 40)}}>
      <div style={{background: '#000', border: `2px solid ${LN}`, borderRadius: 18, padding: '30px 34px', fontFamily: 'M', fontSize: size, lineHeight: 1.6, color: CD, overflowWrap: 'anywhere'}}>
        {lines.map((ln, i) => (
          <div key={i} style={{opacity: tw(f, d + 4 + i * 4, d + 10 + i * 4)}}>
            {ln.map((p, j) => typeof p === 'string' ? <span key={j}>{p}</span> : (
              <mark key={j} style={{background: `rgba(255,81,0,${0.18 * tw(f, d + 14 + i * 4, d + 22 + i * 4)})`, color: OR, padding: '0 4px'}}>{p[0]}</mark>
            ))}
          </div>
        ))}
      </div>
      {src && <div style={{fontFamily: 'M', fontSize: 22, color: MU, marginTop: 16, opacity: tw(f, d + 20, d + 30)}}>{src}</div>}
    </div>
  );
};
const Bullet: React.FC<{f: number; d: number; top: number; b: string; t: string}> = ({f, d, top, b, t}) => (
  <div style={{position: 'absolute', left: L, right: RR, top, display: 'grid', gridTemplateColumns: '48px 1fr', gap: 12, ...rise(sp(f, d), 24)}}>
    <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 32, color: OR}}>→</span>
    <p style={{margin: 0, fontFamily: 'I', fontSize: 36, lineHeight: 1.32, color: CD}}><b style={{color: '#fff'}}>{b}</b> {t}</p>
  </div>
);

/* Robô da série, com o mesmo SVG do gerador */
const Bot: React.FC<{f: number; d: number; left: number; top: number; w: number}> = ({f, d, left, top, w}) => {
  const s = sp(f, d, SPR.pop);
  const bob = Math.sin(f / 12) * 4;
  const blink = Math.floor(f / 50) % 6 === 0;
  return (
    <svg style={{position: 'absolute', left, top: top + bob, transform: `scale(${s})`, transformOrigin: 'bottom center'}} width={w} height={w * 300 / 330} viewBox="0 0 330 300">
      <path d="M120 52 L104 6 L148 40 Z" fill="#000" stroke={OR} strokeWidth="5" /><path d="M210 52 L226 6 L182 40 Z" fill="#000" stroke={OR} strokeWidth="5" />
      <rect x="35" y="52" width="260" height="170" rx="6" fill={OR} stroke="#000" strokeWidth="7" />
      <rect x="8" y="100" width="27" height="70" fill="#000" /><rect x="295" y="100" width="27" height="70" fill="#000" />
      <rect x="80" y="95" width="170" height="85" rx="4" fill="#000" />
      <path d="M98 112 L150 132" stroke={TX} strokeWidth="9" strokeLinecap="square" /><path d="M232 112 L180 132" stroke={TX} strokeWidth="9" strokeLinecap="square" />
      <g opacity={blink ? 0 : 1}><path d="M106 140 L146 146 L106 156 Z" fill={OR} /><path d="M224 140 L184 146 L224 156 Z" fill={OR} /></g>
      <path d="M136 168 L150 162 L165 168 L180 162 L194 168" stroke={TX} strokeWidth="6" fill="none" />
      <rect x="75" y="222" width="34" height="62" fill="#000" stroke={OR} strokeWidth="3" /><rect x="221" y="222" width="34" height="62" fill="#000" stroke={OR} strokeWidth="3" />
      <rect x="140" y="222" width="50" height="40" fill="#000" stroke={OR} strokeWidth="3" />
    </svg>
  );
};

/* ---------- 1 · gancho: a "parede de texto" é cortada ---------- */
const BAD = 'faz um texto bom sobre meu produto, seja criativo mas profissional, não muito longo, fala dos benefícios, usa emoji, escreve como especialista, foca no cliente, deixa persuasivo e original e não repete nada';
const Gancho: React.FC<{f: number}> = ({f}) => {
  const box = sp(f, 4);
  const cut = tw(f, 52, 64, 0, 1, Easing.bezier(0.7, 0, 0.3, 1));
  const shake = f > 64 && f < 78 ? Math.sin((f - 64) * 1.3) * Math.exp(-(f - 64) / 5) * 8 : 0;
  return (
    <>
      <Title f={f} size={84} lines={[[{t: 'Pare de escrever'}], [{t: 'prompt em'}], [{t: 'um parágrafo', hl: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, right: RR, top: 720, ...rise(box, 40), transform: `translateX(${shake}px) translateY(${(1 - box) * 40}px)`}}>
        <div style={{position: 'relative', background: '#000', border: `2px solid ${LN}`, borderRadius: 18, padding: '30px 34px', fontFamily: 'M', fontSize: 27, lineHeight: 1.55,
          color: '#6C6C72'}}>
          <span style={{color: OR}}>&gt; </span>{BAD}
          <svg style={{position: 'absolute', inset: 0}} width="100%" height="100%" preserveAspectRatio="none" viewBox="0 0 100 100">
            <line x1="4" y1="92" x2={4 + 92 * cut} y2={92 - 84 * cut} stroke={OR} strokeWidth="1.2" vectorEffect="non-scaling-stroke" style={{strokeWidth: 6}} />
          </svg>
        </div>
        <div style={{fontFamily: 'M', fontWeight: 700, fontSize: 24, letterSpacing: 2, color: OR, marginTop: 18, opacity: tw(f, 82, 90), display: 'flex', alignItems: 'center', gap: 10}}><svg width={22} height={22} viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke={OR} strokeWidth={3.4} strokeLinecap="round" /></svg>A IA NÃO SABE O QUE É PRIORIDADE</div>
      </div>
      <Bot f={f} d={92} left={600} top={1110} w={230} />
    </>
  );
};

/* ---------- 2 · prova: 10 prompts profissionais ---------- */
const FONTES = [['OpenAI', 'Cookbook'], ['OpenAI', 'Codex'], ['Anthropic', 'Cookbook'], ['LangChain', 'Deep Research'], ['Block', 'goose'],
  ['OpenHands', 'agente'], ['mem0', 'memória'], ['Fabric', 'extract_wisdom'], ['Fabric', 'analyze_claims'], ['Aider', 'edição']];
const Prova: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} lines={[[{t: 'Abrimos'}], [{t: '10 prompts', hl: true}], [{t: 'por dentro.'}]]} />
    <div style={{position: 'absolute', left: L, right: RR, top: 640, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
      {FONTES.map(([a, b], i) => {
        const s = sp(f, 96 + i * 4, SPR.pop);
        return (
          <div key={i} style={{border: `2px solid ${LN}`, background: '#0B0B0D', borderRadius: 14, padding: '16px 20px', transform: `scale(${0.7 + 0.3 * s})`, opacity: Math.min(1, s * 2)}}>
            <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 28, color: TX}}>{a}</div>
            <div style={{fontFamily: 'M', fontSize: 21, color: MU, marginTop: 2}}>{b}</div>
          </div>
        );
      })}
    </div>
    <div style={{position: 'absolute', left: L, right: RR, top: 1250, fontFamily: 'I', fontSize: 38, fontWeight: 600, color: TX, ...rise(sp(f, 186), 20)}}>
      A estrutura <span style={{color: OR}}>se repete</span>.
    </div>
  </>
);

/* ---------- 3 · as 5 peças, com a frequência nos 10 esqueletos ---------- */
const PECAS: [string, string, number][] = [['01', 'PAPEL', 9], ['02', 'PASSOS', 7], ['03', 'REGRAS', 6], ['04', 'FORMATO', 5], ['05', 'EXEMPLO', 5]];
const Estrutura: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} lines={[[{t: 'A estrutura'}], [{t: 'tem '}, {t: '5 peças', hl: true}]]} />
    <div style={{position: 'absolute', left: L, right: RR, top: 560}}>
      {PECAS.map(([n, t, c], i) => {
        const at = [46, 70, 92, 112, 132][i];
        const s = sp(f, at);
        const bar = tw(f, at + 4, at + 28);
        return (
          <div key={n} style={{display: 'grid', gridTemplateColumns: '64px 1fr 120px', alignItems: 'center', padding: '22px 0', borderBottom: i < 4 ? `2px solid ${LN}` : 'none', ...rise(s, 28)}}>
            <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 30, color: OR}}>{n}</span>
            <div>
              <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 40, color: TX, letterSpacing: 1}}>{t}</div>
              <div style={{height: 10, background: LN, borderRadius: 5, marginTop: 12, width: '92%'}}>
                <div style={{height: '100%', width: `${(c / 10) * 100 * bar}%`, background: OR, borderRadius: 5}} />
              </div>
            </div>
            <span style={{fontFamily: 'M', fontWeight: 700, fontSize: 30, color: TX, textAlign: 'right'}}>{Math.round(c * bar)}<span style={{color: MU}}>/10</span></span>
          </div>
        );
      })}
      <div style={{fontFamily: 'M', fontSize: 22, color: MU, marginTop: 22, opacity: tw(f, 140, 150)}}>Presença nos 10 esqueletos da série Engenharia Reversa</div>
    </div>
  </>
);

/* ---------- 4 a 7 · cada peça com trecho real ---------- */
const PieceNav: React.FC<{f: number; on: number[]}> = ({f, on}) => (
  <div style={{position: 'absolute', left: L, right: RR, top: 1262, display: 'flex', gap: 8, ...rise(sp(f, 30), 16)}}>
    {PECAS.map(([n, t], i) => {
      const a = on.includes(i);
      return (
        <div key={n} style={{flex: 1, borderTop: `5px solid ${a ? OR : LN}`, paddingTop: 10, fontFamily: 'M', fontWeight: 700, fontSize: 18, letterSpacing: 1, color: a ? OR : '#5E5E64'}}>
          {n}<br />{t}
        </div>
      );
    })}
  </div>
);
const Papel: React.FC<{f: number}> = ({f}) => (
  <>
    <PTag f={f} t="PEÇA 1 · PAPEL" />
    <Title f={f} top={356} lines={[[{t: 'Diga quem'}], [{t: 'ela '}, {t: 'é', o: true}, {t: '.'}]]} />
    <Code f={f} d={20} top={596} lines={[['You are ', ['a smart memory manager', true]], ['which controls the memory', ' of a system.']]} src="mem0 · licença Apache-2.0" />
    <PieceNav f={f} on={[0]} />
    <Bullet f={f} d={66} top={936} b="9 de 10 começam aqui." t="O papel define o critério de tudo o que vem depois." />
  </>
);
const Passos: React.FC<{f: number}> = ({f}) => (
  <>
    <PTag f={f} t="PEÇA 2 · PASSOS" />
    <Title f={f} top={356} lines={[[{t: 'Passos com'}], [{t: 'números', o: true}, {t: '.'}]]} />
    <Code f={f} d={16} top={596} lines={[['- Extract ', ['20 to 50', true], ' ideas…'], ['- Extract ', ['10 to 20', true], ' insights…'], ['- Takeaway in a ', ['15-word', true], ' sentence']]} src="Fabric · extract_wisdom · licença MIT" />
    <PieceNav f={f} on={[1]} />
    <Bullet f={f} d={70} top={1016} b="Quantidade exata" t="tira a IA do chute e deixa a resposta comparável." />
  </>
);
const Regras: React.FC<{f: number}> = ({f}) => (
  <>
    <PTag f={f} t="PEÇA 3 · REGRAS" />
    <Title f={f} top={356} lines={[[{t: 'O que ela'}], [{t: 'nunca', o: true}, {t: ' faz.'}]]} />
    <Code f={f} d={30} top={596} lines={[[['NEVER revert existing changes', true]], ['you did not make…'], ['If this happens, ', ['STOP IMMEDIATELY', true]], ['and ask the user']]} src="OpenAI · Codex · licença Apache-2.0" />
    <PieceNav f={f} on={[2]} />
    <Bullet f={f} d={80} top={1066} b="Regra no ponto da falha." t="Escreva onde a IA costuma errar, não regras genéricas." />
  </>
);
const Formato: React.FC<{f: number}> = ({f}) => (
  <>
    <PTag f={f} t="PEÇAS 4 E 5" />
    <Title f={f} top={356} lines={[[{t: 'Formato e'}], [{t: 'exemplo', hl: true}]]} />
    <Code f={f} d={26} top={600} size={25} lines={[[['<<<<<<< SEARCH', true]], ['trecho atual'], [['=======', true]], ['trecho novo'], [['>>>>>>> REPLACE', true]]]} src="Aider · formato de saída · licença Apache-2.0" />
    <Code f={f} d={66} top={1000} size={25} lines={[['Here are some ', ['examples of tasks', true]], [['and instructions', true], '.']]} src="Anthropic · Metaprompt · licença MIT" />
    <PieceNav f={f} on={[3, 4]} />
  </>
);

/* ---------- 8 · esqueleto para copiar (tela para print) ---------- */
const SK: [string, string][] = [['# PAPEL', 'Você é [função] e decide com base em [critério].'], ['# PASSOS', '1. [ação] com [quantidade exata]\n2. [ação]'],
  ['# REGRAS', 'Nunca [erro comum]. Se [situação], pare e pergunte.'], ['# FORMATO', 'Responda em [estrutura], com [limite].'], ['# EXEMPLO', '[entrada] → [saída ideal]']];
const Esqueleto: React.FC<{f: number}> = ({f}) => (
  <>
    <Title f={f} lines={[[{t: 'O esqueleto'}], [{t: 'para '}, {t: 'copiar', hl: true}]]} />
    <div style={{position: 'absolute', left: L, right: RR, top: 540, background: '#000', border: `2px solid ${LN}`, borderRadius: 18, padding: '30px 34px', ...rise(sp(f, 14), 40)}}>
      {SK.map(([h, b], i) => (
        <div key={h} style={{marginBottom: i < 4 ? 20 : 0, ...rise(sp(f, 22 + i * 8), 18)}}>
          <div style={{fontFamily: 'M', fontWeight: 800, fontSize: 26, color: OR}}>{h}</div>
          <div style={{fontFamily: 'M', fontSize: 26, lineHeight: 1.5, color: CD, whiteSpace: 'pre-wrap'}}>{b}</div>
        </div>
      ))}
    </div>
    <div style={{position: 'absolute', left: L, top: 1268, display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'M', fontWeight: 700, fontSize: 24, color: OR,
      border: `2.5px solid ${OR}`, borderRadius: 10, padding: '8px 18px', ...rise(sp(f, 48, SPR.pop), 16)}}>
      <svg width={26} height={26} viewBox="0 0 24 24"><path d="M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 100-8 4 4 0 000 8z" stroke={OR} strokeWidth={2} fill="none" strokeLinejoin="round" /></svg>
      TIRE PRINT DESTA TELA
    </div>
  </>
);

/* ---------- 9 · CTA de compartilhamento ---------- */
const Cta: React.FC<{f: number}> = ({f}) => {
  const fx = interpolate(f, [40, 52, 53, 68], [0, 70, -70, 0], {...clamp, easing: Easing.bezier(0.5, 0, 0.2, 1)});
  const fo = interpolate(f, [40, 50, 54, 66], [1, 0, 0, 1], clamp);
  const plane = sp(f, 14, SPR.pop);
  return (
    <>
      <Title f={f} size={70} right={RR} lines={[[{t: 'Manda para quem'}], [{t: 'ainda escreve'}], [{t: 'prompt em'}], [{t: 'um parágrafo', hl: true}, {t: '.'}]]} />
      <div style={{position: 'absolute', left: L, top: 760, display: 'flex', alignItems: 'center', gap: 22, ...rise(sp(f, 30), 24)}}>
        <div style={{width: 112, height: 112, borderRadius: 56, background: OR, display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: `scale(${0.6 + 0.4 * plane})`}}>
          <svg width={58} height={58} viewBox="0 0 24 24" style={{transform: `translate(${fx}px, ${-fx}px)`, opacity: fo}}>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" stroke={BG} strokeWidth={2.4} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          </svg>
        </div>
        <div style={{fontFamily: 'I', fontSize: 36, fontWeight: 600, color: TX, lineHeight: 1.25}}>Toque em enviar<br /><span style={{color: MU, fontWeight: 500}}>e marque quem precisa ver</span></div>
      </div>
      <div style={{position: 'absolute', left: L, right: RR, top: 960}}>
        {[['01', 'Salve o esqueleto'], ['02', 'Comente qual prompt dissecar no próximo'], ['03', 'Siga a @xarpy_dev']].map(([n, t], i) => (
          <div key={n} style={{display: 'grid', gridTemplateColumns: '56px 1fr', padding: '18px 0', borderBottom: i < 2 ? `2px solid ${LN}` : 'none', ...rise(sp(f, 50 + i * 8), 20)}}>
            <span style={{fontFamily: 'M', fontWeight: 800, fontSize: 28, color: OR}}>{n}</span>
            <span style={{fontFamily: 'I', fontSize: 33, color: CD}}>{t}</span>
          </div>
        ))}
      </div>
    </>
  );
};

const PAGE_C: React.FC<{f: number}>[] = [Gancho, Prova, Estrutura, Papel, Passos, Regras, Formato, Esqueleto, Cta];

const Frame: React.FC = () => {
  const F = useF();
  const pos = posAt(F);
  return (
    <AbsoluteFill style={{background: BG, color: TX}}>
      <div style={{position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 900px 700px at 100% 100%, rgba(255,81,0,0.10), transparent 70%)'}} />
      {PAGE_C.map((C, i) => {
        const x = (i - pos) * 1080;
        if (Math.abs(x) > 1100) return null;
        return <AbsoluteFill key={i} style={{transform: `translateX(${x}px)`}}><C f={Math.max(0, F - STARTS[i])} /></AbsoluteFill>;
      })}
      <Head F={F} pos={pos} />
      <Caption F={F} />
    </AbsoluteFill>
  );
};

export type ERProps = {blur?: boolean; samples?: number; safe?: boolean};
export const ERReel: React.FC<ERProps> = ({blur = false, samples = 3, safe}) => (
  <AbsoluteFill style={{background: BG}}>
    <style>{fontCss}</style>
    {blur ? <CameraMotionBlur shutterAngle={180} samples={samples}><Frame /></CameraMotionBlur> : <Frame />}
    {safe && (
      <AbsoluteFill style={{pointerEvents: 'none'}}>
        <div style={{position: 'absolute', left: 0, right: 0, top: 0, height: 200, background: 'rgba(80,140,255,0.3)'}} />
        <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 420, background: 'rgba(80,140,255,0.3)'}} />
        <div style={{position: 'absolute', right: 0, width: 140, top: 1050, bottom: 420, background: 'rgba(80,140,255,0.3)'}} />
      </AbsoluteFill>
    )}
  </AbsoluteFill>
);
