export default class BrowserWebRTC
{
  constructor(socket,globalEvent){
    let localMediaStream = []
    const peers = new Map()
    const peersState = new Map() // new | connected | try
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

    function createNewConnection(createOffer,peerId) {
        const state = peersState.get(peerId)
        if (state == "try"){
            console.log("something is wrong in createNewConnection");
            return
        }
        peersState.set(peerId,"try")
        if (createOffer) { 
            // do offer
            doOffer(peerId)
        } else {
            // send out im ready
            socket.emit("webrtc-state-change", {type : "wait-to-receive-offer", peerId : peerId})
        }
    }


    // create peer connection with others
    socket.on('browser-create-peer-connection', async ({peerId, createOffer}) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                      'stun:stun.l.google.com:19302',
                      'stun:stun1.l.google.com:19302',
                    ],
                },
            ]}
        )

        // add peerConnection to map
        peers.set(peerId, peerConnection)
        peersState.set(peerId, "new")

        // listen on icecandidate event
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit('relayICECandidate', {
                    'peerId': peerId, 
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
                        globalEvent.callEvent("remove-video-src", { socketId : peerId })
                        peerMediaSrc[peerId].audio = null
                    } else 
                    if (data.type == "audio"){
                        globalEvent.callEvent("remove-audio-src", { socketId : peerId })
                        peerMediaSrc[peerId].video = null
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

        peerConnection.oniceconnectionstatechange = () => {
            console.log('ICE state: ',peerConnection.iceConnectionState);
        }

        // create brand new peerMediaSrc for this peerId
        peerMediaSrc[peerId] = { video : null , audio : null }

        // listen to media come from others peer
        peerConnection.ontrack = (event) => {
            if (event.track.kind == "audio"){
                peerMediaSrc[peerId].audio = event.streams[0]  
                globalEvent.callEvent("new-audio-src", {socketId : peerId ,src : event.streams[0]})
            } else 
            if (event.track.kind == "video" ){
                peerMediaSrc[peerId].video = event.streams[0]
                globalEvent.callEvent("new-video-src", {socketId : peerId ,src : event.streams[0]})
            }
        }

        // adding our track to peer connection if exist
        localMediaStream.forEach(stream => {
            stream.getTracks().forEach(track => {
                peerConnection.addTrack(track, stream)
            })
        })

        if (createOffer) { 
            // create reliable data chanel between peers for some event 
            dataChanelSetup(peerConnection.createDataChannel("information", { ordered : true }), socket.id)
        }

        createNewConnection(createOffer,peerId)

    })

    const doOffer = async (peerId) => {
        
        if ( peers.has(peerId) ){
            const peerConnection = peers.get(peerId)
            try {
                const local_description = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(local_description);
                socket.emit('relaySessionDescription', {'peerId': peerId, 'session_description': local_description})
            } catch (error) {
                // alert("Offer setLocalDescription failed!");
                console.log(error);
            }
        } else {
            console.log("there is not peerConnection with this id");
        }

    }


    socket.on('sessionDescription', async ({peerId, session_description}) => {

        const peerConnection = peers.get(peerId)
        const remote_description = session_description;

        const desc = new RTCSessionDescription(remote_description);
        try {
            const stuff = await peerConnection.setRemoteDescription(desc);

            if (remote_description.type == "offer") {
                const local_description = await peerConnection.createAnswer()
                await peerConnection.setLocalDescription(local_description)
                socket.emit('relaySessionDescription', {'peerId': peerId, 'session_description': local_description});
            } else {
                socket.emit("webrtc-state-change", {type : "connection-successful", peerId : peerId})
            }
        } catch (error) {
            console.log(error);
        }

    })


    socket.on('iceCandidate', ({peerId , ice_candidate}) => {
        const peerConnection = peers.get(config.peerId)
        peerConnection.addIceCandidate(new RTCIceCandidate(ice_candidate))
    })

    socket.on("webrtc-connection-successful", (peerId) => {
        peersState.set(peerId, "connected")
    })

    socket.on("webrtc-start-again",({createOffer,peerId}) => {
        createNewConnection(createOffer,peerId)
    })


    socket.on('webrtc-user-left', (socketID) => {
        if (peers.has(socketID)){
            const peer = peers.get(socketID)
            peer.close()
            peers.delete(socketID)
            
            // clear data chanels 
            dataChanels.remove(socketID)

            // clear media src
            if (peerMediaSrc[socketID].video){
                globalEvent.callEvent("remove-video-src", { socketId : socketID })
            }
            if (peerMediaSrc[socketID].audio){
                globalEvent.callEvent("remove-audio-src", { socketId : socketID })
            }
            delete peerMediaSrc[socketID]
            
        } else {
            console.log("ERROR peer is not founded");
        }
    })

    /**
     * media
     */

    // active mic and cam
    const activeCamOrMic = async (type) => {
        try {

            // generate config
            let config
            if (type == "video"){ config = { video : {width: 480, height: 480, facingMode: "user"}}} 
            else { config = { audio : true } }
            
            // get media from user
            const stream = await navigator.mediaDevices.getUserMedia(config)

            // save local stream
            localMediaStream.push(stream)

            // set new media to all peerConnection
            stream.getTracks().forEach(track => {
                peers.forEach((peer, peerId) => {
                    peer.addTrack(track, stream)
                })
            })

            // tell other user in socket to update ui
            socket.emit("share-media", type, true)
            
            if ( type == "video" ){
                document.getElementById('selfvideo').srcObject = stream
            }

            return true
        } catch (error) {
            console.log(error);
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
                    socket.emit("share-media", type, false)
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