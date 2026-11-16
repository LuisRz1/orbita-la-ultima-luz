import type { LevelV2, SurfaceArea, SurfaceMarking } from '../../core/contract/level-v2.ts';
import { at, mound, scenery, smooth } from '../expedition-shapes.ts';

function rectangle(x:number,z:number,width:number,depth:number):SurfaceArea {
  return {min:at(x-width/2,z-depth/2),max:at(x+width/2,z+depth/2)};
}

const aprons=[
  rectangle(5,45,21,62), rectangle(-18,31,25,18), rectangle(29,33,17,21),
  rectangle(-5,14,99,12), rectangle(35,-22,14,82), rectangle(37,-38,30,26),
  rectangle(-47,-18,10,70), rectangle(-39,1,23,18), rectangle(-55,-48,22,17),
];

function portHeight(x:number,z:number) {
  let distance=Infinity;
  for(const {min,max} of aprons)distance=Math.min(distance,Math.max(min.x-x,x-max.x,min.z-z,z-max.z));
  const field=mound(x,z,-76,-51,70,14)+mound(x,z,69,42,54,9)+mound(x,z,70,-70,65,14);
  const heading=Math.atan2(z,x);
  const hills=15+5*Math.cos(heading*3-.8)+3*Math.sin(heading*7+.4);
  return field*smooth(0,15,distance)+.105*Math.cos(x/9)*Math.sin(z/13)
    +hills*smooth(102,139,Math.hypot(x,z));
}

const paint=(color:string,x:number,z:number,width:number,depth:number):SurfaceMarking=>({
  ...rectangle(x,z,width,depth),color,
});
const white='#e8e5d9', amber='#e0b555';

export const earthTerrain:LevelV2['terrain']={
  size:288,res:161,height:portHeight,aprons,
  markings:[
    paint(white,-4.6,50,.21,48),paint(white,14.6,50,.21,48),
    ...Array.from({length:7},(_,i)=>paint(white,-1+i*1.85,31.3,1.03,3.2)),
    ...[-17,1,18,34].map(z=>paint(amber,35,z,.35,5)),
    paint(white,29,-21,.23,68),paint(white,41,-21,.23,68),
    ...[-39,-29,-18,-8,5,15,26,36].map(x=>paint(amber,x,14,3.5,.26)),
    ...[24,27,30,33].map(x=>paint(white,x,39,.2,5.6)),
  ],
};

export const earthProp=scenery(portHeight);

export const earthPortProps=[
  earthProp('earth-control',-16,28,8.7,5.3,5.5),
  earthProp('earth-hangar',29,26,8.3,5.2,6.1),earthProp('earth-hangar',-42,1,8.5,6.4,6.4),
  earthProp('earth-rocket',35,-41,2.15,2.15,25.8),earthProp('earth-tower',42,-42,2.5,2.7,23),
  earthProp('earth-dish',-58,-53,3.5,3.5,7.8),
  earthProp('earth-van',12.5,49,1.12,2.4,1.95),earthProp('earth-van',-28,18,1.1,2.35,1.9),
  earthProp('earth-terminal',3.2,33.1,.51,.42,1.24),earthProp('earth-terminal',-52.5,-48,.5,.42,1.24),
  earthProp('earth-bench',-2.3,43,1.3,.42,1.04),earthProp('earth-bench',-53,-57,1.12,.42,1.04),
  ...[62,46,28,15].flatMap(z=>[-5.35,15.35].map(x=>earthProp('earth-lamp',x,z,.15,.15,4.4))),
  earthProp('earth-lamp',31,-19,.15,.15,5.5),earthProp('earth-lamp',-42,-13,.15,.15,5.5),
  earthProp('earth-fence',46,-33,.12,10,1.76),earthProp('earth-fence',24,-36,.12,7.4,1.76),
  earthProp('earth-fence',-43,-8,7.3,.12,1.65),earthProp('earth-fence',2,76,5.5,.12,1.42),
  ...[
    [-10,56],[-15,61],[-18,51],[-27,44],[-33,49],[-35,60],[-53,51],[-44,64],[-50,20],
    [20,59],[25,51],[31,57],[38,52],[41,43],[52,45],[57,53],[52,27],[59,19],[60,-9],
    [-67,13],[-71,-6],[-74,-22],[-68,-45],[-80,-48],[-75,-61],[-58,-70],[-41,-78],
    [-25,-60],[-20,-71],[-9,-83],[16,-72],[52,-68],[58,-56],[65,-42],[71,-31],
  ].map(([x,z],i)=>earthProp('earth-tree',x,z,.38,.38,3.8+i%5*.51)),
];
