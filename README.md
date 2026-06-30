# 🚂 Simulador de Listas Encadeadas

Site interativo (HTML/CSS/JS) com **menu inicial** e um **simulador passo a passo**
para os três tipos de lista encadeada.

## Como abrir
Dê **duplo clique** em `index.html`. Roda no navegador, sem servidor.

## Telas
1. **Menu** — um cartão/botão para cada lista: simples, dupla e circular.
2. **Simulador** — abre a lista escolhida (botão “← Menu” para voltar).

## No simulador você pode
- **Percorrer**, **inserir** (início / fim / posição) e **remover** (início / fim / valor)
- Ver o **código Go rodando passo a passo**: a linha atual fica destacada, um ponteiro
  vermelho **`cur`** anda pela lista e a narração explica o que acontece a cada passo
- Controlar a execução: **Play/Pausar**, **Próximo**, **Anterior**, **Reiniciar** e **velocidade**
- Clicar num vagão para selecioná-lo

## Arquivos do projeto
- `index.html` — as duas telas
- `styles.css` — visual e animações
- `app.js` — lógica das listas, motor de passo a passo e os trechos de Go

## Pode apagar (sobras não usadas)
`main.go`, `lists.go`, `go.mod` e a pasta `static/`. O projeto é 100% web.
