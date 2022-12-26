export default class Clock
{
    constructor(redlibcore){

        const clock = Date.now()

        redlibcore.globalEvent.addCallBack('process', (delta) => { clock += delta })

        this.setClock = (clockValue) => { clock = clockValue }
        this.getClock = () => { return clock }
    }
}