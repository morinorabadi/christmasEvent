import * as THREE from 'three'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils'

export default class CharactersGenerator
{
    constructor(redlibcore, model ){

        this.generate = () => {
            return new Robot(redlibcore, model)
        }

        let cameraPosition = null
        this.generateEnemy = (camera) => {
            if (!cameraPosition){
                cameraPosition = new CameraPosition(redlibcore,camera)
            }
            return new EnemyRobot(redlibcore, model, cameraPosition)
        }
    }
}

class Robot extends THREE.Object3D
{
    constructor(redlibcore ,assets){
        super()
        const robot = clone(assets.robot.scene)
        this.add( robot )
        
        // clean up Material
        robot.traverse( child => { if ( child.material ) {
            child.material.metalness = 0
        }});

        // create animation mixer and animate
        const mixer = new THREE.AnimationMixer(robot)
        mixer.timeScale = 0.001

        // update mixer
        redlibcore.globalEvent.addCallBack("process", delta => {
            mixer.update(delta)
        })


        // create Animation object
        const animations = [] 
        assets.robot.animations.forEach(animation => {
            animations.push(mixer.clipAction(animation))
        })
        

        // store some information
        let currentState = "" // idle | walk
        let currentAnimationIndex = 0 
        let currentAnimation = animations[0]

        function newAnimation(animation){
            currentAnimation.crossFadeTo(animation,0.5)

            animation.play()
            animation.enabled = true
            animation.crossFadeFrom(currentAnimation,0.5)

            currentAnimation = animation
        }

        // this is for robot animation
        let lastAnimationIndex = -1
        this.animate = (index) => {
            if (lastAnimationIndex != index){
                lastAnimationIndex = index
                newAnimation(animations[index])
            }
        }


        // idle
        this.idle = () => {
            if ( currentState !== "idle" ){ 
                currentState = "idle"
                currentAnimationIndex = Math.floor(Math.random()*3)
                newAnimation(animations[currentAnimationIndex])
            }
            return currentAnimationIndex 
        }

        this.walk = () => {
            if ( currentState !== "walk" ){ 
                currentState = "walk"
                currentAnimationIndex = Math.floor(Math.random()*2) + 3
                newAnimation(animations[currentAnimationIndex])
            }
            return currentAnimationIndex
        }
    }
}

class CameraPosition
{
  constructor(redlibcore,camera){

    // global calculate camera position
    this.videoCount = 0
    let isVideoProcessActive = false

    const calculateCameraPosition = () => {
        if (this.videoCount > 0){
            isVideoProcessActive = true
        } else {
            isVideoProcessActive = false
        }
    }


    this.activeCameraPosition = () => {
        this.videoCount++
        calculateCameraPosition()
    }

    this.deActiveCameraPosition = () => {
        this.videoCount--
        calculateCameraPosition()
    }

    this.cameraPosition = new THREE.Vector3()
    redlibcore.globalEvent.addCallBack("process", () =>{
        if ( !isVideoProcessActive ){ return }
        camera.getWorldPosition(this.cameraPosition)
    })

  }
}

class EnemyRobot extends Robot
{
    constructor(redlibcore ,assets, cameraPosition){
        super(redlibcore ,assets)

        let isVideoActive = false
        let processId = null

        let monitor = new THREE.Mesh(
            new THREE.PlaneGeometry(4,3),
            new THREE.MeshBasicMaterial({ 
                transparent : true,
                alphaMap : assets.videoBorder,
            })
        )
        monitor.position.y = 12

        this.activeVideo = (src,socketId) => {
            if (isVideoActive){ return }
            isVideoActive = true
            cameraPosition.activeCameraPosition()

            const video = document.createElement("video")
            video.playsInline = true
            video.autoplay = true
            video.setAttribute('id', `${socketId}video`)
            document.body.append(video)

            monitor.material.map = new THREE.VideoTexture(video)
            video.srcObject = src
            video.play()

            this.add(monitor)

            processId = redlibcore.globalEvent.addCallBack('process',() => {
                monitor.lookAt(cameraPosition.cameraPosition)
            })

        }

        this.deActiveVideo = (socketId) => {
            // remove process video 
            if (processId){
                redlibcore.globalEvent.removeCallBack('process',processId)
            }
            this.remove(monitor)
            document.getElementById(`${socketId}video`).remove()
            
            isVideoActive = false
            processId = null
        }

    }
}