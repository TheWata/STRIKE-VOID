# STRIKE / VOID

Jogo de cartas multiplayer tático em 3D em tempo real com resolução simultânea de rodadas, blefe, paredes, facas, espelhos amaldiçoados, pactos de sangue e manipulação de almas.

---

## 📁 Arquitetura do Repositório (Padrão MVC + Services + Helpers)

```text
STRIKE-VOID/
├── v0.2/
│   ├── client/                           # Front-end React + Vite + TailwindCSS + Framer Motion 3D
│   │   ├── src/
│   │   │   ├── models/                   # Modelos de cartas, fases, zonas de câmera 3D e metadados
│   │   │   │   ├── cardModel.js
│   │   │   │   └── gameModel.js
│   │   │   ├── views/                    # Views principais (Hub, Lobby e Mesa 3D em 1ª Pessoa)
│   │   │   │   ├── HomeHubView.jsx
│   │   │   │   ├── RoomLobbyView.jsx
│   │   │   │   └── GameTable3DView.jsx
│   │   │   ├── controllers/              # Controllers de estado de jogo e câmera 3D por mouse
│   │   │   │   ├── useGameController.js
│   │   │   │   └── useCamera3DController.js
│   │   │   ├── services/                 # Serviços de Socket.io, Web Audio SFX e LocalStorage
│   │   │   │   ├── socketService.js
│   │   │   │   ├── audioService.js
│   │   │   │   └── storageService.js
│   │   │   ├── helpers/                  # Utilitários matemáticos 3D, classes e media queries
│   │   │   │   ├── math3d.js
│   │   │   │   ├── cn.js
│   │   │   │   └── useMediaQuery.js
│   │   │   └── components/               # Componentes visuais 3D (Silhuetas, Cartas, Caderno, etc.)
│   │   └── package.json
│   │
│   └── server/                           # Back-end Node.js + Express + Socket.io em MVC
│       ├── index.js                      # Ponto de entrada do servidor HTTP + WebSocket
│       ├── src/
│       │   ├── models/                   # Modelos de Sala, Jogador e Baralho (7 Cartas)
│       │   │   ├── CardModel.js
│       │   │   ├── PlayerModel.js
│       │   │   └── RoomModel.js
│       │   ├── controllers/              # Controladores de Rotas e Eventos Socket.io
│       │   │   ├── healthController.js
│       │   │   ├── roomController.js
│       │   │   ├── gameController.js
│       │   │   └── chatController.js
│       │   ├── services/                 # Motor de Jogo, Baralho, Salas e IA de Bots
│       │   │   ├── gameEngineService.js
│       │   │   ├── deckService.js
│       │   │   ├── roomService.js
│       │   │   └── botService.js
│       │   └── helpers/                  # Geradores de ID/código, validadores, cálculo de tempo e logs
│       │       ├── idHelper.js
│       │       ├── validators.js
│       │       ├── timeCalculator.js
│       │       └── logger.js
│       └── package.json
│
├── v0.1/                                 # Protótipo histórico inicial
└── package.json                          # Orquestrador raiz para build e execução unificada
```

---

## 🎥 Experiência 3D em Primeira Pessoa & Silhuetas

- **Mouse para Cima (`JOGADORES`):** Inclina o olhar para cima para encarar as **Silhuetas 3D** dos outros jogadores ao redor da mesa, acompanhar suas barras de vida em caveiras, vínculos de Pacto de Sangue e cartas expostas por *Revelar*.
- **Mouse no Meio/Baixo (`CARTAS`):** Inclina o olhar para a mesa octogonal 3D e foca no leque de cartas na sua mão.
- **Mouse Mais Embaixo (`CADERNO`):** Olha para debaixo da mesa, abrindo o **Caderno de Anotações Clandestinas com o Chat** da partida.

---

## 🃏 Grimório de Cartas (7 Cartas)

1. **🔪 Faca:** Causa 1 de dano (ou mais se fortalecida) ou estilhaça uma Parede.
2. **🧱 Parede:** Ergue grades ao redor do alvo, absorvendo 1 facada e impedindo-o de mirar nos outros.
3. **🪞 Espelho Amaldiçoado *(antigo Reverso)*:** Arte de espelho quebrado. Reflete ações de volta aos atacantes ou rouba paredes. Se usado no vazio, pune o conjurador com -1 Vida (Vácuo).
4. **👁️ Revelar:** Utiliza a arte do Olho Abissal. Expõe todas as cartas da mão do jogador selecionado para toda a mesa.
5. **🧤 Desarmar:** Descarta 2 cartas aleatórias diretamente da mão de outro jogador.
6. **👻 Manipulamento de Alma:** Troca a barra de vida com outro jogador; se usado em si mesmo, aumenta permanentemente o dano da própria Faca (+1 Dano).
7. **🩸 Pacto de Sangue:** Ignora qualquer Parede e vincula sua barra de vida com outra pessoa (dano sofrido é compartilhado). Se refletido pelo Espelho Amaldiçoado, o conjurador toma 1 de dano!

---

## ⚡ Como Rodar Localmente

1. Instale as dependências e gere o build do cliente:
   ```bash
   npm run build
   ```
2. Inicie o servidor unificado:
   ```bash
   npm start
   ```
3. Abra no navegador: [http://localhost:3001](http://localhost:3001)
