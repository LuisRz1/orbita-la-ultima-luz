// Keyboard and mouse. Keys are read by `code`, so the layout (QWERTY, AZERTY, Spanish) does not matter.

export type Actions = 'up' | 'down' | 'left' | 'right' | 'jump' | 'dash' | 'interact' | 'scan' | 'log' | 'console' | 'pause' | 'center' | 'talk';

const bindings: Record<string, Actions> = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', KeyE: 'interact', KeyR: 'scan', Tab: 'log', Slash: 'console', Escape: 'pause',KeyC:'center',KeyL:'talk',
};

export class Input {
  look = { yaw: 0, pitch: 0.32 };
  sensitivity = 0.0025;
  /** Camera distance in metres, changed with the mouse wheel. */
  zoom = 6.4;
  private held = new Set<Actions>();
  private pressed = new Set<Actions>();
  private readonly target: HTMLElement;
  private readonly controller = new AbortController();

  constructor(target: HTMLElement) {
    this.target = target;
    const signal = this.controller.signal;
    window.addEventListener('keydown', e => {
      const a = bindings[e.code];
      if (!a||e.ctrlKey||e.altKey||e.metaKey||e.defaultPrevented||this.typing(e))return;
      if (a === 'jump') e.preventDefault();
      if (!e.repeat) this.pressed.add(a);
      this.held.add(a);
    }, { signal });
    window.addEventListener('keyup', e => { const a = bindings[e.code]; if (a) this.held.delete(a); }, { signal });
    let cameraDrag:number|null=null;
    const clear=()=>{this.held.clear();this.pressed.clear();cameraDrag=null;};
    window.addEventListener('blur',clear,{signal});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clear();},{signal});
    document.addEventListener('pointerlockchange',()=>{if(!this.locked)clear();},{signal});
    target.addEventListener('click',()=>{
      if(!this.locked)void Promise.resolve(target.requestPointerLock?.()).catch(()=>{});
    },{signal});
    target.addEventListener('pointerdown',e=>{
      if(e.button===2&&!this.locked){cameraDrag=e.pointerId;target.setPointerCapture(e.pointerId);e.preventDefault();}
    },{signal});
    target.addEventListener('lostpointercapture',()=>{cameraDrag=null;},{signal});
    target.addEventListener('contextmenu',e=>e.preventDefault(),{signal});
    target.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom = Math.min(11, Math.max(3.2, this.zoom + Math.sign(e.deltaY) * 0.6));
    }, { signal, passive: false });
    const turn=(e:MouseEvent)=>{
      this.look.yaw -= e.movementX * this.sensitivity;
      this.look.pitch = Math.min(1.2, Math.max(-0.15, this.look.pitch + e.movementY * this.sensitivity));
    };
    target.addEventListener('pointermove',e=>{if(cameraDrag===e.pointerId)turn(e);},{signal});
    window.addEventListener('mousemove',e=>{if(this.locked)turn(e);},{signal});
  }

  private typing(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    return !!el&&(!!el.closest?.('dialog[open],input,textarea,select')||el.isContentEditable);
  }

  isHeld(a: Actions) { return this.held.has(a); }
  /** True once per key press; cleared by `endStep`. */
  wasPressed(a: Actions) { return this.pressed.has(a); }
  endStep() { this.pressed.clear(); }

  /** Simulated input for debug tools and tests. */
  press(a: Actions) { this.pressed.add(a); }
  hold(a: Actions, down: boolean) { if (down) this.held.add(a); else this.held.delete(a); }

  get locked() { return document.pointerLockElement === this.target; }
  dispose() { this.controller.abort(); if (this.locked) document.exitPointerLock(); }
}
