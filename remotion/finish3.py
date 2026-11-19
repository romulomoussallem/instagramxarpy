"""Acabamento V3 de um Reel XARPY.

Uso: python3 finish3.py <render_4k_60fps.mp4> <saida_1080.mp4> [--master4k saida_4k.mp4] [--voice voz.wav] [--music trilha.wav]

Vídeo
- 60 -> 30 fps misturando pares de quadros (desfoque de movimento extra)
- 4K -> 1080x1920 com Lanczos (supersampling: texto e bordas sem serrilhado)
- Correção de cor: curva de contraste suave, pretos com leve tom da paleta
- Grão de filme temporal aplicado depois da redução, aberração cromática leve
- H.264 High, BT.709, preparado para a recompressão do Instagram

Som em camadas
- Cada efeito com variação de tom (dois cliques nunca soam iguais)
- Posição estéreo de cada efeito conforme o elemento na tela (roteiro: 3º valor de sfx, -1 a 1)
- Reverberação curta no barramento de efeitos
- Ducking automático da música quando houver narração
- Loudness -14 LUFS em duas passagens, pico abaixo de -1 dBTP
"""
import json, subprocess, os, argparse, random, re

ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('out')
ap.add_argument('--master4k'); ap.add_argument('--clean', action='store_true'); ap.add_argument('--voice'); ap.add_argument('--music')
ap.add_argument('--roteiro', default='src/xr/roteiro3.json')
a = ap.parse_args()

HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, a.roteiro)))
fps = R['fps']
SFX = os.path.join(HERE, 'sfx')
total = sum(s['dur'] for s in R['scenes']) / fps
random.seed(7)

def run(cmd):
    subprocess.run(cmd, check=True)

def synth():
    os.makedirs(SFX, exist_ok=True)
    gen = {
        'whoosh': ['-f', 'lavfi', '-i', 'anoisesrc=d=0.5:c=pink:a=0.5', '-af', 'highpass=f=350,lowpass=f=6000,afade=t=in:d=0.22,afade=t=out:st=0.26:d=0.24,volume=0.45'],
        'click': ['-f', 'lavfi', '-i', 'sine=f=1600:d=0.045', '-f', 'lavfi', '-i', 'anoisesrc=d=0.012:c=white:a=0.3', '-filter_complex', '[0]afade=t=out:d=0.045[s];[1]highpass=f=3000[n];[s][n]amix=inputs=2,volume=0.5'],
        'key': ['-f', 'lavfi', '-i', 'anoisesrc=d=0.03:c=white:a=0.4', '-af', 'highpass=f=1800,lowpass=f=7000,afade=t=out:d=0.03,volume=0.32'],
        'enter': ['-f', 'lavfi', '-i', 'sine=f=150:d=0.14', '-f', 'lavfi', '-i', 'anoisesrc=d=0.02:c=white:a=0.4', '-filter_complex', '[0]afade=t=out:d=0.14[s];[1]highpass=f=2000[n];[s][n]amix=inputs=2,volume=0.9'],
        'chime': ['-f', 'lavfi', '-i', 'sine=f=880:d=0.8', '-f', 'lavfi', '-i', 'sine=f=1318.5:d=0.8', '-f', 'lavfi', '-i', 'sine=f=1760:d=0.8',
                  '-filter_complex', '[0][1][2]amix=inputs=3,afade=t=in:d=0.005,afade=t=out:d=0.8,volume=0.5'],
        'error': ['-f', 'lavfi', '-i', 'sine=f=196:d=0.36', '-f', 'lavfi', '-i', 'sine=f=207.6:d=0.36', '-filter_complex', '[0][1]amix=inputs=2,afade=t=out:d=0.36,volume=0.65'],
    }
    for name, args in gen.items():
        run(['ffmpeg', '-v', 'error', '-y', *args, '-ar', '48000', '-ac', '1', os.path.join(SFX, f'{name}3.wav')])
    run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', f'sine=f=55:d={total}', '-f', 'lavfi', '-i', f'sine=f=82.4:d={total}',
         '-f', 'lavfi', '-i', f'sine=f=110:d={total}', '-f', 'lavfi', '-i', f'sine=f=164.8:d={total}', '-filter_complex',
         f'[0][1][2][3]amix=inputs=4,tremolo=f=0.2:d=0.35,lowpass=f=420,afade=t=in:d=0.6,afade=t=out:st={total-1.0}:d=1.0,volume=0.9',
         '-ar', '48000', os.path.join(SFX, 'bed3.wav')])

