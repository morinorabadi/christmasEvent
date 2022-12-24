const express = require('express')
const http = require('http');
const { Server } = require('socket.io')
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = new Server(server,{cors : {origin : '*'}})


app.use(express.static(path.join(__dirname, '../../dist')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../../dist/index.html'))
});


io.on('connection', socket => {
    console.log(socket.id + " is connected");
})


server.listen(3000,() => {
    console.log("server is active...");
})