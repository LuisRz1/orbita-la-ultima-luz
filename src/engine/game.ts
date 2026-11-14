import { BoxGeometry, Color, GridHelper, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene } from 'three';
import { hud } from '../ui/store.ts';
import { exposeDebug } from './debug.ts';
import { Loop } from './loop.ts';
import { detectTier, tierIds, type Tier } from './quality.ts';
import { createViewport } from './renderer.ts';

export type Game = { dispose(): void };

function startingTier(): Tier {
  const asked = new URLSearchParams(window.location.search).get('quality');
  const forced = tierIds.find(id => id === asked);
  if (forced) return forced;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return detectTier({
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: nav.hardwareConcurrency,
    touch: matchMedia('(pointer: coarse)').matches,
  });
}

/** Mounts the engine inside `host`. For now it draws a reference grid; levels attach here from the next stage on. */
export function createGame(host: HTMLElement): Game {
  const tier = startingTier();
  const viewport = createViewport(host, tier);
  const scene = new Scene();
  scene.background = new Color('#0b0f14');
  const camera = new PerspectiveCamera(55, 1, 0.1, 600);
  camera.position.set(6, 5, 9);
  camera.lookAt(0, 0.5, 0);
  viewport.onResize((width, height) => { camera.aspect = width / height; camera.updateProjectionMatrix(); });

  const grid = new GridHelper(40, 40, '#7fe3e0', '#24303c');
  const marker = new Mesh(new BoxGeometry(1, 1, 1), new MeshBasicMaterial({ color: '#ffaf68', wireframe: true }));
  marker.position.y = 0.5;
  scene.add(grid, marker);

  let sincePublish = 0;
  const loop = new Loop({
    update(dt) { marker.rotation.y += dt * 0.6; },
    render(_alpha, frameMs) {
      viewport.tick(frameMs);
      viewport.renderer.render(scene, camera);
      sincePublish += frameMs;
      if (sincePublish < 100) return;
      sincePublish = 0;
      const info = viewport.renderer.info.render;
      hud.setState({
        ready: true, tier, frameMs: viewport.governor.average, renderScale: viewport.governor.scale,
        drawCalls: info.calls, triangles: info.triangles,
      });
    },
  });
  const hideDebug = exposeDebug({
    state: () => ({ steps: loop.steps, paused: loop.paused, tier }),
    step: (count: number) => loop.step(count),
    pause: (value: boolean) => { loop.paused = value; },
    perf: () => ({ ...hud.getState(), ratio: viewport.ratio, width: viewport.width, height: viewport.height }),
  });
  loop.start();

  return {
    dispose() {
      loop.stop();
      hideDebug();
      grid.geometry.dispose();
      marker.geometry.dispose();
      viewport.dispose();
      hud.setState({ ready: false });
    },
  };
}
