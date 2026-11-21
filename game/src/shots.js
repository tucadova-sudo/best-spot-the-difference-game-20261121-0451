// The screenshot scenes behind ?shot=start|play|end. Each one stages a real state of the
// game — title, mid-play with three differences found, and the last scene complete — so the
// frame is what a short game really looks like and the same seed always gives the same frame.
import { SCENES } from './config.js';
import { SCREEN_PLAY, SCREEN_SCENE, SCREEN_TITLE } from './render.js';

/**
 * Set `world` to the named scene (start, play or end; any other name is start) and return the
 * screen to draw over it and the best score to show.
 */
export function stageShot(name, world) {
  world.reset();
  const state = world.state;
  if (name === 'play') {
    state.screen = SCREEN_PLAY;
    state.scene = 0;
    state.found = SCENES[0].diffs.slice(0, 3).map((diff) => diff.id);
    state.score = 300;
    state.elapsed = 47;
    state.sceneElapsed = 47;
    return { screen: SCREEN_PLAY, best: 300 };
  }
  if (name === 'end') {
    state.screen = SCREEN_SCENE;
    state.scene = 2;
    state.found = SCENES[2].diffs.map((diff) => diff.id);
    state.score = 2100;
    state.sceneBonus = 180;
    state.elapsed = 186;
    state.sceneElapsed = 62;
    return { screen: SCREEN_SCENE, best: 2100 };
  }
  state.screen = SCREEN_TITLE;
  state.scene = 0;
  return { screen: SCREEN_TITLE, best: 0 };
}
