import React, { useEffect, useState, useRef} from 'react'
import { getSocketEvent, handelEvent } from '../../connections/ClientSocket'

export default function SelfUser() {
  const [selfUser, setSelfUser] = useState({})
  // const [isMicOn, setIsMicOn] = useState(false)
  // const [isCamOn, setIsCamOn] = useState(false)

  const micButton = useRef()  
  const camButton = useRef()


  async function activeMic(){
    // check if this user has permission
    // we double check in other users if this user can share or not
    if (!selfUser.isMicAllow){ return }
    micButton.current.disabled = true
    if (selfUser.isMicOn) {
      await handelEvent("de-active-mic")
      setSelfUser((last) => { return {...last, isMicOn : false} })
    } else {
      if (await handelEvent("active-mic")){
        setSelfUser((last) => { return {...last, isMicOn : true} })
      }
    }
    micButton.current.disabled = false
  }

  async function activeCam(){
    // check if this user has permission
    // we double check in other users if this user can share or not
    if (!selfUser.isCamAllow){ return }

    camButton.current.disabled = true
    if (selfUser.isCamOn) {
      await handelEvent("de-active-cam")
      setSelfUser((last) => { return {...last, isCamOn : false} })
    } else {
      if (await handelEvent("active-cam")){
        setSelfUser((last) => { return {...last, isCamOn : true} })
      }
    }
    camButton.current.disabled = false
  }

  useEffect(() => {
    if ( !selfUser.username ){
      handelEvent("self-user").then((user => { setSelfUser(user) }))
    }

    const event = getSocketEvent()
    const eventId = event.addCallBack("update-self-user", (information) => {
      setSelfUser(information)
    })

    micButton.current.disabled = !selfUser.isMicAllow
    camButton.current.disabled = !selfUser.isCamAllow

    return () => {
      event.removeCallBack("update-self-user", eventId)
    }
  }, [selfUser])

  return (
    <div className='self-user'>
      <p>
          you username :
          <span>
              {" "+ selfUser.username}
          </span>
      </p>
      <p>active your : 
        <button ref={camButton} onClick={() => { activeCam() }} style={{background : selfUser.isCamOn ? "#6f6" : "#f66" }} >camera </button>
        <button ref={micButton} onClick={() => { activeMic() }} style={{background : selfUser.isMicOn ? "#6f6" : "#f66" }} >audio</button>
      </p>
      <video style={{display : selfUser.isCamOn ? "block" : "none"}}  id='selfVideo' muted autoPlay ></video>
    </div>
  )
}
