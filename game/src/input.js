// Keyboard and pointer input. Held arrow keys move the keyboard cursor; one-shot presses
// (confirm, hint, mute, restart) are queued as bit flags and taken once by the loop, so a press
// between two frames is never lost and never counted twice. Pointer clicks are queued with
// their field-space position, so the loop can route them to a picture, a button or an overlay.

export const ACTION_CONFIRM = 1;
export const ACTION_HINT = 2;
export const ACTION_MUTE = 4;
export const ACTION_RESTART = 8;

const CONFIRM = new Set(['Space', 'Enter']);
const HINT = new Set(['KeyH']);
const MUTE = new Set(['KeyM']);
const RESTART = new Set(['KeyR']);
const ARROWS = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']);

export function createInput(target, toField) {
  let actions = 0;
  let keyboardUsed = false;
  const held = { left: false, right: false, up: false, down: false, shift: false };
  const clicks = [];

  window.addEventListener('keydown', (event) => {
    if (ARROWS.has(event.code)) {
      keyboardUsed = true;
      if (event.code === 'ArrowLeft') held.left = true;
      if (event.code === 'ArrowRight') held.right = true;
      if (event.code === 'ArrowUp') held.up = true;
      if (event.code === 'ArrowDown') held.down = true;
      held.shift = event.shiftKey;
      event.preventDefault();
    } else if (CONFIRM.has(event.code)) {
      if (!event.repeat) actions |= ACTION_CONFIRM;
      event.preventDefault();
    } else if (HINT.has(event.code)) {
      if (!event.repeat) actions |= ACTION_HINT;
      event.preventDefault();
    } else if (MUTE.has(event.code)) {
      if (!event.repeat) actions |= ACTION_MUTE;
      event.preventDefault();
    } else if (RESTART.has(event.code)) {
      if (!event.repeat) actions |= ACTION_RESTART;
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', (event) => {
    if (event.code === 'ArrowLeft') held.left = false;
    if (event.code === 'ArrowRight') held.right = false;
    if (event.code === 'ArrowUp') held.up = false;
    if (event.code === 'ArrowDown') held.down = false;
    held.shift = event.shiftKey;
  });
  // A key released while the tab is hidden never sends keyup: let go of everything on blur.
  window.addEventListener('blur', () => {
    held.left = false;
    held.right = false;
    held.up = false;
    held.down = false;
    held.shift = false;
  });
  target.addEventListener('pointerdown', (event) => {
    clicks.push(toField(event.clientX, event.clientY));
  });

  return {
    /** Whether the player has used the arrow keys yet this visit. */
    keyboardUsed() {
      return keyboardUsed;
    },
    /** Cursor step per frame while an arrow key is held (Shift moves faster). */
    cursorStep() {
      const base = held.shift ? 9 : 4;
      return {
        x: (held.right ? base : 0) - (held.left ? base : 0),
        y: (held.down ? base : 0) - (held.up ? base : 0),
      };
    },
    /** The one-shot presses since the last call, as ACTION_* flags. */
    takeActions() {
      const taken = actions;
      actions = 0;
      return taken;
    },
    /** The pointer clicks since the last call, in field space. */
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
  };
}
