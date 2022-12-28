import React, { useEffect, useState, useRef} from 'react'
import { handelEvent } from  '../../connections/ClientSocket'

export default function SelfUser({ selfUsername }) {
  const [username, setUsername] = useState("test name")
  const [isMicOn, setIsMicOn] = useState(false)
  const [isCamOn, setIsCamOn] = useState(false)

  const micButton = useRef()  
  const camButton = useRef()


  async function activeMic(){
    micButton.current.disabled = true
    if (isMicOn) {
      await handelEvent("de-active-mic")
      setIsMicOn(false)
    } else {
      if (await handelEvent("active-mic")){
        setIsMicOn(true)
      }
    }
    micButton.current.disabled = false
  }

  async function activeCam(){
    camButton.current.disabled = true
    if (isCamOn) {
      await handelEvent("de-active-cam")
      setIsCamOn(false)
    } else {
      if (await handelEvent("active-cam")){
        setIsCamOn(true)
      }
    }
    camButton.current.disabled = false
  }

  return (
    <div className='self-user'>
      <p>
          <span>
              {" "+ username}
          </span>
      </p>
      <button ref={camButton} onClick={() => { activeCam() }} style={{background : isCamOn ? "green" : "red" }} > cam </button>
      <button ref={micButton} onClick={() => { activeMic() }} style={{background : isMicOn ? "green" : "red" }} > mic </button>
      <video style={{display : isCamOn ? "block" : "none"}}  id='selfVideo' muted autoPlay ></video>
    </div>
  )
}
