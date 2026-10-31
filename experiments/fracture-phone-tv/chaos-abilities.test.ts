/** Chaos-owned native skill regression; ordinary Fracture level gates stay intact. */
import {describe,it,expect,vi} from 'vitest';
import {handleSkillUse} from '../player/skill.handler';
function player(signature?:string){const skills:any={cooldowns:{power_strike:0,phase_shift:0,war_cry:0,whirlwind:0}};const mob:any={id:2,x:11,y:10,isDead:false,clearTarget:vi.fn(),forgetPlayer:vi.fn()};const tracker={getMobsAttacking:()=>[2],clearPlayerAggro:vi.fn()};return {id:1,name:'Native class test',level:1,x:10,y:10,orientation:2,chaosControlled:!!signature,chaosSignatureSkill:signature,getSkillState:()=>skills,getWorld:()=>({getEntityById:()=>mob,forEachMob:(f:any)=>f(mob)}),getCombatTracker:()=>tracker,setPowerStrikeBuff:vi.fn(),setPhaseShift:vi.fn(),send:vi.fn(),skills,mob,tracker};}
describe('isolated class signature entitlement',()=>{
 it('keeps ordinary level-one characters locked out',()=>{const p=player();handleSkillUse(p as any,'power_strike');expect(p.setPowerStrikeBuff).not.toHaveBeenCalled();expect(p.skills.cooldowns.power_strike).toBe(0);});
 it('executes only the server-assigned signature at level one',()=>{const p=player('power_strike');handleSkillUse(p as any,'war_cry');expect(p.mob.stunUntil).toBeUndefined();handleSkillUse(p as any,'power_strike');expect(p.setPowerStrikeBuff).toHaveBeenCalledWith(true,expect.any(Number));expect(p.skills.powerStrikeActive).toBe(true);expect(p.skills.cooldowns.power_strike).toBeGreaterThan(Date.now());});
 it('native phase really clears aggro and records a two-second expiration',()=>{const p=player('phase_shift');handleSkillUse(p as any,'phase_shift');expect(p.mob.clearTarget).toHaveBeenCalled();expect(p.tracker.clearPlayerAggro).toHaveBeenCalledWith(1);expect(p.skills.phaseShiftExpires-Date.now()).toBeGreaterThan(1800);});
 it('native area stun really affects enemies in range',()=>{const p=player('war_cry');handleSkillUse(p as any,'war_cry');expect(p.mob.stunUntil-Date.now()).toBeGreaterThan(2800);});
});
