import React, {useMemo} from 'react';
import {AbsoluteFill, Easing, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {ThreeCanvas} from '@remotion/three';
import * as THREE from 'three';

// Paleta 1 (carrosséis em geral): fundo claro editorial
const P = {bg: '#F7F9F7', green: '#0F3B27', lime: '#92FF5F', orange: '#FF7036', mint: '#CFF1D2', ice: '#BFF2F0'};
const ease = Easing.bezier(0.65, 0, 0.35, 1);
const fontCss = `
@font-face{font-family:'JB';src:url('${staticFile('JetBrainsMono.ttf')}');font-weight:100 900;}
@font-face{font-family:'IT';src:url('${staticFile('InterTight.ttf')}');font-weight:100 900;}`;

// Interpolação por pontos-chave com easing entre cada par
const kf = (f: number, frames: number[], vals: number[]) =>
  interpolate(f, frames, vals, {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});

const roundedRect = (w: number, h: number, r: number) => {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
};
const ext = {depth: 0.32, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.07, bevelSegments: 8, curveSegments: 24};

const Mat: React.FC<{color: string; rough?: number}> = ({color, rough = 0.35}) => (
  <meshPhysicalMaterial color={color} roughness={rough} metalness={0} clearcoat={0.6} clearcoatRoughness={0.25} />
);

// Ícone 1: balão de conversa
const Chat: React.FC = () => {
  const geo = useMemo(() => {
    const s = roundedRect(1.7, 1.2, 0.36);
    const g = new THREE.ExtrudeGeometry(s, ext); g.center(); return g;
  }, []);
  const tail = useMemo(() => {
    const s = new THREE.Shape(); s.moveTo(-0.15, 0); s.lineTo(0.35, 0); s.lineTo(-0.3, -0.45); s.lineTo(-0.15, 0);
    const g = new THREE.ExtrudeGeometry(s, {...ext, bevelSize: 0.04}); return g;
  }, []);
  return (
    <group>
      <mesh geometry={geo} castShadow><Mat color={P.green} /></mesh>
      <mesh geometry={tail} position={[-0.35, -0.55, -0.2]} castShadow><Mat color={P.green} /></mesh>
      {[-0.42, 0, 0.42].map((x) => (
        <mesh key={x} position={[x, 0, 0.3]} castShadow>
          <sphereGeometry args={[0.13, 32, 32]} /><Mat color={P.lime} rough={0.25} />
        </mesh>
      ))}
    </group>
  );
};

// Ícone 2: engrenagem
const Gear: React.FC = () => {
  const geo = useMemo(() => {
    const s = new THREE.Shape(); const teeth = 9, R = 0.85, r = 0.66;
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / (teeth * 4)) * Math.PI * 2;
      const rad = i % 4 === 0 || i % 4 === 1 ? R : r;
      const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
      if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
    }
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.28, 0, Math.PI * 2, true); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, {...ext, bevelSize: 0.04, bevelThickness: 0.05}); g.center(); return g;
  }, []);
  const f = useCurrentFrame();
  return <mesh geometry={geo} rotation={[0, 0, f * 0.02]} castShadow><Mat color={P.orange} /></mesh>;
};

// Ícone 3: gráfico de barras
const Chart: React.FC<{grow: number}> = ({grow}) => {
  const hs = [0.6, 1.0, 1.5];
  return (
    <group position={[0, -0.75, 0]}>
      {hs.map((h, i) => {
        const hh = Math.max(0.05, h * grow);
        return (
          <mesh key={i} position={[(i - 1) * 0.55, hh / 2, 0]} castShadow>
            <boxGeometry args={[0.42, hh, 0.42]} /><Mat color={i === 2 ? P.lime : P.green} />
          </mesh>
        );
      })}
    </group>
  );
};

const Pedestal: React.FC<{x: number; children: React.ReactNode; pop: number; spin: number}> = ({x, children, pop, spin}) => (
  <group position={[x, 0, 0]}>
    <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[1.25, 1.32, 0.24, 64]} /><meshStandardMaterial color="#FFFFFF" roughness={0.6} />
    </mesh>
    <group position={[0, 1.35 + (1 - pop) * -0.6, 0]} scale={Math.max(0.001, pop)} rotation={[0, spin, 0]}>{children}</group>
  </group>
);

