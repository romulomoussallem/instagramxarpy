import React from 'react';
import {
  AbsoluteFill, Img, Sequence, interpolate, spring, staticFile,
  useCurrentFrame, useVideoConfig, Easing,
} from 'remotion';

// Paleta "inovação" (dicas de sistemas, soluções)
const C = {bg: '#04141E', tq: '#64DBE8', or: '#FF6D04', white: '#F7F9F7', dim: '#5E7380', card: '#0B2533'};

const fontCss = `
@font-face{font-family:'JB';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
@font-face{font-family:'IT';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}
`;
const H = 'JB';
const T = 'IT';

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const useIn = (delay = 0, dur = 18) => {
  const f = useCurrentFrame();
  return interpolate(f - delay, [0, dur], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
};
const useOut = (start: number, dur = 10) => {
  const f = useCurrentFrame();
  return interpolate(f - start, [0, dur], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.cubic)});
};

// Texto que sobe de dentro de uma máscara
const Reveal: React.FC<{delay?: number; children: React.ReactNode; style?: React.CSSProperties}> = ({delay = 0, children, style}) => {
  const p = useIn(delay, 20);
  return (
    <div style={{overflow: 'hidden', ...style}}>
      <div style={{transform: `translateY(${(1 - p) * 110}%)`}}>{children}</div>
    </div>
  );
};

// Assinatura da série: textos verticais nas laterais, como no vídeo de referência
const Frame: React.FC = () => {
  const side: React.CSSProperties = {position: 'absolute', top: 0, bottom: 0, display: 'flex', alignItems: 'center',
    fontFamily: T, fontSize: 22, letterSpacing: 4, color: C.dim, textTransform: 'uppercase'};
  return (
    <>
      <div style={{...side, left: 30}}><div style={{writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap'}}>XARPY · IA para negócios · 2026</div></div>
      <div style={{...side, right: 30}}><div style={{writingMode: 'vertical-rl', whiteSpace: 'nowrap'}}>@xarpy_dev · sistemas com IA</div></div>
      <Img src={staticFile('icone.png')} style={{position: 'absolute', top: 70, right: 80, width: 72}} />
    </>
  );
};

const Pill: React.FC<{text: string; delay?: number; color?: string}> = ({text, delay = 0, color = C.tq}) => {
  const p = useIn(delay, 16);
  return (
    <div style={{display: 'inline-block', transform: `scale(${0.8 + 0.2 * p})`, opacity: p,
      background: color, color: C.bg, fontFamily: H, fontWeight: 800, fontSize: 64, letterSpacing: 2,
      padding: '18px 54px', borderRadius: 999}}>{text}</div>
  );
};

/* ---------- Cena 1: abertura ---------- */
const S1: React.FC = () => {
  const block = useIn(0, 22);
  const out = useOut(80);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 150, left: 110, fontFamily: T, fontSize: 28, letterSpacing: 6, color: C.tq}}>
        <Reveal delay={4}>EDIÇÃO 01 · 18.11.2026</Reveal>
      </div>
      <div style={{position: 'absolute', left: 0, top: 560, height: 520, width: `${block * 100}%`, background: C.tq}} />
      <div style={{position: 'absolute', left: 110, top: 560, height: 520, display: 'flex', alignItems: 'center'}}>
        <Reveal delay={10}><div style={{fontFamily: H, fontWeight: 800, fontSize: 420, color: C.bg, lineHeight: 1}}>IA</div></Reveal>
      </div>
      <div style={{position: 'absolute', left: 110, top: 1120}}>
        <Reveal delay={18}><div style={{fontFamily: H, fontWeight: 700, fontSize: 110, color: C.white, lineHeight: 1.05}}>para</div></Reveal>
        <Reveal delay={24}><div style={{fontFamily: H, fontWeight: 700, fontSize: 110, color: C.or, lineHeight: 1.05}}>negócios.</div></Reveal>
      </div>
      <div style={{position: 'absolute', left: 110, bottom: 200, width: 760, fontFamily: T, fontSize: 34, color: C.dim, lineHeight: 1.4}}>
        <Reveal delay={34}>O que muda quando a IA sai do chat e entra na operação.</Reveal>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Cena 2: frase + cartão de conversa em 3D ---------- */
const Bubble: React.FC<{side: 'l' | 'r'; text: string; delay: number}> = ({side, text, delay}) => {
  const p = useIn(delay, 14);
  return (
    <div style={{display: 'flex', justifyContent: side === 'l' ? 'flex-start' : 'flex-end', opacity: p,
      transform: `translateY(${(1 - p) * 30}px)`, marginBottom: 22}}>
      <div style={{maxWidth: 520, padding: '22px 28px', borderRadius: 28, fontFamily: T, fontSize: 32, lineHeight: 1.35,
        background: side === 'l' ? '#16384A' : C.tq, color: side === 'l' ? C.white : C.bg}}>{text}</div>
    </div>
  );
};
const S2: React.FC = () => {
  const f = useCurrentFrame();
  const card = useIn(16, 26);
  const out = useOut(122);
  const rot = interpolate(f, [16, 135], [-14, -6]);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 210, left: 110, right: 110}}>
        <Reveal><div style={{fontFamily: H, fontWeight: 700, fontSize: 62, color: C.white, lineHeight: 1.15}}>Não é sobre ter IA.</div></Reveal>
        <Reveal delay={8}><div style={{fontFamily: H, fontWeight: 700, fontSize: 62, color: C.or, lineHeight: 1.15}}>É onde ela trabalha.</div></Reveal>
      </div>
      <div style={{position: 'absolute', top: 640, left: 0, right: 0, display: 'flex', justifyContent: 'center', perspective: 1600}}>
        <div style={{width: 720, background: C.card, borderRadius: 40, padding: 40, opacity: card,
          transform: `translateY(${(1 - card) * 160}px) rotateY(${rot}deg) rotateX(6deg)`,
          boxShadow: '40px 50px 0 #020B11'}}>
          <div style={{display: 'flex', alignItems: 'center', gap: 20, marginBottom: 34}}>
            <div style={{width: 64, height: 64, borderRadius: 32, background: C.or}} />
            <div>
              <div style={{fontFamily: T, fontWeight: 700, fontSize: 30, color: C.white}}>Atendimento da loja</div>
              <div style={{fontFamily: T, fontSize: 24, color: C.tq}}>responde em segundos · 24h</div>
            </div>
          </div>
          <Bubble side="l" text="Oi, meu pedido já saiu?" delay={36} />
          <Bubble side="r" text="Saiu hoje às 14h. Chega amanhã até as 18h. Quer o código de rastreio?" delay={52} />
          <Bubble side="l" text="Quero sim." delay={74} />
          <Bubble side="r" text="Enviado aqui e no seu e-mail." delay={88} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

