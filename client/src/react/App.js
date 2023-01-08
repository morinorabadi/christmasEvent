import React, { useEffect, useRef, useState } from 'react';

// username
import SetUsername from './username/SetUsername'
import Users from './username/Users';
import SelfUser from './username/SelfUser';

// utils
import Loading from './utils/Loading';

// socket
import { getSocketEvent } from '../connections/ClientSocket'

// three js
import Scene from '../three/Scene'
import RedLib from '../redlibCore/core'

let isInitStart = false
let isGLTFLoadOver = false

// create redlib instance
const redLibCore = new RedLib({ fps : 60 })

// create three scene
const scene = new Scene(redLibCore)

// connection
// ! fix chat
import ChatBox from './Connection/ChatBox';

export default function App() {
  const [selfUsername, setSelfUsername] = useState({isAdmin : false, username : "", id : ""})
  const [isUsernameSet, setIsUsernameSet] = useState(false)

  const [isLoadOver, setIsLoadOver] = useState(false)

  const setUserName = useRef()

  useEffect(()=> { 
    const event = getSocketEvent()
    const eventId = event.addCallBack("server-authentication",(response) =>{

      setIsUsernameSet(true)
      setUserName.current.success()
      setSelfUsername(response.information)

      if ( response.status == 200 ) {
        if ( isGLTFLoadOver && !isInitStart ){
          isInitStart = true
          scene.init()
          setIsLoadOver(true)
        }

      } else {
        setIsUsernameSet(false)
        setUserName.current.error(response.information.error)
      }
    })

    scene.load(() => {
      isGLTFLoadOver = true

      if ( isUsernameSet && !isInitStart ){
        isInitStart = true
        scene.init()
        setIsLoadOver(true)
      }
      
    })

    return () => {
      console.log("clean up");
      event.removeCallBack("server-authentication",eventId)
    }
    
  },[])

  return (
    <div>

      <div id='game'>
        <div id="contoroller">
          <svg id="joy" viewBox="0 0 400 400">
              <circle className="big" cx="200" cy="200" r="100" />
              <circle className="small" cx="200" cy="200" r="70" />
          </svg>
          <svg id="direction"></svg>
        </div>
        <canvas id="scene" ></canvas>
      </div>

      { isUsernameSet ?
         <>
          <div id="main" >
          {
            isLoadOver ?
            <>
              <SelfUser selfUsername={selfUsername} />
              <Users />
              {/* <ChatBox /> */}
            </>
            :
            <Loading/>
          }
          </div>
        </>
        :
        <>
          <SetUsername ref={setUserName} />
        </>
      }
    </div>
  )
}