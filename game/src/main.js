// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s steps
// (several in a slow frame, none in a fast one), and the renderer paints what is there. The game
// moves between four screens: title, play, scene complete and victory.
//
// ?seed=N fixes the decorative random pattern. ?shot=start|play|end (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady for a
// screenshot. ?selftest=1 runs a scripted click sequence against the real rules and writes
// PASS or FAIL into document.title and the status line, for automated play-testing.
import { BEST_KEY, STEP } from './config.js';
import { createWorld, EVENT_FOUND, EVENT_SCENE, EVENT_WIN, EVENT_WRONG } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_RESTART, createInput } from './input.js';
import { createRenderer, SCREEN_PLAY, SCREEN_SCENE, SCREEN_TITLE, SCREEN_VICTORY } from './render.js';
import { stageShot } from './shots.js';

/** The longest frame the loop catches up on; a longer stall (a hidden tab) is dropped, not replayed. */
const MAX_FRAME = 0.25;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : 1234;
const selftest = params.has('selftest');

const canvas = document.getElementById('game');
const status = document.getElementById('status');
const world = createWorld();
const renderer = createRenderer(canvas);

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(BEST_KEY) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(BEST_KEY, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

// Small WebAudio beeps, made on first use so no sound file is needed.
let audio = null;
function beep(frequency, seconds, type, when) {
  if (world.state.muted) return;
  try {
    audio = audio ?? new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(0.12, audio.currentTime + when);
    gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + when + seconds);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(audio.currentTime + when);
    oscillator.stop(audio.currentTime + when + seconds);
  } catch {
    // Audio can be unavailable in headless runs: the game plays silently.
  }
}
function soundFound() {
  beep(880, 0.12, 'sine', 0);
  beep(1318, 0.18, 'sine', 0.09);
}
function soundWrong() {
  beep(160, 0.18, 'sawtooth', 0);
}
function soundComplete() {
  [523, 659, 784, 1046].forEach((frequency, i) => beep(frequency, 0.16, 'sine', i * 0.09));
}

