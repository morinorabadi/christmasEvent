const { v4: uuidV4 }=  require('uuid')

class ClientsPeerState
{
    constructor(io){
        let peersConnection = []

        this.new = (receiverId, senderId) => {
            peersConnection.push( new BrowserWebRTC(io, receiverId, senderId))
            console.log("peersConnection", peersConnection.length)
        }

        this.find = (peerId) => {
            const result = []
            peersConnection.forEach(peers => {
                if (peers.find(peerId)){
                    result.push(peers)
                }
            })
            return result
        }

        this.findExactly = (receiver, sender) => {
            return peersConnection.find( peers =>  peers.findExactly(receiver, sender))
        }

        this.remove = (toRemove) => {
            peersConnection = peersConnection.filter((webrtc) => {
                let isHere = true
                toRemove.forEach(webrtcRemove => {
                    if ( webrtc.id == webrtcRemove.id ){
                        isHere = false
                    }
                })
                return isHere
            })
        }
    }
}



class BrowserWebRTC{
    constructor(io, receiverId, senderId){
        this.id = uuidV4()
        this.sender = {id : senderId, state : "sending-offer"},
        this.receiver = {id : receiverId,  state : "creating-webrtc"},
        this.isOver = false,
        this.isStartAgain = false,
        this.sessionDescriptionObject = null

        this.startAgain = (peerId) => {
            console.log("start again");
            if (peerId == this.receiver.id){
                this.swap()
            }
            this.sender.state = "sending-offer"
            this.receiver.state = "creating-webrtc"
            this.isOver = false
            io.to(this.sender.id).emit("webrtc-start-again",  {createOffer : true,  peerId : this.receiver.id })
            io.to(this.receiver.id).emit("webrtc-start-again",{createOffer : false, peerId : this.sender.id })
        }
    }
    swap(){
        const senderId = this.sender.id
        this.sender.id = this.receiver.id
        this.receiver.id = senderId
    }

    find(peerId){
        if (this.sender.id == peerId || this.receiver.id == peerId){ return true }
        return false
    }

    findExactly(receiver, sender){
        if (this.sender.id == sender && this.receiver.id == receiver){ return true }
        return false
    }
}

module.exports = ClientsPeerState