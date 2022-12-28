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
        const socket = io("http://localhost:5500")
        let peerConnection = null
        let browserWebRTC = null

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
                case "de-active-mic":
                    browserWebRTC.deActiveMic()    
            }
        }

        // add this socket events
        this.event.addEvent("server-other-users")
        this.event.addEvent("server-authentication")

        // add browserWebRTC event
        this.event.addEvent("new-video-src")
        this.event.addEvent("new-audio-src")
        this.event.addEvent("remove-video-src")
        this.event.addEvent("remove-audio-src")

        // ! convert this events 
        // game
        this.onStartGame = null
        this.onUpdateData = null

        // property
        this.gameId = null

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
            socket.on("server-other-users", response => {
                if (this.responseCheck(response)){
                    this.event.callEvent("server-other-users",response.information)
                }
            })

            browserWebRTC = new BrowserWebRTC(socket,this.event)

            //! not working
            // room create webrtc peer connection
            socket.on("room-start-game", response => {
                if (this.responseCheck(response)){
                    this.gameId = response.gameId
                    // this.onStartGame()
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
}

// create socket instance
export function init() {
    console.log("init");
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