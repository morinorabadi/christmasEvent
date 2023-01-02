export default class ServerWebRTC
{
    constructor(){
        let dataChannel = null
        
        this.createConnection = async ({ localDescription, chanelLabel, emit, onUpdate}) => {
    
            const localPeerConnection = new RTCPeerConnection({});
            
            try {
            // set server localDescription to connect this client peer in room
            await localPeerConnection.setRemoteDescription(new RTCSessionDescription(localDescription));
                

            // adding event listeners for data chanel
            function onDataChannel({ channel }) {
                if (channel.label !== chanelLabel) {
                return;
                }

                dataChannel = channel;
                dataChannel.onmessage = ({data}) => { 
                    const gameInfo = JSON.parse(data) 
                    onUpdate(gameInfo)
                }
            }

            localPeerConnection.addEventListener('datachannel', onDataChannel);
    
            // answer 
            const answer = await localPeerConnection.createAnswer();
            await localPeerConnection.setLocalDescription(answer);
            emit("peer-connection-answer", answer)
    
            } catch (error) {
            localPeerConnection.close();
            throw error;
            }
        }

        this.sendData = (_data) => {
            const data = JSON.stringify(_data)
            if (dataChannel){ dataChannel.send(data) }
        }

        this.close = () => {
            console.log("\n\nclose event is fire\n\n");
            if (dataChannel) {
                //! fix remove event listener
                dataChannel.removeEventListener('message', onMessage);
            }
            //! fix peer-connection-delete event
            emit("peer-connection-delete")
            return RTCPeerConnection.prototype.close.apply(this, arguments);
        }
    }
}