import io from 'socket.io-client'
import WebRTCSocket from './WebRTCSocket'
import Events from '../redlibCore/utils/Events'

let clientSocket = null

class ClientSocket
{
    constructor(){
        this.event = new Events()

        // events
        this.onUsername = null
        this.onAvailableRoom = null
        this.onLoadInformation = null
        this.onPlayerJoinLeft = null
        // game
        this.onStartGame = null
        this.onUpdateData = null

        // property
        this.gameId = null

        // create connection
        const socket = io("http://localhost:5500")
        let peerConnection = null

        this.emit = (event,payload) => {
            socket.emit(event,payload)
        }

        // handel events
        socket.on('connect', () => {
            console.log("socket connected");

            // user name event
            socket.on("clinet-set-username", response => {
                if (this.responseCheck(response)){
                   this.onUsername(response.username)
                }
            })

            // available room
            socket.on("server-available-room", response => {
                if (this.responseCheck(response)){
                    this.onAvailableRoom(response.rooms)
                }
            })

            // server load information
            socket.on("room-load-information", response => {
                if (this.responseCheck(response)){
                    this.onLoadInformation(response.information)
                    // this.emit("load-over")
                }
            })

            // room create webrtc peer connection
            socket.on("room-create-webrtc", option => {
                peerConnection = new WebRTCSocket()
                peerConnection.createConnection({
                    onMessege :  this.onUpdateData,
                    emit : this.emit,
                    ...option
                })
            })

            // room create webrtc peer connection
            socket.on("room-start-game", response => {
                if (this.responseCheck(response)){
                    this.gameId = response.gameId
                    this.onStartGame()
                }
            })

            // if player some player join or left room
            socket.on("room-player-changes", response => {
                if (this.responseCheck(response)){
                    console.log(response);
                    this.onPlayerJoinLeft(response.information)
                }
            })

            // if player some player join or left room
            socket.on("room-force-leave", response => {
                if (this.responseCheck(response)){
                    this.roomForceLeave()
                }
            })

        })
    }

    // response Check
    responseCheck(response){
        if (response.status >= 200 && response.status < 300) {
            return true
        } else {
            console.log("error");
            return false
        }
    }

    /**
     * emit events 
     */
    // setUsername
    setUsername(username){
        this.emit("set-username", username)
    }
    // createRoom
    createRoom(roomname){
        this.emit("create-room", roomname)
    }
    // join room
    joinRoom(roomId){
        this.emit("join-room", roomId)
    }
}

// create socket instance
export function init() {
    clientSocket = new ClientSocket()
}

// return instance event class
export function getSocketEvent() {
    if (clientSocket){
        clientSocket.event
    } 
}