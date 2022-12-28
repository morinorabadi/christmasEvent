import React, { useState, useEffect } from 'react'

import {SocketEmit, getSocketEvent} from '../../connections/ClientSocket'

export default function ChatBox() {
  const [messages, setMessages] = useState([])
  const [myMessage, setMyMessage] = useState("")

  const sendOut = () => {
    SocketEmit("send-message", myMessage)
    setMyMessage('')
  }


  useEffect(() => {
    const globalEvent = getSocketEvent()

    const eventId = globalEvent.addCallBack("new-message",(newMessage) => {
      setMessages((last) => { return [...last, newMessage] })
    })

    return () => {
      globalEvent.removeCallBack("new-message", eventId)
    }
  }, [])

  return (
    <div className='chat-box' >
      <ul>{
        messages.map(message => {
          return (
            <li key={message.id}>
              <p>{message.text}</p>
              <span>{message.owner}</span>
            </li>
          )
        })
      }</ul>
      <div>
        <input 
          type='text' 
          value={myMessage}
          onChange={(e)=> {setMyMessage(e.target.value)}} 
        />
        <button onClick={sendOut} >
          post
        </button>
      </div>

    </div>
  )
}
