import * as THREE from 'three'

export default class Renderer
{
    constructor(redlibcore,scene,camera){
        this.isActive = false
        
        // setup renderer
        const canvasHtml = document.getElementById('scene')
        const renderer = new THREE.WebGLRenderer({canvas : canvasHtml})

        renderer.setSize(window.innerWidth,window.innerHeight)
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

        // if "isActive" render scene
        redlibcore.globalEvent.addCallBack("process", () => {
            if ( this.isActive ){ renderer.render(scene,camera) }

        })

        // handel resize event
        redlibcore.globalEvent.addCallBack("resize", (sizes) => {
            renderer.setSize(sizes.x,sizes.y)
        })
    }

    // active render
    active(){
        this.isActive = true
    }

    // deActive render
    deActive(){
        this.isActive = false
    }

}