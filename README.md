# STRIKE / VOID

Jogo de cartas multiplayer tático em tempo real com resolução simultânea de rodadas, blefe, paredes, facas e reversos sombrios.

---

## 📁 Estrutura do Repositório

```text
STRIKE-VOID/
├── v0.1/                 # Protótipo Minimalista inicial (Vanilla JS + Express + Socket.io)
│   ├── public/           # Front-end estático da versão 1
│   ├── server.js         # Servidor da versão 1
│   └── package.json
│
├── v0.2/                 # Versão 2 (Nova Arquitetura Completa)
│   ├── client/           # Front-end React + Vite + TailwindCSS + Framer Motion + Web Audio SFX
│   │   ├── src/
│   │   └── package.json
│   └── server/           # Back-end Node.js + Express + Socket.io com Bots, SFX Sync e IA
│       ├── index.js
│       └── package.json
│
├── package.json          # Orquestrador raiz para build e execução unificada
└── .gitignore
```

---

## ⚡ Como Rodar Localmente (Versão 0.2)

### Opção 1: Execução Completa (Cliente + Servidor juntos)

1. Instale as dependências e gere o build do cliente:
   ```bash
   npm run build
   ```
2. Inicie o servidor unificado:
   ```bash
   npm start
   ```
3. Abra no navegador: [http://localhost:3001](http://localhost:3001)

### Opção 2: Modo Desenvolvimento (Hot-reload)

- **Terminal 1 (Servidor):**
  ```bash
  npm run dev:server
  ```
- **Terminal 2 (Cliente React com Vite):**
  ```bash
  npm run dev:client
  ```
  Acesse `http://localhost:5173`.

---

## 🌐 Como Deixar Online (Deploy Gratuito no Render)

O projeto já está preparado com suporte a portas dinâmicas (`process.env.PORT`) e serving estático do React compilado diretamente pelo Node.js/Socket.io.

1. Suba este repositório para o seu **GitHub**.
2. Acesse o [Render.com](https://render.com) e crie uma conta gratuita.
3. Clique em **New +** > **Web Service**.
4. Conecte ao seu repositório no GitHub.
5. Configure os campos:
   - **Environment:** `Node`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
6. Clique em **Create Web Service**. Em poucos minutos o link com HTTPS e WebSockets estará online para jogar com seus amigos!
