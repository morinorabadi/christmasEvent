import * as THREE from 'three'

export default class Renderer
{
    constructor(redlibcore,scene,camera){
        this.isActive = false
        
        // setup rendere
        const renderer = new THREE.WebGLRenderer({canvas : document.getElementById('three_scene')})
        renderer.setSize(window.innerWidth,window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
        renderer.setClearColor(new THREE.Color("#111"))

        // if "isactive" rendere scene
        redlibcore.globalEvent.addCallBack("process", () => {
            if ( this.isActive ){ renderer.render(scene,camera) }
        })

        // handele resize event
        redlibcore.globalEvent.addCallBack("resize", (sizes) => {
            renderer.setSize(sizes.x, sizes.y)
        })
    }

    // active render
    active(){
        this.isActive = true
    }

    // deactive render
    deactive(){
        this.isActive = false
    }

}