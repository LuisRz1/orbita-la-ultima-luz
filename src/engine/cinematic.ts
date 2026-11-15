// Arrival shot: a short camera move from high above the landing site, around the lander and down behind the
// player's shoulder, while the destination's title card plays. Purely visual; the sortie starts when it ends or is
// skipped. Positions only; the game decides when it plays (setting, reduced motion, debug runs).
import { CatmullRomCurve3, Vector3 } from 'three';

export type ShotFrame = { position: Vector3; look: Vector3; focus: number };
export type Shot = { duration: number; at(t: number, out: ShotFrame): ShotFrame };

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * `player` is where the astronaut stands, `yaw` the camera yaw the sortie starts with, `end` the camera position the
 * sortie will use; `lander` is the landing craft (or dock) the shot circles. `height(x, z)` keeps the camera above
 * the terrain.
 */
export function arrivalShot(player: Vector3, yaw: number, end: Vector3, lander: Vector3, height: (x: number, z: number) => number, duration = 5.6): Shot {
  // Behind the player along the starting view, and a side direction to sweep around.
  const back = new Vector3(Math.sin(yaw), 0, Math.cos(yaw)), side = new Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
  const above = (v: Vector3, clearance: number) => { v.y = Math.max(v.y, height(v.x, v.z) + clearance); return v; };
  const points = [
    above(lander.clone().addScaledVector(back, -46).addScaledVector(side, 30).setY(lander.y + 34), 8),
    above(lander.clone().addScaledVector(side, 22).addScaledVector(back, -6).setY(lander.y + 14), 4),
    above(lander.clone().addScaledVector(back, 10).addScaledVector(side, 13).setY(lander.y + 8), 3),
    end.clone(),
  ];
  const curve = new CatmullRomCurve3(points, false, 'centripetal');
  const head = player.clone().setY(player.y + 1.4), landerTop = lander.clone().setY(lander.y + 2);
  return {
    duration,
    at(t, out) {
      const k = ease(Math.min(1, Math.max(0, t / duration)));
      curve.getPointAt(k, out.position);
      // Look at the lander first, then hand over to the player during the last third.
      const hand = Math.min(1, Math.max(0, (k - 0.45) / 0.45));
      out.look.copy(landerTop).lerp(head, hand * hand * (3 - 2 * hand));
      out.focus = out.position.distanceTo(out.look);
      return out;
    },
  };
}
