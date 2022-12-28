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
  const [users, setUsers] = useState([
    { username : "mori", isAdmin : false, id : "13" },
    { username : "mori", isAdmin : true , id : "12" },
    { username : "mori", isAdmin : false, id : "23" },
  ])

  const setUserName = useRef()

  useEffect(()=> { 
    const socketEvent = getSocketEvent()
    // listen on server-authentication event
    
    const idOne = socketEvent.addCallBack("server-authentication",(response) =>{
      if ( response.status == 200 ) {
        setIsUsernameSet(true)
        setUserName.current.success()
        setSelfUsername(response.information)
      } else {
        setIsUsernameSet(false)
        setUserName.current.error(response.information.error)
      }
    })

    // listen on server-other-users event
    const idTwo = socketEvent.addCallBack("server-other-users",(information) =>{
      setUsers(information)
    })

    return () => {
      console.log("clean up");
      socketEvent.removeCallBack(idOne)
      socketEvent.removeCallBack(idTwo)
    }
  },[])

  return (
    <div>
      { isUsernameSet ?
        <div className='container' >
          <div id="mainScene" ></div>
          <div className='slider'>
            <SelfUser selfUsername={selfUsername} />
            <Users users={users} />
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