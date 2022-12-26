import * as THREE from 'three'

import World from './world/world'
import Renderer from './utils/Renderer';
import AssetsLoader from './utils/AssetsLoader'
import Clock from './utils/Clock';
import Characters from './character/Characters';


export default class Scene{
    constructor(redlibcore){

        // create clock
        const clock = new Clock(redlibcore)

        // creating world
        const world = new World()
        
        // setup renderer
        const renderer = new Renderer(redlibcore, world.scene, charater.camera)

        const loadedAssetes = {}
        let charaters = null
        this.load = (onLoadOver) => {
            new AssetsLoader().load({
                loadOver : () => {
                    // create charaters class
                    charaters = new Characters(redlibcore,loadedAssetes)
                    // world.scene.add(charaters.group)

                    // fix load
                    onLoadOver()
                },
                objects : [
                    // charater 3m model 
                    {type : "gltf"   , src : "static/spaseShip.glb", loadOver : gltf    => {
                        loadedAssetes.charater = gltf.scene
                        gltf.scene.children.forEach( mesh => {
    
                            // adding material to 3d model 
                            switch (mesh.name) {
                                case "black":
                                    mesh.material = new THREE.MeshStandardMaterial({ color : '#222' })
                                    break;
    
                                case "white":
                                    mesh.material = new THREE.MeshStandardMaterial({ color : '#ccc' })
                                    break;
    
                                case "blue":
                                    mesh.material = new THREE.MeshStandardMaterial({ color : '#12a4ff' })
                                    break;
                            }
                        });
                    }},
                    // spaseShip audio
                    {type : "audio"  , src : "static/audios/spaseShip.mp3", loadOver : audio   => {
                        loadedAssetes.spaseShipAudio = audio
                    }}
                ]
            })
        }
    }
}