/* ---------- Cena 3: tríade com pílula ---------- */
const Bars: React.FC = () => {
  const vals = [0.35, 0.5, 0.45, 0.7, 0.85, 1];
  const f = useCurrentFrame();
  return (
    <div style={{display: 'flex', alignItems: 'flex-end', gap: 26, height: 520}}>
      {vals.map((v, i) => {
        const p = interpolate(f - 6 - i * 4, [0, 18], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
        return <div key={i} style={{width: 92, height: 520 * v * p, background: i === vals.length - 1 ? C.or : C.tq, borderRadius: 14}} />;
      })}
    </div>
  );
};
const Counter: React.FC = () => {
  const f = useCurrentFrame();
  const n = Math.round(interpolate(f, [4, 34], [0, 37], {extrapolateRight: 'clamp', extrapolateLeft: 'clamp', easing: ease}));
  return (
    <div style={{width: 760, background: C.card, borderRadius: 40, padding: 50}}>
      <div style={{fontFamily: T, fontSize: 30, color: C.dim, letterSpacing: 3}}>MARGEM POR CANAL · ESTA SEMANA</div>
      <div style={{fontFamily: H, fontWeight: 800, fontSize: 220, color: C.white, lineHeight: 1.05}}>{n}%</div>
      <div style={{display: 'flex', gap: 16, marginTop: 10}}>
        <div style={{background: C.or, color: C.bg, fontFamily: T, fontWeight: 700, fontSize: 30, padding: '12px 24px', borderRadius: 14}}>Priorizar loja online</div>
        <div style={{background: '#16384A', color: C.white, fontFamily: T, fontSize: 30, padding: '12px 24px', borderRadius: 14}}>Pausar canal B</div>
      </div>
    </div>
  );
};
const Mini: React.FC = () => (
  <div style={{width: 760, transform: 'scale(1.25)', transformOrigin: 'top center'}}>
    <Bubble side="l" text="Tem horário amanhã?" delay={4} />
    <Bubble side="r" text="Tenho 10h ou 15h. Qual prefere?" delay={14} />
    <Bubble side="l" text="15h." delay={26} />
  </div>
);
const Triad: React.FC<{verb: string; pill: string; color?: string; children: React.ReactNode; dur: number}> = ({verb, pill, color, children, dur}) => {
  const out = useOut(dur - 8, 8);
  const p = useIn(0, 18);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 230, width: '100%', textAlign: 'center'}}>
        <Reveal><div style={{fontFamily: H, fontWeight: 700, fontSize: 64, color: C.white}}>{verb}</div></Reveal>
      </div>
      <div style={{position: 'absolute', top: 470, width: '100%', display: 'flex', justifyContent: 'center', opacity: p,
        transform: `scale(${0.92 + 0.08 * p})`}}>{children}</div>
      <div style={{position: 'absolute', top: 1290, width: '100%', textAlign: 'center'}}><Pill text={pill} delay={8} color={color} /></div>
    </AbsoluteFill>
  );
};

