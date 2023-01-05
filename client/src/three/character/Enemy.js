import * as THREE from 'three'
import { getSocketEvent, handelEvent } from '../../connections/ClientSocket'

export default class Enemys
{
  constructor(redlibcore, robotModel, camera, getClock){

    this.group = new THREE.Group()

    // init
    let selfGameId = null
    let playersObject = null
    this.init = (playerGameId) => {
        selfGameId = playerGameId
        playersObject = {}
        this.group.clear()
    }

    // active
    let isActive = false
    this.active = () => { isActive = true }
    this.deActive = () => { isActive = false }

    // process
    redlibcore.globalEvent.addCallBack('process', () => {
        
        if ( !isActive ) { return }

        Object.keys( playersObject ).forEach(id => {


            const player = playersObject[id]
            const min = player.gameInfo.min

            if ( player.gameInfo.state == "good" ){
                const max = player.gameInfo.max
                const timeNow = getClock() - 200

                // create position base on min max
                // we decide base on dis formula => px = p1 + tan(alpha) * deltaT
                const deltaTC = (timeNow - min.t) / (max.t - min.t)

                player.model.position.x = min.px + ( max.px - min.px ) * deltaTC
                player.model.position.z = min.pz + ( max.pz - min.pz ) * deltaTC
                player.model.rotation.y = min.ry + ( max.ry - min.ry ) * deltaTC

            } else {
                // player disconnect
                player.model.position.x = min.px
                player.model.position.z = min.pz
                player.model.rotation.y = min.ry
            }

        })
    })

    /**
     * media functions
     */
    const addVideo = ({src, socketId}) => {
        console.log("new media source");
        const enemy = Object.values(playersObject).find(enemy => enemy.socketId == socketId )
        if ( enemy ){
            enemy.model.activeVideo(src,socketId)
        }
    }

    const removeVideo = ({socketId}) => {
        console.log("remove-video-src");
        const enemy = Object.values(playersObject).find(enemy => enemy.socketId == socketId )
        if ( enemy ){
            enemy.model.deActiveVideo(socketId)
        }
    }


    const addAudio = ({src, socketId}) => {
        const audio = document.createElement('audio')
        audio.setAttribute('id', `${socketId}audio`)
        audio.autoplay = true
        audio.srcObject = src
        document.getElementById('main').append(audio)
    }

    const removeAudio = ({socketId}) => {
        document.getElementById(`${socketId}audio`).remove()
    }

    /**
     * listen to socket event
     */
    const event = getSocketEvent()


    // new player join
    event.addCallBack('player-join',(playersInfo) => {
        playersInfo.forEach(player => {
            // return if player Game id is for this user
            if ( player.gameId == selfGameId ){ return }

            // return if player Game id already exist
            else if ( playersObject[player.gameId] ){ return }

            // create new enemy
            const newEnemy = robotModel.generateEnemy(camera)
            this.group.add(newEnemy)

            // we have 3 state on enemy player game info
            // state : good == ping is less than 100
            // state : bad  == ping is less than 500
            // state : dc   == last gameInfo is more than 500 ms
            playersObject[player.gameId] = {
                model : newEnemy,
                socketId : player.socketId,
                gameInfo : { 
                    state : "good",
                    min : player.gameInfo,
                    max : player.gameInfo,
                    oldMax : []
                }
            }
        })
    })

    // some player left 
    event.addCallBack('player-left', (playerGameId) => {
        console.log("player left");
        this.group.remove(playersObject[playerGameId].model)
        delete playersObject[playerGameId]
    })

    // active video source
    event.addCallBack('new-video-src', (object) => { addVideo(object)})
    // remove video source
    event.addCallBack('remove-video-src', (object) => { removeVideo(object) })

    // active audio source
    event.addCallBack('new-audio-src', (object) => { addAudio(object) })
    // remove audio source
    event.addCallBack('remove-audio-src', (object) => { removeAudio(object) })


    // handel information came from server game loop
    event.addCallBack('update-game',(gameInfo) => {
        const timeNow = getClock() - 200
        Object.keys( playersObject ).forEach(id => {
            if ( id == selfGameId ) { return }
            
            const playerInfo = playersObject[id]
            const info = gameInfo[id]

            if (info.t >  timeNow ){
                playerInfo.gameInfo.state = "good"
                if ( info.t > playerInfo.gameInfo.max.t ){
                    playerInfo.gameInfo.oldMax.push(playerInfo.gameInfo.max)
                    playerInfo.gameInfo.max = info


                    let smallestTime = playerInfo.gameInfo.min.t
                    for (let index = playerInfo.gameInfo.oldMax.length -1 ; index > -1 ; index--) {
                        if ( timeNow > playerInfo.gameInfo.oldMax[index].t ) {
                            if (playerInfo.gameInfo.oldMax[index].t > smallestTime ){
                                playerInfo.gameInfo.min = playerInfo.gameInfo.oldMax[index]
                                smallestTime = playerInfo.gameInfo.oldMax[index].t
                            } else {
                                playerInfo.gameInfo.oldMax.splice(index,1)
                            }
                        }
                    }
                }
            } else if ( info.t >  timeNow - 400 ){
                playerInfo.gameInfo.state = "bad"
                playerInfo.gameInfo.min = info

            } else {
                playerInfo.gameInfo.state = "dc"
                playerInfo.gameInfo.min = info
            }
        })
    })
  }
}