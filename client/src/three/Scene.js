import * as THREE from 'three'

import World from './world/world'
import Renderer from './utils/Renderer';
import AssetsLoader from './utils/AssetsLoader'
import Clock from './utils/Clock';
import UserCharacters from './character//User';
import RobotGenerator from './character/Robot'
import Controller from './utils/Controller'
import Enemys from './character/Enemy'

// socket 
import { handelEvent, getSocketEvent } from '../connections/ClientSocket'

export default class Scene{
    constructor(redlibcore){
        let isLoadOver = false
        let isLoadingStart = false
        let isInit = false

        let renderer = null
        let character = null
        let controller = null
        let enemys = null

        this.active = (props) => {
            if ( isLoadOver ) { 
                renderer.active()
                character.active(props)

                enemys.init(props.gameId)
                enemys.active()
                
                controller.active()
            }
        }

        this.deActive = () => {
            renderer.deActive()
            character.deActive()
            controller.deActive()
        }

        const loadedAssets = {
            // just for test
            character : new THREE.Mesh(
                new THREE.BoxGeometry(),
                new THREE.MeshStandardMaterial({color : "red"})
            )
        }
        this.load = (onLoadOver) => {
            // prevent from multiple loading
            if (isLoadingStart){ return }
            isLoadingStart = true
            
            // start loading
            new AssetsLoader().load({
                loadOver : () => {

                    // emit load over
                    isLoadOver = true
                    onLoadOver()
                    
                },

                objects : [
                    // room
                    {type : "gltf"   , src : "static/room.glb", loadOver : gltf    => {
                        loadedAssets.world = gltf
                    }},
                    // robot
                    {type : "gltf"   , src : "static/robot.glb", loadOver : gltf    => {
                        loadedAssets.robot = gltf
                    }},
                    // border
                    {
                        type : "texture", src : "static/videoBorder.jpg", loadOver : texture => {
                            loadedAssets.videoBorder = texture
                    }},
                ]
            })
        }

        this.init = () => {
            // prevent from multiple init
            if (isInit){ return }
            isInit = true


            // creating world
            const world = new World(loadedAssets.world)

            // create clock
            const clock = new Clock(redlibcore)

            // create robot
            const robotGenerator = new RobotGenerator(redlibcore,loadedAssets)

            // create character 
            character = new UserCharacters(redlibcore, robotGenerator, world.collisionShapes,() => clock.getClock())
            world.scene.add(character.group)

            enemys = new Enemys(redlibcore,robotGenerator,character.camera,() => clock.getClock())
            world.scene.add(enemys.group)
            
            // create controller
            controller = new Controller(
                redlibcore,
                (direction) =>  {character.getDirection(direction)},
                (direction) => { character.getCameraDirection(direction); },
                () => { character.end()},
                redlibcore.sizes.getSizes().isMobile
            )

            // setup renderer
            renderer = new Renderer(redlibcore, world.scene,character.camera)

            
            // this call when server WebRTC is created
            getSocketEvent().addCallBack("start-game", ( option ) => {
                document.getElementById('game').style.display = "block"
                this.active( option )

                // create fake resize for event
                let loopId = setInterval(() => {
                    redlibcore.sizes.resize()
                }, 250)
                setTimeout(() => { clearInterval(loopId) }, 3000) 
            })
            
            // send start-game to socket than to server
            handelEvent("start-game")
        }
    }
}