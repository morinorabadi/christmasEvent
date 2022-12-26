import Vector2 from "./Vector2";

export default class Sizes
{
    constructor(_events){
        this.sizes = new Vector2(window.innerWidth,window.innerHeight);
        this.events = _events

        this.events.addEvent("resize")
        
        window.addEventListener("resize",()=> {
            this.resize()
        })
    }
    resize(){
        this.sizes.set(window.innerWidth,window.innerHeight)
        this.events.callEvent("resize", this.sizes)
    }
    // always x is biger than y
    orderedSize(){
        if (this.sizes.x > this.sizes.y){
            return this.sizes
        } else {
            return new Vector2(this.sizes.y , this.sizes.x)
        }
    }
}