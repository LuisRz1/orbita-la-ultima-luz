// Character and prop models built from primitives with toon materials and ink outlines.
// Everything is generated in code: no external models, licences or downloads.
import {
  BoxGeometry, CapsuleGeometry, CircleGeometry, CylinderGeometry, DodecahedronGeometry, Group, InstancedMesh, Matrix4,
  Mesh, MeshBasicMaterial, OctahedronGeometry, SphereGeometry, TorusGeometry, Vector3, type BufferGeometry, type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import type { Prop } from '../core/contract/level-v2.ts';
import type { SuitDesign } from '../core/suit.ts';
import type { POI } from '../core/contract/grid-v1.ts';
import { foilTexture, glyphTexture, hullTexture, outlineMaterial, stripeTexture, toon, toonMapped, visorTexture } from './style.ts';

/** Suit colour blocking for the Nácar biome. */
export const suitColors = {
  shell: '#f4efe6', bellows: '#c8d4ea', frame: '#3b3358', coral: '#ff7a5c', boot: '#e9e2f2', pack: '#e9e2d4',
  pelvis: '#e2dcef', cyan: '#7fe3e0', amber: '#ffaf68',
};

export const colors = {
  suit: '#ece8de', suitShade: '#c9c3b4', accent: '#ff9d4d', visor: '#1f3f52', visorGlow: '#2a6f86', dark: '#3a404c',
  foil: '#f2c14e', hull: '#e4e0d4', rock: '#c7bcdc', rockDark: '#7f71a6', screen: '#7fe3e0', luma: '#ffb05c', lumaCore: '#fff2c4',
};

/** A mesh with an ink outline that shares its geometry. */
export function part(geo: BufferGeometry, mat: Material, outline = 0.03) {
  const mesh = new Mesh(geo, mat);
  if (outline > 0) mesh.add(new Mesh(geo, outlineMaterial(outline)));
  return mesh;
}

type Motion = {speed:number;grounded:boolean;vertical:number;turn:number;boosting:boolean;tethered:boolean};
export type Astronaut = {
  group: Group;
  animate(dt:number,motion:Motion):void;
  act(action:POI['action']):void;
  resetMotion():void;
  /** Shows the chosen equipment on the suit: antenna length, thruster nozzles, instruments. */
  setLoadout(d: SuitDesign): void;
  /** Battery gauge on the backpack: fraction of capacity and whether only the reserve is left. */
  setBattery(fraction: number, reserveOnly: boolean): void;
};

/** "Rounded explorer" suit: bubble helmet, broad shoulders and boots, coral commander stripes. Height ≈ 1.80 m. */
export function buildAstronaut(): Astronaut {
  const group = new Group();
  const shell = toon(suitColors.shell), lilac = toon(suitColors.bellows), dark = toon(suitColors.frame), coral = toon(suitColors.coral);
  const boots = toon(suitColors.boot), sole = toon(suitColors.frame), pack = toon(suitColors.pack), pelvis = toon(suitColors.pelvis);
  const rig = new Group();
  rig.name='astronaut rig';
  group.add(rig);
  const torsoPivot=new Group(),upperBody=new Group();
  torsoPivot.name='torso';
  torsoPivot.position.y=.94;
  upperBody.position.y=-.94;
  torsoPivot.add(upperBody);rig.add(torsoPivot);

  // Legs: hip pivot → upper leg → knee pivot (bellows) → lower leg → boot.
  const legs = [-1, 1].map(side => {
    const hip = new Group();
    hip.name=side<0?'left hip':'right hip';
    hip.position.set(side * 0.12, 0.84, 0);
    const upper = part(new CapsuleGeometry(0.11, 0.2, 4, 12), shell, 0.022);
    upper.position.y = -0.17;
    const knee = new Group();
    knee.name=side<0?'left knee':'right knee';
    knee.position.y = -0.34;
    const bellows = part(new TorusGeometry(0.1, 0.025, 6, 16), lilac, 0.012);
    bellows.rotation.x = Math.PI / 2;
    const lower = part(new CapsuleGeometry(0.095, 0.2, 4, 12), shell, 0.022);
    lower.position.y = -0.17;
    const ankle=new Group();
    ankle.position.set(0,-.43,-.04);
    const boot = part(new RoundedBoxGeometry(0.22, 0.14, 0.34, 3, 0.05), boots, 0.02);
    const soleMesh = new Mesh(new RoundedBoxGeometry(0.23, 0.04, 0.35, 2, 0.015), sole);
    soleMesh.position.y=-.06;
    ankle.add(boot,soleMesh);knee.add(bellows,lower,ankle);
    hip.add(upper, knee);
    if (side < 0) { const stripe = part(new CylinderGeometry(0.115, 0.115, 0.06, 14), coral, 0.01); stripe.position.y = -0.12; hip.add(stripe); }
    rig.add(hip);
    return { hip, knee, ankle };
  });
  // Arms: shoulder pivot → upper arm → elbow bellows → forearm → glove with coral cuff.
  const arms = [-1, 1].map(side => {
    const shoulder = new Group();
    shoulder.position.set(side * 0.33, 1.34, 0);
    shoulder.rotation.z = side * 0.14;
    const upper = part(new CapsuleGeometry(0.085, 0.15, 4, 12), shell, 0.02);
    upper.position.y = -0.16;
    const forearm=new Group();
    forearm.name=side<0?'left elbow':'right elbow';
    forearm.position.y=-.29;
    const elbow = part(new TorusGeometry(0.085, 0.022, 6, 14), lilac, 0.01);
    elbow.rotation.x = Math.PI / 2;
    const fore = part(new CapsuleGeometry(0.08, 0.13, 4, 12), shell, 0.02);
    fore.position.y = -0.13;
    const cuff = part(new CylinderGeometry(0.09, 0.09, 0.05, 14), coral, 0.01);
    cuff.position.y = -0.23;
    const glove = part(new SphereGeometry(0.09, 14, 10), lilac, 0.02);
    glove.position.y = -0.31; glove.scale.set(1, 1.1, 0.9);
    forearm.add(elbow,fore,cuff,glove);
    shoulder.add(upper,forearm);
    if (side < 0) { const stripe = part(new CylinderGeometry(0.09, 0.09, 0.05, 14), coral, 0.01); stripe.position.y = -0.1; shoulder.add(stripe); }
    upperBody.add(shoulder);
    return {shoulder,forearm};
  });

  const hips = part(new RoundedBoxGeometry(0.42, 0.18, 0.3, 3, 0.07), pelvis, 0.02);
  hips.position.y = 0.9;
  const torso = part(new SphereGeometry(0.3, 20, 16), shell);
  torso.position.y = 1.17; torso.scale.set(1, 1.05, 0.82);
  const shoulders = [-1, 1].map(side => {
    const ball = part(new SphereGeometry(0.12, 14, 10), shell, 0.02);
    ball.position.set(side * 0.31, 1.36, 0);
    const ring = part(new TorusGeometry(0.11, 0.022, 6, 16), lilac, 0.01);
    ring.position.set(side * 0.3, 1.3, 0); ring.rotation.set(Math.PI / 2, 0, side * 0.5);
    return [ball, ring];
  }).flat();
  // Round chest module: two knobs and one steady cyan light.
  const chest = part(new CylinderGeometry(0.09, 0.09, 0.05, 18), lilac, 0.015);
  chest.rotation.x = Math.PI / 2; chest.position.set(0, 1.2, -0.25);
  const knobs = [-0.04, 0.04].map(x => { const k = new Mesh(new CylinderGeometry(0.018, 0.018, 0.03, 10), dark); k.rotation.x = Math.PI / 2; k.position.set(x, 1.18, -0.28); return k; });
  const chestLight = new Mesh(new SphereGeometry(0.016, 8, 6), new MeshBasicMaterial({ color: suitColors.cyan }));
  chestLight.position.set(0, 1.23, -0.285);

  const backpack = part(new RoundedBoxGeometry(0.5, 0.62, 0.24, 3, 0.06), pack);
  backpack.position.set(0, 1.2, 0.27);
  const frame = part(new RoundedBoxGeometry(0.52, 0.06, 0.26, 2, 0.02), dark, 0.012);
  frame.position.set(0, 1.5, 0.27);
  // Battery gauge facing the camera behind the player.
  const cells = Array.from({ length: 5 }, (_, i) => {
    const cell = new Mesh(new BoxGeometry(0.07, 0.06, 0.02), new MeshBasicMaterial({ color: suitColors.cyan }));
    cell.position.set(0, 1.04 + i * 0.075, 0.4);
    return cell;
  });
  const gaugeFrame = new Mesh(new BoxGeometry(0.11, 0.42, 0.015), dark);
  gaugeFrame.position.set(0, 1.19, 0.392);

  const neck = part(new TorusGeometry(0.17, 0.04, 8, 22), dark, 0.012);
  neck.rotation.x = Math.PI / 2; neck.position.y = 1.44;
  const helmet = part(new SphereGeometry(0.25, 24, 18), shell);
  helmet.position.y = 1.58;
  // Front of a three.js sphere is phi = 1.5π; the visor segment is centred there and sits proud of the shell.
  const visor = new Mesh(new SphereGeometry(0.258, 26, 16, Math.PI * 1.1, Math.PI * 0.8, Math.PI * 0.22, Math.PI * 0.42),
    new MeshBasicMaterial({ map: visorTexture() }));
  visor.position.set(0, 1.58, -0.012);
  visor.add(new Mesh(visor.geometry, outlineMaterial(0.012)));
  const helmetPivot=new Group();
  helmetPivot.position.y=1.44;
  helmet.position.y-=helmetPivot.position.y;
  visor.position.y-=helmetPivot.position.y;
  helmetPivot.add(helmet,visor);

  // Equipment slots, filled by setLoadout.
  const antenna = new Group();
  antenna.position.set(-0.18, 1.53, 0.33);
  const nozzles = new Group();
  nozzles.position.set(0, 0.86, 0.3);
  const camera = new Group();
  camera.position.set(-0.15, 1.3, -0.24);
  const drill = new Group();
  drill.position.set(0.14, -0.15, 0);
  legs[1].hip.add(drill);
  const kit = new Group();
  kit.position.set(-0.14, -0.2, 0);
  legs[0].hip.add(kit);
  rig.add(hips);
  upperBody.add(torso, ...shoulders, chest, ...knobs, chestLight, backpack, frame, gaugeFrame, ...cells, neck, helmetPivot, antenna, nozzles, camera);

  const clear = (g: Group) => { for (const c of [...g.children]) g.remove(c); };
  let phase=0,breath=0,pace=0,popT=1,gesture=0,landing=0,drop=0;
  let onGround=true,action:POI['action']='service';
  const popping: Group[] = [];
  const approach=(value:number,goal:number,weight:number)=>value+(goal-value)*weight;
  return {
    group,
    act(next){action=next;gesture=1;},
    resetMotion(){phase=0;pace=0;gesture=0;landing=0;drop=0;onGround=true;},
    setLoadout(d) {
      clear(antenna); clear(nozzles); clear(camera); clear(drill); clear(kit);
      const len = { short: 0.25, medium: 0.45, long: 0.7 }[d.antenna];
      const whip = part(new CylinderGeometry(0.01, 0.014, len, 6), dark, 0.008);
      whip.position.y = len / 2;
      antenna.add(whip);
      if (d.antenna === 'long') { const dish = part(new SphereGeometry(0.08, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2.5), lilac, 0.01); dish.position.y = len; dish.rotation.x = -0.9; antenna.add(dish); }
      const n = { none: 0, compact: 2, strong: 4 }[d.thruster];
      for (let i = 0; i < n; i++) {
        const x = n === 2 ? (i ? 0.12 : -0.12) : -0.18 + i * 0.12;
        const nozzle = part(new CylinderGeometry(0.035, 0.05, 0.09, 10), dark, 0.01);
        nozzle.position.set(x, 0, 0);
        nozzles.add(nozzle);
      }
      if (d.instruments.includes('camera')) {
        const body = part(new RoundedBoxGeometry(0.1, 0.07, 0.06, 2, 0.015), dark, 0.01);
        const lens = new Mesh(new CircleGeometry(0.022, 12), new MeshBasicMaterial({ color: suitColors.cyan }));
        lens.position.z = -0.032; lens.rotation.y = Math.PI;
        camera.add(body, lens);
      }
      if (d.instruments.includes('drill')) { const holster = part(new RoundedBoxGeometry(0.07, 0.2, 0.08, 2, 0.02), dark, 0.01); drill.add(holster); }
      if (d.instruments.includes('kit')) { const pouch = part(new RoundedBoxGeometry(0.09, 0.11, 0.08, 2, 0.025), toon(suitColors.amber), 0.01); kit.add(pouch); }
      popping.splice(0, popping.length, antenna, nozzles, camera, drill, kit);
      popT = 0;
    },
    setBattery(fraction, reserveOnly) {
      const color = reserveOnly ? suitColors.coral : fraction < 0.3 ? suitColors.amber : suitColors.cyan;
      cells.forEach((cell, i) => {
        const on = fraction > i / 5 + 0.02;
        (cell.material as MeshBasicMaterial).color.set(on ? color : '#2b2540');
      });
    },
    animate(dt,{speed,grounded,vertical,turn,boosting,tethered}) {
      const k=1-Math.exp(-dt*13);
      pace=approach(pace,Math.min(1,speed/5.4),k);
      breath+=dt*2.3;
      if(grounded)phase+=dt*(3.2+speed*1.25);
      if(!grounded)drop=Math.max(drop,-vertical);
      else if(!onGround){landing=Math.max(.45,Math.min(1,drop/6));drop=0;}
      onGround=grounded;
      const absorb=landing;
      landing*=Math.exp(-dt*9);
      const reach=Math.sin(gesture*Math.PI)*Math.max(.18,1-pace);
      gesture=Math.max(0,gesture-dt*1.4);
      const counter=Math.sin(phase)*pace;
      const footwork=pace*(tethered?.60:1);
      const thrust=Number(boosting),ascent=Math.max(0,Math.min(1,vertical/4));
      legs.forEach(({hip,knee,ankle},i)=>{
        const cycle=phase+i*Math.PI, swing=Math.sin(cycle), recovery=Math.max(0,Math.cos(cycle));
        const stride=swing*.76*footwork+recovery*.17*footwork;
        const air=(i===0?.28:-.12)+ascent*(i===0?.49:.21)-thrust*(i===0?.25:.58);
        hip.rotation.x=approach(hip.rotation.x,(grounded?stride:air)+absorb*.32,k);
        hip.rotation.z=approach(hip.rotation.z,(i===0?1:-1)*(.024+.075*thrust+.046*absorb),k);
        knee.rotation.x=approach(knee.rotation.x,grounded?-.87*recovery*footwork-.53*absorb:-.27-.66*ascent-.27*thrust,k);
        ankle.rotation.x=approach(ankle.rotation.x,grounded?-stride*.42+.39*recovery*footwork+.2*absorb:.21,k);
      });
      arms.forEach(({shoulder,forearm},i)=>{
        const side=i===0?-1:1, stroke=side*counter;
        const lead=i===1?reach:reach*(action==='salvage'?.80:.19);
        const armSwing=grounded?stroke*.54+absorb*.3:.57+ascent*.42+i*.13;
        shoulder.rotation.x=approach(shoulder.rotation.x,armSwing-.91*thrust+lead*(action==='scan'?1.15:1.45),k);
        shoulder.rotation.z=approach(shoulder.rotation.z,side*(.13+.11*pace+(grounded?0:.23)-lead*.10),k);
        forearm.rotation.x=approach(forearm.rotation.x,.14+Math.max(0,stroke)*.59+ascent*.24+lead*(action==='scan'?1.09:.61),k);
      });
      const sway=Math.cos(phase)*footwork;
      rig.position.y=approach(rig.position.y,grounded?Math.cos(phase*2)*.043*footwork-.024*footwork-.12*absorb:0,k);
      rig.position.x=approach(rig.position.x,sway*.023,k);
      torsoPivot.rotation.x=approach(torsoPivot.rotation.x,-pace*.14-thrust*.32-absorb*.24-reach*.12+Math.sin(breath)*.018,k);
      torsoPivot.rotation.z=approach(torsoPivot.rotation.z,-turn*.16+sway*.06,k);
      torsoPivot.rotation.y=approach(torsoPivot.rotation.y,counter*.21-turn*.22+reach*.12,k);
      helmetPivot.rotation.y=approach(helmetPivot.rotation.y,turn*.32-counter*.09,k);
      helmetPivot.rotation.x=approach(helmetPivot.rotation.x,.04*Math.cos(phase*2)*footwork-.14*ascent+.19*reach,k);
      antenna.rotation.x=approach(antenna.rotation.x,pace*.3+thrust*.28-vertical*.04,k*.54);
      // New equipment pops in: scale 0 → 1.15 → 1 over 0.25 s.
      if (popT < 1) {
        popT = Math.min(1, popT + dt / 0.25);
        const sc = popT < 0.7 ? (popT / 0.7) * 1.15 : 1.15 - (popT - 0.7) / 0.3 * 0.15;
        for (const g of popping) g.scale.setScalar(sc);
      }
    },
  };
}

export type Luma = { group: Group; animate(t: number, still: boolean, vitality?:number): void };
const stellarColors=[
  {fur:'#ffe3a0',core:'#fff1cb',shadow:'#795335',tempo:1},
  {fur:colors.luma,core:colors.lumaCore,shadow:'#4a2208',tempo:.86},
  {fur:'#ed6054',core:'#ff9b7e',shadow:'#632b37',tempo:.68},
  {fur:'#bdd7f4',core:'#d9ebff',shadow:'#334573',tempo:.49},
];

/** LUMA: compact, cubic alien creature with a warm core and a translator band. */
export function buildLuma(chapter=2): Luma {
  const group = new Group();
  const tint=stellarColors[chapter-1];
  const fur = toon(tint.fur, tint.shadow);
  const body = part(new RoundedBoxGeometry(0.36, 0.34, 0.36, 3, 0.07), fur, 0.025);
  const glyphs = glyphTexture();
  glyphs.repeat.set(2, 1);
  const band = new Mesh(new RoundedBoxGeometry(0.375, 0.06, 0.375, 2, 0.02), new MeshBasicMaterial({ map: glyphs }));
  band.position.y = -0.08;
  const eyes = [-0.075, 0.075].map(x => { const e = new Mesh(new BoxGeometry(0.05, 0.09, 0.02), toon('#1b1530')); e.position.set(x, 0.045, -0.182); return e; });
  const shine = [-0.075, 0.075].map(x => { const e = new Mesh(new BoxGeometry(0.016, 0.022, 0.01), new MeshBasicMaterial({ color: '#ffffff' })); e.position.set(x - 0.01, 0.065, -0.19); return e; });
  const cheeks = [-0.13, 0.13].map(x => { const c = new Mesh(new CircleGeometry(0.025, 10), new MeshBasicMaterial({ color: '#ff8a5c', transparent: true, opacity: 0.7 })); c.position.set(x, -0.005, -0.182); c.rotation.y = Math.PI; return c; });
  const coreGlow=toon(tint.core,tint.core);
  const core = new Mesh(new OctahedronGeometry(0.05),coreGlow);
  core.position.set(0, -0.08, -0.2);
  const ears = [-1, 1].map(side => {
    const e = part(new RoundedBoxGeometry(0.06, 0.156, 0.06, 2, 0.02), fur, 0.018); e.position.set(side * 0.13, 0.23, 0); e.rotation.z = -side * 0.35;
    const tip = new Mesh(new RoundedBoxGeometry(0.062, 0.05, 0.062, 2, 0.02), toon('#ff9ec7')); tip.position.y = 0.06; e.add(tip);
    return e;
  });
  const paws=[-1,1].flatMap(x=>[-1,1].map(z=>{
    const paw=part(new RoundedBoxGeometry(.09,.11,.1,2,.025),fur,.012);
    paw.position.set(x*.114,-.176,z*.106);
    return paw;
  }));
  const motes = new Group();
  for (let i = 0; i < 4; i++) { const m = new Mesh(new OctahedronGeometry(0.018), new MeshBasicMaterial({ color: tint.core })); motes.add(m); }
  group.add(body, band, core, motes, ...eyes, ...shine, ...cheeks, ...ears,...paws);
  return {
    group,
    animate(t, still,vitality=1) {
      t*=tint.tempo;
      body.scale.y = 1 + Math.sin(t * 3) * 0.03*vitality;
      core.scale.setScalar(.45+.55*vitality+Math.sin(t*4.5)*.18*vitality);
      coreGlow.emissiveIntensity=vitality;
      motes.scale.setScalar(vitality);
      motes.visible=vitality>.25;
      ears.forEach((e, i) => { e.rotation.x = Math.sin(t * 2 + i) * (still ? 0.25 : 0.08)*vitality; });
      paws.forEach((paw,i)=>{
        const swing=still?0:Math.sin(t*8+(i===0||i===3?0:Math.PI));
        paw.rotation.x=swing*.28*vitality;
        paw.position.y=-.176+Math.max(0,swing)*.035*vitality;
      });
      // Blink every few seconds.
      const blink = vitality<.08||(t%3.7)<.12;
      eyes.forEach(e => { e.scale.y = blink ? 0.15 : 1; });
      shine.forEach(e => { e.visible = !blink; });
      glyphs.offset.x = (t * 0.08) % 1;
      motes.children.forEach((m, i) => {
        const a = t * (0.8 + i * 0.25) + i * 1.6;
        m.position.set(Math.cos(a) * 0.32, 0.05 + Math.sin(a * 1.3) * 0.12, Math.sin(a) * 0.32);
      });
    },
  };
}

/** Visible model for a level prop, sized to its collision solid and placed at ground height `base`. */
export function buildProp(prop: Prop, base: number): Group {
  const { kind, solid } = prop;
  const g = new Group();
  g.position.set(solid.x, base, solid.z);
  const h = solid.top - base;
  const hull = toon(colors.hull), dark = toon(colors.dark), rock = toon(colors.rock), rockDark = toon(colors.rockDark);
  const add = (m: Mesh, x: number, y: number, z: number) => { m.position.set(x, y, z); g.add(m); return m; };

  if(kind==='crew'){
    const person=buildAstronaut().group;
    person.rotation.y=Math.atan2(solid.x,solid.z)+Math.PI;
    g.add(person);
  } else if(kind==='gate'&&solid.kind==='box'){
    add(part(new BoxGeometry(solid.hx*2,h,solid.hz*2),hull),0,h/2,0);
    const hazard=toon(colors.accent);
    for(let x=-solid.hx+1;x<solid.hx;x+=1.5) add(new Mesh(new BoxGeometry(.32,h*.93,.035),hazard),x,h/2,solid.hz+.03);
  } else if(kind==='recovery-capsule'&&solid.kind==='box'){
    const shell=add(part(new CapsuleGeometry(h*.36,solid.hx*1.08,4,14),toonMapped(hullTexture('AURORA / RC-04'))),
      0,h*.43,0);
    shell.rotation.z=Math.PI/2; shell.scale.x=solid.hz/(h*.65);
    const seal=add(part(new TorusGeometry(h*.34,h*.061,8,18),dark,.014),-solid.hx*.86,h*.46,0);
    seal.rotation.y=Math.PI/2;
    const hatch=add(new Mesh(new CircleGeometry(h*.325,18),new MeshBasicMaterial({color:'#223746'})),
      -solid.hx*.90,h*.46,0);
    hatch.rotation.y=-Math.PI/2;
    add(new Mesh(new BoxGeometry(.17,.08,.32),new MeshBasicMaterial({color:'#ffd29b'})),-solid.hx*.84,h*.84,0);
  } else if(kind==='animal-berth'&&solid.kind==='box'){
    const baseH=Math.min(.22,h*.66);
    add(part(new RoundedBoxGeometry(solid.hx*2,baseH,solid.hz*2,3,.05),dark,.014),0,baseH/2,0);
    add(part(new RoundedBoxGeometry(solid.hx*1.84,.11,solid.hz*1.82,2,.035),toon('#c18b5e'),.015),0,baseH+.045,0);
    if(h>.5){
      add(new Mesh(new RoundedBoxGeometry(solid.hx*2,h-baseH,solid.hz*2,3,.16),
        new MeshBasicMaterial({color:'#7cb6ba',transparent:true,opacity:.18,depthWrite:false})),0,(h+baseH)/2,0);
      for(const x of [-solid.hx*.86,solid.hx*.86]){
        add(new Mesh(new BoxGeometry(.055,.07,solid.hz*1.8),new MeshBasicMaterial({color:'#ecc083'})),x,baseH+.07,0);
      }
    }
  } else if(kind==='solar-rack'&&solid.kind==='box'){
    const panelW=solid.hx*2,panelD=solid.hz*2;
    add(part(new BoxGeometry(.34,h,.46),dark,.018),0,h/2,0);
    add(part(new BoxGeometry(panelW,.14,panelD),hull,.028),0,h,0);
    const solar=new InstancedMesh(new BoxGeometry(panelW/8-.085,.026,panelD/4-.065),toon('#294f72','#0d192c'),32);
    const transform=new Matrix4();
    for(let row=0;row<4;row++)for(let col=0;col<8;col++){
      const x=-panelW/2+(col+.5)*panelW/8,z=-panelD/2+(row+.5)*panelD/4;
      solar.setMatrixAt(row*8+col,transform.makeTranslation(x,h+.09,z));
    }
    g.add(solar);
  } else if (kind === 'lander' && solid.kind === 'box') {
    add(part(new CylinderGeometry(solid.hx * 0.95, solid.hx, 2.2, 8), toonMapped(foilTexture())), 0, 1.1, 0);
    add(part(new BoxGeometry(solid.hx * 1.3, h - 2.2, solid.hz * 1.3), toonMapped(hullTexture('AURORA-2'))), 0, 2.2 + (h - 2.2) / 2, 0);
    add(part(new BoxGeometry(0.5, 0.7, 0.08), dark, 0.015), 0, 2.75, -solid.hz * 0.66);
    const dish = add(part(new SphereGeometry(0.7, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2.4), hull), 1, h + 0.25, 0.6);
    dish.rotation.set(-0.6, 0.4, 0);
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      // Strut from the hull down to a footpad outside the body, oriented along the segment.
      const top = new Vector3(sx * solid.hx * 0.72, 1.7, sz * solid.hz * 0.72);
      const foot = new Vector3(sx * (solid.hx + 0.7), 0.08, sz * (solid.hz + 0.7));
      const len = top.distanceTo(foot);
      const strut = add(part(new CylinderGeometry(0.08, 0.11, len, 8), dark, 0.018), (top.x + foot.x) / 2, (top.y + foot.y) / 2, (top.z + foot.z) / 2);
      strut.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), top.clone().sub(foot).normalize());
      add(part(new CylinderGeometry(0.4, 0.46, 0.1, 10), dark, 0.018), foot.x, 0.05, foot.z);
    }
  } else if (kind === 'mast' && solid.kind === 'cylinder') {
    add(part(new CylinderGeometry(0.12, 0.2, h, 6), dark, 0.025), 0, h / 2, 0);
    for (let y = 1.2; y < h - 0.8; y += 1.6) { const bar = add(part(new BoxGeometry(0.9, 0.06, 0.06), dark, 0.012), 0, y, 0); bar.rotation.y = y; }
    const dish = add(part(new SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.6), hull), 0, h - 0.6, 0);
    dish.rotation.x = -1.2;
    add(part(new BoxGeometry(0.6, 0.5, 0.4), hull, 0.02), 0, 0.9, 0.4);
  } else if (kind === 'shelter' && solid.kind === 'box') {
    const dome = add(part(new CylinderGeometry(solid.hx * 1.05, solid.hx * 1.05, solid.hz * 2, 14, 1, false, 0, Math.PI), toonMapped(hullTexture('HAB-1'))), 0, 0.05, 0);
    dome.rotation.set(Math.PI / 2, 0, -Math.PI / 2);
    dome.scale.set(1, 1, h / (solid.hx * 1.05));
    const stripe = add(new Mesh(new BoxGeometry(0.06, 0.3, solid.hz * 2), toon(colors.accent)), solid.hx * 1.02, 1.1, 0);
    stripe.scale.y = 1;
    add(part(new BoxGeometry(0.08, 1.4, 0.9), dark, 0.015), solid.hx * 1.02, 0.75, 0.6);
  } else if (kind === 'console' && solid.kind === 'box') {
    add(part(new BoxGeometry(solid.hx * 2, h, solid.hz * 2), toonMapped(hullTexture('UPLINK'))), 0, h / 2, 0);
    const screen = add(new Mesh(new BoxGeometry(0.05, 0.42, 1.1), toon(colors.screen, '#2a8f8c')), -solid.hx - 0.02, h * 0.72, 0);
    screen.rotation.z = 0.25;
  } else if (kind === 'cache' && solid.kind === 'box') {
    add(part(new BoxGeometry(solid.hx * 2, h, solid.hz * 2), toonMapped(stripeTexture())), 0, h / 2, 0);
    add(part(new BoxGeometry(solid.hx * 2.05, 0.12, solid.hz * 2.05), dark, 0.015), 0, h, 0);
  } else if (kind === 'pillar' && solid.kind === 'cylinder') {
    let y = 0, r = solid.r * 1.15, i = 0;
    while (y < h - 0.2) {
      const step = Math.min(h - y, r * 1.2);
      const stone = add(part(new DodecahedronGeometry(1, 0), i % 2 ? rockDark : rock, 0.04), 0, y + step / 2, 0);
      stone.scale.set(r, step * 0.62, r); stone.rotation.y = i * 1.3;
      y += step * 0.92; r *= 0.86; i++;
    }
  } else if (kind === 'marker' && solid.kind === 'cylinder') {
    add(part(new CylinderGeometry(solid.r, solid.r * 1.3, h, 8), dark, 0.015), 0, h / 2, 0);
    const lamp = add(new Mesh(new SphereGeometry(0.12, 10, 8), new MeshBasicMaterial({ color: '#ffe3a3' })), 0, h + 0.08, 0);
    lamp.userData.blink = true;
  } else if (kind === 'step' && solid.kind === 'box') {
    // A rock slab column from the rift floor; its flat top is the step.
    const slab = add(part(new BoxGeometry(solid.hx * 2, h, solid.hz * 2), rock, 0.04), 0, h / 2, 0);
    slab.rotation.y = solid.x * 0.3;
    add(part(new BoxGeometry(solid.hx * 2.1, 0.12, solid.hz * 2.1), rockDark, 0.02), 0, h - 0.06, 0);
  } else if (solid.kind === 'cylinder') {
    const stone = add(part(new DodecahedronGeometry(1, 0), kind === 'boulder' ? rock : rockDark, 0.04), 0, h * 0.42, 0);
    stone.scale.set(solid.r * 1.08, h * 0.62, solid.r * 1.02);
    stone.rotation.set(0.2, solid.x * 0.37, 0.1);
  }
  return g;
}
