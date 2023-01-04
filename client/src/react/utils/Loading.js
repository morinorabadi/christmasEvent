import React, { useEffect, useState } from 'react'
import {getSocketEvent} from '../../connections/ClientSocket' 

export default function Loading() {
  const [text, setText] = useState("Loading...")
  let isFirst = false

  useEffect(() => {
    
    const loopId = setInterval(()=> {
      if (isFirst){
        isFirst = false
        setText("Loading.")
      }else {
        isFirst = true
        setText("Loading...")
      }
    }, 300)


    const event = getSocketEvent()
    const mediaElements = []
    const eventsId = []
    const addVideoId = event.addCallBack('new-video-src', ({src, socketId}) => {
        const video = document.createElement('video')
        video.setAttribute('id', `${socketId}video`)
        video.autoplay = true
        video.playsInline = true
        video.srcObject = src
        mediaElements.push(video)
        document.getElementById('loading').append(video)
    })

    const removeVideoId = event.addCallBack('remove-video-src', ({socketId}) => {
        console.log("ok");
        document.getElementById(`${socketId}video`).remove()
    })

    const addAudioId = event.addCallBack('new-audio-src', ({src, socketId}) => {
        const audio = document.createElement('audio')
        audio.setAttribute('id', `${socketId}audio`)
        audio.autoplay = true
        audio.srcObject = src
        mediaElements.push(video)
        document.getElementById('loading').append(video)
    })

    const removeAudioId = event.addCallBack('remove-audio-src', ({socketId}) => {
        document.getElementById(`${socketId}audio`).remove()
    })

    return () => {
      // clear Interval
      clearInterval(loopId)

      // clear callBacks
      event.removeCallBack('new-video-src', addVideoId)
      event.removeCallBack('remove-video-src', removeVideoId)
      event.removeCallBack('new-audio-src', addAudioId)
      event.removeCallBack('remove-audio-src', removeAudioId)

      // clear old media elements
      mediaElements.forEach(element => {
        element.remove()
      })
    }
  },[])

  return (
    <div className='loading' >
      <h2>
        {text}
      </h2>
      <div id='loading' ></div>
    </div>
  )
}
