import React, { useEffect, useState, useRef } from 'react'
import { getSocketEvent, SocketEmit, handelEvent} from "../../connections/ClientSocket"

export default function Users() {
  const [users, setUsers] = useState([])
  const selfId = useRef()
  const [isYouAreAdmin, setIsYouAreAdmin] = useState(false)

  const youAreAdmin = (users) => {

    users.forEach(user => {
      if (user.id == selfId.current && user.isAdmin){
        console.log("gg is called");
        setIsYouAreAdmin(true)
      }
    })
  }

  useEffect(()=> {
    handelEvent("self-user").then((user) => (selfId.current = user.id))

    handelEvent("update-users").then((users) => {
      setUsers(users)
      youAreAdmin(users)
    })

    const event = getSocketEvent()
    const eventId = event.addCallBack("update-users", (users) => {
      setUsers(users)
      youAreAdmin(users)
    })

    return () => {
      event.removeCallBack("update-users", eventId)
    }

  },[])

  return (
    <ul className='users' >
        <li className='title'> users </li>
        {
            users.map(user => {
                return( 
                <li 
                  key={user.id} >
                    <p className='type' style={{ color : 
                     selfId.current == user.id ?
                     "#0f0" :
                     user.isAdmin ? "#444" : '#fff'
                    }}  >ii</p>
                    <p>{user.username}</p>
                    <div>
                      <p className='icon' style={{ background : user.isCamOn ? "#6f6" : "#f66" }} >cam</p>
                      <p className='icon' style={{ background : user.isMicOn ? "#6f6" : "#f66" }} >mic</p>
                      { isYouAreAdmin &&  (selfId.current !== user.id && !user.isAdmin)?

                        <>
                          <button 
                            style={{ background : user.isCamAllow ? "#8f8" : "#f88"}} 
                            onClick={ () => { SocketEmit("admin-users-media",{ id : user.id, type: "video", isAllow : !user.isCamAllow }) } } >
                             cam 
                            </button>
                          <button 
                            style={{ background : user.isMicAllow ? "#8f8" : "#f88"}} 
                            onClick={ () => { SocketEmit("admin-users-media",{ id : user.id, type: "audio", isAllow : !user.isMicAllow }) } } >
                             mic 
                            </button>
                        </>
                        :
                        <></>
                      }

                    </div>
                </li>)
            })
        }
    </ul>
  )
}
