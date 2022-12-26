import * as THREE from 'three'
import { lerp } from 'three/src/math/MathUtils'

export default class UserCharater
{
    constructor(redlibcore,charater,audio, getClock ){
        this.group = new THREE.Group()
        this.isActive = false

        // charater
        this.charater = charater 
        this.group.add(this.charater)
        this.playerGameId = null
        // audio
        this.audio = audio
        this.audio._loop = true
        this.audio.volume(0.3)
        this.audio.rate(0.8)
        // this.audio.play()

        // setup camera and camera group
        this.cameraGroup = new THREE.Group()
        this.camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight, 1, 200)
        this.cameraGroup.add(this.camera)
        this.group.add(this.cameraGroup)
        this.camera.position.set(0,15,18)
        this.camera.lookAt(new THREE.Vector3(0,0,0))
        
        // adding process event for update position
        redlibcore.globalEvent.addCallBack('process', (delta) => { this.updatePosition(delta) })
        redlibcore.globalEvent.addCallBack('resize', () => { this.resize() })

        // clock
        this.getClock = getClock
        
        // store every inforamtion about move
        this.moveInfo = {
            isActive : false,
            direction : new THREE.Vector2(),

            forseMove : false,
            speed : 0,
            maxSpeed : 0.01,

            CameraRotate : Math.PI / 2,
        }

    }
    active(position){
        this.group.position.x = position.px 
        this.isActive = true
    }
    deactive(){
        this.isActive = false
        this.playerGameId = null
    }
    // handele resize events
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    // store inputs from controll calss
    setDirection(direction){
        this.moveInfo.direction = direction
        this.moveInfo.isActive = true
        
    }

    // call this event when input is over
    setDirectionEnd(){
        this.moveInfo.isActive = false
    }

    // handele input events
    updatePosition(delta){
        // chech if is active
        if (!this.isActive){ return }

        // handele speed of spaseShip
        if ( this.moveInfo.isActive ){
            this.moveInfo.forseMove = true
            if ( this.moveInfo.speed < this.moveInfo.maxSpeed ) {
                // increse speed for smoth movement
                this.moveInfo.speed += delta * 0.00002

                // handele spaseShip audio base on speed
                this.audio.volume((this.moveInfo.speed * 55) + 0.3)
                this.audio.rate((this.moveInfo.speed * 40) + 0.8)
            }
        } else if (this.moveInfo.forseMove) {
            if (  this.moveInfo.speed > 0 ) {
                // decrese speed for smoth movement
                this.moveInfo.speed -= delta * 0.00001
                
                // handele spaseShip audio base on speed
                this.audio.volume((this.moveInfo.speed * 40) + 0.3)
                this.audio.rate((this.moveInfo.speed * 40) + 0.8)
            } else {
                this.moveInfo.forseMove = false
            }
        }

        // actuall charechter move base on speed
        if ( this.moveInfo.forseMove ) {

            const direction = this.moveInfo.direction.clone()
            direction.x = -direction.x

            // store CameraRotate
            this.moveInfo.CameraRotate += direction.x * delta * this.moveInfo.speed * 0.2
            // rotate camera and charater
            this.cameraGroup.rotation.y = lerp(this.moveInfo.CameraRotate,this.cameraGroup.rotation.y,0.85)
            this.charater.rotation.y = lerp(this.moveInfo.CameraRotate,this.charater.rotation.y,0.4)
            // move charater base on "CameraRotate" and "speed"
            const direction1 = this.moveInfo.direction.clone()
            direction1.rotateAround( new THREE.Vector2(), this.cameraGroup.rotation.y )

            this.group.position.x -= delta * this.moveInfo.speed * direction1.x
            this.group.position.z += delta * this.moveInfo.speed * direction1.y

        }

        if (this.playerGameId){
            // send out user position for other player
            socket.volatile.emit("ugi", { 
                px : this.group.position.x,
                pz : this.group.position.z,
                ry : this.charater.rotation.y,
                // fix global clock 
                t  : this.getClock() ,
                pi : this.playerGameId
            })
        }

    }
}