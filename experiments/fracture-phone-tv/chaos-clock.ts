/** Chaos-owned simulation time. Ordinary Fracture keeps its existing wall clock. */
let defaultClock:any=null;
export function setChaosClock(clock:any):void {defaultClock=clock;}
function clockFor(context:any):any {const world=context?.getWorld?.()||context?.chaosWorld;return context?.chaosClock||(world?world.chaosClock:defaultClock);}
export function gameNow(context:any):number {return clockFor(context)?.now()??Date.now();}
export function gameTimeout(context:any,callback:()=>void,delay:number):ReturnType<typeof setTimeout>{
 if(!process.env.CHAOS_ACTOR_KEY&&!defaultClock)return setTimeout(callback,delay);
 const due=gameNow(context)+delay;
 const timer=setInterval(()=>{if(!clockFor(context)?.paused&&gameNow(context)>=due){clearInterval(timer);callback();}},25);
 timer.unref?.();return timer;
}
