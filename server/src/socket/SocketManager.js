/**
 * emitted events
 * 1. server-authentication
 * 2. server-other-users
 */

const { v4: uuidV4 }=  require('uuid')

const fakeAdmins = [
    { username : "qwer" ,password : "1234" }
]
class SocketManager
{
    constructor( _io){
        this.io = _io
        this.sockets = new Map()
        this.socketsInEvent = []
        this.messages = new Map()
    }

    SocketConnect(socket){
        // log some information
        console.log(socket.id,"is connected");

        // save socket in Map
        this.sockets.set(socket.id, socket)

        // listen disconnect event 
        socket.on("disconnecting", () => {
            // log some information
            console.log(socket.id,"is disconnected");

            // clear socket Map
            this.sockets.delete(socket.id)

            // clear socket in events if exist and tell to others
            console.log("check socketsInEvent length");
            console.log(this.socketsInEvent.length);
            const index = this.socketsInEvent.indexOf(socket.id)
            if (index !== -1){
                console.log("exist");
                this.socketsInEvent.splice(index,1)
                this.io.to(this.socketsInEvent).emit("user-left-event", socket.id)
            }
            console.log(this.socketsInEvent.length);
        })
        
        // admin login
        socket.on("login", (userPass) => {
            const response = { status : 200, information : {} }
            // checking fake data base
            fakeAdmins.forEach(user => {
                if ( user.username == userPass.username ){
                    if ( user.password == userPass.password ){
                        socket.data.username = {
                            username : userPass.username,
                            isAdmin : true,
                            id : socket.id
                        }
                        response.information = socket.data.username
                    }
                }
            })
            if ( !response.information.username ) {
                response.status = 404
                response.information.error = "not founded user"
            }
            socket.emit("server-authentication",response)
            this.sendAllUsers()
        })
        
        // set nickname 
        socket.on("set-nickname", (nickName) => {
            socket.data.username = {
                username : nickName.username,
                isAdmin : false,
                id : socket.id
            }
            const response = { status : 200, information : socket.data.username }
            socket.emit("server-authentication",response)
            this.sendAllUsers()
        })

        /**
         * video call
         */

        //  after join in event
        socket.on('join-to-event', () =>  {
            console.log("["+ socket.id + "] join to event ");
            
            // all others in event
            this.socketsInEvent.forEach(id => {
                console.log("send offer to this id:  ", id);
                this.sockets.get(id).emit("server-create-peer-connection", {'peer_id': socket.id, 'should_create_offer': true})            
                // socket that join right now
                socket.emit("server-create-peer-connection", {'peer_id': id, 'should_create_offer': false})
            })
            // add this user to sockets In Event 
            this.socketsInEvent.push(socket.id)
        });

        
        // RTCPeerConnection events
        socket.on('relayICECandidate', (config) => {
            const peer_id = config.peer_id;
            const ice_candidate = config.ice_candidate;
            console.log("["+ socket.id + "] relaying ICE candidate to [" + peer_id + "] ");
    
            if (this.sockets.has(peer_id)) {
                this.sockets.get(peer_id).emit('iceCandidate', {'peer_id': socket.id, 'ice_candidate': ice_candidate});
            }
        })

        // RTCPeerConnection events
        socket.on('relaySessionDescription', (config) => {
            const peer_id = config.peer_id;
            const session_description = config.session_description;
            console.log("["+ socket.id + "] relaying session description to [" + peer_id + "] ");
    
            if (this.sockets.has(peer_id)) {
                this.sockets.get(peer_id).emit('sessionDescription', {'peer_id': socket.id, 'session_description': session_description});
            }
        })

        /**
         * chat
         */
        socket.on('send-message', message => {
            //! check for empty message
            console.log();
            if ( socket.data.username ) {
                const id = uuidV4()
                const messageObject = {
                    id,
                    text : message,
                    date : Date.now(),
                    owner : socket.data.username.username
                }
                this.messages.set(id, messageObject)
                this.io.to(this.socketsInEvent).emit("new-message", {status : 200 , information : messageObject})
            } else {
                socket.emit('error')
            }
        })

    }
    sendAllUsers(){
        const sockets = []
        const response = { status : 200 , information : [] }
        this.sockets.forEach((socket, socketId) => {
            if ( socket.data.username ){
                sockets.push(socketId)
                response.information.push({
                    ...socket.data.username,
                    id : socketId
                })
            }
        })
        this.io.to(sockets).emit("server-other-users", response)
    }
}

module.exports = SocketManager