# Série "Engenharia Reversa" (@xarpy_dev)

Um carrossel a cada 3 horas dissecando um prompt complexo encontrado no GitHub.

- Gerador: `python3 tools/gen_rev.py engenharia-reversa/NN-slug/dados.json` (campos documentados no topo do arquivo).
- Cada pasta tem `dados.json`, `legenda.txt` e `slide1.jpg` a `slide7.jpg`.
- `registro.json` lista os prompts já usados (status `pronto` ou `publicado`). Nunca repetir repositório + arquivo.

Vocabulário: não usar "desmontar". Preferir dissecar, destrinchar, raio-x, decifrar, abrir por dentro, por dentro de.

Regras de escolha do prompt:
- Público, com licença permissiva (MIT, Apache-2.0, BSD, CC0, CC-BY). Conferir o arquivo LICENSE.
- Nada de prompts vazados de empresas (repositórios de "system prompts leaked" ficam fora).
- Complexo de verdade: várias seções, regras, exemplos ou variáveis. Evitar prompts de uma linha.
- Trechos citados curtos, sempre com fonte.

Variação visual (18/11): a capa alterna entre 4 layouts conforme o número do prompt (n mod 4): 0 título + robô à direita, 1 número gigante laranja, 2 bloco laranja sólido, 3 fundo branco. O brilho (glow) foi removido. Gerar sempre com `tools/gen_rev.py`, sem copiar o layout do post anterior.
