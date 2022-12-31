import * as THREE from 'three'

import InputConverter from '../../redlibCore/utils/InputConverter'

export default class Controller
{
    constructor(redlibcore, getDirection,getCameraDirection , end, isMobile){
        // events
        this.getDirection = getDirection
        this.getCameraDirection = getCameraDirection
        this.end = end 
        this.isMobile = isMobile

        // global events
        redlibcore.globalEvent.addCallBack("resize", (sizes) => {this.resize(sizes)})
        redlibcore.globalEvent.addCallBack("process", (delta) => {this.process(delta)})

        // adding keyboard events
        this.isActive = true
        this.keyBoardRightInfo = { isActive : false, left : false, right : false, x : 0 , isBiger : false }
        this.keyBoardUpInfo =    { isActive : false, up : false, down : false   , y : 0 , isBiger : false }
        
        this.keyboardDirection = new THREE.Vector2()
        document.addEventListener('keydown',( event ) => { this.KeyBoardControl(event,true)})
        document.addEventListener('keyup',( event ) => { this.KeyBoardControl(event,false)})

        // touch events
        redlibcore.globalEvent.addCallBack("touchStart", (touch) => { this.touchStart(touch) })
        redlibcore.globalEvent.addCallBack("touchDrag", (touch) => { this.touchDrag(touch) })
        redlibcore.globalEvent.addCallBack("touchEnd", () => { this.touchEnd() })

        // joy 
        this.joy = document.querySelector('#joy')
        this.big = document.querySelector('#joy .big')
        this.small = document.querySelector('#joy .small')
        this.joyConverter = new InputConverter(this.joy)
        this.position = new THREE.Vector2()


        // camera
        this.camera = document.querySelector('#direction')
        this.directionConverter = new InputConverter(this.camera)
        this.cameraAllow = false
        this.lastCameraDirection = null
        
    }

    process(){

        if ( this.joyAutoRender ){
    
            if (Math.abs(this.position.x) + Math.abs(this.position.y) < 0.02) {
                this.joyAutoRender = false
                this.small.setAttribute('cy', 200)
                this.small.setAttribute('cx', 200)     
                return           
            }
            
            this.position.multiplyScalar(0.92)
            this.small.setAttribute('cy', this.position.y * 200 + 200)
            this.small.setAttribute('cx', this.position.x * 200 + 200)

        }

    }

    resize(sizes){
        if (this.isMobile) { 
            this.joy.style.display = "none"

                this.camera.style.width = sizes.x
                this.camera.style.height = sizes.y

        } else {

            if ( sizes.x > sizes.y ){
    
                this.joy.style.top =  sizes.y * 0.38
                this.joy.style.width =  sizes.y * 0.62


                this.camera.style.width = sizes.x / 2 
                this.camera.style.height = sizes.y
                
            } else {
                
                const lorem = sizes.x / 2
                this.joy.style.top =  sizes.y - lorem
                this.joy.style.width =  lorem
                
                this.camera.style.width = lorem
                this.camera.style.height = sizes.y
                
            }
            
            this.joyConverter.resize()
        }

        this.directionConverter.resize()

    }
    /**
     * KeyBoard
     */

    // handel keyboard events 
    KeyBoardControl(event,isDown){
        // check witch key is preset or release
        let isPressed = false
        switch (event.code) {
            // up and down
            case 'KeyW' :
            case 'ArrowUp':
                
                isPressed = true
                this.keyBoardUpInfo.up = isDown
                break;

            case 'KeyS':
            case 'ArrowDown':

                isPressed = true
                this.keyBoardUpInfo.down = isDown
                break;

            // left and right
            case 'KeyA':
            case 'ArrowLeft':

                isPressed = true
                this.keyBoardRightInfo.left = isDown
                break;

            case 'KeyD':            
            case 'ArrowRight':

                isPressed = true
                this.keyBoardRightInfo.right = isDown
                break;
            
        }
        

        // handel left or right direction
        if (this.keyBoardRightInfo.left && this.keyBoardRightInfo.right){   
            this.keyBoardRightInfo.x = 0
            this.keyBoardRightInfo.isActive = false

        } else if ( this.keyBoardRightInfo.left ) {
            this.keyBoardRightInfo.x = -1
            this.keyBoardRightInfo.isActive = true

        } else if ( this.keyBoardRightInfo.right ) {
            this.keyBoardRightInfo.x = 1
            this.keyBoardRightInfo.isActive = true

        } else {
            this.keyBoardRightInfo.x = 0
            this.keyBoardRightInfo.isActive = false

        }

        // handel up or down
        if (this.keyBoardUpInfo.up && this.keyBoardUpInfo.down){
            this.keyBoardUpInfo.y = 0
            this.keyBoardUpInfo.isActive = false

        } else if ( this.keyBoardUpInfo.up ) {
            this.keyBoardUpInfo.y = -1
            this.keyBoardUpInfo.isActive = true

        } else if ( this.keyBoardUpInfo.down ) {
            this.keyBoardUpInfo.y = 1
            this.keyBoardUpInfo.isActive = true

        } else {
            this.keyBoardUpInfo.y = 0
            this.keyBoardUpInfo.isActive = false

        }

        if ( this.keyBoardUpInfo.isActive || this.keyBoardRightInfo.isActive ){
            this.getDirection(new THREE.Vector2(this.keyBoardRightInfo.x,this.keyBoardUpInfo.y))
        } else if ( isPressed ) {
            this.end()
        }

    }

    /**
     * Touch
     */
    touchStart(touch){
        // camera
        const cameraFirstTouch = this.directionConverter.convert(touch)
        if (Math.abs(cameraFirstTouch.x) <=  1 && Math.abs(cameraFirstTouch.y) <  1 ){
            this.cameraAllow = true
            this.lastCameraDirection = cameraFirstTouch
        }
        
        //joy
        if ( this.isMobile ){ return }
        const joyTouch = this.joyConverter.convert(touch)
        if ( joyTouch.x > 0.75 || joyTouch.y > 0.75 ||joyTouch.y <  -0.75 ){
            this.joyAlowDrag = false
        } else {
            this.joyAlowDrag = true
            this.joyAutoRender = false
        }
    }

    touchDrag(touch){
        // camera
        if (this.cameraAllow){
            const cameraTouch = this.directionConverter.convert(touch)
            this.getCameraDirection(new THREE.Vector2(
                this.lastCameraDirection.x - cameraTouch.x,
                this.lastCameraDirection.y - cameraTouch.y
            ))
    
            this.lastCameraDirection = cameraTouch
        }


        // joy
        if (this.joyAlowDrag){ 

            const joyTouch = this.joyConverter.convert(touch)
            this.position.set(joyTouch.x, joyTouch.y)
            if (this.position.distanceToSquared(new THREE.Vector2()) > 0.3){
                this.position.normalize().multiplyScalar(0.56)
            }
            this.getDirection(this.position.clone())

            this.small.setAttribute('cy', this.position.y * 200 + 200)
            this.small.setAttribute('cx', this.position.x * 200 + 200)
        }
    }

    touchEnd(){
        // camera
        this.cameraAllow = false

        // joy
        this.joyAutoRender = true
        if ( this.joyAlowDrag ) {
            this.end()
        }

    }

}


