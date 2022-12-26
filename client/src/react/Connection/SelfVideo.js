import React, { useRef } from 'react'


export default function SelfVideo() {
  const videoContainer  = useRef()
  

  async function activeVideo(){
    try {
      const stream =  await navigator.mediaDevices.getUserMedia({video: true, audio: true})
      console.log(stream);
      videoContainer.current.autoplay = true;
      videoContainer.current.muted = true;
      videoContainer.current.srcObject = stream
      stream.getTracks().forEach(track => { console.log(track) } );
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className='self-video' >
      <button onClick={activeVideo} >click to grab video</button>
      <video ref={videoContainer} ></video>
    </div>
  )
}
