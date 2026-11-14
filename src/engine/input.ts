// Keyboard and mouse. Keys are read by `code`, so the layout (QWERTY, AZERTY, Spanish) does not matter.

export type Actions = 'up' | 'down' | 'left' | 'right' | 'jump' | 'dash' | 'interact' | 'scan' | 'log' | 'console' | 'pause';

const bindings: Record<string, Actions> = {
  KeyW: 'up', ArrowUp: 'up', KeyS: 'down', ArrowDown: 'down', KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  Space: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', KeyE: 'interact', KeyR: 'scan', Tab: 'log', Slash: 'console', Escape: 'pause',
};

export class Input {
  look = { yaw: 0, pitch: 0.32 };
  sensitivity = 0.0025;
  /** Time of the last mouse look, used to decide when the camera may re-centre on its own. */
  lastLook = -Infinity;
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
      if (!a || this.typing(e)) return;
      if (a === 'log' || a === 'jump') e.preventDefault();
      if (!e.repeat) this.pressed.add(a);
      this.held.add(a);
    }, { signal });
    window.addEventListener('keyup', e => { const a = bindings[e.code]; if (a) this.held.delete(a); }, { signal });
    window.addEventListener('blur', () => this.held.clear(), { signal });
    target.addEventListener('click', () => { if (document.pointerLockElement !== target) target.requestPointerLock?.(); }, { signal });
    target.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom = Math.min(11, Math.max(3.2, this.zoom + Math.sign(e.deltaY) * 0.6));
    }, { signal, passive: false });
    window.addEventListener('mousemove', e => {
      if (document.pointerLockElement !== target) return;
      this.lastLook = performance.now();
      this.look.yaw -= e.movementX * this.sensitivity;
      this.look.pitch = Math.min(1.2, Math.max(-0.15, this.look.pitch + e.movementY * this.sensitivity));
    }, { signal });
  }

  private typing(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
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
