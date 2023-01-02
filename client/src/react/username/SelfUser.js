import React, { useEffect, useState, useRef} from 'react'
import { getSocketEvent, handelEvent } from '../../connections/ClientSocket'

export default function SelfUser() {
  const [selfUser, setSelfUser] = useState({})

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
        <button ref={camButton} onClick={() => { activeCam() }} >
          {
              selfUser.isCamOn ? 
                <svg><path d="m44 34.25-8-8v5.55l-3-3V11H15.2l-3-3H33q1.2 0 2.1.9.9.9.9 2.1v10.75l8-8Zm-1.6 12.4L1.95 6.2l2.1-2.1L44.5 44.55ZM24.2 20Zm-4.35 4.1ZM7.95 8l3 3H7v26h26v-3.95l3 3V37q0 1.2-.9 2.1-.9.9-2.1.9H7q-1.2 0-2.1-.9Q4 38.2 4 37V11q0-1.2.9-2.1Q5.8 8 7 8Z"/></svg>
              :
                <svg><path d="M7 40q-1.2 0-2.1-.9Q4 38.2 4 37V11q0-1.2.9-2.1Q5.8 8 7 8h26q1.2 0 2.1.9.9.9.9 2.1v10.75l8-8v20.5l-8-8V37q0 1.2-.9 2.1-.9.9-2.1.9Zm0-3h26V11H7v26Zm0 0V11v26Z"/></svg>
          }
        </button>
        
        <button ref={micButton} onClick={() => { activeMic() }} >
          {
            selfUser.isMicOn ? 
              <svg><path d="m34.3 29.95-2.15-2.15q1.05-1.3 1.55-2.925.5-1.625.5-3.325h3q0 2.3-.75 4.45-.75 2.15-2.15 3.95ZM23.05 18.7Zm4.85 4.85-2.65-2.6V9.05q0-.85-.6-1.45T23.2 7q-.85 0-1.45.6t-.6 1.45v7.75l-3-3V9.05q0-2.1 1.475-3.575T23.2 4q2.1 0 3.575 1.475T28.25 9.05v12.5q0 .4-.075 1t-.275 1ZM21.7 42v-6.8q-5.3-.55-8.9-4.45-3.6-3.9-3.6-9.2h3q0 4.55 3.225 7.65 3.225 3.1 7.775 3.1 1.9 0 3.65-.625t3.2-1.725l2.15 2.15q-1.55 1.3-3.45 2.075-1.9.775-4.05 1.025V42Zm19.85 3.25L1.8 5.5l1.9-1.9 39.75 39.75Z"/></svg>
            :
              <svg><path d="M24 26.85q-2.15 0-3.6-1.55-1.45-1.55-1.45-3.75V9q0-2.1 1.475-3.55Q21.9 4 24 4t3.575 1.45Q29.05 6.9 29.05 9v12.55q0 2.2-1.45 3.75-1.45 1.55-3.6 1.55Zm0-11.4ZM22.5 42v-6.8q-5.3-.55-8.9-4.45-3.6-3.9-3.6-9.2h3q0 4.55 3.225 7.65Q19.45 32.3 24 32.3q4.55 0 7.775-3.1Q35 26.1 35 21.55h3q0 5.3-3.6 9.2-3.6 3.9-8.9 4.45V42ZM24 23.85q.9 0 1.475-.675.575-.675.575-1.625V9q0-.85-.6-1.425Q24.85 7 24 7t-1.45.575q-.6.575-.6 1.425v12.55q0 .95.575 1.625T24 23.85Z"/></svg>
          }
        </button>
      <video style={{display : selfUser.isCamOn ? "block" : "none"}}  id='selfvideo' playsInline autoPlay ></video>
    </div>
  )
}
