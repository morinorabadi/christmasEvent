export default class WebRTCSocket
{
    constructor(){
        let dataChannel = null
        
        this.createConnection = async ({ localDescription, chanelLabel, emit, onMessege}) => {
    
            const localPeerConnection = new RTCPeerConnection({});
            
            try {
            // set server localDescription to coonect tihs clinet peer in room
            await localPeerConnection.setRemoteDescription(new RTCSessionDescription(localDescription));
                

            // adding event liseners for data chanel
            function onDataChannel({ channel }) {
                if (channel.label !== chanelLabel) {
                return;
                }

                dataChannel = channel;
                dataChannel.onmessage = ({data}) => { 
                    const gameInfo = JSON.parse(data) 
                    onMessege(gameInfo)
                }
                dataChannel.onopen = () => console.log('\n\ndataChannel opened\n\n');
                dataChannel.onclose = () => console.log('\n\ndataChannel closed\n\n');
                dataChannel.onerror = (error) => console.error('dataChannel error:', error);
            }

            localPeerConnection.addEventListener('datachannel', onDataChannel);
    
            // answer 
            const answer = await localPeerConnection.createAnswer();
            await localPeerConnection.setLocalDescription(answer);
            emit("peer-connection-answer", {answer})
    
            } catch (error) {
            localPeerConnection.close();
            throw error;
            }
        }

        this.sendData = (data) => {
            if (dataChannel){ dataChannel.send(data) }
        }

        this.close = () => {
            console.log("\n\nclose event is fire\n\n");
            if (dataChannel) {
                // fix remove event listener
                dataChannel.removeEventListener('message', onMessage);
            }
            // fix
            emit("peer-connection-delete")
            return RTCPeerConnection.prototype.close.apply(this, arguments);
        }
    }
}