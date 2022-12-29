import * as THREE from 'three'

export default class World
{
    constructor(world){
        // main scene
        this.scene = new THREE.Scene()
        world.scene.traverse( child => { if ( child.material ) {
            if( child.material.map ){
                child.material.map.flipY = false
            }
            child.material.metalness = 0
        } } );

        this.scene.add(world.scene)

        // add light to scene
        const ambientLight = new THREE.AmbientLight("#bdfff0",0.5)
        const directionalLight = new THREE.DirectionalLight("#fff",0.4)
        directionalLight.position.set(1,1,1 )

        this.scene.add(ambientLight,directionalLight)
    }
}