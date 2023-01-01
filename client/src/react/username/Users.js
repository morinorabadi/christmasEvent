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
                      <svg className='type' style={{ fill : selfId.current == user.id ? "#0f0" : user.isAdmin ? "#444" : '#fff' }}><path d="M24 23.95q-3.3 0-5.4-2.1-2.1-2.1-2.1-5.4 0-3.3 2.1-5.4 2.1-2.1 5.4-2.1 3.3 0 5.4 2.1 2.1 2.1 2.1 5.4 0 3.3-2.1 5.4-2.1 2.1-5.4 2.1ZM8 40v-4.7q0-1.9.95-3.25T11.4 30q3.35-1.5 6.425-2.25Q20.9 27 24 27q3.1 0 6.15.775 3.05.775 6.4 2.225 1.55.7 2.5 2.05.95 1.35.95 3.25V40Zm3-3h26v-1.7q0-.8-.475-1.525-.475-.725-1.175-1.075-3.2-1.55-5.85-2.125Q26.85 30 24 30t-5.55.575q-2.7.575-5.85 2.125-.7.35-1.15 1.075Q11 34.5 11 35.3Zm13-16.05q1.95 0 3.225-1.275Q28.5 18.4 28.5 16.45q0-1.95-1.275-3.225Q25.95 11.95 24 11.95q-1.95 0-3.225 1.275Q19.5 14.5 19.5 16.45q0 1.95 1.275 3.225Q22.05 20.95 24 20.95Zm0-4.5ZM24 37Z"/></svg>
                      <p>{user.username}</p>
                      <i>
                        {
                          user.isCamOn ? 
                            <svg><path d="m44 34.25-8-8v5.55l-3-3V11H15.2l-3-3H33q1.2 0 2.1.9.9.9.9 2.1v10.75l8-8Zm-1.6 12.4L1.95 6.2l2.1-2.1L44.5 44.55ZM24.2 20Zm-4.35 4.1ZM7.95 8l3 3H7v26h26v-3.95l3 3V37q0 1.2-.9 2.1-.9.9-2.1.9H7q-1.2 0-2.1-.9Q4 38.2 4 37V11q0-1.2.9-2.1Q5.8 8 7 8Z"/></svg>
                          :
                            <svg><path d="M7 40q-1.2 0-2.1-.9Q4 38.2 4 37V11q0-1.2.9-2.1Q5.8 8 7 8h26q1.2 0 2.1.9.9.9.9 2.1v10.75l8-8v20.5l-8-8V37q0 1.2-.9 2.1-.9.9-2.1.9Zm0-3h26V11H7v26Zm0 0V11v26Z"/></svg>
                        }
                      </i>
                      <i>
                        {
                          user.isMicOn ? 
                            <svg><path d="m34.3 29.95-2.15-2.15q1.05-1.3 1.55-2.925.5-1.625.5-3.325h3q0 2.3-.75 4.45-.75 2.15-2.15 3.95ZM23.05 18.7Zm4.85 4.85-2.65-2.6V9.05q0-.85-.6-1.45T23.2 7q-.85 0-1.45.6t-.6 1.45v7.75l-3-3V9.05q0-2.1 1.475-3.575T23.2 4q2.1 0 3.575 1.475T28.25 9.05v12.5q0 .4-.075 1t-.275 1ZM21.7 42v-6.8q-5.3-.55-8.9-4.45-3.6-3.9-3.6-9.2h3q0 4.55 3.225 7.65 3.225 3.1 7.775 3.1 1.9 0 3.65-.625t3.2-1.725l2.15 2.15q-1.55 1.3-3.45 2.075-1.9.775-4.05 1.025V42Zm19.85 3.25L1.8 5.5l1.9-1.9 39.75 39.75Z"/></svg>
                          :
                            <svg><path d="M24 26.85q-2.15 0-3.6-1.55-1.45-1.55-1.45-3.75V9q0-2.1 1.475-3.55Q21.9 4 24 4t3.575 1.45Q29.05 6.9 29.05 9v12.55q0 2.2-1.45 3.75-1.45 1.55-3.6 1.55Zm0-11.4ZM22.5 42v-6.8q-5.3-.55-8.9-4.45-3.6-3.9-3.6-9.2h3q0 4.55 3.225 7.65Q19.45 32.3 24 32.3q4.55 0 7.775-3.1Q35 26.1 35 21.55h3q0 5.3-3.6 9.2-3.6 3.9-8.9 4.45V42ZM24 23.85q.9 0 1.475-.675.575-.675.575-1.625V9q0-.85-.6-1.425Q24.85 7 24 7t-1.45.575q-.6.575-.6 1.425v12.55q0 .95.575 1.625T24 23.85Z"/></svg>
                        }
                      </i>

                      {/* { isYouAreAdmin &&  (selfId.current !== user.id && !user.isAdmin)?

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
                      } */}
                </li>)
            })
        }
        <li className='end'></li>
    </ul>
  )
}
