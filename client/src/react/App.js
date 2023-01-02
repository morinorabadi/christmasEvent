import React, { useEffect, useRef, useState } from 'react';

// username
import SetUsername from './username/SetUsername'
import Users from './username/Users';
import SelfUser from './username/SelfUser';

// test
import TestVideoAudio from './Connection/TestVideoAudio';
import { getSocketEvent } from '../connections/ClientSocket'


// three js
import Scene from '../three/Scene'
import RedLib from '../redlibCore/core'

const redLibCore = new RedLib({ fps : 30 })

const scene = new Scene(redLibCore)

// utils
import Loading from './utils/Loading';
import Canvas from './utils/Canvas';


// connection
import ChatBox from './Connection/ChatBox';

export default function App() {
  const [selfUsername, setSelfUsername] = useState({isAdmin : false, username : "", id : ""})
  const [isUsernameSet, setIsUsernameSet] = useState(false)

  const [isLoadOver, setIsLoadOver] = useState(false)

  const setUserName = useRef()

  useEffect(()=> { 
    const event = getSocketEvent()
    const eventId = event.addCallBack("server-authentication",(response) =>{
      if ( response.status == 200 ) {
        setIsUsernameSet(true)
        setUserName.current.success()
        setSelfUsername(response.information)

      } else {
        setIsUsernameSet(false)
        setUserName.current.error(response.information.error)
      }
    })

    new TestVideoAudio()

    scene.load(() => {
      setIsLoadOver(true)
    })

    return () => {
      console.log("clean up");
      event.removeCallBack("server-authentication",eventId)
    }
    
  },[])

  return (
    <div>
      { isUsernameSet ?
         <>
          <div id="main" >
          {
            isLoadOver ?
            <Canvas scene={scene} />
            :
            <Loading/>
          }
          </div>
          <SelfUser selfUsername={selfUsername} />
          <Users />
          {/* <ChatBox /> */}
        </>
        :
        <>
          <SetUsername ref={setUserName} />
        </>
      }
    </div>
  )
}