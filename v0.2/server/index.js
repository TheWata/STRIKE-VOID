const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');

const { getHealth } = require('./src/controllers/healthController');
const { registerRoomHandlers } = require('./src/controllers/roomController');
const { registerGameHandlers } = require('./src/controllers/gameController');
const { registerChatHandlers } = require('./src/controllers/chatController');

const cliPort = Number(process.argv[2]);
const PORT = Number(process.env.PORT) || (Number.isFinite(cliPort) && cliPort > 0 ? cliPort : 3001);
const app = express();
app.use(cors({ origin: '*' }));

// Servir o build do front-end se existir
const clientDist = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDist));

app.get('/api/health', getHealth);

// Redireciona qualquer outra rota para o SPA se os estáticos existirem (compatível com Express 5)
app.use((req, res, next) => {
  if (req.method === 'GET') {
    const indexPath = path.join(clientDist, 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) next();
    });
  }
  next();
});

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket);
  registerGameHandlers(io, socket);
  registerChatHandlers(io, socket);
});

server.listen(PORT, () =>
  console.log('STRIKE/VOID v2 (MVC) server rodando na porta ' + PORT)
);
