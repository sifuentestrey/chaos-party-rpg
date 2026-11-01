/** Chaos-owned regression: native hit flashes wait for actual image data. */
import {describe,it,expect,vi,afterEach} from 'vitest';
import {Sprite} from '../renderer/sprite';
afterEach(()=>vi.unstubAllGlobals());
function fixture(loaded=false){
 let ready:any;const image:any={width:loaded?2:0,height:loaded?2:0,addEventListener:vi.fn((_event,fn)=>ready=fn)};
 const data=new Uint8ClampedArray([4,8,12,170]),ctx={drawImage:vi.fn(),getImageData:vi.fn(()=>Object.freeze({data})),putImageData:vi.fn()},canvas:any={getContext:()=>ctx};
 const create=vi.fn(()=>canvas);vi.stubGlobal('document',{createElement:create});const sprite:any=Object.create(Sprite.prototype);Object.assign(sprite,{image,name:'clotharmor',width:32,height:32,offsetX:0,offsetY:0,chaosHurtPending:false});
 return {sprite,image,ctx,canvas,create,data,loaded:()=>{image.width=2;image.height=2;ready();}};
}
describe('native hurt sprite readiness',()=>{
 it('defers a zero-sized image, registers once, then builds the native flash when it loads',()=>{const f=fixture();f.sprite.createHurtSprite();f.sprite.createHurtSprite();expect(f.create).not.toHaveBeenCalled();expect(f.image.addEventListener).toHaveBeenCalledTimes(1);f.loaded();expect(f.ctx.getImageData).toHaveBeenCalledWith(0,0,2,2);expect(f.sprite.whiteSprite.image).toBe(f.canvas);expect([...f.data]).toEqual([255,75,75,170]);});
 it('builds the native silhouette without assigning to read-only ImageData.data',()=>{const f=fixture(true);expect(()=>f.sprite.createSilhouette()).not.toThrow();expect(f.sprite.silhouetteSprite.image).toBe(f.canvas);});
 it('retains immediate native behavior for an already loaded sprite',()=>{const f=fixture(true);f.sprite.createHurtSprite();expect(f.image.addEventListener).not.toHaveBeenCalled();expect(f.ctx.putImageData).toHaveBeenCalledTimes(1);expect(f.sprite.whiteSprite.isLoaded).toBe(true);});
});
