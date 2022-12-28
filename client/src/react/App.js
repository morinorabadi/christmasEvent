import React, { useEffect, useRef, useState } from 'react';

// username
import SetUsername from './username/SetUsername'
import Users from './username/Users';
import SelfUser from './username/SelfUser';


import { getSocketEvent } from '../connections/ClientSocket'

// connection
// import SelfVideo from './videoConnection/SelfVideo';
import ChatBox from './Connection/ChatBox';

export default function App() {
  const [selfUsername, setSelfUsername] = useState({isAdmin : false, username : "", id : ""})
  const [isUsernameSet, setIsUsernameSet] = useState(false)

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

    return () => {
      console.log("clean up");
      event.removeCallBack("server-authentication",eventId)
    }
  },[])

  return (
    <div>
      { isUsernameSet ?
        <div className='container' >
          <div id="mainScene" ></div>
          <div className='slider'>
            <SelfUser selfUsername={selfUsername} />
            <Users />
            <ChatBox />
          </div>
        </div>
        :
        <>
          <SetUsername ref={setUserName} />
        </>
      }
    </div>
  )
}