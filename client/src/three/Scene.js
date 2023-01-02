import * as THREE from 'three'

import World from './world/world'
import Renderer from './utils/Renderer';
import AssetsLoader from './utils/AssetsLoader'
import Clock from './utils/Clock';
import UserCharacters from './character//User';
import Robot from './character/Robot'
import Controller from './utils/Controller'

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

        this.active = (props) => {
            if ( isLoadOver ) { 
                renderer.active()
                character.active(props)
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
                    // room
                    {type : "gltf"   , src : "static/robot.glb", loadOver : gltf    => {
                        loadedAssets.robot = gltf
                    }}
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
            const robot = new Robot(redlibcore,loadedAssets.robot)

            // create character 
            character = new UserCharacters(redlibcore, robot, world.collisionShapes,() => clock.getClock())
            world.scene.add(character.group)


            // create controller
            controller = new Controller(
                redlibcore,
                (direction) =>  {character.getDirection(direction)},
                (direction) => { character.getCameraDirection(direction); },
                () => { character.end()},
                //! fix global isMobile
                false
            )

            // setup renderer
            renderer = new Renderer(redlibcore, world.scene,character.camera)

            redlibcore.sizes.resize()
            
            getSocketEvent().addCallBack("start-game", ( props ) => {
                console.log("start game event and id is : ", props);
                this.active(props)
            })
            
            // send start-game to socket than to server
            handelEvent("start-game")
        }
    }
}