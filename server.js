const express = require('express');
const app = express();
const route = require('./routes')
const { Server } = require("socket.io");
const { createServer } = require("http");

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

const PORT = 8080;

route(app);

const httpServer = createServer(app);
const io = new Server(httpServer);
io.on("connection", (socket) => {
  socket.on("message", (data)=>{
    io.sockets.emit("server sent data", data)
  })
});
httpServer.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});