
export default class Controller
{
    constructor(redlibcore, getDirection, getSpeed ,end){
        // events
        this.getDirection = getDirection
        this.getSpeed = getSpeed
        this.end = end

        // globa events
        redlibcore.globalEvent.addCallBack("resize", (sizes) => {this.resize(sizes)})
        redlibcore.globalEvent.addCallBack("process", (delta) => {this.process(delta)})

        // adding keyboard events
        this.keyBoardRightInfo = { isActive : false, left : false, right : false, x : 0 , isBiger : false }
        this.keyBoardUpInfo =    { isActive : false, up : false, down : false   , y : 0 , isBiger : false }
        this.keyBoardSpeedInfo = { isActive : false, spase : true, shiftt : false }
        
        this.keyboardDirection = new THREE.Vector2()
        document.addEventListener('keydown',( event ) => { this.KeyBoardControll(event,true)})
        document.addEventListener('keyup',( event ) => { this.KeyBoardControll(event,false)})

        // touch events
        redlibcore.globalEvent.addCallBack("touchStart", (touch) => { this.touchStart(touch) })
        redlibcore.globalEvent.addCallBack("touchDrag", (touch) => { this.touchDrag(touch) })
        redlibcore.globalEvent.addCallBack("touchEnd", () => { this.touchEnd() })

        // joy 
        this.joy = document.querySelector('#joy')
        this.big = document.querySelector('#joy .big')
        this.small = document.querySelector('#joy .small')
        this.joyConverter = new redlib.InputConverter(this.joy)

        this.position = new THREE.Vector2()
        
        // speed
        this.speed = document.querySelector('#speed')
        this.button = document.querySelector('#speed circle')
        this.speedConverter = new redlib.InputConverter(this.speed)

        this.speedTouchY = 0
        this.speedTouchYPorpos = 110
        this.speedTouchYCurent = 110


        this.isEngineOn = false
        this.isForward = true
        
        // resize in the end
        this.resize({x : window.innerWidth, y : innerHeight})
    }

    process(delta){
        this.keyboardSmothDirection(delta)

        if (this.speedAutoRender){
            if ( Math.abs(this.speedTouchYPorpos - this.speedTouchYCurent) < 0.01 ){
                this.speedAutoRender = false
                this.speedTouchYCurent = this.speedTouchYPorpos
                this.button.setAttribute('cy', this.speedTouchYPorpos)
            } else {
                this.speedTouchYCurent += (this.speedTouchYPorpos - this.speedTouchYCurent )* 0.1
                this.button.setAttribute('cy', this.speedTouchYCurent)
            }
            
        }

        if ( this.joyAutoRender ){
    
            if (Math.abs(this.position.x) + Math.abs(this.position.y) < 0.02) {
                this.joyAutoRender = false
                this.small.setAttribute('cy', 200)
                this.small.setAttribute('cx', 200)     
                this.getDirection(new THREE.Vector2())
                return           
            } 
            this.position.multiplyScalar(0.92)
            this.getDirection(this.position.clone())
            this.small.setAttribute('cy', this.position.y * 200 + 200)
            this.small.setAttribute('cx', this.position.x * 200 + 200)

        }

    }

    resize(sizes){
        if ( sizes.x > sizes.y ){

            this.joy.style.top =  sizes.y * 0.38
            this.joy.style.width =  sizes.y * 0.62
            
            this.speed.style.height = sizes.y * 0.62
            this.speed.style.top =  sizes.y * 0.38
            
        } else {
            const lorem = sizes.x * 10 / 16
            this.joy.style.top =  sizes.y - lorem
            this.joy.style.width =  lorem
            
            this.speed.style.height = lorem
            this.speed.style.top =  sizes.y - lorem

        }

        this.joyConverter.resize()
        this.speedConverter.resize()

    }
    /**
     * KeyBord
     */

    // handele keyboard events 
    KeyBoardControll(event,isDown){
        // chech wich key is presed or relese
        switch (event.code) {
            // up and dowm
            case 'KeyW' :
            case 'ArrowUp':

                this.keyBoardUpInfo.up = isDown
                break;

            case 'KeyS':
            case 'ArrowDown':

                this.keyBoardUpInfo.down = isDown
                break;

            // left and right
            case 'KeyA':
            case 'ArrowLeft':

                this.keyBoardRightInfo.left = isDown
                break;

            case 'KeyD':            
            case 'ArrowRight':

                this.keyBoardRightInfo.right = isDown
                break;

            // -----------------------------------
            case 'Space':
            case 'ShiftLeft':
                // prevent from key_up
                if ( !isDown ){return}
                
                if ( this.isEngineOn ){
                    if ( !this.isForward && event.code == "Space" ){
                        this.isForward = true
                    } else if ( this.isForward && event.code == "ShiftLeft" ){
                        this.isForward = false
                    } else {
                        this.isEngineOn = false
                    }
                } else {
                    if ( event.code == "Space" ) { 
                        this.isForward = true
                    } else {
                        this.isForward = false
                    }
                    this.isEngineOn = true
                }

                this.getSpeed(this.isEngineOn,this.isForward)
                this.speedButtonRender()
                break;
        }
        

        // handele up or down direction
        if (this.keyBoardSpeedInfo.spase && this.keyBoardSpeedInfo.shiftt ){
                this.isEngineOn = false
                this.isForward = true
        } else if ( this.keyBoardSpeedInfo.up ) {
            speed = 1
        } else if ( this.keyBoardSpeedInfo.down ) {
            speed = -0.5
        }



        // handele left or right direction
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

        // handele up or down
        if (this.keyBoardUpInfo.up && this.keyBoardUpInfo.down){   
            this.keyBoardUpInfo.y = 0
            this.keyBoardUpInfo.isActive = false

        } else if ( this.keyBoardUpInfo.up ) {
            this.keyBoardUpInfo.y = 1
            this.keyBoardUpInfo.isActive = true

        } else if ( this.keyBoardUpInfo.down ) {
            this.keyBoardUpInfo.y = -1
            this.keyBoardUpInfo.isActive = true

        } else {
            this.keyBoardUpInfo.y = 0
            this.keyBoardUpInfo.isActive = false

        }


    }

