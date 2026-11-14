import Phaser from 'phaser';
import art from '../art-manifest.json';
import { accessible, distance, inBounds, isWalkable, pointKey, route, type Point, type POI, type World } from './contract.ts';
import { approachRange } from './mission.ts';

const WIDTH=960, HEIGHT=540, HALF_X=24, HALF_Y=12;
export const artUrl = (file:string) => import.meta.env.BASE_URL+'art/'+file;
type ArtKey = keyof typeof art;
type Sprite = Phaser.GameObjects.Sprite;
type SceneHooks = { onNear: (poi:POI|null)=>void; onSelect: (id:string)=>void; onReady:()=>void;
  onUse:(id:string|undefined,at:Point,scan:boolean)=>void; onStop:(at:Point)=>void };
type SceneStatus = { active:boolean; completed:ReadonlySet<string>; focus:string|null;
  companionVisible?:boolean; available?:ReadonlySet<string> };
type SurfaceOptions = { tethered?:boolean };

export class Surface extends Phaser.Scene {
  private actor!:Sprite;
  private luma!:Sprite;
  private shadow!: Phaser.GameObjects.Ellipse;
  private lumaShadow!: Phaser.GameObjects.Ellipse;
  private targetMarker!: Phaser.GameObjects.Ellipse;
  private markers = new Map<string,Sprite>();
  private assets = new Map<string,Sprite>();
  private cell:Point;
  private companion:Point;
  private facing=0;
  private step:Point|null=null;
  private elapsed=0;
  private path:Point[]=[];
  private held=new Set<string>();
  private near:string|undefined;
  private paused=false;
  private ready=false;
  private status:SceneStatus={active:true,completed:new Set(),focus:null};
  private tileScale:number;
  private origin:Point;
  private scenery!:Phaser.GameObjects.Container;
  private tether?:Phaser.GameObjects.Graphics;

