import io from 'socket.io-client'
import Events from '../redlibCore/utils/Events'

// RTCPeerConnections
import ServerWebRTC from './ServerWebRTC'
import BrowserWebRTC from './BrowserWebRTC'

let clientSocket = null

class ClientSocket
{
    constructor(){
        //* create connection

        const urls = "http://localhost:5500"
        // const urls = "http://192.168.1.98:5500"
        // const urls = "http://159.69.180.15:5500"
        // const urls = "https://conference.metaverse247.live"

        console.log("socket url is : ",urls);
        const socket =  io(urls)
 

        let peerConnection = null
        let browserWebRTC = null
        let serverWebRTC = null
        let selfUser = null

        //* global functions and variable
        this.event = new Events()
        
        this.emit = (event,payload) => { socket.emit(event,payload) }
        
        this.handelEvent = async (type) => {
            switch (type) {

                case "active-cam":
                    return await browserWebRTC.activeCam()
                case "active-mic":
                    return await browserWebRTC.activeMic()
                
                
                case "de-active-cam":
                    browserWebRTC.deActiveCam()
                    break
                case "de-active-mic":
                    browserWebRTC.deActiveMic()  
                    break
                
                // get users information
                case "update-users":
                    return this.users
                
                // get self socket id
                case "self-user":
                    if (socket.id){
                        return selfUser
                    }
                    break
                
                case "start-game":
                    // * start game 
                    socket.emit("start-game")
                    break
            }
        }

        this.users = []

        // add this socket events
        this.event.addEvent("server-authentication")
        this.event.addEvent("update-users")
        this.event.addEvent("update-self-user")

        // add browserWebRTC event
        this.event.addEvent("new-video-src")
        this.event.addEvent("new-audio-src")
        this.event.addEvent("remove-video-src")
        this.event.addEvent("remove-audio-src")

        // add chat events
        this.event.addEvent("new-message")

        // serverWebRTC game event  
        this.event.addEvent("start-game")
        this.event.addEvent("update-game")
        this.event.addEvent("player-join")
        this.event.addEvent("player-left")

        // handel events
        socket.on('connect', () => {
            console.log("socket connected");

            // disconnect event
            socket.on('disconnect', () => {
                console.log("we are disconnected");

            })

            // user name event
            socket.on("server-authentication", response => {
                this.event.callEvent("server-authentication",response)
                if (response.status == 200){ socket.emit('join-to-event') }
            })

            
            // user name event
            socket.on("server-update-users", response => {
                if (this.responseCheck(response)){
                    this.users = response.information
                    selfUser = this.users.find(user => user.id == socket.id)
                    this.event.callEvent("update-users",this.users)
                    this.event.callEvent('update-self-user', selfUser)
                }
            })

            // video and audio
            browserWebRTC = new BrowserWebRTC(socket,this.event)

            
            // chat app
            socket.on("new-message", response => {
                console.log("new-message");
                if (this.responseCheck(response)){
                    this.event.callEvent('new-message', response.information)
                }
            })

            /**
             * server WebRTC
             */

            // handel request from server to create webrtc peer connection
            socket.on("create-server-webrtc", option => {
                serverWebRTC = new ServerWebRTC()
                serverWebRTC.createConnection({
                    onUpdate :  (data) => {this.event.callEvent("update-game", data)},
                    emit : this.emit,
                    ...option
                })
        
            })

            // start game loop after peer-to-peer connection is created
            socket.on("server-start-game",({gameId}) => {
                this.event.callEvent("start-game", {gameId, sendData : serverWebRTC.sendData})
            })
            
            socket.on("game-player-join",(newPlayer) => {
                this.event.callEvent("player-join", newPlayer )
            })

            socket.on("game-player-left",(playerGameID) => {
                this.event.callEvent("player-left", playerGameID)
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
}

// create socket instance
export function init() {
    console.log("init clientSocket");
    if (!clientSocket){
        clientSocket = new ClientSocket()
    }
}

// return ClientSocket event function
export function getSocketEvent() {
    if (clientSocket){
        return clientSocket.event
    } 
}

// return ClientSocket emit function
export function SocketEmit(e,p) {
    if (clientSocket){
        clientSocket.emit(e,p)
    } 
}

// function for send some data to socket
export async function handelEvent(type){
    if (clientSocket){
        return await clientSocket.handelEvent(type)
    }
}