import * as THREE from 'three'

export default class Enemy
{
    constructor(redlibcore, charater, getClock){
        this.group = new THREE.Group()
        this.charaterModel = charater.clone()

        // clock
        this.getClock = getClock

        redlibcore.globalEvent.addCallBack('process', (delta) => { this.updatePosition(delta) })

    }
    
    init(playerGameId){
        this.selfGameId = playerGameId
        this.group.clear()
        this.playersObject = {}
    }

    active(){
        this.isActive = true
    }

    deactive(){
        this.isActive = false
    }
    
    updateEnemys(playersGameId,position){
        playersGameId.forEach(id => {
            // return if player Game id is for this user
            if ( id == this.selfGameId ){ return }

            // return if player Game id already exsit
            else if ( this.playersObject[id] ){ return }

            // create new enemy
            const newEnemy = this.charaterModel.clone()
            this.group.add(newEnemy)

            // we have 3 state on enemy player game info
            // state : good == ping is less than 100
            // state : bad  == pnig is less than 500
            // state : dc   == last gameinfo is more than 500 ms
            this.playersObject[id] = {
                model : newEnemy,
                gameInfo : { 
                    state : "good",
                    min : position,
                    max : position,
                    oldMax : []
                }
            }
        })
    }
    
    playerLeave(playerGameId){
        this.group.remove(this.playersObject[playerGameId].model)
        delete this.playersObject[playerGameId]
    }
    
    // update position from server
    updateGameInfo(time ,gameInfo){
        const timeNow = this.getClock() - 200

        Object.keys(this.playersObject).forEach(id => {
            if ( id == this.selfGameId ) { return }
            
            const playerInfo = this.playersObject[id]
            const info = gameInfo[id]

            if (info.t >  timeNow ){
                playerInfo.gameInfo.state = "good"
                if ( info.t > playerInfo.gameInfo.max.t ){
                    playerInfo.gameInfo.oldMax.push(playerInfo.gameInfo.max)
                    playerInfo.gameInfo.max = info


                    let smalletsTime = playerInfo.gameInfo.min.t
                    for (let index = playerInfo.gameInfo.oldMax.length -1 ; index > -1 ; index--) {
                        if ( timeNow > playerInfo.gameInfo.oldMax[index].t ) {
                            if (playerInfo.gameInfo.oldMax[index].t > smalletsTime ){
                                playerInfo.gameInfo.min = playerInfo.gameInfo.oldMax[index]
                                smalletsTime = playerInfo.gameInfo.oldMax[index].t
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
    }

    updatePosition(delta){
        
        if ( !this.isActive ) { return }


        Object.keys(this.playersObject).forEach(id => {

            const player = this.playersObject[id]
            const min = player.gameInfo.min

            if ( player.gameInfo.state == "good" ){
                const max = player.gameInfo.max
                const timeNow = this.getClock() - 200

                // create position base on min max
                // we deside base on dis formolu => px = p1 + tan(alpha) * deltaT
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
    }
}

        /**
         * server Setup
         */

        // generate world
        // socket.on("server-create-world", (respone) => {
        //     if ( respone.status == 200 ){
        //         // create world
        //         this.world.generateBase(respone.baseWorldData)


        //         // create enemys class
        //         this.enemys.init(respone.playerGameId)

        //         this.loadChecks.isWorldLoad = true
                
        //         socket.emit("load-over", Date.now())
                
        //     }
        // })

        // // start game event
        // socket.on("server-start-game", ( response ) => {
        //     if ( response.status == 200 ){
        //         this.clock.setClock(response.serverTime + delay / 2)
        //         this.enemys.active()
        //     }
        // })

        // // server on new player join
        // socket.on("game-new-player",( response ) => {
        //     if ( response.status == 200 ){
        //         this.enemys.updateEnemys(response.playersGameId,response.position)
        //     }
        // })

        // // game on some player disconnect
        // socket.on("game-player-disconnect",( response ) => {
        //     if ( response.status == 200 ){
        //         this.enemys.playerLeave(response.playerGameId)
        //     }
        // })

        // // server room destroyed
        // socket.on("game-room-destroyed",( response )=>{
        //     if ( response.status == 200 ){
        //         this.enemys.deactive()
        //         socket.emit("room-destroyed-done")
        //     }
        // })

        // // server update game info  
        // socket.on("sugi", (time ,gameInfo) => {
        //     this.enemys.updateGameInfo(time ,gameInfo)
        // })