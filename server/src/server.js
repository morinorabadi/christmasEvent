const express = require('express')
const http = require('http');
const { Server } = require('socket.io')
const path = require("path")
const SocketManager = require('./socket/SocketManager')

const app = express()
const server = http.createServer(app)


app.use(express.static(path.join(__dirname, '../../dist')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'))
});

/**
 * socket
 */
const io = new Server(server,{cors : {origin : '*'}})
const socketManager = new SocketManager(io)
io.on('connection', socket => { socketManager.SocketConnect(socket) })


server.listen(5500,() => {
    console.log("server is active...");
})