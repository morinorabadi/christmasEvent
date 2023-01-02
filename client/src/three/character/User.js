import * as THREE from 'three'

export default class UserCharacter
{
  constructor(redlibcore, characterModel,collisionShapes, getClock ){
    this.group = new THREE.Group()
    

    this.isActive = false

    // character
    const character = characterModel
    this.group.add(character)

    const reaCaster = new THREE.Raycaster()

    // camera
    const cameraGroup = new THREE.Group()
    const cameraGroup1 = new THREE.Group()
    cameraGroup1.position.y = 5

    const canvasHtml = document.getElementById('scene')
    const boundingClientRect = canvasHtml.getBoundingClientRect()

    this.camera = new THREE.PerspectiveCamera( 65, boundingClientRect.width / boundingClientRect.height, 0.1, 1000 );
    this.camera.position.set(0,15,10)
    this.camera.lookAt(new THREE.Vector3(0,5,0))
    cameraGroup.add(this.camera)
    cameraGroup1.add(cameraGroup)
    // adding resize event dor resize camera
    redlibcore.globalEvent.addCallBack('resize', (sizes) => { 

        this.camera.aspect = sizes.x / sizes.y
        this.camera.updateProjectionMatrix();

    })
    this.group.add(cameraGroup1)

    // online
    this.getClock = getClock
    this.playerGameId = null
    this.sendData = null
    
    
    // direction
    let getDirection = false
    let direction = new THREE.Vector2()

    // client end sending input
    this.getDirection = (_direction) => {
        getDirection = true
        direction = _direction.normalize()
    }

    // client end sending input
    this.end = () => {
        getDirection = false
    }


    const cameraTopLimit = 0.7
    const cameraDownLimit = -0.2
    this.getCameraDirection = (direction) => {
        cameraGroup1.rotation.y += direction.x
        cameraGroup.rotation.x += direction.y

        if (cameraGroup.rotation.x > cameraTopLimit ){
            cameraGroup.rotation.x = cameraTopLimit
        } else if (cameraGroup.rotation.x < cameraDownLimit ){
            cameraGroup.rotation.x = cameraDownLimit
        }
    }


    // speed
    const maxSpeed = 0.4
    const deltaSpeed = 0.002
    let currentSpeed = 0
    let hadSpeed = false

    // add global events
    redlibcore.globalEvent.addCallBack("process", (delta) => {

        // change current speed base on client input
        if ( getDirection ){
            // increase speed
            if (currentSpeed < maxSpeed){
                currentSpeed += delta * deltaSpeed
                character.walk()
            } else {
                currentSpeed = maxSpeed
            }
            hadSpeed = true

        } else if ( hadSpeed ) {

            // if we had speed decrees in 
            currentSpeed -= delta * deltaSpeed
            if ( currentSpeed < 0 ){
                currentSpeed = 0
                hadSpeed = false
                character.idle()
            }
        }

        // actual character movement
        if ( hadSpeed ){


            const currentDirection = direction.clone()

            // rotate character
            character.rotation.y = - direction.angle()  +  Math.PI / 2 +  cameraGroup1.rotation.y

            currentDirection.rotateAround(new THREE.Vector2(0,0),-cameraGroup1.rotation.y)

            reaCaster.set(this.group.position, new THREE.Vector3(
                currentDirection.x,
                0,
                currentDirection.y,
            ))

            let isIntersect = false
            const result = reaCaster.intersectObjects(collisionShapes)
            if (result.length > 0){
                if (result[0].distance < 3){
                    currentDirection.multiplyScalar(0)
                    isIntersect = true
                }
            }
            if (!isIntersect){
                currentDirection.multiplyScalar(currentSpeed)
            }


            // move character group
            this.group.position.x += currentDirection.x
            this.group.position.z += currentDirection.y
        }


        // send out user position for other player
        if (this.playerGameId){
            this.sendData({ 
                px : this.group.position.x,
                pz : this.group.position.z,
                ry : character.rotation.y,
                t  : this.getClock() ,
                i : this.playerGameId
            })
        }

    })
  }
  active(props){
    //! we need to update start position
    this.playerGameId = props.gameId
    this.sendData = props.sendData
    this.isActive = true
  }
  deActive(){
    this.isActive = false
    this.playerGameId = null
    this.sendData = null
  }
}