/* ---------- Cena 4: tarefas empilhadas ---------- */
const Task: React.FC<{text: string; meta: string; delay: number; i: number}> = ({text, meta, delay, i}) => {
  const p = useIn(delay, 16);
  return (
    <div style={{position: 'absolute', left: 140, right: 140, top: 640 + i * 190, opacity: p,
      transform: `translateX(${(1 - p) * 120}px)`, background: i % 2 ? '#16384A' : C.card, borderRadius: 32,
      padding: '34px 40px', display: 'flex', alignItems: 'center', gap: 30}}>
      <div style={{width: 74, height: 74, borderRadius: 37, background: C.tq, color: C.bg, fontFamily: H, fontWeight: 800,
        fontSize: 44, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>✓</div>
      <div>
        <div style={{fontFamily: T, fontWeight: 700, fontSize: 38, color: C.white}}>{text}</div>
        <div style={{fontFamily: T, fontSize: 26, color: C.dim, marginTop: 4}}>{meta}</div>
      </div>
    </div>
  );
};
const S4: React.FC = () => {
  const out = useOut(98);
  return (
    <AbsoluteFill style={{opacity: out}}>
      <div style={{position: 'absolute', top: 260, left: 140, right: 140}}>
        <Reveal><div style={{fontFamily: H, fontWeight: 700, fontSize: 70, color: C.white, lineHeight: 1.1}}>Enquanto o time</div></Reveal>
        <Reveal delay={6}><div style={{fontFamily: H, fontWeight: 700, fontSize: 70, color: C.or, lineHeight: 1.1}}>cuida do cliente:</div></Reveal>
      </div>
      <Task i={0} delay={14} text="Proposta enviada" meta="gerada a partir da conversa" />
      <Task i={1} delay={26} text="Nota fiscal emitida" meta="pedido 4821" />
      <Task i={2} delay={38} text="Lead qualificado" meta="encaminhado ao comercial" />
      <Task i={3} delay={50} text="Estoque atualizado" meta="sincronizado com a loja" />
    </AbsoluteFill>
  );
};

/* ---------- Cena 5: fechamento ---------- */
const S5: React.FC = () => {
  const f = useCurrentFrame();
  const big = spring({frame: f - 14, fps: 30, config: {damping: 200}});
  const wipe = interpolate(f, [0, 14], [0, 1], {extrapolateRight: 'clamp', easing: ease});
  return (
    <AbsoluteFill>
      <div style={{position: 'absolute', inset: 0, background: C.or, transform: `scaleY(${wipe})`, transformOrigin: 'bottom'}} />
      <div style={{position: 'absolute', top: 640, left: 110, right: 110}}>
        <Reveal delay={10}><div style={{fontFamily: H, fontWeight: 800, fontSize: 96, color: C.bg, lineHeight: 1}}>SUA EMPRESA</div></Reveal>
        <div style={{overflow: 'hidden', marginTop: 10}}>
          <div style={{fontFamily: H, fontWeight: 800, fontSize: 96, color: C.white, lineHeight: 1,
            transform: `translateY(${(1 - big) * 110}%)`}}>NO AUTOMÁTICO.</div>
        </div>
      </div>
      <div style={{position: 'absolute', bottom: 260, left: 110, right: 110, display: 'flex', alignItems: 'center', gap: 26, opacity: useIn(40, 16)}}>
        <Img src={staticFile('icone.png')} style={{width: 96}} />
        <div>
          <div style={{fontFamily: H, fontWeight: 700, fontSize: 48, color: C.bg}}>@xarpy_dev</div>
          <div style={{fontFamily: T, fontSize: 32, color: C.bg}}>Sistemas com IA para empresas</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const Reel: React.FC = () => {
  const {fps} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: C.bg}}>
      <style>{fontCss}</style>
      <Frame />
      <Sequence from={0} durationInFrames={90}><S1 /></Sequence>
      <Sequence from={90} durationInFrames={132}><S2 /></Sequence>
      <Sequence from={222} durationInFrames={50}>
        <Triad verb="Uma IA que" pill="ATENDE" dur={50}><Mini /></Triad>
      </Sequence>
      <Sequence from={272} durationInFrames={50}>
        <Triad verb="Uma IA que" pill="VENDE" dur={50}><Bars /></Triad>
      </Sequence>
      <Sequence from={322} durationInFrames={56}>
        <Triad verb="Uma IA que" pill="DECIDE" color={C.or} dur={56}><Counter /></Triad>
      </Sequence>
      <Sequence from={378} durationInFrames={108}><S4 /></Sequence>
      <Sequence from={486} durationInFrames={54}><S5 /></Sequence>
    </AbsoluteFill>
  );
};
