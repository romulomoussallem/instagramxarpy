# Renderizador dos Reels XARPY (Remotion)

Código dos Reels publicados no @xarpy_dev. Composições em `src/Root.tsx`.

- Reel 2 "Por onde começar com IA": `src/news3/Reel2.tsx` (tema Skills claro, padrão atual)
- "5 caminhos R$ 20 mil": `src/news3/Ganhos.tsx`
- Radar IA: `src/news3/Radar3.tsx`
- Engenharia Reversa: `src/er/ERReel.tsx` · Tutorial 12: `src/t12/T12.tsx`

## Rodar
```
npm install
npx remotion render src/index.ts Reel2 out.mp4 --concurrency=2 --muted --crf=12
python3 finish3.py out.mp4 final.mp4 --voice voz.wav --roteiro roteiro.json --clean
```
Depois: x264 crf 18, maxrate 7M, alimiter 0.66 no áudio (-14 LUFS, pico < -1 dBTP).

Narração: conector ElevenLabs (`creative_generate_speech`, eleven_v4, voz "Will - For institutional videos" `IKpiSijWzlhOL6uX83EH`). Legenda: tempos estimados pelas pausas (ffmpeg silencedetect) e distribuídos por sílaba.
