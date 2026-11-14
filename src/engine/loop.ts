// Fixed-step game loop. Simulation always advances in steps of `fixedDt`, so a run can be replayed exactly.

export const fixedDt = 1 / 60;
const maxStepsPerFrame = 5;

export type LoopHandlers = {
  /** Advances the simulation by exactly `fixedDt` seconds. */
  update(dt: number): void;
  /** Draws a frame. `alpha` is how far the display is between the last two simulation steps. */
  render(alpha: number, frameMs: number): void;
};

export class Loop {
  paused = false;
  steps = 0;
  private handle = 0;
  private last = 0;
  private accumulator = 0;
  private readonly handlers: LoopHandlers;
  constructor(handlers: LoopHandlers) { this.handlers = handlers; }

  start() {
    if (this.handle) return;
    this.last = performance.now();
    const frame = (now: number) => {
      this.handle = requestAnimationFrame(frame);
      const frameMs = now - this.last;
      this.last = now;
      if (!this.paused) {
        this.accumulator += Math.min(frameMs / 1000, maxStepsPerFrame * fixedDt);
        while (this.accumulator >= fixedDt) {
          this.handlers.update(fixedDt);
          this.steps++;
          this.accumulator -= fixedDt;
        }
      }
      this.handlers.render(this.paused ? 1 : this.accumulator / fixedDt, frameMs);
    };
    this.handle = requestAnimationFrame(frame);
  }

  /** Runs `count` simulation steps immediately, regardless of pause. Used by deterministic tests. */
  step(count: number) {
    for (let i = 0; i < count; i++) { this.handlers.update(fixedDt); this.steps++; }
    this.handlers.render(1, 0);
  }

  stop() {
    cancelAnimationFrame(this.handle);
    this.handle = 0;
  }
}
