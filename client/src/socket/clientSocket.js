import io from 'socket.io-client'

export default class ClientSocket
{
    constructor(){

        // create connection
        const socket = io("http://localhost:3000")

        this.emit = (event,payload) => {
            socket.emit(event,payload)
        }

        // handel events
        socket.on('connect', () => {
            console.log("socket connected");
        })
    }
}