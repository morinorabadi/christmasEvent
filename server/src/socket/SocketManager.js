/**
 * emitted events
 * 1. server-authentication
 * 2. server-other-users
 */

const fakeAdmins = [
    { username : "qwer" ,password : "1234" }
]
class SocketManager
{
    constructor( _io){
        this.io = _io
        this.sockets = new Map()
    }
    SocketConnect(socket){
        console.log(socket.id,"is connected");
        this.sockets.set(socket.id, socket)
        socket.on("disconnecting", () => {
            console.log(socket.id,"is disconnected");
            this.sockets.delete(socket.id)
        })
        
        // login
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
            this.io.to(socket.id).emit("server-authentication",response)
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
            this.io.to(socket.id).emit("server-authentication",response)
            this.sendAllUsers()
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