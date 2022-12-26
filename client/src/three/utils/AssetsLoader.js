/**
 * this class design to load and manage assets
 * like texture and gltf and audio files
 * 
 * load objects should be like this
 * {
 *     loadOver : ()=> {  }
 *     objects : [
 *         {type : "texture", src : "...", loadOver : texture => {} },
 *         {type : "gltf"   , src : "...", loadOver : gltf    => {} }
 *         {type : "audio"  , src : "...", loadOver : audio   => {} }
 *     ]
 * }
 */


import * as THREE from 'three'
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader'
import {Howl} from 'howler'

export default class AssetsLoader{
    constructor(){
        this.manager = new THREE.LoadingManager(undefined,undefined,
            (url) => {console.log("opss we cant load ",url)}
        )
        this.textureLoader = new THREE.TextureLoader(this.manager)
        this.GltfLoader = new GLTFLoader(this.manager)
    }
    load(task){
        task.objects.forEach(object => { object.isloaded = false })
        task.objects.forEach(object => {
            if (object.type == "gltf"){
                this.GltfLoader.load(
                    object.src,
                    gltf => {
                        object.loadOver(gltf)
                        object.isloaded = true
                        this.isOver(task)
                    }
                )
            } else if (object.type == "texture"){
                this.textureLoader.load(
                    object.src,
                    texture => {
                        object.loadOver(texture)
                        object.isloaded = true
                        this.isOver(task)
                    }
                )
            } else if (object.type == "audio"){
                const audio = new  Howl({
                    src : [object.src],
                    onload : () => {
                        object.loadOver(audio)
                        object.isloaded = true
                        this.isOver(task)
                    }
                })
            }
        });
    }
    isOver(task){
        let isover = true
        task.objects.forEach(object => {
            if (!object.isloaded){
                isover = false
            }
        })
        if (isover){
            task.loadOver()
        }
    }
}