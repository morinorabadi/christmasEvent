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
    constructor(redlibcore ,model){
        super()
        const robot = clone(model.scene)
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
        model.animations.forEach(animation => {
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

        // idle
        const idleAnimation = [ 
            {index : 0, name : "normal" },
            {index : 1, name : "left" },
            {index : 2, name : "right" },
        ]
        this.idle = () => {
            if ( currentState == "idle" ){ return }
            currentState = "idle"

            currentAnimationIndex = Math.floor(Math.random()*3)
            const idleAnimationObject = idleAnimation[currentAnimationIndex]
            newAnimation(animations[idleAnimationObject.index])
            return idleAnimationObject.name
        }

        // walk
        const walkAnimation = [ 
            {index : 3, name : "walk0" },
            {index : 4, name : "walk1" },
        ]
        this.walk = () => {
            if ( currentState == "walk" ){ return }
            currentState = "walk"

            currentAnimationIndex = Math.floor(Math.random()*2)
            const walkAnimationObject = walkAnimation[currentAnimationIndex]
            newAnimation(animations[walkAnimationObject.index])
            return walkAnimationObject.name


        }
        
        this.idle()
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
    constructor(redlibcore ,model, cameraPosition){
        super(redlibcore ,model)

        let isVideoActive = false
        let processId = null

        let monitor = new THREE.Mesh(
            new THREE.PlaneGeometry(3,3),
            new THREE.MeshBasicMaterial()
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

            //! fix process id and make it global 
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