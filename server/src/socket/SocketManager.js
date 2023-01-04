/**
 * emitted events
 * 1. server-authentication
 * 2. server-other-users
 */
const { v4: uuidV4 }=  require('uuid')
const WebRtcConnection = require('../webRTC/WebRtcConnection')
const BrowserWebRTCManager = require('../webRTC/BrowserWebRTCManager')

const fakeAdmins = [
    { username : "qwer" ,password : "1234" },
    { username : "asdf" ,password : "1234" }
]


class SocketManager
{
  constructor( io){
    // socket variables
    const sockets = new Map()
    
    // sockets that are authentication
    const socketsAuthenticated = []

    // manage browser WebRTC
    const browserWebRTCManager = new BrowserWebRTCManager(io,sendAllUsers)

    this.SocketConnect = (socket) => {
        // log some information
        console.log(socket.id,"is connected");

        // save socket in Map
        sockets.set(socket.id, socket)

        // listen disconnect event 
        socket.on("disconnecting", () => {
            // log some information
            console.log(socket.id,"is disconnected");

            // clear socket Map
            sockets.delete(socket.id)

            // clear socket in events if exist
            const eventIndex = socketsAuthenticated.indexOf(socket.id)
            if (eventIndex !== -1){
                socketsAuthenticated.splice(eventIndex,1)
            }

            // clear browser WebRTC 
            browserWebRTCManager.removeSocket(socket.id)


            // clear socket in game if exist and tell to others
            const gameIndex = socketsInGame.indexOf(socket.id)
            if (gameIndex !== -1){
                // delete from scene
                const playerGameID = socket.data.gameId
                socketsInGame.splice(gameIndex,1)
                io.to(socketsInGame).emit("game-player-left", playerGameID)
                
                // close server peerConnection
                peerConnections.get(socket.id).close()
                peerConnections.delete(socket.id)

                // clear game info
                delete gameInfo[playerGameID]

            }

        })


        // admin login
        socket.on("login", (userPass) => {
            const response = { status : 200, information : {} }

            let exist  = false
            // checking fake data base
            fakeAdmins.forEach(user => {
                if ( user.username == userPass.username ){
                    if ( user.password == userPass.password ){
                        console.log(`socket "${socket.id}" id login as "${user.username}"`);
                        createSocketData(socket,true,userPass.username)
                        response.information = socket.data
                        exist = true
                        sendAllUsers()
                    }
                }
            })

            // if not user exist 
            if ( exist ) {
                response.status = 404
                response.information.error = "not founded user"
            }

            // send our response
            socket.emit("server-authentication",response)
        })
        
        // set nickname 
        socket.on("set-nickname", (nickName) => {
            console.log(`socket "${socket.id}" id pick "${nickName.username}" as nickName`);
            createSocketData(socket,false,nickName.username)
            const response = { status : 200, information : socket.data.username }
            sendAllUsers()
            socket.emit("server-authentication",response)
        })

        /**
         * video call
         */

        //  after join in event
        socket.on('authentication-done', () =>  {
            if (socket.data.authentication){
                console.log("ERROR multi authentication")
                return
            }
            socket.data.authentication = true
            // log some info
            console.log(socket.id + " authentication ")
            
            // start browser WebRTCconnection 
            browserWebRTCManager.newClient(socket)

            // add user to sockets In Event 
            socketsAuthenticated.push(socket.id)
        })

        // chat messages
        socket.on('send-message', message => { newMessage(socket, message) })

        /**
         * game
         */

        // start game event called when load is over 
        socket.on("start-game", () => { createRTCConnection(socket) })

        // after we emit "create-webrtc" we wait for answer from client
        socket.on("peer-connection-answer", (answer) => { applyAnswer(socket,answer) })

    }
    /**
     * update users information about each other
     */
    function sendAllUsers(){
        const socketsID = []
        const response = { status : 200 , information : [] }
        sockets.forEach((socket, socketId) => {
            if ( socket.data ){
                socketsID.push(socketId)
                response.information.push({
                    ...socket.data,
                    id : socketId,
                })
            }
        })
        io.to(socketsID).emit("server-update-users", response)
    }
    // create data for sockets
    function createSocketData(socket,isAdmin,username) {
        socket.data = {
            isAdmin,
            username : username,

            isMicOn    : false,
            isMicAllow : true,

            isCamOn    : false,
            isCamAllow : true,
        }
    }

    /**
     * chat
     */
    const messages = new Map()
    function newMessage(socket,message) {
        //! check for empty message
        if ( socket.data.username ) {
            const id = uuidV4()
            const messageObject = {
                id,
                text : message,
                date : Date.now(),
                owner : socket.data.username
            }
            messages.set(id, messageObject)
            io.to(socketsAuthenticated).emit("new-message", {status : 200 , information : messageObject})
        } else {
            socket.emit('error')
        }
    }

    /**
     * server webRTC
     */
    // game peerConnection and information
    const peerConnections = new Map()
    const gameInfo = {}
    const socketsInGame = []
    // we generate some simple ID to decrees bites send from server to client
    let lastPlayerGameId = 0
    function createGameId(){
        lastPlayerGameId++
        const id = lastPlayerGameId.toString()
        gameInfo[id] = { 
            px : lastPlayerGameId,
            pz : 0,
            ry : 0,
            t  : Date.now() ,
            i : id
        }
        return id
    }

    async function createRTCConnection(socket) {
        const socketId = socket.id
        // create WebRtcConnection
        const connection = new WebRtcConnection("game", (data) => { updateGameInfo(data) })
        await connection.doOffer()

        // add the Connection to the Map.
        peerConnections.set(socketId, connection)

        // send out RTCPeerConnection info to socket
        socket.emit("create-server-webrtc", {
            localDescription : connection.localDescription,
            chanelLabel : connection.chanelLabel
        })
    }

    async function applyAnswer(socket, answer) {
        // search for server side peer
        const connection = peerConnections.get(socket.id)
        if ( connection ){
            try {
                // start game
                if (!isGameStart){ startGame() }

                // if exist we "applyAnswer" receive from client
                await connection.applyAnswer(answer);

                // if request reach here everything is good
                //  apply socket
                socketsInGame.push(socket.id)
                const id = createGameId()
                socket.data.gameId = id

                // create response
                const response = []
                socketsInGame.forEach(id => {
                    const gameId = sockets.get(id).data.gameId 
                    response.push({
                        gameId : gameId ,
                        socketId : id,
                        gameInfo : gameInfo[gameId],
                    })
                })

                socket.emit("server-start-game", {status : 200, gameId : id} )
                io.to(socketsInGame).emit("game-player-join", response)
            } catch (error) {
                console.log(error);
            }
        }
    }

    function updateGameInfo(data) {
        // data come from clientPeerConnection
        const lastInfo = gameInfo[data.i]
        if (data.t > lastInfo.t) { gameInfo[data.i] = data }
    }

    /**
     * game loop
     */
    let isGameStart = false
    let loopId = null

    // start game loop
    function startGame(){ 
        isGameStart = true
        loopId = setInterval(() => {
            const data = JSON.stringify(gameInfo)
            peerConnections.forEach( (peer , _ ) => {
                peer.sendData(data)
            });
        }, 80)
    }

    // end game loop
    //! use endGame
    function endGame(){
        clearInterval(loopId)
        loopId = null
        isGameStart = null
    }
  }
}

module.exports = SocketManager