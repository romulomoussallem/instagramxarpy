# Sistema de Motion XARPY

Referência para todos os Reels feitos em Remotion. Baseado no catálogo de 100 técnicas (Prompt Master AAA+). Regra mestra: a melhor animação é a que deixa a mensagem mais clara, não a mais complexa.

## Princípios
1. Todo movimento tem função: guiar a leitura, mostrar relação entre elementos ou marcar uma mudança de estado.
2. Nada se move sem motivo. Elementos em repouso ficam parados (exceção: respiração discreta de personagens).
3. A fala manda no tempo. Com narração, cada revelação acontece quando a voz cita o elemento.
4. Identidade intocável: logo e símbolo oficiais (`marca/`) só recebem máscara, escala e opacidade. Nunca redesenhar.
5. Sem brilho, glow, gradientes decorativos ou elasticidade sem motivo.

## Tokens (quadros a 30 fps; render a 60 fps)
| Token | Valor | Uso |
|---|---|---|
| `SPR.page` | damping 22, stiffness 120, mass 1 | passagem de página (~500 ms) |
| `SPR.card` | damping 15, stiffness 140, mass 0.8 | entrada de blocos (~350 ms) |
| `SPR.pop` | damping 10, stiffness 200, mass 0.6 | selos, checks, microinterações (~200 ms) |
| `SPR.word` | damping 16, stiffness 240, mass 0.5 | letras e palavras |
| Cascata | 2 a 4 quadros entre elementos irmãos | listas, letras, selos |
| Distância de entrada | 16 a 36 px na vertical | blocos e textos |
| Foco | elementos fora de foco a 40% de opacidade | estado ativo sincronizado à fala |
| Passagem de página (`TR`) | 16 quadros | carrossel horizontal |
| Desfoque de movimento | 3 amostras, obturador 180° (8 em trechos muito rápidos) | todo o vídeo |

## Técnicas aprovadas e onde usar
| Nº | Técnica | Uso padrão |
|---|---|---|
| 2, 5 | Split Text Reveal, Character Stagger | títulos: letras sobem por máscara em cascata |
| 3 | Mask Reveal | faixa verde, sublinhados, logo |
| 7 | Rolling Text | contador de páginas 01/07 |
| 11 | Seamless Page Transition | deslize horizontal entre páginas, cabeçalho e rodapé fixos |
| 12 | Shared Element Transition | elemento que aparece em duas páginas viaja entre elas (ex.: selos docx/xlsx/pptx/pdf) |
| 16 | Iris Transition | revelação circular do símbolo oficial no encerramento |
| 26 | Progressive Loading | barra de progresso do rodapé = página atual |
| 28 | Validation Feedback | checks e X desenhados, caixas de prós e contras |
| 36 | SVG Path Drawing | checks, sublinhados, divisórias |
| 51, 60 | Procedural Assembly, Blueprint-to-Physical | personagem ou objeto aparece em traço e ganha volume |
| 61 | Idle Animation | respiração discreta do robô |
| 84, 98 | Rack Focus, State-Based Motion | foco no item que a voz está citando |
| 92 | Signature Motion | varredura verde da esquerda para a direita em todo destaque |
| 100 | Cinematic Brand Outro | encerramento com símbolo, @xarpy_dev e próximo episódio |

## Técnicas descartadas e por quê
- 3D, partículas, líquidos, volumétricos (40-50, 88, 89, 87): pesam, fogem da identidade gráfica e não ajudam a leitura.
- Whip pan, speed ramp, diagonal/liquid wipe (82, 83, 15, 17): agressivos demais para conteúdo de tutorial.
- Elastic toggle, magnetic button, hover (21, 24, 25): não existe interação em vídeo.
- Parallax em múltiplas camadas (33): no layout claro e chapado do carrossel, cria movimento sem função.

## Legenda
- Palavra por palavra, sincronizada com a narração (`palavras.json`).
- Blocos de até ~26 letras, quebrados nas pausas da fala, sem separar nomes compostos ("Claude Code").
- Palavras-chave recebem a varredura verde (técnica 92).
- Área segura do Instagram: nada importante acima de 200 px, abaixo de 1500 px ou em x > 940 entre y 1050 e 1500.

## Acessibilidade
- Toda informação está no texto da tela e na legenda; nada depende só de movimento ou só de som.
- Contraste de texto ≥ 4,5:1.
- Sem flashes nem movimento contínuo de fundo.

## Antes de criar uma animação nova
Responder: qual a função? existe forma mais discreta? é coerente com os tokens acima? Se não houver resposta clara, deixar o elemento parado.