    keyboardSmothDirection(delta){
        let sendOut = false

        // left or right
        if ( this.keyBoardRightInfo.isActive ){
            if (Math.abs(this.keyboardDirection.x) < 0.55){
                this.keyboardDirection.x += Math.sign(this.keyBoardRightInfo.x) * delta * 0.002
                this.keyBoardRightInfo.isBiger = true
                sendOut = true
            }
        } else if ( this.keyBoardRightInfo.isBiger ) {
            if ( Math.abs(this.keyboardDirection.x) > 0.05 ) {
                this.keyboardDirection.x -= Math.sign(this.keyboardDirection.x) * delta * 0.004
                sendOut = true
            } else {
                this.keyBoardRightInfo.isBiger = false
            }
        }

        // up or down
        if ( this.keyBoardUpInfo.isActive ){
            if (Math.abs(this.keyboardDirection.y) < 0.55){
                this.keyboardDirection.y += Math.sign(this.keyBoardUpInfo.y) * delta * 0.002
                this.keyBoardUpInfo.isBiger = true
                sendOut = true
            }
        } else if ( this.keyBoardUpInfo.isBiger ) {
            if ( Math.abs(this.keyboardDirection.y) > 0.05 ) {
                this.keyboardDirection.y -= Math.sign(this.keyboardDirection.y) * delta * 0.004
                sendOut = true
            } else {
                this.keyBoardUpInfo.isBiger = false
            }
        }

        if ( sendOut ){
            this.getDirection(this.keyboardDirection)
        }

    }
    /**
     * Touch
     */
    touchStart(touch){
        // speed
        const speedTouch = this.speedConverter.convert(touch)
        if ( speedTouch.x < -0.75 || speedTouch.y > 0.75 ||speedTouch.y <  -0.75 ){
            this.speedAlowDrag = false
        } else {
            this.speedAlowDrag = true
            this.speedAutoRender = false
        }

        //joy
        const joyTouch = this.joyConverter.convert(touch)
        if ( joyTouch.x > 0.75 || joyTouch.y > 0.75 ||joyTouch.y <  -0.75 ){
            this.joyAlowDrag = false
        } else {
            this.joyAlowDrag = true
            this.joyAutoRender = false
        }
    }

    touchDrag(touch){
        // speed
        if (this.speedAlowDrag){
            this.speedTouchY = this.speedConverter.convert(touch).y - 0.1
            if (this.speedTouchY < -0.4) {
                this.speedTouchY = -0.4
            } else if ( this.speedTouchY > 0.2){
                this.speedTouchY = 0.2
            }
            this.speedTouchYCurent = this.speedTouchY * 100 + 110
            this.button.setAttribute('cy', this.speedTouchYCurent)
        }


        // joy
        if (this.joyAlowDrag){ 

            const joyTouch = this.joyConverter.convert(touch)
            this.position.set(joyTouch.x, joyTouch.y)
            if (this.position.distanceToSquared(new THREE.Vector2()) > 0.3){
                this.position.normalize().multiplyScalar(0.56)
            }
            this.getDirection(this.position.clone())
            // this.position.multiplyScalar(200)

            this.small.setAttribute('cy', this.position.y * 200 + 200)
            this.small.setAttribute('cx', this.position.x * 200 + 200)
        }
    }

    touchEnd(){
        if ( this.speedAlowDrag ) {
            if ( this.speedTouchY < -0.2 ){
                this.isEngineOn = true
                this.isForward = true
            } else if ( this.speedTouchY > 0.1 ){
                this.isEngineOn = true
                this.isForward = false
            } else {
                this.isEngineOn = false
                this.isForward = false
            }
            this.getSpeed(this.isEngineOn, this.isForward)
            this.speedButtonRender()
        }
        this.joyAutoRender = true
        this.end()
    }

    speedButtonRender(){
        if ( this.isEngineOn ){
            if ( this.isForward ) {
                this.speedTouchYPorpos = 70
            } else {
                this.speedTouchYPorpos = 130
            }
        } else {
            this.speedTouchYPorpos = 110
        }
        this.speedAutoRender = true
    }

}