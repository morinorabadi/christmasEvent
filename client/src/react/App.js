import React, { useEffect, useRef, useState } from 'react';

// username
import SetUsername from './username/SetUsername'
import Users from './username/Users';
import SelfUser from './username/SelfUser';

// connection
// import SelfVideo from './videoConnection/SelfVideo';
import ChatBox from './Connection/ChatBox';
// import VideoContainer from './videoConnection/VideoContainer'

export default function App({socket}) {
  const [selfUsername, setSelfUsername] = useState({isAdmin : false, username : "", id : ""})
  const [isUsernameSet, setIsUsernameSet] = useState(false)
  const [users, setUsers] = useState([
    { username : "mori", isAdmin : false, id : "13" },
    { username : "mori", isAdmin : true , id : "12" },
    { username : "mori", isAdmin : false, id : "23" },
  ])

  const setUserName = useRef()

  useEffect(()=> { 
    
    // listen on server-authentication event
    socket.on("server-authentication", (response) => {
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
    socket.on("server-other-users", (response) => {
      if ( response.status == 200 ) {
        console.log(response.information)
        setUsers(response.information)
      }
    })
    return () => {
      socket.off("server-authentication")
      socket.off("server-other-users")
    }
  },[])

  return (
    <div>
      { isUsernameSet ?
        <div className='container' >
          <canvas id="mainScene" ></canvas>
          <div className='slider'>
            <SelfUser selfUsername={selfUsername} />
            <Users users={users} />
            <ChatBox />
          </div>
        </div>
        :
        <>
          <SetUsername socket={socket} ref={setUserName} />
        </>
      }
    </div>
  )
}
