/**
 * emitted events
 * 1. server-authentication
 * 2. server-other-users
 */
const { v4: uuidV4 }=  require('uuid')
const WebRtcConnection = require('../webRTC/WebRtcConnection')

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
    const socketsInEvent = []

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

            // clear socket in events if exist and tell to others
            const index = socketsInEvent.indexOf(socket.id)
            if (index !== -1){
                socketsInEvent.splice(index,1)
                io.to(socketsInEvent).emit("user-left-event", socket.id)
            }
            sendAllUsers()
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
                        createDataSocket(socket,true,userPass.username)
                        response.information = socket.data.information
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
            console.log(`socket "${socket.id}" id pick "${nickName}" as nickName`);
            createDataSocket(socket,false,nickName.username)
            const response = { status : 200, information : socket.data.username }
            sendAllUsers()
            socket.emit("server-authentication",response)
        })

        /**
         * video call
         */

        //  after join in event
        socket.on('join-to-event', () =>  {
            console.log("["+ socket.id + "] join to event ")
            
            // all others in event
            socketsInEvent.forEach(otherID => {
                console.log(`"${otherID}" send offer to new ${ socket.id }`);
                sockets.get(otherID).emit("server-create-peer-connection", {'peer_id': socket.id, 'createOffer': true})

                // socket that join right now
                socket.emit("server-create-peer-connection", {'peer_id': otherID, 'createOffer': false})
            })
            // add user to sockets In Event 
            socketsInEvent.push(socket.id)
        });

        // for update media ui
        socket.on("share-media", (type, isOn) => {
            if(type == "audio" ){
                socket.data.information.isMicOn = isOn
            } else
            if ( type == "video" ){
                socket.data.information.isCamOn = isOn
            }
            sendAllUsers()
        })

        //! fix
        // admin to limit others  
        socket.on("admin-users-media", request => {
            // check for authentication
            if (socket.data.information){
                // check for permission
                if ( socket.data.information.isAdmin ){
                    // search for user
                    if ( sockets.has(request.id) ){
                        const guestSocket = sockets.get(request.id)
                        // apply limits
                        if (request.type == "video"){
                            guestSocket.data.information.isCamAllow = request.isAllow
                        }else
                        if ( request.type == "audio" ){
                            guestSocket.data.information.isMicAllow = request.isAllow
                        }
                        sendAllUsers()
                    }
                }
            }
        })
        
        // RTCPeerConnection events
        socket.on('relayICECandidate', (config) => {
            const peer_id = config.peer_id;
            const ice_candidate = config.ice_candidate;
            console.log(`"${socket.id}" relaying ICE candidate to "${peer_id}"`);

            if ( sockets.has(peer_id)) {
                sockets.get(peer_id).emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
            }
        })

        // RTCPeerConnection events
        socket.on('relaySessionDescription', (config) => {
            const peer_id = config.peer_id;
            const session_description = config.session_description;
            console.log(`"${socket.id}" relaying session description to "${peer_id}"`);

            if (sockets.has(peer_id)) {
                sockets.get(peer_id).emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
            }
        })

        // chat messages
        socket.on('send-message', message => { newMessage(socket, message) })

        /**
         * game
         */

        // start game event called when load is over 
        socket.on("start-game", () => { createRTCConnection(socket) } )

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
            if ( socket.data.information ){
                socketsID.push(socketId)
                response.information.push({
                    ...socket.data.information,
                    id : socketId,
                })
            }
        })
        io.to(socketsID).emit("server-update-users", response)
    }
    // create data for sockets
    function createDataSocket(socket,isAdmin,username) {
        socket.data.information = {
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
        if ( socket.data.information.username ) {
            const id = uuidV4()
            const messageObject = {
                id,
                text : message,
                date : Date.now(),
                owner : socket.data.information.username
            }
            messages.set(id, messageObject)
            io.to(socketsInEvent).emit("new-message", {status : 200 , information : messageObject})
        } else {
            socket.emit('error')
        }
    }

    /**
     * server webRTC
     */
    // game peerConnection and information
    const peerConnections = new Map()
    const gameInfo = new Map()

    // we generate some simple ID to decrees bites send from server to client
    let lastPlayerGameId = 0
    function createGameId(){
        lastPlayerGameId++
        const id = lastPlayerGameId.toString()
        gameInfo.set(id,{ 
            px : lastPlayerGameId,
            pz : 0,
            ry : 0,
            t  : Date.now() ,
            i : id
        })
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
                const id = createGameId()
                socket.emit("server-start-game", {status : 200, gameId : id} )
            } catch (error) {
                console.log(error);
            }
        }
    }

    function updateGameInfo(data) {
        // data come from clientPeerConnection
        const lastInfo = gameInfo.get(data.i)
        if (data.t > lastInfo.t) { gameInfo.set(data.i,data) }
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
            console.log("send out data");
            const data = JSON.stringify(Array.from( gameInfo.values() ))
            peerConnections.forEach( (peer , _ ) => {
                peer.sendData(data)
            });
        }, 1000)
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