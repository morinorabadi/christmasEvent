
/**
 * clientsPeerState interface
 * {
 *  sender :   {id : socket.id, state : "sending-offer"},
 *  receiver : {id : clientId,  state : "creating-webrtc"},
 *  isOver : false,
 *  startAgain : false
 * }
 */
const ClientsPeerState = require('./BrowserWebRTC')

class BrowserWebRTCManager
{
  constructor(io,sendAllUsers){
    const clientsSocketId = []
    const clientsPeerState = new ClientsPeerState(io)

    //! fix timeout
    // sender states are "sending-offer" | "wait-for-answer" ? "wait-for-receiver" | 
    // receiver states are "creating-webrtc" ? "wait-to-receive-offer" | sending-answer |
    function relaySessionDescription(user,object){
        if (clientsSocketId.some(id => id == user)) {
            io.to(user).emit('sessionDescription', object)
        } else {
            console.log("ERROR in sessionDescription user dose't exist");
        }
    }

    function startAgain(peerId){
        const result = clientsPeerState.find(peerId)
        result.forEach(webrtc => {
            if (webrtc.isOver){
                webrtc.startAgain(peerId)
            } else {
                webrtc.isStartAgain = true
            }
        })
    }

    this.newClient = (socket) => {
        /**
         * add some socket Event 
         */

        // ICECandidate events
        socket.on('relayICECandidate', ({peerId,ice_candidate}) => {
            console.log(peerId, "\n\n", ice_candidate);
            if (clientsSocketId.some(id => id == peerId)) {
                io.to(peerId).emit('relayICECandidate', {'peerId': socket.id, ice_candidate});
            } else {
                console.log("ERROR in relayICECandidate");
            }
        })

        // SessionDescription events
        socket.on('relaySessionDescription', ({peerId,session_description}) => {
            console.log(`relaying session description "${socket.id}" to "${peerId}" type is ${  session_description.type }`);

            // check if receiver is ready 
            if (session_description.type == "offer"){
                const webrtc = clientsPeerState.findExactly(peerId, socket.id)
                if (webrtc.receiver.state === "wait-to-receive-offer"){
                    relaySessionDescription(peerId ,{'peerId': socket.id, session_description : session_description})
                    webrtc.sender.state = "wait-for-answer"
                } else {
                    webrtc.sessionDescriptionObject = {'peerId': socket.id, session_description : session_description}
                    webrtc.sender.state = "wait-for-receiver"
                }
            } else if (session_description.type == "answer"){
                relaySessionDescription(peerId ,{'peerId': socket.id, session_description : session_description})
            }
        })

        socket.on("webrtc-state-change", ({type, peerId}) => {
            switch (type) {
                case "wait-to-receive-offer":
                    const webrtc = clientsPeerState.findExactly(socket.id, peerId)
                    if ( webrtc.sender.state == "wait-for-receiver"){
                        relaySessionDescription(socket.id, webrtc.sessionDescriptionObject)
                        webrtc.sessionDescriptionObject = null
                        webrtc.receiver.state = "sending-answer"
                    } else {
                        webrtc.receiver.state = "wait-to-receive-offer"
                    }
                    break
                case "connection-successful":
                    // connection successful
                    const webRtc = clientsPeerState.findExactly(peerId,socket.id)
                    
                    if (webRtc.isStartAgain){
                        webRtc.startAgain(peerId)
                    } else {
                        webRtc.isOver = true
                        io.to(webRtc.sender.id).emit("webrtc-connection-successful",webRtc.receiver.id)
                        io.to(webRtc.receiver.id).emit("webrtc-connection-successful",webRtc.sender.id)
                    }
                    break
            }
        })

        // share media Event
        socket.on("share-media", (type, isOn) => {
            startAgain(socket.id)
            if(type == "audio" ){
                socket.data.isMicOn = isOn
            } else
            if ( type == "video" ){
                socket.data.isCamOn = isOn
            }
            sendAllUsers()
        })

        //! fix
        // admin to limit others  
        // socket.on("admin-users-media", request => {
        //     // check for authentication
        //     if (socket.data){
        //         // check for permission
        //         if ( socket.data.isAdmin ){
        //             // search for user
        //             if ( sockets.has(request.id) ){
        //                 const guestSocket = sockets.get(request.id)
        //                 // apply limits
        //                 if (request.type == "video"){
        //                     guestSocket.data.isCamAllow = request.isAllow
        //                 }else
        //                 if ( request.type == "audio" ){
        //                     guestSocket.data.isMicAllow = request.isAllow
        //                 }
        //                 sendAllUsers()
        //             }
        //         }
        //     }
        // })
        clientsSocketId.forEach(clientId => {
            console.log(`create RTCPeerConnection between ${clientId} as sender and ${socket.id} as receiver`);

            // create new RTCPeerConnection for this user that's ready to get offer
            socket.emit('browser-create-peer-connection',{ peerId : clientId, createOffer : false})

            // tell others about new user join and say to them create and send offer
            io.to(clientId).emit('browser-create-peer-connection',{ peerId : socket.id, createOffer : true})

            // add peerConnection to clientsPeerState for manage connection
            clientsPeerState.new(socket.id, clientId)
        })


        // add this socket to clientsSocketId array
        clientsSocketId.push(socket.id)
    }

    this.removeSocket = (socketId) => {
        // clear clientsSocketId
        clientsSocketId.splice(clientsSocketId.indexOf(socketId),1)

        const result = clientsPeerState.find(socketId)
        if (result.length == 0){ return }
        // find peer connections between them and sey to them 
        result.forEach(peer => {
            if (socketId = peer.sender){
                io.to(peer.receiver).emit("webrtc-user-left", socketId)
            } else {
                io.to(peer.sender).emit("webrtc-user-left", socketId)
            }
        })

        // clear clientsPeerState
        clientsPeerState.remove(result)
    }

  }
}

module.exports = BrowserWebRTCManager