import * as THREE from 'three'
import { lerp } from 'three/src/math/MathUtils'

export default class UserCharacter
{
    constructor(redlibcore, characterModel, getClock ){
        this.group = new THREE.Group()
        //! remove this
        this.group.position.y = 15
        this.isActive = false

        // character
        this.character = characterModel
        this.group.add(this.character)
        this.playerGameId = null

        // setup camera and camera group
        this.cameraGroup = new THREE.Group()
        this.camera = new THREE.PerspectiveCamera(45,window.innerWidth / window.innerHeight, 1, 200)
        this.cameraGroup.add(this.camera)
        this.group.add(this.cameraGroup)
        this.camera.position.set(0,2,18)
        this.camera.lookAt(new THREE.Vector3(0,0,0))
        
        // adding process event for update position
        redlibcore.globalEvent.addCallBack('process', (delta) => { this.updatePosition(delta) })
        redlibcore.globalEvent.addCallBack('resize', () => { this.resize() })

        // clock
        this.getClock = getClock
        
        // store every information about move
        this.moveInfo = {
            isActive : false,
            direction : new THREE.Vector2(),

            forceMove : false,
            speed : 0,
            maxSpeed : 0.01,

            CameraRotate : Math.PI / 2,
        }

    }
    active(){
        //! we need to update start position
        // this.group.position.x = position.px 
        this.isActive = true
    }
    deActive(){
        this.isActive = false
        this.playerGameId = null
    }
    // handel resize events
    resize(){
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
    }

    // store inputs from control class
    setDirection(direction){
        this.moveInfo.direction = direction
        this.moveInfo.isActive = true
        
    }

    // call this event when input is over
    setDirectionEnd(){
        this.moveInfo.isActive = false
    }

    // handel input events
    updatePosition(delta){
        // check if is active
        if (!this.isActive){ return }

        // handel speed of Character
        if ( this.moveInfo.isActive ){
            this.moveInfo.forceMove = true
            if ( this.moveInfo.speed < this.moveInfo.maxSpeed ) {
                // increase speed for smooth movement
                this.moveInfo.speed += delta * 0.00002
            }
        } else if (this.moveInfo.forceMove) {
            if (  this.moveInfo.speed > 0 ) {
                // decrees speed for smooth movement
                this.moveInfo.speed -= delta * 0.00001
            } else {
                this.moveInfo.forceMove = false
            }
        }

        // actual charter move base on speed
        if ( this.moveInfo.forceMove ) {

            const direction = this.moveInfo.direction.clone()
            direction.x = -direction.x

            // store CameraRotate
            this.moveInfo.CameraRotate += direction.x * delta * this.moveInfo.speed * 0.2
            // rotate camera and character
            this.cameraGroup.rotation.y = lerp(this.moveInfo.CameraRotate,this.cameraGroup.rotation.y,0.85)
            this.character.rotation.y = lerp(this.moveInfo.CameraRotate,this.character.rotation.y,0.4)
            // move character base on "CameraRotate" and "speed"
            const direction1 = this.moveInfo.direction.clone()
            direction1.rotateAround( new THREE.Vector2(), this.cameraGroup.rotation.y )

            this.group.position.x -= delta * this.moveInfo.speed * direction1.x
            this.group.position.z += delta * this.moveInfo.speed * direction1.y

        }

        //! fix  -- don't needed this right now   
        // send out user position for other player
        // if (this.playerGameId){
        //     socket.volatile.emit("ugi", { 
        //         px : this.group.position.x,
        //         pz : this.group.position.z,
        //         ry : this.character.rotation.y,
        //         t  : this.getClock() ,
        //         pi : this.playerGameId
        //     })
        // }

    }
}