// Drawing only: the world's state and the current screen in, pixels out. The 1280x720
// playfield is scaled to fit the window and centred, the margin filled with the backdrop
// colour. Every picture is drawn with flat canvas shapes, no images and no network, so the
// two panels differ only where a scene's differences say so.
import { FIELD, FONT, FOOTER, HEADER, PALETTE, PANEL, SCENES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_SCENE = 'scene';
export const SCREEN_VICTORY = 'victory';

/** Footer buttons, in field space: hint, sound, restart. */
export const BUTTONS = [
  { id: 'hint', label: 'Hint (H) −25', x: 16, y: 672, width: 150, height: 40 },
  { id: 'sound', label: 'Sound: On (M)', x: 182, y: 672, width: 150, height: 40 },
  { id: 'restart', label: 'Restart (R)', x: 348, y: 672, width: 150, height: 40 },
];

export function createRenderer(canvas) {
  const context = canvas.getContext('2d');
  const view = { scale: 1, x: 0, y: 0 };

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = Math.round(window.innerWidth * ratio);
    const height = Math.round(window.innerHeight * ratio);
    canvas.width = width;
    canvas.height = height;
    view.scale = Math.min(width / FIELD.width, height / FIELD.height);
    view.x = (width - FIELD.width * view.scale) / 2;
    view.y = (height - FIELD.height * view.scale) / 2;
  }

  /** Client (CSS) pixels to field space. */
  function toField(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / (rect.width / FIELD.width),
      y: (clientY - rect.top) / (rect.height / FIELD.height),
    };
  }

  /** Which picture panel a field point is in, and its scene-space position there. */
  function panelAt(x, y) {
    if (y < PANEL.y || y > PANEL.y + PANEL.height) return null;
    if (x >= PANEL.leftX && x <= PANEL.leftX + PANEL.width) {
      return { panel: 'left', x: x - PANEL.leftX, y: y - PANEL.y };
    }
    if (x >= PANEL.rightX && x <= PANEL.rightX + PANEL.width) {
      return { panel: 'right', x: x - PANEL.rightX, y: y - PANEL.y };
    }
    return null;
  }

  function buttonAt(x, y) {
    for (const button of BUTTONS) {
      if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
        return button.id;
      }
    }
    return null;
  }

  const fonts = new Map();
  function text(value, x, y, size, color, align, weight) {
    const key = `${weight || ''}${size}`;
    if (!fonts.has(key)) fonts.set(key, `${weight ? '700 ' : ''}${size}px ${FONT}`);
    context.font = fonts.get(key);
    context.fillStyle = color;
    context.textAlign = align;
    context.textBaseline = 'alphabetic';
    context.fillText(value, x, y);
  }

  function circle(x, y, r, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI * 2);
    context.fill();
  }

  function ellipse(x, y, rx, ry, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    context.fill();
  }

  function rect(x, y, w, h, fill) {
    context.fillStyle = fill;
    context.fillRect(x, y, w, h);
  }

  function rr(x, y, w, h, r, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.roundRect(x, y, w, h, r);
    context.fill();
  }

  function poly(points, fill) {
    context.fillStyle = fill;
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (let i = 1; i < points.length; i += 1) context.lineTo(points[i][0], points[i][1]);
    context.closePath();
    context.fill();
  }

  function line(x1, y1, x2, y2, color, width) {
    context.strokeStyle = color;
    context.lineWidth = width;
    context.beginPath();
    context.moveTo(x1, y1);
    context.lineTo(x2, y2);
    context.stroke();
  }

  function cloud(x, y, s) {
    circle(x, y, 16 * s, '#ffffff');
    circle(x + 18 * s, y - 6 * s, 20 * s, '#ffffff');
    circle(x + 38 * s, y, 16 * s, '#ffffff');
    ellipse(x + 18 * s, y + 8 * s, 34 * s, 12 * s, '#ffffff');
  }

  function sun(x, y, r) {
    for (let i = 0; i < 8; i += 1) {
      const a = (i / 8) * Math.PI * 2;
      line(x + Math.cos(a) * (r + 6), y + Math.sin(a) * (r + 6), x + Math.cos(a) * (r + 16), y + Math.sin(a) * (r + 16), '#ffd94d', 4);
    }
    circle(x, y, r, '#ffd94d');
  }

  // ---- Scene 1: Pasar Pagi (morning market) -------------------------------------------
  function drawMarket(variant) {
    const sky = context.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, '#bfe3ff');
    sky.addColorStop(1, '#ffe9b8');
    context.fillStyle = sky;
    context.fillRect(0, 0, 616, 380);
    cloud(150, 150, 1);
    cloud(330, 135, 0.8);
    if (variant) cloud(480, 150, 0.9);
    // Distant rooftops.
    poly([[0, 380], [0, 320], [70, 300], [140, 320], [140, 380]], '#c9a06a');
    poly([[140, 380], [140, 315], [230, 295], [320, 315], [320, 380]], '#b98a5a');
    poly([[320, 380], [320, 325], [420, 300], [520, 325], [520, 380]], '#c9a06a');
    poly([[520, 380], [520, 318], [616, 300], [616, 380]], '#b98a5a');
    // Ground.
    rect(0, 380, 616, 180, '#d9b380');
    rect(0, 380, 616, 4, '#b98d5f');
    // Awning: seven stripes; the middle one changes colour.
    for (let i = 0; i < 7; i += 1) {
      const x = 40 + i * 77;
      const fill = i === 3 ? (variant ? '#2a9d8f' : '#e5534b') : i % 2 === 0 ? '#fff3d6' : '#e5534b';
      rect(x, 40, 77, 70, fill);
    }
    for (let i = 0; i < 7; i += 1) circle(40 + i * 77 + 38, 110, 12, i === 3 ? (variant ? '#2a9d8f' : '#e5534b') : i % 2 === 0 ? '#fff3d6' : '#e5534b');
    rect(56, 110, 8, 270, '#6b4a2f');
    rect(552, 110, 8, 270, '#6b4a2f');
    // Hanging lanterns.
    line(150, 110, 150, 128, '#6b4a2f', 2);
    circle(150, 140, 12, '#e5534b');
    line(470, 110, 470, 128, '#6b4a2f', 2);
    circle(470, 140, 12, '#e5534b');
    // Vendor behind the counter.
    rr(268, 280, 80, 115, 14, '#3f7fbf');
    circle(308, 240, 26, '#f2c89b');
    circle(299, 236, 3, '#222222');
    circle(317, 236, 3, '#222222');
    context.strokeStyle = '#222222';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(308, 248, 9, 0.15 * Math.PI, 0.85 * Math.PI);
    context.stroke();
    if (variant) {
      // Straw hat: wide brim and dome.
      ellipse(308, 218, 46, 12, '#e8c96a');
      context.fillStyle = '#e8c96a';
      context.beginPath();
      context.arc(308, 216, 24, Math.PI, 0);
      context.fill();
    } else {
      // Red cap with brim.
      context.fillStyle = '#d43d2a';
      context.beginPath();
      context.arc(308, 222, 26, Math.PI, 0);
      context.fill();
      rr(278, 218, 60, 9, 4, '#d43d2a');
    }
    // Counter.
    rect(60, 380, 496, 90, '#8a5a2b');
    rect(60, 380, 496, 16, '#a06a35');
    line(180, 396, 180, 470, '#6b4a2f', 3);
    line(308, 396, 308, 470, '#6b4a2f', 3);
    line(436, 396, 436, 470, '#6b4a2f', 3);
    // Price sign on the counter.
    line(120, 322, 120, 380, '#6b4a2f', 4);
    rr(88, 268, 64, 54, 6, '#f5e6c8');
    context.strokeStyle = '#8a5a2b';
    context.lineWidth = 3;
    context.strokeRect(88, 268, 64, 54);
    text(variant ? '6000' : '5000', 120, 303, 20, '#333333', 'center', true);
    // Basket of oranges (left) and mangoes (right).
    poly([[150, 400], [210, 400], [202, 432], [158, 432]], '#b07a3e');
    circle(165, 392, 13, '#f28c1e');
    if (!variant) circle(185, 384, 13, '#f28c1e');
    circle(203, 394, 13, '#f28c1e');
    poly([[400, 400], [460, 400], [452, 432], [408, 432]], '#b07a3e');
    ellipse(418, 392, 13, 10, '#ffb703');
    ellipse(438, 386, 13, 10, '#ffb703');
    ellipse(452, 394, 13, 10, '#ff8c42');
    // Cat sitting on the counter (right).
    if (!variant) {
      ellipse(470, 392, 20, 15, '#f5f0e6');
      circle(470, 366, 14, '#f5f0e6');
      poly([[460, 356], [464, 342], [470, 354]], '#f5f0e6');
      poly([[480, 356], [476, 342], [470, 354]], '#f5f0e6');
      circle(465, 364, 2, '#222222');
      circle(475, 364, 2, '#222222');
      context.strokeStyle = '#f5f0e6';
      context.lineWidth = 6;
      context.beginPath();
      context.arc(492, 396, 12, -0.4 * Math.PI, 0.5 * Math.PI);
      context.stroke();
    }
    // Bicycle leaning on the right.
    context.strokeStyle = '#333333';
    context.lineWidth = 4;
    context.beginPath();
    context.arc(490, 505, 26, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.arc(552, 505, 26, 0, Math.PI * 2);
    context.stroke();
    line(490, 505, 520, 470, '#333333', 4);
    line(552, 505, 520, 470, '#333333', 4);
    line(520, 470, 516, 505, '#333333', 4);
    line(516, 470, 540, 470, '#333333', 4);
    line(520, 452, 540, 452, '#333333', 4);
    if (!variant) {
      circle(520, 448, 6, '#f2c94c');
      circle(520, 448, 2, '#8a6d00');
    }
    // Chilli strings on the left post.
    for (let i = 0; i < 4; i += 1) circle(84, 150 + i * 14, 6, '#d43d2a');
  }

  // ---- Scene 2: Taman Senja (park at dusk) ----------------------------------------------
  function drawPark(variant) {
    const sky = context.createLinearGradient(0, 0, 0, 400);
    sky.addColorStop(0, '#2c2a4a');
    sky.addColorStop(0.6, '#f28c5a');
    sky.addColorStop(1, '#ffd9a0');
    context.fillStyle = sky;
    context.fillRect(0, 0, 616, 400);
    // Stars.
    const stars = [[40, 40], [120, 28], [210, 55], [300, 30], [380, 48], [470, 32], [560, 55], [90, 90], [260, 80], [350, 95], [500, 90], [590, 30]];
    for (const [x, y] of stars) circle(x, y, 2, '#ffffff');
    circle(540, 70, 26, '#fff3c4');
    circle(530, 64, 22, '#f5e6a8');
    // Kite.
    poly([[140, 80], [168, 110], [140, 140], [112, 110]], variant ? '#4fc3f7' : '#e5534b');
    line(140, 140, 150, 190, '#eef1f5', 2);
    circle(144, 155, 4, '#f2c94c');
    circle(148, 175, 4, '#f2c94c');
    // Tree.
    rect(78, 200, 24, 200, '#6b4a2f');
    line(90, 260, 150, 230, '#6b4a2f', 8);
    circle(110, 180, 55, '#3e7d44');
    circle(70, 210, 40, '#35703a');
    circle(150, 205, 42, '#4a8a4d');
    circle(110, 150, 38, '#4a8a4d');
    circle(95, 165, 7, '#e5534b');
    circle(130, 190, 7, '#e5534b');
    circle(170, 160, 7, '#e5534b');
    if (variant) circle(150, 150, 7, '#e5534b');
    // Bird on the branch.
    if (!variant) {
      ellipse(150, 228, 12, 8, '#2b2b2b');
      circle(160, 222, 6, '#2b2b2b');
      poly([[166, 221], [172, 224], [166, 226]], '#f2c94c');
    }
    // Grass.
    rect(0, 400, 616, 160, '#4a7d3a');
    rect(0, 400, 616, 6, '#3e6e31');
    // Lamp post.
    rect(496, 210, 8, 210, '#2b2b2b');
    poly([[484, 190], [516, 190], [510, 212], [490, 212]], '#2b2b2b');
    if (!variant) {
      const halo = context.createRadialGradient(500, 200, 4, 500, 200, 70);
      halo.addColorStop(0, 'rgba(255, 217, 77, 0.85)');
      halo.addColorStop(1, 'rgba(255, 217, 77, 0)');
      context.fillStyle = halo;
      context.beginPath();
      context.arc(500, 200, 70, 0, Math.PI * 2);
      context.fill();
      poly([[486, 212], [514, 212], [540, 330], [460, 330]], 'rgba(255, 217, 77, 0.25)');
      circle(500, 200, 10, '#ffd94d');
    } else {
      circle(500, 200, 10, '#8b93a3');
    }
    // Bench.
    rect(288, 360, 10, 80, '#5a3d22');
    rect(404, 360, 10, 80, '#5a3d22');
    const slats = variant ? [362, 374, 398] : [362, 374, 386, 398];
    for (const y of slats) rect(296, y, 108, 8, '#8a5a2b');
    rect(280, 408, 140, 10, '#8a5a2b');
    rect(284, 418, 8, 22, '#5a3d22');
    rect(408, 418, 8, 22, '#5a3d22');
    // Pond.
    ellipse(180, 500, 130, 38, '#4db2e8');
    context.strokeStyle = 'rgba(255,255,255,0.6)';
    context.lineWidth = 2;
    context.beginPath();
    context.arc(140, 498, 22, 0.1 * Math.PI, 0.9 * Math.PI);
    context.stroke();
    context.beginPath();
    context.arc(210, 512, 18, 0.1 * Math.PI, 0.9 * Math.PI);
    context.stroke();
    // Ducks.
    const ducks = variant ? [[120, 500], [180, 510], [240, 505]] : [[120, 500], [180, 510]];
    for (const [x, y] of ducks) {
      ellipse(x, y, 14, 9, '#ffffff');
      circle(x + 11, y - 8, 7, '#ffffff');
      poly([[x + 17, y - 9], [x + 23, y - 7], [x + 17, y - 5]], '#f28c1e');
      circle(x + 12, y - 10, 1.5, '#222222');
    }
    // Flower bed.
    rect(420, 470, 160, 70, '#3e6e31');
    const flowers = variant ? [440, 470, 500, 560] : [440, 470, 500, 520, 560];
    for (const x of flowers) {
      line(x, 505, x, 530, '#2b5c22', 3);
      circle(x, 500, 8, x % 60 === 0 ? '#f2c94c' : '#e5534b');
      circle(x - 6, 506, 5, x % 60 === 0 ? '#f2c94c' : '#e5534b');
      circle(x + 6, 506, 5, x % 60 === 0 ? '#f2c94c' : '#e5534b');
    }
  }

  // ---- Scene 3: Pantai Pagi (beach morning) ---------------------------------------------
  function drawBeach(variant) {
    const sky = context.createLinearGradient(0, 0, 0, 240);
    sky.addColorStop(0, '#aee2ff');
    sky.addColorStop(1, '#fff3c4');
    context.fillStyle = sky;
    context.fillRect(0, 0, 616, 240);
    sun(90, 70, 30);
    cloud(200, 60, 1);
    cloud(420, 50, 0.8);
    // Sea.
    rect(0, 240, 616, 120, '#2a9d8f');
    context.strokeStyle = 'rgba(255,255,255,0.7)';
    context.lineWidth = 3;
    for (const y of [260, 300, 340]) {
      context.beginPath();
      for (let x = 0; x <= 616; x += 16) {
        const yy = y + Math.sin((x / 616) * Math.PI * 6) * 4;
        if (x === 0) context.moveTo(x, yy);
        else context.lineTo(x, yy);
      }
      context.stroke();
    }
    // Boat.
    line(430, 240, 430, 312, '#6b4a2f', 4);
    poly([[430, 245], [430, 305], [480, 305]], variant ? '#f28c1e' : '#ffffff');
    poly([[390, 312], [470, 312], [458, 332], [402, 332]], '#8a5a2b');
    // Sand.
    rect(0, 360, 616, 200, '#f2d8a0');
    for (const [x, y] of [[60, 400], [180, 430], [300, 400], [380, 540], [560, 400], [90, 520], [250, 540]]) {
      circle(x, y, 2, '#d9b380');
    }
    // Palm tree.
    context.strokeStyle = '#6b4a2f';
    context.lineWidth = 14;
    context.beginPath();
    context.moveTo(110, 430);
    context.quadraticCurveTo(120, 320, 140, 225);
    context.stroke();
    context.strokeStyle = '#3e7d44';
    context.lineWidth = 8;
    for (const [dx, dy] of [[-60, -10], [-40, -35], [0, -45], [45, -30], [65, -5]]) {
      context.beginPath();
      context.moveTo(140, 225);
      context.quadraticCurveTo(140 + dx / 2, 225 + dy / 2 - 12, 140 + dx, 225 + dy);
      context.stroke();
    }
    circle(132, 228, 8, '#6b4a2f');
    circle(152, 232, 8, '#6b4a2f');
    if (variant) circle(150, 220, 8, '#6b4a2f');
    // Umbrella.
    line(480, 380, 480, 520, '#8a5a2b', 5);
    context.fillStyle = variant ? '#4ade80' : '#e5534b';
    context.beginPath();
    context.arc(480, 380, 70, Math.PI, 0);
    context.closePath();
    context.fill();
    context.fillStyle = '#fff3d6';
    context.beginPath();
    context.moveTo(480, 380);
    context.arc(480, 380, 70, Math.PI * 1.25, Math.PI * 1.5);
    context.closePath();
    context.fill();
    context.beginPath();
    context.moveTo(480, 380);
    context.arc(480, 380, 70, Math.PI * 1.5, Math.PI * 1.75);
    context.closePath();
    context.fill();
    circle(480, 378, 6, '#f2c94c');
    // Bucket.
    poly([[310, 460], [350, 460], [344, 500], [316, 500]], variant ? '#f27fb0' : '#4fc3f7');
    context.strokeStyle = '#333333';
    context.lineWidth = 3;
    context.beginPath();
    context.arc(330, 460, 18, Math.PI, 0);
    context.stroke();
    // Crab.
    if (!variant) {
      ellipse(220, 500, 16, 10, '#e5534b');
      circle(206, 492, 6, '#e5534b');
      circle(234, 492, 6, '#e5534b');
      line(212, 488, 210, 480, '#e5534b', 3);
      line(228, 488, 230, 480, '#e5534b', 3);
      circle(210, 478, 2, '#222222');
      circle(230, 478, 2, '#222222');
      line(208, 502, 196, 508, '#e5534b', 3);
      line(232, 502, 244, 508, '#e5534b', 3);
    }
    // Shells.
    const shells = variant ? [[430, 520], [465, 522], [540, 521]] : [[430, 520], [465, 522], [500, 520], [540, 521]];
    for (const [x, y] of shells) {
      context.fillStyle = '#fff3d6';
      context.beginPath();
      context.arc(x, y, 10, Math.PI, 0);
      context.fill();
      context.strokeStyle = '#d9a05a';
      context.lineWidth = 2;
      for (let i = -1; i <= 1; i += 1) line(x, y, x + i * 7, y - 9, '#d9a05a', 2);
    }
    // Starfish.
    if (!variant) {
      context.fillStyle = '#f28c1e';
      context.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (i * Math.PI) / 5;
        const r = i % 2 === 0 ? 16 : 7;
        const x = 560 + Math.cos(angle) * r;
        const y = 470 + Math.sin(angle) * r;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      }
      context.closePath();
      context.fill();
    }
  }

  function drawScene(index, variant) {
    if (index === 0) drawMarket(variant);
    else if (index === 1) drawPark(variant);
    else drawBeach(variant);
  }


  /** One picture panel: the scene, its label tag, and the markers for what is found. */
  function drawPanel(state, panelX, variant) {
    context.save();
    context.beginPath();
    context.rect(panelX, PANEL.y, PANEL.width, PANEL.height);
    context.clip();
    context.translate(panelX, PANEL.y);
    drawScene(state.scene, variant);
    context.restore();
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 3;
    context.strokeRect(panelX, PANEL.y, PANEL.width, PANEL.height);
    // Label tag: A on the left picture, B on the right.
    rr(panelX + 8, PANEL.y + 8, 34, 30, 6, 'rgba(14, 21, 34, 0.75)');
    text(variant ? 'B' : 'A', panelX + 25, PANEL.y + 31, 20, PALETTE.text, 'center', true);
    // Red rings on every difference found, on both pictures.
    for (const id of state.found) {
      const diff = SCENES[state.scene].diffs.find((d) => d.id === id);
      if (!diff) continue;
      const x = panelX + diff.x;
      const y = PANEL.y + diff.y;
      context.strokeStyle = PALETTE.marker;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x, y, diff.r + 6, 0, Math.PI * 2);
      context.stroke();
      context.fillStyle = PALETTE.markerSoft;
      context.beginPath();
      context.arc(x, y, diff.r + 6, 0, Math.PI * 2);
      context.fill();
    }
    // Hint: a pulsing ring around one difference not found yet.
    if (state.hint !== null) {
      const pulse = 6 + Math.sin(performance.now() / 150) * 4;
      const x = panelX + state.hint.x;
      const y = PANEL.y + state.hint.y;
      context.strokeStyle = PALETTE.accent;
      context.lineWidth = 4;
      context.beginPath();
      context.arc(x, y, 30 + pulse, 0, Math.PI * 2);
      context.stroke();
    }
    // Wrong-click mark.
    if (state.flash !== null) {
      const x = panelX + state.flash.x;
      const y = PANEL.y + state.flash.y;
      const s = 12;
      context.strokeStyle = PALETTE.bad;
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(x - s, y - s);
      context.lineTo(x + s, y + s);
      context.moveTo(x + s, y - s);
      context.lineTo(x - s, y + s);
      context.stroke();
    }
  }

  function formatTime(seconds) {
    const total = Math.floor(seconds);
    const minutes = Math.floor(total / 60);
    const rest = total % 60;
    return `${minutes}:${String(rest).padStart(2, '0')}`;
  }

  function drawHud(state) {
    context.fillStyle = PALETTE.header;
    context.fillRect(0, 0, FIELD.width, HEADER.height);
    const scene = SCENES[state.scene];
    text('Pasar Pagi — Spot the Difference', 24, 38, 24, PALETTE.text, 'left', true);
    text(`Scene ${state.scene + 1} · ${scene.name}`, FIELD.width / 2, 38, 22, PALETTE.accent, 'center', true);
    const remaining = scene.diffs.length - state.found.length;
    text(
      `Found ${state.found.length}/${scene.diffs.length} · ${remaining} left    Score ${state.score}    ${formatTime(state.elapsed)}`,
      FIELD.width - 24, 38, 20, PALETTE.text, 'right',
    );
  }

  function drawFooter(state) {
    // Scene dots in the gap between the pictures and the footer.
    for (let i = 0; i < SCENES.length; i += 1) {
      const x = FIELD.width / 2 + (i - 1) * 28;
      circle(x, 646, 7, i < state.scene ? PALETTE.good : i === state.scene ? PALETTE.accent : '#3a4763');
    }
    for (const button of BUTTONS) {
      const label = button.id === 'sound' ? `Sound: ${state.muted ? 'Off' : 'On'} (M)` : button.label;
      rr(button.x, button.y, button.width, button.height, 8, PALETTE.button);
      text(label, button.x + button.width / 2, button.y + 26, 16, PALETTE.buttonText, 'center');
    }
    text('Click a difference on either picture · Arrows move the cursor · Enter selects · H hint', FIELD.width - 24, 698, 16, PALETTE.muted, 'right');
  }

  function drawKeyboardCursor(state) {
    if (state.screen !== SCREEN_PLAY || !state.cursorActive) return;
    const x = PANEL.rightX + state.cursor.x;
    const y = PANEL.y + state.cursor.y;
    context.strokeStyle = PALETTE.accent;
    context.lineWidth = 2;
    context.beginPath();
    context.arc(x, y, 14, 0, Math.PI * 2);
    context.stroke();
    line(x - 20, y, x - 8, y, PALETTE.accent, 2);
    line(x + 8, y, x + 20, y, PALETTE.accent, 2);
    line(x, y - 20, x, y - 8, PALETTE.accent, 2);
    line(x, y + 8, x, y + 20, PALETTE.accent, 2);
  }

  function drawOverlayPanel(title, lines, prompt) {
    context.fillStyle = PALETTE.overlay;
    context.fillRect(0, 0, FIELD.width, FIELD.height);
    const width = 680;
    const height = 150 + lines.length * 32 + 70;
    const x = (FIELD.width - width) / 2;
    const y = (FIELD.height - height) / 2;
    rr(x, y, width, height, 16, '#1a2233');
    context.strokeStyle = PALETTE.panelBorder;
    context.lineWidth = 2;
    context.beginPath();
    context.roundRect(x, y, width, height, 16);
    context.stroke();
    text(title, FIELD.width / 2, y + 62, 44, PALETTE.text, 'center', true);
    for (let i = 0; i < lines.length; i += 1) {
      text(lines[i], FIELD.width / 2, y + 108 + i * 32, 20, PALETTE.muted, 'center');
    }
    text(prompt, FIELD.width / 2, y + height - 34, 22, PALETTE.accent, 'center');
  }

  /** Paint one frame: header, both pictures, footer, then the overlay for the screen. */
  function draw(state, screen, best) {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.fillStyle = PALETTE.backdrop;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.setTransform(view.scale, 0, 0, view.scale, view.x, view.y);
    drawHud(state);
    drawPanel(state, PANEL.leftX, false);
    drawPanel(state, PANEL.rightX, true);
    drawFooter(state);
    if (screen === SCREEN_PLAY) drawKeyboardCursor(state);
    if (screen === SCREEN_TITLE) {
      drawOverlayPanel(
        'Pasar Pagi',
        [
          'Spot the Difference — two pictures, seven differences, three scenes.',
          'Click a difference on either picture, or move the cursor with the arrow keys and press Enter.',
          'A hint (H) costs 25 points. A wrong click costs 5. Finish a scene fast for a bonus.',
          best > 0 ? `Best score: ${best}` : ' ',
        ],
        'Click or press Space to start',
      );
    } else if (screen === SCREEN_SCENE) {
      const scene = SCENES[state.scene];
      drawOverlayPanel(
        'Scene Complete!',
        [
          `You found all seven differences in ${scene.name}.`,
          `Scene bonus +${state.sceneBonus}    Score ${state.score}`,
          `Mistakes so far: ${state.mistakes}`,
        ],
        state.scene + 1 < SCENES.length ? 'Click for the next scene' : 'Click to see your results',
      );
    } else if (screen === SCREEN_VICTORY) {
      drawOverlayPanel(
        'You found them all!',
        [
          `Three scenes, 21 differences, in ${formatTime(state.elapsed)}.`,
          `Score ${state.score}    Mistakes ${state.mistakes}    Best ${Math.max(best, state.score)}`,
          'Thanks for playing Pasar Pagi.',
        ],
        'Click or press Space to play again',
      );
    }
  }

  resize();
  window.addEventListener('resize', resize);
  return { draw, toField, panelAt, buttonAt };
}
