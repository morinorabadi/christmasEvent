export default class BrowserWebRTC
{
  constructor(socket){
    let local_media_stream = null
    const peers = new Map()
    const peerMediaElements = new Map()
    
    this.disconnect =  function() {
        console.log("Disconnected from signaling server");

        // clean up media elements Map
        peerMediaElements.forEach((media, peerId) => { media.remove() })
        peerMediaElements.clear()

        // clean up peers Map
        peers.forEach((peer, peerId) => { peer.close() })
        peers.clear()
    }

    // create peer connection with others
    socket.on('server-create-peer-connection', async (config) => {
        console.log('Signaling server said to add peer:', config);
        const peer_id = config.peer_id;
        console.log(`your id is ${socket.id} and peer_id is ${peer_id}`);

        const peer_connection = new RTCPeerConnection({
            sdpSemantics: 'unified-plan',
            iceServers: [
                {urls:"stun:stun.l.google.com:19302"},
            ]}
        )

        peers.set(peer_id, peer_connection)

        // listen on icecandidate event
        peer_connection.onicecandidate = (event) => {
            console.log("listen on icecandidate event");
            if (event.candidate) {
                socket.emit('relayICECandidate', {
                    'peer_id': peer_id, 
                    'ice_candidate': {
                        'sdpMLineIndex': event.candidate.sdpMLineIndex,
                        'candidate': event.candidate.candidate
                    }
                });
            }
        }

        // create video container 
        const remote_media = document.createElement('video')
        document.body.append(remote_media);
        remote_media.autoplay = true
        remote_media.setAttribute('id', peer_id)
        peerMediaElements.set(peer_id, remote_media)

        // listen to media come from others peer
        peer_connection.ontrack = (event) => {
            console.log("ontrack");
            console.log();
            remote_media.srcObject =  event.streams[0]
            remote_media.play()
        }

        if (local_media_stream){
            local_media_stream.getTracks().forEach(track => peer_connection.addTrack(track, local_media_stream));
        } else {
            console.log("there is no stream available");
        }

        
        if (config.should_create_offer) {
            console.log("Creating RTC offer to ", peer_id)
            try {
                const local_description = await peer_connection.createOffer();

                await peer_connection.setLocalDescription(local_description);
                
                socket.emit('relaySessionDescription', {'peer_id': peer_id, 'session_description': local_description});
                console.log("Offer setLocalDescription succeeded"); 
            } catch (error) {
                alert("Offer setLocalDescription failed!"); 
                console.log("Error sending offer: ", error);
            }
        }
    });


    socket.on('sessionDescription', async (config) => {
        console.log('Remote description received: ', config);
        const peer_id = config.peer_id;
        const peer = peers.get(peer_id)
        const remote_description = config.session_description;

        const desc = new RTCSessionDescription(remote_description);
        try {
            const stuff = await peer.setRemoteDescription(desc);
            console.log("setRemoteDescription succeeded");

            if (remote_description.type == "offer") {
                console.log("Creating answer");
                const local_description = await peer.createAnswer()


                await peer.setLocalDescription(local_description)

                socket.emit('relaySessionDescription', {'peer_id': peer_id, 'session_description': local_description});
                console.log("Answer setLocalDescription succeeded");
            }
        } catch (error) {
            alert("Answer setLocalDescription failed!"); 
            console.log("setRemoteDescription error: ", error);
        }

    });


    socket.on('iceCandidate', function(config) {
        const peer = peers.get(config.peer_id)
        const ice_candidate = config.ice_candidate;
        peer.addIceCandidate(new RTCIceCandidate(ice_candidate));
    });


    socket.on('user-left-event', (socketID) => {
        console.log('Signaling server said to remove peer:');
        
        if (peers.has(socketID)){
            const peer = peers.get(socketID)
            peer.close()
            peers.delete(socketID)
        } else {
            console.log("ERROR peer is not founded");
        }
        

        // clear video element
        const mediaElement = peerMediaElements.get(socketID)
        mediaElement.remove()
        peerMediaElements.delete(socketID)
    })




    socket.on("start-video-call", async () => {
        console.log("start-video-call");
        if (local_media_stream != null) {  /* ie, if we've already been initialized */
            return; 
        }
        let isUserAllow = false
        navigator.getUserMedia = ( 
            navigator.getUserMedia ||
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia ||
            navigator.msGetUserMedia
        );
        
        try {
            const stream = await navigator.mediaDevices.getUserMedia({"audio": true, "video":true})
            console.log("Access granted to audio/video");
            isUserAllow = true
            local_media_stream = stream;
            const local_media = document.createElement('video')
            document.body.append(local_media);
            local_media.autoplay = true
            local_media.srcObject = stream;
            local_media.muted = true


        } catch (error) {
            console.log(error);
            console.log("Access denied for audio/video");
            alert("You chose not to provide access to the camera/microphone, demo will not work.");
        } finally {
            socket.emit('join-to-event', isUserAllow)
        }

    })
  }
}