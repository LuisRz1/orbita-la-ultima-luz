import type { Localized, POI } from '../core/contract/grid-v1.ts';
import type { LevelPoint, Prop, Vec2, Zone } from '../core/contract/level-v2.ts';
export { t } from '../core/orbit/engineering.ts';

export const at=(x:number,z:number):Vec2=>({x,z});
export function zone(id:string,title:Localized,x:number,z:number,radius:number,drain?:number):Zone{
  return {id,title,center:at(x,z),radius,drain};
}
export function point(id:string,sector:string,x:number,z:number,action:POI['action'],title:Localized,result:Localized,
  prerequisites:string[]=[],power=0,required=true):LevelPoint{
  return {id,position:at(x,z),zone:sector,radius:3,action,title,hint:title,result,prop:'console',power,prerequisites,required};
}
export const smooth=(a:number,b:number,x:number)=>{
  const u=Math.max(0,Math.min(1,(x-a)/(b-a)));
  return u*u*(3-2*u);
};
export const mound=(x:number,z:number,cx:number,cz:number,r:number,height:number)=>
  height*(1-smooth(r*.15,r,Math.hypot(x-cx,z-cz)));
export function scenery(height:(x:number,z:number)=>number) {
  return (kind:Prop['kind'],x:number,z:number,wide:number,deep:number,rise:number):Prop=>({
    kind,solid:kind==='mast'||kind==='pillar'||kind==='boulder'||kind==='rock'||kind==='marker'||kind==='crew'
      ?{kind:'cylinder',x,z,r:wide,top:height(x,z)+rise}
      :{kind:'box',x,z,hx:wide,hz:deep,top:height(x,z)+rise},
  });
}
