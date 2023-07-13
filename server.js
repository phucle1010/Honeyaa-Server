const express = require('express');
const app = express();
const route = require('./routes');
const { Server } = require('socket.io');
const { createServer } = require('http');
const db = require('./store/index');

app.use(express.json({ limit: '200mb' }));
app.use(express.urlencoded({ limit: '200mb', extended: true }));

const PORT = 8080;

route(app);

const httpServer = createServer(app);
const io = new Server(httpServer);

io.on('connection', (socket) => {
    socket.on('message', (data) => {
        io.sockets.emit('server sent data', data);
    });
});

// db.getConnection(function (err, con) {
//     if (err) {
//         console.log('failed to connect to database');
//     } else {
//         con.query('SELECT * FROM detail_chat', (err, result) => {
//             if (err) {
//                 console.log(err);
//             } else {
//                 console.log('result: ', result);
//             }
//         });
//         console.log('Connected!');
//     }
// });
httpServer.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});
