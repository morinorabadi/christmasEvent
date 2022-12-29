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
        const animations = [] 
        model.animations.forEach(animation => {
            animations.push(mixer.clipAction(animation))
        })
        
        animations[0].play()
        
        let animationCount = 0 
        setInterval(() => {
            console.log("ok");
            const current = animations[animationCount]

            animationCount++
            if (animationCount > animations.length-1 ){
                animationCount = 0
            }
            const next = animations[animationCount]
            
            current.crossFadeTo(next,0.5)

            console.log(next._clip.name);
            console.log(next._clip.name);

            next.play()
            next.enabled = true
            next.crossFadeFrom(current,0.5)
            
        },3000)

        const animationsName =  {
            idle : {
                normal : 0,
                left : 1,
                right : 2,
            },
            walk : {
                walk0 : 3,
                walk0 : 4,
            }
        }


        // update mixer
        redlibcore.globalEvent.addCallBack("process", delta => {
            mixer.update(delta)
        })
    }
}