  constructor(private world:World, saved:Point, private hooks:SceneHooks, private options:SurfaceOptions = {}) {
    super('surface');
    this.cell={...saved};
    this.companion={...saved};
    const w=(world.width+world.height)*HALF_X;
    const h=(world.width+world.height)*HALF_Y;
    this.tileScale=Math.min(1.14,860/w,390/h);
    this.origin={x:WIDTH/2+(world.height-world.width)*HALF_X*this.tileScale/2,y:90};
  }
  private screen(p:Point) {
    return {x:this.origin.x+(p.x-p.y)*HALF_X*this.tileScale,
      y:this.origin.y+(p.x+p.y)*HALF_Y*this.tileScale};
  }
  private ground(x:number,y:number) {
    const a=(x-this.origin.x)/(HALF_X*this.tileScale),b=(y-this.origin.y)/(HALF_Y*this.tileScale);
    return {x:Math.round((a+b)/2),y:Math.round((b-a)/2)};
  }
  preload() {
    const keys:ArtKey[]=['astronaut',('luma-'+this.world.id) as ArtKey,('floor-'+this.world.id) as ArtKey,
      'markers','habitat','relay','cache','console','beacon','shuttle',('rock-'+this.world.id) as ArtKey];
    for (const key of keys) {
      const a=art[key];
      if(a.size[0]===a.frame[0] && a.size[1]===a.frame[1]) this.load.image(key,artUrl(a.file));
      else this.load.spritesheet(key,artUrl(a.file),{frameWidth:a.frame[0],frameHeight:a.frame[1]});
    }
  }
  private graphicSprite(key:ArtKey,p:Point,frame?:number) {
    const {x,y}=this.screen(p), config=art[key];
    return this.add.sprite(x,y,key,frame).setOrigin(config.origin[0],config.origin[1]).setScale(this.tileScale);
  }
  create() {
    this.sky();
    const terrain = ('floor-'+this.world.id) as ArtKey;
    const rock = ('rock-'+this.world.id) as ArtKey;
    const hazard=new Set(this.world.hazards.map(pointKey));
    const hullVoid=new Set(this.options.tethered?this.world.blocked.map(pointKey):[]);
    const grid = this.add.graphics().setDepth(-1);
    for(let z=0;z<this.world.width+this.world.height;z++) for(let x=0;x<this.world.width;x++){
      const y=z-x; if(y<0||y>=this.world.height) continue;
      const k={x,y}, s=this.screen(k);
      if(hullVoid.has(pointKey(k)))continue;
      this.graphicSprite(terrain,k,(x*11+y*7+x*y)%4).setDepth(-500+z);
      if(hazard.has(pointKey(k))){
        grid.fillStyle(0x201a40,.51).fillPoints([
          new Phaser.Math.Vector2(s.x-HALF_X*this.tileScale,s.y),new Phaser.Math.Vector2(s.x,s.y-HALF_Y*this.tileScale),
          new Phaser.Math.Vector2(s.x+HALF_X*this.tileScale,s.y),new Phaser.Math.Vector2(s.x,s.y+HALF_Y*this.tileScale),
        ],true);
      }
    }
    if(this.options.tethered)this.tether=this.add.graphics().setDepth(-.5);
    else for(const p of this.world.blocked) this.graphicSprite(rock,p).setDepth(p.x+p.y+1);
    for(const p of this.world.points) {
      const key=p.prop==='rock'?rock:p.prop;
      const sprite=this.graphicSprite(key,p.position).setDepth(p.position.x+p.position.y+1);
      this.assets.set(p.id,sprite);
      const w=this.screen(p.position);
      const marker=this.add.sprite(w.x,w.y-(art[key].frame[1]*.74+12)*this.tileScale,'markers',0)
        .setDepth(100).setScale(1.12).setInteractive({useHandCursor:true});
      marker.on('pointerdown',()=>{ if(this.status.active&&this.isAvailable(p.id)){
        this.hooks.onSelect(p.id); this.goTo(p.id);
      } });
      this.markers.set(p.id,marker);
    }
    this.targetMarker=this.add.ellipse(0,0,32,16).setStrokeStyle(1,0xe6cf88,.9).setDepth(-.2).setVisible(false);
    this.shadow=this.add.ellipse(0,0,28*this.tileScale,10*this.tileScale,0x111124,.4);
    this.lumaShadow=this.add.ellipse(0,0,20*this.tileScale,7*this.tileScale,0x111124,.34);
    this.actor=this.graphicSprite('astronaut',this.cell,0);
    this.luma=this.graphicSprite(('luma-'+this.world.id) as ArtKey,this.companion,0);
    this.input.on('pointerdown', (pointer:Phaser.Input.Pointer, hover:Phaser.GameObjects.GameObject[])=>{
      if(hover.length || !this.status.active || this.paused) return;
      const p=this.ground(pointer.x,pointer.y);
      if(inBounds(this.world,p)&&isWalkable(this.world,p)) this.path=route(this.world,this.step??this.cell,p,.01)??[];
    });
    window.addEventListener('keydown',this.keyDown);
    window.addEventListener('keyup',this.keyUp);
    window.addEventListener('blur',this.flush);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN,()=> {
      window.removeEventListener('keydown',this.keyDown);window.removeEventListener('keyup',this.keyUp);window.removeEventListener('blur',this.flush);
    });
    this.ready=true;
    this.paintStatus(); this.actors(0); this.reportNear(); this.hooks.onReady();
  }
  private sky() {
    this.scenery=this.add.container(0,0).setDepth(-1000);
    const g=this.add.graphics();
    const color=Number('0x'+this.world.landscape.slice(1));
    g.fillGradientStyle(color,0x101322,0x0a1020,0x0d1528,1).fillRect(0,0,WIDTH,HEIGHT);
    for(let n=1,i=0;i<180;i++){
      n=(n*16807)%2147483647;
      const x=n%WIDTH;
      n=(n*16807)%2147483647;
      const y=n%HEIGHT;
      g.fillStyle(i%11===0?0xffe7b8:0x9db4d4,i%10===0?.72:.3).fillRect(x,y,i%12===0?2:1,1);
    }
    const cx=this.world.id==='moon'?785:751,cy=179,r=this.world.id==='moon'?121:129;
    for(let i=10;i>=0;i--) g.fillStyle(this.world.id==='mars'?0xd17c6b:0x8a9de4,.028).fillCircle(cx,cy,r+6*i);
    g.fillStyle(this.world.id==='mars'?0x955c56:0x485887,.8).fillCircle(cx,cy,r);
    g.lineStyle(1,0x98b2e5,.55).strokeCircle(cx,cy,r);
    g.fillStyle(this.world.id==='mars'?0xbf7963:0x7f97bc,.58).fillCircle(cx-28,cy-33,r*.68);
    for(let i=0;i<54;i++){
      const a=Math.sin(i*5.31)*r*.82,b=Math.cos(i*7.31)*r*.77;
      if(Math.hypot(a,b)>r*.85) continue;
      g.fillStyle(i%3?0x222c53:0xa2b9d3,.16).fillRect(cx+a,cy+b,8+(i%8)*3,1+i%3);
    }
    g.lineStyle(1,0x9aaaed,.16).strokeEllipse(cx,cy+5,350,80);
    this.scenery.add(g);
  }
  private flush=()=>this.held.clear();
  private keyDown=(event:KeyboardEvent)=>{
    if(!this.status.active || this.paused || event.ctrlKey || event.altKey || event.metaKey) return;
    if(event.target instanceof HTMLElement && (event.target.matches('input,textarea,select') || event.target.isContentEditable)) return;
    const k=event.key.toLowerCase();
    if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){
      event.preventDefault();this.path=[];this.held.add(k);
    } else if((k==='e'||k==='r')&&!event.repeat){
      const selected=this.world.points.find(p=>p.id===this.status.focus && this.isAvailable(p.id) && distance(this.cell,p.position)<=approachRange);
      event.preventDefault();this.hooks.onUse(selected?.id??this.near,this.cell,k==='r');
    }
  };
  private keyUp=(event:KeyboardEvent)=>this.held.delete(event.key.toLowerCase());
  private isAvailable(id:string){return this.status.available?.has(id)??true;}
  setStatus(s:SceneStatus) {
    const changed=this.status.available!==s.available;
    this.status=s;
    if(!s.active){this.held.clear();this.path=[];}
    if(this.ready){
      this.paintStatus();
      if(changed)this.reportNear();
    }
  }
  setPaused(pause:boolean){this.paused=pause;this.held.clear();if(pause)this.path=[];}
  current() {return this.cell;}
  reset(spawn:Point) {
    this.cell={...spawn};this.companion={...spawn};
    this.step=null;this.path=[];this.held.clear();this.near=undefined;
    if(this.ready){this.actors(0);this.reportNear();}
  }
  goTo(id:string) {
    if(!this.ready||this.paused||!this.status.active||!this.isAvailable(id)) return;
    const p=this.world.points.find(p=>p.id===id);
    if(p){ this.path=route(this.world,this.step??this.cell,p.position)??[]; this.held.clear(); }
  }
  private paintStatus(){
    const types=['scan','salvage','service','upload'];
    this.luma.setVisible(this.status.companionVisible??true);
    this.lumaShadow.setVisible(this.status.companionVisible??true);
    for(const p of this.world.points){
      this.markers.get(p.id)?.setFrame(this.status.completed.has(p.id)?4:types.indexOf(p.action))
        .setVisible(this.isAvailable(p.id))
        .setAlpha(this.status.focus===p.id?1:this.status.completed.has(p.id)?.63:.88);
    }
    const focus=this.world.points.find(p=>p.id===this.status.focus&&this.isAvailable(p.id));
    if(focus){
      const p=this.screen(focus.position);
      this.targetMarker.setPosition(p.x,p.y).setVisible(true);
    } else this.targetMarker.setVisible(false);
  }
  private reportNear(){
    const current=this.world.points.filter(p=>this.isAvailable(p.id)&&distance(this.cell,p.position)<=approachRange)
      .sort((a,b)=>distance(this.cell,a.position)-distance(this.cell,b.position)).find(p=>!this.status.completed.has(p.id))
      ?? this.world.points.find(p=>this.isAvailable(p.id)&&distance(this.cell,p.position)<=approachRange);
    if(current?.id===this.near) return;
    this.near=current?.id; this.hooks.onNear(current??null);
  }
  private actors(delta:number) {
    const k=this.step?Math.min(1,this.elapsed/188):0;
    const p=this.step?{x:this.cell.x+(this.step.x-this.cell.x)*k,y:this.cell.y+(this.step.y-this.cell.y)*k}:this.cell;
    const position=this.screen(p), visual=this.screen(this.companion);
    if(this.tether){
      const anchor=this.screen(this.world.spawn);
      this.tether.clear().lineStyle(1.5,0xf2cf92,.8).lineBetween(anchor.x,anchor.y,position.x,position.y);
    }
    this.actor.setPosition(position.x,position.y).setDepth(p.x+p.y+.65)
      .setFrame(this.facing*4+(this.step?Math.min(3,Math.floor(k*4)):0));
    this.shadow.setPosition(position.x,position.y+2).setDepth(p.x+p.y+.3);
    if(distance(this.companion,p)>.72){
      const v=Math.min(.16,delta/240);
      this.companion={ x:this.companion.x+(p.x-this.companion.x)*v,y:this.companion.y+(p.y-this.companion.y)*v };
    }
    const offsetX=visual.x-18*this.tileScale,offsetY=visual.y+5*this.tileScale;
    this.luma.setPosition(offsetX,offsetY).setDepth(this.companion.x+this.companion.y+.5)
      .setFrame(this.facing*4+(this.step?Math.min(3,Math.floor(k*4)):0));
    this.lumaShadow.setPosition(offsetX,offsetY+2).setDepth(this.companion.x+this.companion.y+.2);
    for(const poi of this.world.points){
      const sprite=this.assets.get(poi.id);
      if(!sprite)continue;
      const nearBehind=position.y<sprite.y && sprite.y-position.y<31*this.tileScale && Math.abs(sprite.x-position.x)<sprite.displayWidth*.4;
      sprite.setAlpha(nearBehind?.54:1);
    }
  }
  update(_time:number,delta:number){
    if(!this.ready||!this.status.active||this.paused) return;
    if(this.step){
      this.elapsed+=Math.min(delta,64);
      if(this.elapsed>=188){
        this.cell=this.step; this.step=null;this.reportNear(); this.hooks.onStop(this.cell);
      }
    }
    if(!this.step){
      const d=[['d','arrowright',1,0,0],['s','arrowdown',0,1,1],['a','arrowleft',-1,0,2],['w','arrowup',0,-1,3]] as const;
      const move=d.find(([k,a])=>this.held.has(k)||this.held.has(a));
      const step=move?{x:this.cell.x+move[2],y:this.cell.y+move[3]}:this.path.shift();
      if(step && accessible(this.world,this.cell,step)){
        this.step=step; this.elapsed=0;
        const dir=d.find(([, ,x,y])=>step.x-this.cell.x===x&&step.y-this.cell.y===y);
        if(dir)this.facing=dir[4];
      }
    }
    this.actors(delta);
  }
}

export function mountSurface(parent:HTMLElement,scene:Phaser.Scene) {
  return new Phaser.Game({
    type:Phaser.AUTO, parent, width:WIDTH, height:HEIGHT, backgroundColor:'#10151e',
    render:{pixelArt:true,antialias:false,roundPixels:true},
    scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},
    audio:{noAudio:true},scene:[scene],
  });
}
