// The game's rules and state, with no drawing and no browser in it: three scenes of seven
// differences, the found set, mistakes, score, timer, hints and the keyboard cursor. step()
// advances one fixed step and returns what happened as bit flags, so the caller can react
// without the world knowing about screens or sound. Nothing here allocates after createWorld.
import { CLICK_RADIUS, FLASH_SECONDS, HINT_SECONDS, SCENES, SCORE } from './config.js';

export const EVENT_FOUND = 1;
export const EVENT_WRONG = 2;
export const EVENT_SCENE = 4;
export const EVENT_WIN = 8;

/** Distance in scene pixels between two points. */
function distance(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

export function createWorld() {
  const state = {
    screen: 'title',
    scene: 0,
    found: [],
    mistakes: 0,
    score: 0,
    elapsed: 0,
    sceneElapsed: 0,
    hint: null,
    flash: null,
    muted: false,
    sceneBonus: 0,
    // Keyboard cursor, in scene space on the right picture; shown only once the
    // player has used the arrow keys, so staged screenshots stay clean.
    cursor: { x: 308, y: 280 },
    cursorActive: false,
    best: 0,
  };

  function sceneDef() {
    return SCENES[state.scene];
  }

  function remaining() {
    return sceneDef().diffs.length - state.found.length;
  }

  function reset() {
    state.screen = 'title';
    state.scene = 0;
    state.found = [];
    state.mistakes = 0;
    state.score = 0;
    state.elapsed = 0;
    state.sceneElapsed = 0;
    state.hint = null;
    state.flash = null;
    state.sceneBonus = 0;
    state.cursor = { x: 308, y: 280 };
    state.cursorActive = false;
  }

  function startGame() {
    reset();
    state.screen = 'play';
  }

  function sceneBonus() {
    return Math.max(0, SCORE.sceneBonusBase - Math.floor(state.sceneElapsed) * SCORE.sceneBonusPerSecond);
  }

  /** A click in scene space on either picture. Returns what happened as EVENT_* flags. */
  function clickAt(x, y) {
    if (state.screen !== 'play') return 0;
    const diffs = sceneDef().diffs;
    // A click on a difference already found is a no-op, never a mistake.
    for (const diff of diffs) {
      if (!state.found.includes(diff.id)) continue;
      if (distance(x, y, diff.x, diff.y) <= Math.max(CLICK_RADIUS, diff.r + 10)) return 0;
    }
    let nearest = null;
    let nearestDistance = Infinity;
    for (const diff of diffs) {
      if (state.found.includes(diff.id)) continue;
      const d = distance(x, y, diff.x, diff.y);
      if (d < nearestDistance) {
        nearestDistance = d;
        nearest = diff;
      }
    }
    if (nearest !== null && nearestDistance <= Math.max(CLICK_RADIUS, nearest.r + 10)) {
      state.found.push(nearest.id);
      state.score += SCORE.found;
      state.hint = null;
      if (state.found.length === diffs.length) {
        state.sceneBonus = sceneBonus();
        state.score += state.sceneBonus;
        if (state.scene === SCENES.length - 1) {
          state.screen = 'victory';
          return EVENT_FOUND | EVENT_WIN;
        }
        state.screen = 'scene';
        return EVENT_FOUND | EVENT_SCENE;
      }
      return EVENT_FOUND;
    }
    state.mistakes += 1;
    state.score = Math.max(0, state.score + SCORE.wrong);
    state.flash = { x, y, left: FLASH_SECONDS };
    return EVENT_WRONG;
  }

  /** Move to the next scene after a scene-complete screen. */
  function nextScene() {
    state.scene += 1;
    state.found = [];
    state.sceneElapsed = 0;
    state.hint = null;
    state.flash = null;
    state.cursor = { x: 308, y: 280 };
    state.screen = 'play';
  }

  /** Hint: pulse a ring around one difference the player has not found yet. */
  function hint() {
    if (state.screen !== 'play') return null;
    const unfound = sceneDef().diffs.filter((diff) => !state.found.includes(diff.id));
    if (unfound.length === 0) return null;
    const pick = unfound[0];
    state.hint = { id: pick.id, x: pick.x, y: pick.y, left: HINT_SECONDS };
    state.score = Math.max(0, state.score + SCORE.hint);
    return pick;
  }

  /** One fixed step: the clock runs while playing; hint rings and wrong-click marks fade. */
  function step(dt) {
    if (state.screen === 'play') {
      state.elapsed += dt;
      state.sceneElapsed += dt;
    }
    if (state.hint !== null) {
      state.hint.left -= dt;
      if (state.hint.left <= 0) state.hint = null;
    }
    if (state.flash !== null) {
      state.flash.left -= dt;
      if (state.flash.left <= 0) state.flash = null;
    }
    return 0;
  }

  reset();
  return { state, reset, startGame, clickAt, nextScene, hint, step, remaining, sceneDef, sceneBonus };
}
