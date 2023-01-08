import * as THREE from 'three'
import { lerp } from 'three/src/math/MathUtils'
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
            newEnemy.visible = false
            this.group.add(newEnemy)

            // we have 3 state on enemy player game info
            // state : good == ping is less than 100
            // state : bad  == ping is less than 500
            // state : dc   == last gameInfo is more than 500 ms
            playersObject[player.gameId] = {
                model : newEnemy,
                socketId : player.socketId,
                state : "new", // "good" | "bad" | "dc" | "new"
                gameInfos : [player.gameInfo],
            }
            setTimeout(() => {
                if (playersObject[player.gameId]){
                newEnemy.visible = true
                playersObject[player.gameId].state = "bad"
                }
            }, 1000)
        })
    })

    // some player left 
    event.addCallBack('player-left', (playerGameId) => {
        this.group.remove(playersObject[playerGameId].model)
        delete playersObject[playerGameId]
    })

    // media events ********
    // active video source
    event.addCallBack('new-video-src', (object) => { addVideo(object)})
    // remove video source
    event.addCallBack('remove-video-src', (object) => { removeVideo(object) })

    // active audio source
    event.addCallBack('new-audio-src', (object) => { addAudio(object) })
    // remove audio source
    event.addCallBack('remove-audio-src', (object) => { removeAudio(object) })


    /**
     * enemy position predict
     */

    const interpolationTime = 300
    const badConnectionTime = 500


    // handel information came from server game loop
    event.addCallBack('update-game',(gameInfo) => { 
        Object.keys( playersObject ).forEach(id => {
            if ( id == selfGameId ) { return }
            
            const playerObject = playersObject[id]
            const serverInfo = gameInfo[id]

            // check is this state is updated
            if (playerObject.gameInfos[playerObject.gameInfos.length -1 ].t < serverInfo.t){
                // if it is added to gameInfos array
                playerObject.gameInfos.push(serverInfo)

                // do animation if change
                playerObject.model.animate(serverInfo.a)
            }
        })
    })

    // active
    let isActive = false
    this.active = () => { isActive = true }
    this.deActive = () => { isActive = false }

    redlibcore.globalEvent.addCallBack('process', () => {
        if (!isActive){return}

        Object.keys( playersObject ).forEach(id => {
            const player = playersObject[id]

            if (player.state == "new" ){ 
                return
            }
            const now = getClock()
            const renderTime = now - interpolationTime
            const badStateTime = now - badConnectionTime

            const lastGameInfo = player.gameInfos[player.gameInfos.length -1]

            if ( lastGameInfo.t > renderTime ){
                // update state
                player.state = "good"

                // save future position
                const future = lastGameInfo
                let nearest;

                // find closet gameInfo to renderTime
                let founded = false
                for (let index = player.gameInfos.length -1; index > -1; index-- ){
                    if (player.gameInfos[index].t < renderTime && !founded ){
                        founded = true
                        nearest = player.gameInfos[index]
                    } else
                    // clear old states
                    if (player.gameInfos[index].t < renderTime - 500 ){
                        player.gameInfos.splice(index,1)
                    }
                }

                // update model position
                const LerpValue = (renderTime - nearest.t) / (future.t - nearest.t)
                player.model.position.x = lerp(nearest.x, future.x, LerpValue)
                player.model.position.z = lerp(nearest.z, future.z, LerpValue)
                player.model.rotation.y = lerp(nearest.y, future.y, LerpValue)

            } else
            // state is bad package time is less than render time
            if ( lastGameInfo.t > badStateTime ) {
                // update state
                player.state = "bad"

                // save nearest position
                const nearest = lastGameInfo
                let closest = null
                const nearestTime = nearest.t
                // find closet gameInfo to nearest that time is less than 100 ms
                let founded = false
                for (let index = player.gameInfos.length -1; index > -1; index-- ){
                    if (player.gameInfos[index].t < nearestTime - 100 && !founded ){
                        founded = true
                        closest = player.gameInfos[index]
                    } else
                    // clear old states
                    if (player.gameInfos[index].t < renderTime - badConnectionTime ){
                        player.gameInfos.splice(index,1)
                    }
                }

                // player.model.position.x = ax +c => 
                // a = (nearest.x - closest.x) /  (nearest.t - closest.t)
                // renderPosition = a ( renderTime - nearestTime ) + nearestPosition
                player.model.position.x = (nearest.x - closest.x) /  (nearest.t - closest.t) * (renderTime - nearest.t ) + nearest.x
                player.model.position.z = (nearest.z - closest.z) /  (nearest.t - closest.t) * (renderTime - nearest.t ) + nearest.z
                player.model.rotation.y = (nearest.y - closest.y) /  (nearest.t - closest.t) * (renderTime - nearest.t ) + nearest.y

            }
            // state is disconnected and player don't update his position last 400 ms
            else {
                // update state
                player.state = "dc"

                // set newest position
                player.model.position.x = lastGameInfo.x
                player.model.position.z = lastGameInfo.z
                player.model.rotation.y = lastGameInfo.y
                

                // clear useless gameInfos
                const lastPlayerGameInfoIndex = player.gameInfos.length -1
                for (let index = lastPlayerGameInfoIndex; index > -1; index-- ){
                    if ( index !== lastPlayerGameInfoIndex){
                        player.gameInfos.splice(index,1)
                    }
                }
            }
        })
    })
  }
}