synth()

cues, t0 = [], 0
for s in R['scenes']:
    if t0 > 0:
        cues.append((max(0, t0 - 3) / fps, 'whoosh', 0.0))
    for item in s.get('sfx', []):
        fr, name = item[0], item[1]
        pan = item[2] if len(item) > 2 else 0.0
        cues.append(((t0 + fr) / fps, name, pan))
    t0 += s['dur']

inputs = ['-i', a.video, '-i', a.music or os.path.join(SFX, 'bed3.wav')]
if a.voice:
    inputs += ['-i', a.voice]
base = 3 if a.voice else 2
fc, labels = [], []
for i, (t, name, pan) in enumerate(cues):
    inputs += ['-i', os.path.join(SFX, f'{name}3.wav')]
    ms = int(t * 1000)
    rate = random.uniform(0.94, 1.06) if name in ('key', 'click', 'enter') else 1.0
    gain = random.uniform(0.85, 1.0) if name == 'key' else 1.0
    l, r = (1 - max(0, pan)), (1 + min(0, pan))
    fc.append(f'[{base + i}:a]asetrate={int(48000 * rate)},aresample=48000,volume={gain:.2f},'
              f'pan=stereo|c0={l:.2f}*c0|c1={r:.2f}*c0,adelay={ms}|{ms}[c{i}]')
    labels.append(f'[c{i}]')
fc.append(f'{"".join(labels)}amix=inputs={len(labels)}:normalize=0,aecho=0.85:0.55:28|53:0.22|0.12[sfx]')
mv = 0.35 if a.voice else 0.5
fc.append(f'[1:a]aformat=channel_layouts=stereo,volume={mv},apad=whole_dur={total}[mus0]')
if a.voice:
    fc.append('[2:a]aformat=channel_layouts=stereo,asplit=2[vox][vkey]')
    fc.append('[mus0][vkey]sidechaincompress=threshold=0.03:ratio=8:attack=20:release=350[mus]')
    fc.append('[mus][vox][sfx]amix=inputs=3:normalize=0[mix]')
else:
    fc.append('[mus0][sfx]amix=inputs=2:normalize=0[mix]')
fc.append(f'[mix]atrim=0:{total},aresample=48000' + (',asplit=2[aout][aout2]' if a.master4k else '[aout]'))

grade = ("curves=all='0/0.012 0.18/0.16 0.5/0.5 0.82/0.85 1/1',"
         "colorbalance=rs=-0.01:gs=0.012:bs=-0.005")
v = ("[0:v]tmix=frames=2:weights='1 1',fps=30,"
     f"{grade},split=2[v4k][vhd];"
     "[vhd]scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int,"
     f"noise=c0s=5:c0f=t,{'' if a.clean else 'rgbashift=rh=-1:bh=1,'}unsharp=3:3:0.22:3:3:0,format=yuv420p,"
     "setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709[vout];"
     "[v4k]noise=c0s=6:c0f=t,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709[v4out]")
if not a.master4k:
    v = v.replace(',split=2[v4k][vhd];[vhd]', ',').split(';[v4k]')[0]
fc.append(v)

tmp = a.out + '.tmp.mp4'
enc = ['-c:v', 'libx264', '-preset', 'slow', '-profile:v', 'high', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709']
cmd = ['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc),
       '-map', '[vout]', '-map', '[aout]', *enc, '-crf', '16', '-maxrate', '16M', '-bufsize', '32M', '-r', '30',
       '-c:a', 'pcm_s16le', tmp.replace('.mp4', '.mov')]
if a.master4k:
    cmd += ['-map', '[v4out]', '-map', '[aout2]', *enc, '-crf', '14', '-r', '30', '-c:a', 'pcm_s16le', a.master4k + '.tmp.mov']
run(cmd)

def loud(src, dst):
    m = subprocess.run(['ffmpeg', '-nostats', '-i', src, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    I = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', m)[-1])
    run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-c:v', 'copy', '-af',
         f'volume={-14.0 - I:.2f}dB,alimiter=limit=0.64:attack=0.5:release=50:level=disabled,aresample=48000',
         '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', dst])
    os.remove(src)

loud(tmp.replace('.mp4', '.mov'), a.out)
if a.master4k:
    loud(a.master4k + '.tmp.mov', a.master4k)
print('ok', a.out, a.master4k or '')
