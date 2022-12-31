import * as THREE from 'three'

import World from './world/world'
import Renderer from './utils/Renderer';
import AssetsLoader from './utils/AssetsLoader'
import Clock from './utils/Clock';
import UserCharacters from './character//User';
import Robot from './character/Robot'
import Controller from './utils/Controller'

export default class Scene{
    constructor(redlibcore){
        let renderer = null
        let character = null

        this.active = () => {
            if ( isLoadOver ) { 
                renderer.active()
                character.active()
            }
        }

        this.deActive = () => {
            renderer.deActive()
        }

        const loadedAssets = {
            // just for test
            character : new THREE.Mesh(
                new THREE.BoxGeometry(),
                new THREE.MeshStandardMaterial({color : "red"})
            )
        }
        let isLoadOver = false
        this.load = (onLoadOver) => {
            new AssetsLoader().load({
                loadOver : () => {
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
                    const controller = new Controller(
                        redlibcore,
                        (direction) =>  {character.getDirection(direction)},
                        (direction) => { character.getCameraDirection(direction); },
                        () => { character.end()},
                        //! fix global isMobile
                        true
                    )

                    // setup renderer
                    renderer = new Renderer(redlibcore, world.scene,character.camera)
                    
                    // emit load over
                    isLoadOver = true
                    onLoadOver()
                },

                objects : [
                    // room
                    {type : "gltf"   , src : "static/room1.glb", loadOver : gltf    => {
                        loadedAssets.world = gltf
                    }},
                    // room
                    {type : "gltf"   , src : "static/robot1.glb", loadOver : gltf    => {
                        loadedAssets.robot = gltf
                    }}
                ]
            })
        }
    }
}
