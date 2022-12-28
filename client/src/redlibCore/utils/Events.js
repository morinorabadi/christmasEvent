/**
 * order in addCallBack function
 * 3 : "always to begin",
 * 2 : "push to begin",
 * 1 : "always to last",
 * 0 : "push to last",
 */

 export default class Events{
    constructor()
    {
        this.events = {}
        this.callBacks = {}
    }

    // create new event
    addEvent(eventName)
    {
        this.events[eventName] = {last: 0,begin: 0, callBackId : 0}
        this.callBacks[eventName] = []
    }

    // add functions to added events
    addCallBack(eventName,callBack,order = 0)
    {   
        this.events[eventName].callBackId++
        const id = this.events[eventName].callBackId
        
        const callBackObject = { id : id, callBack : callBack }
        if (order == 3 || order == 2){
            this.callBacks[eventName].splice(this.events[eventName].begin ,0,callBackObject);
            if (order == 3){
                this.events[eventName].begin++;
            }
        } else {
            this.callBacks[eventName].splice(this.callBacks[eventName].length - this.events[eventName].last, 0, callBackObject)
            if (order == 1){
                this.events[eventName].last++;
            }
        }
        return id
    }

    removeCallBack(eventName,id){
        console.log("debug log remove this in events class");
        console.log(this.callBacks[eventName].length);
        this.callBacks[eventName] = this.callBacks[eventName].filter( object => object.id !== id)
        console.log(this.callBacks[eventName].length);
        console.log("remove this in events class");
    }
    // call event with name and with or without parameters
    callEvent(eventName,parameters = null)
    {   
        if (parameters){
            for (let event of this.callBacks[eventName])
            {
                event.callBack(parameters)
            } 
        } else {
            for (let event of this.callBacks[eventName])
            {
                event.callBack()
            }
        }
    }
}