const Scene: React.FC = () => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pop = (d: number) => spring({frame: f - d, fps, config: {damping: 13, stiffness: 120}});
  // Caminho da câmera: passa por cada ícone e recua para mostrar os três
  const K = [0, 34, 52, 82, 100, 128, 150];
  // Plano final em diagonal, para os três ícones caberem no quadro vertical
  const camX = kf(f, K, [-4, -4, 0, 0, 4, 4, 12.5]);
  const camZ = kf(f, K, [8.6, 8.6, 8.6, 8.6, 8.6, 8.6, 2.2]);
  const camY = kf(f, K, [2.4, 2.4, 2.4, 2.4, 2.4, 2.4, 6.8]);
  const lookX = kf(f, K, [-4, -4, 0, 0, 4, 4, -0.5]);
  const lookY = kf(f, K, [0.7, 0.7, 0.7, 0.7, 0.7, 0.7, 0.9]);
  const face = kf(f, [128, 150], [0, 1.25]);
  const drift = Math.sin(f / 30) * 0.15;
  const dashes = 34; const lineP = kf(f, [10, 120], [0, 1]);
  return (
    <>
      <color attach="background" args={[P.bg]} />
      <fog attach="fog" args={[P.bg, 14, 34]} />
      <CameraRig x={camX + drift} y={camY} z={camZ} lx={lookX} ly={lookY} />
      <ambientLight intensity={0.9} />
      <directionalLight position={[3, 8, 6]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-radius={6} />
      <directionalLight position={[-6, 3, -4]} intensity={0.6} color={P.ice} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} /><meshStandardMaterial color={P.bg} roughness={1} />
      </mesh>
      {Array.from({length: dashes}).map((_, i) => {
        const x = -6 + (12 * i) / (dashes - 1);
        return i / dashes < lineP ? (
          <mesh key={i} position={[x, 0.01, 0]}><boxGeometry args={[0.18, 0.02, 0.04]} /><meshStandardMaterial color={P.green} /></mesh>
        ) : null;
      })}
      <Pedestal x={-4} pop={pop(4)} spin={Math.sin(f / 22) * 0.35 + face}><Chat /></Pedestal>
      <Pedestal x={0} pop={pop(44)} spin={-0.25 + Math.sin(f / 25) * 0.2 + face}><Gear /></Pedestal>
      <Pedestal x={4} pop={pop(90)} spin={Math.sin(f / 24) * 0.3 + face}><Chart grow={kf(f, [94, 120], [0, 1])} /></Pedestal>
    </>
  );
};

import {useThree} from '@react-three/fiber';
const CameraRig: React.FC<{x: number; y: number; z: number; lx: number; ly: number}> = ({x, y, z, lx, ly}) => {
  const {camera} = useThree();
  camera.position.set(x, y, z);
  camera.lookAt(lx, ly, 0);
  (camera as THREE.PerspectiveCamera).fov = 38;
  camera.updateProjectionMatrix();
  return null;
};

const Word: React.FC<{t: string; d: number; hi?: boolean}> = ({t, d, hi}) => {
  const f = useCurrentFrame();
  const p = interpolate(f - d, [0, 10], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic)});
  return (
    <span style={{display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * 24}px)`, marginRight: 22,
      color: hi ? P.green : P.green, background: hi ? P.lime : 'transparent', padding: hi ? '0 14px' : 0, borderRadius: 10}}>{t}</span>
  );
};

const Label: React.FC<{text: string; from: number; to: number}> = ({text, from, to}) => {
  const f = useCurrentFrame();
  const o = interpolate(f, [from, from + 8, to - 6, to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  return (
    <div style={{position: 'absolute', top: 1340, width: '100%', textAlign: 'center', opacity: o}}>
      <span style={{fontFamily: 'JB', fontWeight: 800, fontSize: 58, letterSpacing: 4, color: P.bg, background: P.green,
        padding: '16px 46px', borderRadius: 999}}>{text}</span>
    </div>
  );
};

export const Prova: React.FC = () => {
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: P.bg}}>
      <style>{fontCss}</style>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: true}} dpr={1}>
        <Scene />
      </ThreeCanvas>
      <Label text="ATENDE" from={12} to={46} />
      <Label text="EXECUTA" from={54} to={92} />
      <Label text="DECIDE" from={100} to={132} />
      <div style={{position: 'absolute', top: 230, left: 100, right: 100, fontFamily: 'JB', fontWeight: 800, fontSize: 70,
        lineHeight: 1.25, color: P.green}}>
        <div><Word t="IA" d={136} /><Word t="que" d={140} /><Word t="trabalha" d={144} /></div>
        <div><Word t="dentro" d={150} hi /><Word t="da" d={156} /><Word t="empresa." d={160} /></div>
      </div>
    </AbsoluteFill>
  );
};