function runShot(name) {
  const scene = stageShot(name, world);
  let painted = 0;
  function paint() {
    renderer.draw(world.state, scene.screen, scene.best);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

/** Scripted play-test: correct click, wrong click, correct click, hint, scene flow. */
function runSelftest() {
  const results = [];
  const check = (name, ok) => results.push(`${name}:${ok ? 'ok' : 'FAIL'}`);
  world.startGame();
  const scene = world.sceneDef();
  const first = scene.diffs[0];
  const second = scene.diffs[1];
  let events = world.clickAt(first.x, first.y);
  check('found-first', (events & EVENT_FOUND) !== 0 && world.state.found.length === 1 && world.state.score === 100);
  events = world.clickAt(40, 520);
  check('wrong-click', (events & EVENT_WRONG) !== 0 && world.state.mistakes === 1 && world.state.score === 95);
  events = world.clickAt(first.x, first.y);
  check('found-again-noop', events === 0 && world.state.found.length === 1);
  events = world.clickAt(second.x, second.y);
  check('found-second', (events & EVENT_FOUND) !== 0 && world.state.found.length === 2);
  const hint = world.hint();
  check('hint', hint !== null && world.state.hint !== null && world.state.score === 170);
  for (const diff of scene.diffs.slice(2)) world.clickAt(diff.x, diff.y);
  check('scene-complete', world.state.screen === SCREEN_SCENE && (world.state.score > 170));
  world.nextScene();
  check('next-scene', world.state.screen === SCREEN_PLAY && world.state.scene === 1 && world.state.found.length === 0);
  const passed = results.every((r) => r.endsWith(':ok'));
  const text = `SELFTEST ${passed ? 'PASS' : 'FAIL'} ${results.join(' ')}`;
  document.title = text;
  status.textContent = text;
  window.__selftest = text;
}

function runGame() {
  const input = createInput(canvas, (x, y) => renderer.toField(x, y));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();

  // Screen readers (and anyone watching the page's text) hear the screen changes and each find.
  function announce(message) {
    status.textContent = message;
  }

  function startGame() {
    world.startGame();
    screen = SCREEN_PLAY;
    announce('Playing. Find seven differences in each of three scenes.');
  }

  function endGame() {
    screen = SCREEN_VICTORY;
    if (world.state.score > best) {
      best = world.state.score;
      saveBest(best);
    }
    announce(`You found them all. Score ${world.state.score}. Best ${best}.`);
  }

  function handleClick(field) {
    const button = renderer.buttonAt(field.x, field.y);
    if (button === 'hint') {
      const picked = world.hint();
      announce(picked === null ? 'Nothing left to hint at.' : `Hint: look near ${picked.label}.`);
      return;
    }
    if (button === 'sound') {
      world.state.muted = !world.state.muted;
      announce(world.state.muted ? 'Sound off.' : 'Sound on.');
      return;
    }
    if (button === 'restart') {
      startGame();
      return;
    }
    if (screen === SCREEN_TITLE) {
      startGame();
      return;
    }
    if (screen === SCREEN_SCENE) {
      if (world.state.scene + 1 < 3) {
        world.nextScene();
        screen = SCREEN_PLAY;
        announce(`Scene ${world.state.scene + 1}: ${world.sceneDef().name}.`);
      } else {
        endGame();
      }
      return;
    }
    if (screen === SCREEN_VICTORY) {
      startGame();
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const hit = renderer.panelAt(field.x, field.y);
    if (hit === null) return;
    const events = world.clickAt(hit.x, hit.y);
    if (events & EVENT_FOUND) {
      soundFound();
      const remaining = world.remaining();
      announce(remaining === 0 ? 'Scene complete.' : `Found one. ${remaining} left in this scene.`);
    }
    if (events & EVENT_WRONG) {
      soundWrong();
      announce('Not a difference. Try again.');
    }
    if (events & EVENT_SCENE) {
      soundComplete();
      screen = SCREEN_SCENE;
      announce(`Scene complete. Bonus ${world.state.sceneBonus}.`);
    }
    if (events & EVENT_WIN) {
      soundComplete();
      endGame();
    }
  }

  function handleActions() {
    const actions = input.takeActions();
    if (actions & ACTION_RESTART) {
      startGame();
      return;
    }
    if (actions & ACTION_MUTE) {
      world.state.muted = !world.state.muted;
      announce(world.state.muted ? 'Sound off.' : 'Sound on.');
    }
    if (actions & ACTION_HINT && screen === SCREEN_PLAY) {
      const picked = world.hint();
      announce(picked === null ? 'Nothing left to hint at.' : `Hint: look near ${picked.label}.`);
    }
    if (actions & ACTION_CONFIRM) {
      if (screen === SCREEN_TITLE || screen === SCREEN_VICTORY) startGame();
      else if (screen === SCREEN_SCENE) {
        if (world.state.scene + 1 < 3) {
          world.nextScene();
          screen = SCREEN_PLAY;
        } else endGame();
      } else if (screen === SCREEN_PLAY) {
        // Confirm clicks at the keyboard cursor (right picture).
        const events = world.clickAt(world.state.cursor.x, world.state.cursor.y);
        if (events & EVENT_FOUND) soundFound();
        if (events & EVENT_WRONG) soundWrong();
        if (events & EVENT_SCENE) {
          soundComplete();
          screen = SCREEN_SCENE;
        }
        if (events & EVENT_WIN) {
          soundComplete();
          endGame();
        }
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    handleActions();
    for (const click of input.takeClicks()) handleClick(click);
    if (screen === SCREEN_PLAY) {
      const step = input.cursorStep();
      if (step.x !== 0 || step.y !== 0) world.state.cursorActive = true;
      const cursor = world.state.cursor;
      cursor.x = Math.min(616, Math.max(0, cursor.x + step.x));
      cursor.y = Math.min(560, Math.max(0, cursor.y + step.y));
      while (accumulator >= STEP) {
        world.step(STEP);
        accumulator -= STEP;
      }
    } else {
      accumulator = 0;
    }
    renderer.draw(world.state, screen, best);
  }

  // Leaving the tab stops the clock rather than letting time run unseen.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) accumulator = 0;
  });

  announce('Pasar Pagi, spot the difference. Press Space or click to start.');
  if (selftest) runSelftest();
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
