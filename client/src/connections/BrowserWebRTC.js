export default class BrowserWebRTC
{
  constructor(socket,globalEvent){
    let localMediaStream = []
    const peers = new Map()
    const dataChanels = new Map()
    const peerMediaSrc = {}

    this.disconnect =  function() {
        console.log("Disconnected from signaling server");

        // clean up local media 
        localMediaStream.forEach((stream) => {
            stream.getTracks().forEach( track => {
                dataChanels.forEach((chanel,_) => {
                    chanel.send(JSON.stringify({ text : "close-media", type : track.kind, socketId : socket.id }))
                })
                track.stop()
            })
        })
        localMediaStream = []

        // clean up media elements Map
        //! find out should we close track or not
        Object.keys(peerMediaSrc).forEach((socketId) => {
            const media = peerMediaSrc[socketId]

            if (media.video !== null ) {  
                globalEvent.callEvent("remove-video-src", { socketId : socketId })
            }

            if (media.audio !== null ) {  
                globalEvent.callEvent("remove-audio-src", { socketId : socketId })
            }
            
        })
        peerMediaSrc = {}

        // clean up peers Map
        dataChanels.forEach((chanel, peerId) => { chanel.close() })
        dataChanels.clear()

        // clean up peers Map
        peers.forEach((peer, peerId) => { peer.close() })
        peers.clear()
    }

    // create peer connection with others
    socket.on('server-create-peer-connection', async (config) => {
        const peer_id = config.peer_id;
        console.log(`your id is ${socket.id} and peer_id is ${peer_id}`);

        const peerConnection = new RTCPeerConnection({
            // sdpSemantics: 'unified-plan',
            iceServers: [
                {
                    urls: [
                      'stun:stun.l.google.com:19302',
                      'stun:stun1.l.google.com:19302',
                      'stun:stun2.l.google.com:19302',
                      'stun:stun3.l.google.com:19302',
                    ],
                },
            ]}
        )

        peers.set(peer_id, peerConnection)

        // listen on icecandidate event
        peerConnection.onicecandidate = (event) => {
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


        function dataChanelMessage(event) {
            const data = JSON.parse(event.data)
            switch (data.text) {
                case "close-media":
                    if (data.type == "video"){
                        globalEvent.callEvent("remove-video-src", { socketId : peer_id })
                    } else 
                    if (data.type == "audio"){
                        globalEvent.callEvent("remove-video-src", { socketId : peer_id })
                    }
                    break;
            }
        }


        function dataChanelSetup(chanel,id) {
            dataChanels.set(id,chanel)
            chanel.addEventListener("message", dataChanelMessage)
        }

        // listen to data chanel comes from other
        peerConnection.ondatachannel = (event) => {

            dataChanelSetup(event.channel,socket.id)
        }

        peerMediaSrc[peer_id] = { video : null , audio : null }
        // listen to media come from others peer
        peerConnection.ontrack = (event) => {   
            
            if (event.track.kind == "audio"){
                peerMediaSrc[peer_id].audio = event.streams[0]  
                globalEvent.callEvent("new-audio-src", {socketId : peer_id ,src : event.streams[0]})
            } else 
            if (event.track.kind == "video" ){
                console.log(event.streams[0]);
                peerMediaSrc[peer_id].video = event.streams[0]
                globalEvent.callEvent("new-video-src", {socketId : peer_id ,src : event.streams[0]})
                
                //! test video call remove this
                // const video = document.createElement('video')
                // video.setAttribute('id', socket.id)
                // video.autoplay = true
                // video.srcObject = event.streams[0]
                // document.getElementById('video_call').append(video)
            }
        }

        //* adding track to peer connection
        localMediaStream.forEach(stream => {
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream)
            })
        })

        if (config.should_create_offer) { 
            // create reliable data chanel between peers for some event 
            dataChanelSetup(peerConnection.createDataChannel("information", { ordered : true }), socket.id)
            
            // do offer
            doOffer(peer_id)
        }
        
    });

    const doOffer = async (peer_id) => {
        
        if ( peers.has(peer_id) ){
            const peer_connection = peers.get(peer_id)
            try {
                const local_description = await peer_connection.createOffer();

                await peer_connection.setLocalDescription(local_description);
                
                socket.emit('relaySessionDescription', {'peer_id': peer_id, 'session_description': local_description});
            } catch (error) {
                alert("Offer setLocalDescription failed!"); 
                console.log("Error sending offer: ", error);
            }
        } else {
            console.log("there is not peer_connection with this id");
        }

    }


    socket.on('sessionDescription', async (config) => {
        const peer_id = config.peer_id;
        const peer = peers.get(peer_id)
        const remote_description = config.session_description;

        const desc = new RTCSessionDescription(remote_description);
        try {
            const stuff = await peer.setRemoteDescription(desc);

            if (remote_description.type == "offer") {
                const local_description = await peer.createAnswer()


                await peer.setLocalDescription(local_description)

                socket.emit('relaySessionDescription', {'peer_id': peer_id, 'session_description': local_description});
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


    //! fix this
    socket.on('user-left-event', (socketID) => {
        console.log('Signaling server said to remove peer:',socketID);
        if (peers.has(socketID)){
            const peer = peers.get(socketID)
            peer.close()
            peers.delete(socketID)
                    // clear media src
            delete peerMediaSrc[socketID]
            
        } else {
            console.log("ERROR peer is not founded");
        }
    })

    // active mic and cam
    const activeCamOrMic = async (type) => {
        try {
            const config = {}
            config[type] = true

            const stream = await navigator.mediaDevices.getUserMedia(config)

            // save local stream
            localMediaStream.push(stream)

            // set new media and send new offer to all peerConnection
            stream.getTracks().forEach(track => {
                peers.forEach((peer, peer_id) => {
                    peer.addTrack(track, stream)
                    doOffer(peer_id)
                })
            })
            
            if ( type == "video" ){
                document.getElementById('selfVideo').srcObject = stream
            }

            return true
        } catch (error) {
            alert(`Access denied for ${type}`)
        }
    }

    this.activeCam = async() => { return await activeCamOrMic("video") }
    this.activeMic = async() => { return await activeCamOrMic("audio") }



    // deactivate cam or mic
    const deActiveCamOrMic = (type) => {

        let removeIndex = null
        localMediaStream.forEach((stream,index) => {
            stream.getTracks().forEach( track => {
                // find track
                if (track.kind == type){
                    // send out to others
                    dataChanels.forEach((chanel,_) => {
                        chanel.send(JSON.stringify({ text : "close-media", type : type, socketId : socket.id }))
                    })
                    track.stop()
                    removeIndex = index
                }
            })
        })
        
        // remove from localMediaStream
        if ( removeIndex !== null ){
            localMediaStream.splice(removeIndex,1)
        }
    }

    this.deActiveCam = () => {deActiveCamOrMic("video")}
    this.deActiveMic = () => {deActiveCamOrMic("audio")}
    
  }
}