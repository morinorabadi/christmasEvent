import * as THREE from 'three'
export default class Characters extends THREE.Object3D
{
    constructor(redlibcore ,model ){
        super()

        this.add(model.scene)
        
        // clean up Material
        model.scene.traverse( child => { if ( child.material ) {
            child.material.metalness = 0
        }});

        // create animation mixer and animate
        const mixer = new THREE.AnimationMixer(model.scene)
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
            console.log("idle");

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
            console.log("walk");

            currentAnimationIndex = Math.floor(Math.random()*2)
            const walkAnimationObject = walkAnimation[currentAnimationIndex]
            newAnimation(animations[walkAnimationObject.index])
            return walkAnimationObject.name


        }
        
        this.idle()
    }
}

        // let animationCount = 0 
        // setInterval(() => {
        //     console.log("ok");
        //     const current = animations[animationCount]

        //     animationCount++
        //     if (animationCount > animations.length-1 ){
        //         animationCount = 0
        //     }
        //     const next = animations[animationCount]
            
        //     current.crossFadeTo(next,0.5)

        //     console.log(next._clip.name);
        //     console.log(next._clip.name);

        //     next.play()
        //     next.enabled = true
        //     next.crossFadeFrom(current,0.5)
            
        // },3000)
