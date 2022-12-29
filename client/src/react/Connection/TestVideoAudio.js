import {getSocketEvent} from '../../connections/ClientSocket'

export default class TestVideoAudio
{
    constructor(){
        const event = getSocketEvent()


        event.addCallBack('new-video-src', ({src, socketId}) => {
            const video = document.createElement('video')
            video.setAttribute('id', `${socketId}video`)
            video.autoplay = true
            video.srcObject = src
            document.getElementById('mainScene').append(video)
        })

        event.addCallBack('remove-video-src', ({socketId}) => {
            document.getElementById(`${socketId}video`).remove()
        })

        event.addCallBack('new-audio-src', ({src, socketId}) => {
            const audio = document.createElement('audio')
            audio.setAttribute('id', `${socketId}audio`)
            audio.autoplay = true
            audio.srcObject = src
            document.getElementById('mainScene').append(video)
        })

        event.addCallBack('remove-audio-src', ({socketId}) => {
            document.getElementById(`${socketId}audio`).remove()
        })

    }
}