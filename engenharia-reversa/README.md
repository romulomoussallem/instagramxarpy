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

Variação visual (18/11): a capa segue o tema do prompt (campo opcional "tema" no dados.json; se faltar, o gerador deduz por palavras-chave): escrita = número gigante laranja, agentes = bloco laranja sólido, avaliacao = fundo branco, atendimento/seguranca/geral = layout escuro com robô à direita. Sem brilho. Gerar sempre com `tools/gen_rev.py`.
